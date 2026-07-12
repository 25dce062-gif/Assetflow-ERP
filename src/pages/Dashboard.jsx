import { useState, useEffect } from 'react';
import { 
  Package, CheckCircle2, ClipboardList, AlertTriangle, 
  ArrowRightLeft, Wrench, MoreHorizontal, TrendingUp, Calendar, Check, X, Download, ShieldCheck, Box, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { localStorageDB } from '../services/localStorageDB';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [lineData, setLineData] = useState([]);

  const [stats, setStats] = useState({
    total: 0, available: 0, allocated: 0, maintenance: 0, 
    upcomingReturns: 0, overdueReturns: 0, runningAudits: 0, pendingTransfers: 0, pendingMaintenance: 0
  });

  const exportReport = async (type) => {
    try {
      const doc = new jsPDF();
      doc.text(`AssetFlow - ${type} Report`, 14, 15);
      
      let tableColumn = [];
      let tableRows = [];

      if (type === 'Asset' || type === 'Department') {
        const assets = await localStorageDB.getAll('assets');
        tableColumn = ["ID", "Name", "Category", "Department", "Status"];
        const filtered = type === 'Department' 
          ? [...assets].sort((a, b) => (a.department || '').localeCompare(b.department || ''))
          : assets;
          
        tableRows = filtered.map(asset => [
          asset.tag || asset.id, 
          asset.name, 
          asset.category, 
          asset.department || 'Unassigned',
          asset.status
        ]);
      } else if (type === 'Maintenance') {
        const tickets = await localStorageDB.getAll('maintenance');
        tableColumn = ["Asset", "Issue", "Vendor", "Cost", "Status"];
        tableRows = tickets.map(t => [
          t.assetName,
          t.issue,
          t.vendor,
          `$${t.cost || 0}`,
          t.status
        ]);
      }
      
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
      });
      
      doc.save(`${type}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(`${type} Report Exported Successfully`);
      setShowExportMenu(false);
    } catch (err) {
      toast.error(`Failed to export ${type} Report`);
    }
  };

  useEffect(() => {
    const unsubRequests = localStorageDB.subscribe('requests', (data) => {
      setPendingRequests(data.filter(r => r.status === 'Pending'));
    });
    
    const unsubAssets = localStorageDB.subscribe('assets', (data) => {
      const total = data.length;
      const available = data.filter(a => a.status === 'Available').length;
      const allocated = data.filter(a => a.status === 'Allocated').length;
      const maintenance = data.filter(a => a.status === 'Maintenance').length;
      
      // Calculate Bar Data & Pie Data
      const depts = {};
      data.forEach(a => {
        const dept = a.department || 'Unassigned';
        if (!depts[dept]) depts[dept] = { name: dept, active: 0, inactive: 0 };
        if (a.status === 'Allocated') depts[dept].active++;
        else depts[dept].inactive++;
      });
      setBarData(Object.values(depts));
      
      const pie = Object.values(depts).map(d => ({ name: d.name, value: d.active + d.inactive })).filter(d => d.value > 0);
      setPieData(pie);

      setStats(prev => ({ ...prev, total, available, allocated, maintenance }));
    });

    const unsubMaintenance = localStorageDB.subscribe('maintenance', (data) => {
      const months = {};
      data.forEach(m => {
        if (!m.createdAt) return;
        const d = new Date(m.createdAt);
        const month = d.toLocaleString('default', { month: 'short' });
        months[month] = (months[month] || 0) + 1;
      });
      const line = Object.keys(months).map(m => ({ name: m, issues: months[m] }));
      setLineData(line.length ? line : [{ name: 'No Data', issues: 0 }]);
      
      setStats(prev => ({ ...prev, pendingMaintenance: data.filter(m => m.status !== 'Completed').length }));
    });

    const unsubAllocations = localStorageDB.subscribe('allocations', (data) => {
      const now = new Date();
      const upcomingReturns = data.filter(a => a.status === 'Active' && a.returnDate && new Date(a.returnDate) > now).length;
      const overdueReturns = data.filter(a => a.status === 'Active' && a.returnDate && new Date(a.returnDate) < now).length;
      setStats(prev => ({ ...prev, upcomingReturns, overdueReturns }));
    });

    const unsubAudits = localStorageDB.subscribe('audits', (data) => {
      setStats(prev => ({ ...prev, runningAudits: data.filter(a => a.status === 'Active').length }));
    });

    const unsubTransfers = localStorageDB.subscribe('transfers', (data) => {
      setStats(prev => ({ ...prev, pendingTransfers: data.filter(a => a.status === 'Pending').length }));
    });

    const unsubActivity = localStorageDB.subscribe('activityLogs', (data) => {
      const sorted = [...data].sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp)).slice(0, 15);
      setActivityLogs(sorted);
    });

    return () => {
      unsubRequests(); unsubAssets(); unsubMaintenance(); 
      unsubAllocations(); unsubAudits(); unsubTransfers(); unsubActivity();
    };
  }, []);

  const handleApprove = async (id) => {
    try {
      await localStorageDB.update('requests', id, { status: 'Approved' });
      toast.success('Request approved');
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (id) => {
    try {
      await localStorageDB.update('requests', id, { status: 'Rejected' });
      toast.success('Request rejected');
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const statCards = [
    { name: 'Total Assets', value: stats.total, icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
    { name: 'Available', value: stats.available, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Allocated', value: stats.allocated, icon: ClipboardList, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { name: 'In Maintenance', value: stats.maintenance, icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const secondaryCards = [
    { name: 'Pending Maint.', value: stats.pendingMaintenance, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { name: 'Upcoming Returns', value: stats.upcomingReturns, icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Overdue Returns', value: stats.overdueReturns, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { name: 'Running Audits', value: stats.runningAudits, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Pending Transfers', value: stats.pendingTransfers, icon: ArrowRightLeft, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Real-time metrics for your organization.</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            Live Data
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center px-4 py-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                <button onClick={() => exportReport('Department')} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                  Department Report
                </button>
                <button onClick={() => exportReport('Asset')} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                  Asset Report
                </button>
                <button onClick={() => exportReport('Maintenance')} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                  Maintenance Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            className="bg-card rounded-xl p-4 shadow-soft border border-border flex items-center"
          >
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} shrink-0`}>
              <stat.icon className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{stat.name}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Secondary KPIs */}
      <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {secondaryCards.map((stat, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            className="bg-card rounded-xl p-3 shadow-soft border border-border flex items-center justify-between"
          >
            <div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{stat.name}</p>
            </div>
            <div className={`p-2 rounded-md ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Charts Grid */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department Allocation Pie Chart */}
        <motion.div 
          variants={itemVariants}
          className="bg-card rounded-xl shadow-soft border border-border p-5 lg:col-span-1"
        >
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">Assets by Department</h3>
            <p className="text-xs text-muted-foreground mt-1">Distribution across organization</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Asset Utilization Bar Chart */}
        <motion.div 
          variants={itemVariants}
          className="bg-card rounded-xl shadow-soft border border-border p-5 lg:col-span-2"
        >
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">Asset Utilization</h3>
            <p className="text-xs text-muted-foreground mt-1">Active vs Inactive by Department</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ borderRadius: '8px', backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Bar dataKey="active" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 4, 4]} barSize={32} name="Allocated" />
                <Bar dataKey="inactive" stackId="a" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} barSize={32} name="Available/Other" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Maintenance Frequency Line Chart */}
        <motion.div 
          variants={itemVariants}
          className="bg-card rounded-xl shadow-soft border border-border p-5 lg:col-span-1"
        >
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">Maintenance Frequency</h3>
            <p className="text-xs text-muted-foreground mt-1">Tickets created per month</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="issues" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} name="Tickets" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Activity Logs & Approvals */}
        <motion.div 
          variants={itemVariants}
          className="bg-card rounded-xl shadow-soft border border-border flex flex-col lg:col-span-2 h-80"
        >
          <div className="flex border-b border-border bg-muted/30">
            <div className="px-5 py-3 w-1/2 border-r border-border">
              <h3 className="text-sm font-semibold text-foreground">Global Activity Log</h3>
            </div>
            <div className="px-5 py-3 w-1/2 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-foreground">Pending Action</h3>
              <span className="bg-destructive/10 text-destructive text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded">{pendingRequests.length}</span>
            </div>
          </div>
          <div className="flex flex-1 overflow-hidden">
            
            {/* Global Activity */}
            <div className="w-1/2 overflow-y-auto p-4 border-r border-border">
              <div className="space-y-4">
                {activityLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center">No activity yet.</p>
                ) : (
                  activityLogs.map((log, i) => (
                    <div key={i} className="flex flex-col border-b border-border/50 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <p className="text-[13px] font-semibold text-foreground">{log.action}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">{log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{log.notes || log.details}</p>
                      <p className="text-[10px] text-primary mt-1">By {log.user || 'Unknown'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pending Requests */}
            <div className="w-1/2 overflow-y-auto p-4 bg-muted/10">
              <div className="space-y-3">
                {pendingRequests.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center">No pending requests.</p>
                ) : (
                  pendingRequests.map((req) => (
                    <div key={req.id} className="p-3 rounded-lg border border-border bg-background shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-foreground text-xs">{req.requestType === 'Booking' ? 'Booking' : 'Allocation'}</h4>
                        <div className="flex space-x-1 shrink-0">
                          <button onClick={() => handleReject(req.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleApprove(req.id)} className="p-1 rounded hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">{req.employeeName}</span> wants <span className="text-primary">{req.category}</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </motion.div>

      </motion.div>
    </motion.div>
  );
}
