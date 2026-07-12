import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Clock, ShieldCheck, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { localStorageDB } from '../../services/localStorageDB';

export default function EmployeeDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ active: 0, pending: 0, returned: 0 });
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const userName = currentUser.name || currentUser.displayName || 'Unknown';

    const unsubscribeRequests = localStorageDB.subscribe('requests', (data) => {
      const userRequests = data.filter(r => r.employeeId === currentUser.uid);
      setMyRequests(userRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      
      const pendingCount = userRequests.filter(r => r.status === 'Pending').length;
      setStats(prev => ({ ...prev, pending: pendingCount }));
    });

    const unsubscribeAllocations = localStorageDB.subscribe('allocations', (data) => {
      const activeCount = data.filter(a => a.assignee === userName && a.status === 'Active').length;
      setStats(prev => ({ ...prev, active: activeCount }));
    });

    const unsubscribeReturns = localStorageDB.subscribe('returns', (data) => {
      const returnedCount = data.filter(r => r.returnedBy === userName).length;
      setStats(prev => ({ ...prev, returned: returnedCount }));
    });

    return () => {
      unsubscribeRequests();
      unsubscribeAllocations();
      unsubscribeReturns();
    };
  }, [currentUser]);

  const statCards = [
    { title: 'My Active Assets', value: stats.active, icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Pending Requests', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Completed Returns', value: stats.returned, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome, {currentUser?.name?.split(' ')[0] || 'Employee'}!</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Here is an overview of your assigned equipment and active requests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-card border border-border rounded-xl p-6 shadow-soft hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-3xl font-extrabold text-foreground mt-2">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* My Requests Section */}
      <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden mt-6">
        <div className="p-5 border-b border-border bg-muted/30">
          <h2 className="text-base font-semibold text-foreground flex items-center">
            <Activity className="w-4 h-4 mr-2 text-primary" />
            My Requests
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Details</th>
                <th className="px-6 py-3">Submitted On</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {myRequests.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-muted-foreground">
                    You have no requests.
                  </td>
                </tr>
              ) : (
                myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{req.requestType}</td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">
                      {req.category || req.assetName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        req.status === 'Approved' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' :
                        req.status === 'Rejected' ? 'text-destructive bg-destructive/10 border-destructive/20' :
                        'text-amber-500 bg-amber-500/10 border-amber-500/20'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
