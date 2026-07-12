import { useState, useEffect } from 'react';
import { Plus, Search, Filter, ChevronDown, Eye, Edit, Trash2, Tag, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'assets'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assetData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssets(assetData);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Firestore Error: ", err);
      setError(err.message);
      setLoading(false);
      toast.error('Failed to load assets. Check database connection.');
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteDoc(doc(db, 'assets', id));
        toast.success(`${name} deleted successfully.`);
      } catch (err) {
        console.error("Error deleting document: ", err);
        toast.error('Failed to delete asset.');
      }
    }
  };

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
        <Link 
          to="/assets/new"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Register Asset
        </Link>
      </div>

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
                        <Link to={`/assets/${asset.tag}`} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="View Details">
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
    </motion.div>
  );
}
