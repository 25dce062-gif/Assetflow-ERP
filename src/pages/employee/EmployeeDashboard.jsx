import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Clock, ShieldCheck, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function EmployeeDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ active: 0, pending: 0, returned: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) return;
      try {
        const userName = currentUser.name || currentUser.displayName || 'Unknown';
        // Active Assets
        const qAlloc = query(collection(db, 'allocations'), where('assignee', '==', userName), where('status', '==', 'Active'));
        const allocSnap = await getDocs(qAlloc);
        
        // Pending Requests
        const qTrans = query(collection(db, 'transfers'), where('to', '==', userName), where('status', '==', 'Pending'));
        const transSnap = await getDocs(qTrans);

        // Processed Returns
        const qRet = query(collection(db, 'returns'), where('returnedBy', '==', userName));
        const retSnap = await getDocs(qRet);

        setStats({
          active: allocSnap.size,
          pending: transSnap.size,
          returned: retSnap.size
        });
      } catch (error) {
        console.error("Error fetching employee stats:", error);
      }
    };
    fetchStats();
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

      <div className="bg-card border border-border rounded-xl p-8 shadow-soft text-center mt-6">
        <Activity className="w-12 h-12 text-primary mx-auto mb-4 opacity-80" />
        <h2 className="text-lg font-bold text-foreground">Need new hardware?</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2">
          If you require a new laptop, phone, or accessory for your role, submit a request to the IT department.
        </p>
      </div>
    </motion.div>
  );
}
