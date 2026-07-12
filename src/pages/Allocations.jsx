import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ClipboardList, Search, CheckCircle2, User, Building, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { collection, onSnapshot, addDoc, doc, updateDoc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { withTimeout } from '../utils/firebaseUtils';

export default function Allocations() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [allocations, setAllocations] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch Active Allocations
    const qAllocations = query(collection(db, 'allocations'), orderBy('createdAt', 'desc'));
    const unsubAllocations = onSnapshot(qAllocations, (snapshot) => {
      setAllocations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching allocations:", error);
      setLoading(false);
    });

    // Fetch Available Assets for the dropdown
    const qAssets = query(collection(db, 'assets'), where('status', '==', 'Available'));
    const unsubAssets = onSnapshot(qAssets, (snapshot) => {
      setAvailableAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubAllocations();
      unsubAssets();
    };
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const selectedAsset = availableAssets.find(a => a.id === data.assetId);
      
      // 1. Create Allocation Record with timeout
      await withTimeout(addDoc(collection(db, 'allocations'), {
        assetId: data.assetId,
        assetName: `${selectedAsset.name} (${selectedAsset.tag})`,
        assignee: data.assignee,
        department: data.department || 'Unassigned',
        returnDate: data.returnDate || 'Permanent',
        status: 'Active',
        createdAt: serverTimestamp()
      }));

      // 2. Update Asset Status to Allocated with timeout
      await withTimeout(updateDoc(doc(db, 'assets', data.assetId), {
        status: 'Allocated',
        department: data.department || 'Unassigned'
      }));

      toast.success('Asset successfully allocated!');
      reset();
    } catch (error) {
      console.error("Allocation Error:", error);
      toast.error(error.message || 'Failed to allocate asset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Asset Allocations</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Assign assets to employees or departments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Allocation Form */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden sticky top-24">
            <div className="p-5 border-b border-border bg-muted/30">
              <h2 className="text-base font-semibold text-foreground flex items-center">
                <ClipboardList className="w-4 h-4 mr-2 text-primary" />
                New Allocation
              </h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Select Asset *</label>
                <select
                  {...register("assetId", { required: true })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                >
                  <option value="">-- Choose available asset --</option>
                  {availableAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.tag} - {asset.name}
                    </option>
                  ))}
                </select>
                {errors.assetId && <span className="text-xs text-destructive mt-1">Please select an asset</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Assignee (Employee) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    {...register("assignee", { required: true })}
                    className="w-full pl-9 pr-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                    placeholder="e.g. Jane Smith"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Department</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <select
                    {...register("department")}
                    className="w-full pl-9 pr-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                  >
                    <option value="">-- Optional --</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Expected Return Date</label>
                <input
                  type="date"
                  {...register("returnDate")}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Leave blank if permanent allocation.</p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || availableAssets.length === 0}
                className="w-full py-2.5 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center"
              >
                {isSubmitting ? (
                   <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : null}
                {isSubmitting ? 'Allocating...' : 'Allocate Asset'}
              </button>
            </form>
          </div>
        </div>

        {/* Current Allocations List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl shadow-soft">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="text-base font-semibold text-foreground">Active Allocations</h2>
              <div className="relative w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-9 pr-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Search allocations..."
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-5 py-3">Asset</th>
                    <th className="px-5 py-3">Assignee</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-muted-foreground">
                        <div className="flex justify-center mb-2">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        Loading allocations...
                      </td>
                    </tr>
                  ) : allocations.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-muted-foreground">
                        No active allocations found.
                      </td>
                    </tr>
                  ) : (
                    allocations.map((alloc) => (
                      <tr key={alloc.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-4 font-medium text-foreground">{alloc.assetName}</td>
                        <td className="px-5 py-4 text-foreground">{alloc.assignee}</td>
                        <td className="px-5 py-4 text-muted-foreground">{alloc.department}</td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {alloc.createdAt?.toDate().toLocaleDateString() || 'Just now'}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border text-emerald-500 bg-emerald-500/10 border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {alloc.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
