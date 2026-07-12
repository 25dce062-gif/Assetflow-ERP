import { useState, useEffect } from 'react';
import { Package, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';

export default function MyAssets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    
    const userName = currentUser.name || currentUser.displayName || 'Unknown';
    // We fetch allocations where assignee matches the user
    const q = query(collection(db, 'allocations'), where('assignee', '==', userName), where('status', '==', 'Active'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Assets</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">View the equipment currently assigned to you.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Assigned Date</th>
                <th className="px-6 py-3">Expected Return</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading your assets...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                    You currently have no assets assigned to you.
                  </td>
                </tr>
              ) : (
                assets.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground flex items-center">
                      <Package className="w-4 h-4 mr-2 text-primary" />
                      {item.assetName}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{item.createdAt?.toDate().toLocaleDateString() || 'N/A'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.returnDate || 'Permanent'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border text-blue-500 bg-blue-500/10 border-blue-500/20">
                        {item.status}
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
