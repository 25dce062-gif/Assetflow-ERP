import { useState, useEffect } from 'react';
import { Plus, Search, Filter, ChevronDown, Eye, Edit, Trash2, Tag, AlertCircle, Scan, X, Check, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { localStorageDB } from '../services/localStorageDB';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { logActivity, createNotification } from '../utils/firebaseUtils';
import { useAuth } from '../context/AuthContext';

const getStatusColor = (status) => {
  switch(status) {
    case 'Available': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    case 'Allocated': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    case 'Maintenance': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    default: return 'text-slate-500 bg-slate-100 border-slate-200';
  }
};

export default function AssetDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [assets, setAssets] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('Directory');
  const [newAuditName, setNewAuditName] = useState('');
  const [newAuditDept, setNewAuditDept] = useState('');
  const [newAuditLocation, setNewAuditLocation] = useState('');
  const [newAuditAuditor, setNewAuditAuditor] = useState('');
  const [newAuditStartDate, setNewAuditStartDate] = useState('');
  const [newAuditEndDate, setNewAuditEndDate] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    const unsubscribeAssets = localStorageDB.subscribe('assets', (data) => {
      // Sort by createdAt desc
      const sortedData = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAssets(sortedData);
      setLoading(false);
      setError(null);
    });

    const unsubscribeAudits = localStorageDB.subscribe('audits', (data) => {
      const sortedAudits = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAudits(sortedAudits);
    });

    return () => {
      unsubscribeAssets();
      unsubscribeAudits();
    };
  }, []);

  const createAudit = async () => {
    if (!newAuditName || !newAuditAuditor || !newAuditStartDate || !newAuditEndDate) {
      toast.error('Please fill all required fields to create an audit cycle.');
      return;
    }
    try {
      let targetAssets = assets;
      if (newAuditDept) {
         targetAssets = targetAssets.filter(a => a.department === newAuditDept);
      }
      if (newAuditLocation) {
         targetAssets = targetAssets.filter(a => a.location === newAuditLocation);
      }

      const auditAssets = targetAssets.map(a => ({
        id: a.id,
        tag: a.tag,
        name: a.name,
        verified: false,
        status: 'Pending'
      }));

      await localStorageDB.add('audits', {
        name: newAuditName,
        department: newAuditDept || 'All',
        location: newAuditLocation || 'All',
        auditor: newAuditAuditor,
        startDate: newAuditStartDate,
        endDate: newAuditEndDate,
        status: 'Active',
        totalAssets: auditAssets.length,
        verifiedCount: 0,
        assets: auditAssets,
        createdAt: new Date().toISOString()
      });
      
      await logActivity(currentUser, 'Audit', 'Audit Created', `Created audit ${newAuditName}`);
      toast.success('Audit Cycle created successfully.');
      setNewAuditName('');
      setNewAuditDept('');
      setNewAuditLocation('');
      setNewAuditAuditor('');
      setNewAuditStartDate('');
      setNewAuditEndDate('');
    } catch (error) {
      toast.error('Failed to create audit.');
    }
  };

  const verifyAsset = async (auditId, assetTag, status = 'Verified') => {
    try {
      const audit = audits.find(a => a.id === auditId);
      if (!audit) return;
      
      const assetIndex = audit.assets.findIndex(a => a.tag === assetTag || a.tag.toLowerCase() === assetTag.toLowerCase());
      if (assetIndex === -1) {
        toast.error('Asset not found in this audit scope.');
        return;
      }
      if (audit.assets[assetIndex].verified) {
        toast.error('Asset already verified.');
        return;
      }

      audit.assets[assetIndex].verified = true;
      audit.assets[assetIndex].status = status;
      audit.verifiedCount += 1;

      await localStorageDB.update('audits', auditId, {
        assets: audit.assets,
        verifiedCount: audit.verifiedCount
      });
      toast.success(`Asset ${audit.assets[assetIndex].name} marked as ${status}!`);
    } catch (error) {
      toast.error('Verification failed.');
    }
  };

  const closeAudit = async (auditId) => {
    try {
      const audit = audits.find(a => a.id === auditId);
      await localStorageDB.update('audits', auditId, { status: 'Closed' });
      
      // Update asset statuses based on audit findings
      for (const asset of audit.assets) {
         if (!asset.verified || asset.status === 'Missing') {
            await localStorageDB.update('assets', asset.id, { status: 'Lost' });
         } else if (asset.status === 'Damaged') {
            await localStorageDB.update('assets', asset.id, { status: 'Under Review' });
         }
      }
      
      await logActivity(currentUser, 'Audit', 'Audit Closed', `Closed audit ${audit.name}`);
      await createNotification('Admin', 'Audit Closed', `Audit ${audit.name} has been closed.`, 'info');
      toast.success('Audit Closed. Asset statuses updated.');
    } catch (error) {
      toast.error('Failed to close audit.');
    }
  };

  const exportPDF = (audit) => {
    const doc = new jsPDF();
    doc.text(`Audit Report: ${audit.name}`, 14, 15);
    doc.text(`Department: ${audit.department} | Auditor: ${audit.auditor}`, 14, 22);
    
    const tableData = audit.assets.map(a => [
      a.tag,
      a.name,
      a.verified ? 'Yes' : 'No',
      a.status || 'Pending'
    ]);
    
    doc.autoTable({
      startY: 30,
      head: [['Asset Tag', 'Name', 'Audited', 'Status']],
      body: tableData,
    });
    
    doc.save(`Audit_${audit.name.replace(/\s+/g, '_')}.pdf`);
  };

  const exportExcel = (audit) => {
    const wsData = audit.assets.map(a => ({
      Tag: a.tag,
      Name: a.name,
      Audited: a.verified ? 'Yes' : 'No',
      Status: a.status || 'Pending'
    }));
    
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit Data");
    XLSX.writeFile(wb, `Audit_${audit.name.replace(/\s+/g, '_')}.xlsx`);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await localStorageDB.delete('assets', id);
        toast.success(`${name} deleted successfully.`);
      } catch (err) {
        console.error("Error deleting document: ", err);
        toast.error('Failed to delete asset.');
      }
    }
  };

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner("reader", { 
        qrbox: { width: 250, height: 250 }, 
        fps: 5 
      }, false);

      scanner.render(
        (decodedText) => {
          scanner.clear();
          setIsScanning(false);
          setSearchTerm(decodedText);
          toast.success("Code Scanned Successfully");
        },
        (error) => {
          // Ignore scanning errors (happens when no code is in frame)
        }
      );

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [isScanning]);

  // Filter assets based on search term
  const filteredAssets = assets.filter(asset => 
    asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    asset.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Asset Directory</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Search and manage all organizational assets.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsScanning(true)}
            className="inline-flex items-center justify-center rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted/80 border border-border transition-colors"
          >
            <Scan className="mr-2 h-4 w-4" />
            Scan QR
          </button>
          <Link 
            to="/admin/assets/new"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Register Asset
          </Link>
        </div>
      </div>

      <div className="flex bg-card p-1 rounded-lg border border-border inline-flex shadow-sm">
        <button
          onClick={() => setActiveTab('Directory')}
          className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors ${
            activeTab === 'Directory' 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Asset Directory
        </button>
        <button
          onClick={() => setActiveTab('Audits')}
          className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors ${
            activeTab === 'Audits' 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Asset Audits
        </button>
      </div>

      {activeTab === 'Directory' ? (
        <div className="bg-card border border-border rounded-xl shadow-soft">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              placeholder="Search by tag, name, or serial number..."
            />
          </div>
          <div className="flex items-center space-x-2">
            <button className="inline-flex items-center rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted text-foreground transition-colors">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              Filter
            </button>
            <button className="inline-flex items-center rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted text-foreground transition-colors">
              Sort by
              <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3">Asset Tag</th>
                <th className="px-6 py-3">Asset Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p>Loading assets from database...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-destructive">
                      <AlertCircle className="w-8 h-8 mb-4 opacity-80" />
                      <p className="font-semibold">Database Connection Error</p>
                      <p className="text-sm opacity-80 mt-1 max-w-md">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-muted-foreground">
                    No assets found matching your search.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-foreground flex items-center">
                      <Tag className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                      {asset.tag}
                    </td>
                    <td className="px-6 py-4 text-foreground font-medium">{asset.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{asset.category || 'N/A'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{asset.department || 'N/A'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{asset.location || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(asset.status)}`}>
                        {asset.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/admin/assets/${asset.tag}`} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-md transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(asset.id, asset.name)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors" 
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-medium">
          <div>Showing <span className="text-foreground">{filteredAssets.length}</span> assets</div>
          <div className="flex space-x-1">
            <button className="px-2.5 py-1.5 border border-border rounded-md hover:bg-muted transition-colors">Previous</button>
            <button className="px-2.5 py-1.5 border border-primary bg-primary/10 text-primary rounded-md">1</button>
            <button className="px-2.5 py-1.5 border border-border rounded-md hover:bg-muted transition-colors">Next</button>
          </div>
        </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
              <div className="p-5 border-b border-border bg-muted/30">
                <h2 className="text-base font-semibold text-foreground">New Audit Cycle</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Audit Name</label>
                  <input
                    value={newAuditName}
                    onChange={(e) => setNewAuditName(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. Q3 IT Audit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Target Department (Optional)</label>
                  <select
                    value={newAuditDept}
                    onChange={(e) => setNewAuditDept(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">All Departments</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="HR">HR</option>
                    <option value="Sales">Sales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Location Scope (Optional)</label>
                  <input
                    value={newAuditLocation}
                    onChange={(e) => setNewAuditLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. Building A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Assign Auditor(s) *</label>
                  <input
                    value={newAuditAuditor}
                    onChange={(e) => setNewAuditAuditor(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Comma separated names"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Start Date *</label>
                    <input
                      type="date"
                      value={newAuditStartDate}
                      onChange={(e) => setNewAuditStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">End Date *</label>
                    <input
                      type="date"
                      value={newAuditEndDate}
                      onChange={(e) => setNewAuditEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <button
                  onClick={createAudit}
                  className="w-full py-2.5 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Create Audit
                </button>
              </div>
            </div>
          </div>
          
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl shadow-soft">
              <div className="p-5 border-b border-border bg-muted/30">
                <h2 className="text-base font-semibold text-foreground">Audit Cycles</h2>
              </div>
              <div className="divide-y divide-border">
                {audits.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No audits found.</div>
                ) : (
                  audits.map((audit) => (
                    <div key={audit.id} className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground flex items-center">
                            {audit.name}
                            <span className={`ml-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              audit.status === 'Active' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20' : 'text-slate-500 bg-slate-100 border-slate-200'
                            }`}>
                              {audit.status}
                            </span>
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">Dept: {audit.department} • Auditor: {audit.auditor}</p>
                        </div>
                        {audit.status === 'Active' && (
                          <div className="flex space-x-2">
                            <button onClick={() => closeAudit(audit.id)} className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border hover:bg-muted text-foreground transition-colors">
                              Close Audit
                            </button>
                          </div>
                        )}
                        {audit.status === 'Closed' && (
                          <div className="flex space-x-2">
                            <button onClick={() => exportPDF(audit)} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors flex items-center">
                              <FileText className="w-3.5 h-3.5 mr-1" /> PDF
                            </button>
                            <button onClick={() => exportExcel(audit)} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors flex items-center">
                              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Excel
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">Progress</span>
                          <span className="font-semibold">{audit.verifiedCount} / {audit.totalAssets} Verified</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${audit.totalAssets > 0 ? (audit.verifiedCount / audit.totalAssets) * 100 : 0}%` }}></div>
                        </div>
                      </div>

                      {audit.status === 'Active' && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text"
                            placeholder="Scan or enter Asset Tag"
                            className="flex-1 px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                verifyAsset(audit.id, e.target.value, 'Verified');
                                e.target.value = '';
                              }
                            }}
                          />
                          <div className="flex space-x-1 shrink-0">
                            <button 
                              onClick={() => {
                                const input = e.target.previousSibling;
                                if (input && input.value) {
                                  verifyAsset(audit.id, input.value, 'Missing');
                                  input.value = '';
                                }
                              }}
                              className="px-2 py-1.5 text-xs font-medium rounded border border-border text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
                              title="Mark Missing"
                            >
                              Missing
                            </button>
                            <button 
                              onClick={() => {
                                const input = e.target.previousSibling.previousSibling;
                                if (input && input.value) {
                                  verifyAsset(audit.id, input.value, 'Damaged');
                                  input.value = '';
                                }
                              }}
                              className="px-2 py-1.5 text-xs font-medium rounded border border-border text-muted-foreground hover:text-amber-500 hover:bg-amber-50"
                              title="Mark Damaged"
                            >
                              Damaged
                            </button>
                            <button 
                              onClick={() => {
                                const input = e.target.previousSibling.previousSibling.previousSibling;
                                if (input && input.value) {
                                  verifyAsset(audit.id, input.value, 'Misplaced');
                                  input.value = '';
                                }
                              }}
                              className="px-2 py-1.5 text-xs font-medium rounded border border-border text-muted-foreground hover:text-blue-500 hover:bg-blue-50"
                              title="Mark Misplaced"
                            >
                              Misplaced
                            </button>
                          </div>
                        </div>
                      )}

                      {audit.status === 'Closed' && (
                        <div className="mt-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                          <h4 className="text-xs font-semibold text-destructive mb-2">Missing Asset Report</h4>
                          <ul className="text-xs space-y-1">
                            {audit.assets.filter(a => !a.verified).map(asset => (
                              <li key={asset.tag} className="text-muted-foreground flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1 text-destructive" />
                                {asset.tag} - {asset.name}
                              </li>
                            ))}
                            {audit.assets.filter(a => !a.verified).length === 0 && (
                              <li className="text-emerald-600 font-medium">All assets were verified!</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-xl shadow-xl border border-border overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold text-foreground flex items-center">
                  <Scan className="w-4 h-4 mr-2 text-primary" />
                  Scan QR / Barcode
                </h3>
                <button 
                  onClick={() => setIsScanning(false)}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <div id="reader" className="w-full rounded-lg overflow-hidden border-2 border-dashed border-border"></div>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Point your camera at the asset's QR code or barcode to instantly locate it.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
