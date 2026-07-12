import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { RotateCcw, Box, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { localStorageDB } from '../services/localStorageDB';
import { useAuth } from '../context/AuthContext';
import { logActivity, createNotification } from '../utils/firebaseUtils';

export default function Returns() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [allocatedAssets, setAllocatedAssets] = useState([]);
  const [returnHistory, setReturnHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const unsubAssets = localStorageDB.subscribe('assets', (data) => {
      setAllocatedAssets(data.filter(a => a.status === 'Allocated'));
    });
    const unsubReturns = localStorageDB.subscribe('returns', (data) => {
      setReturnHistory([...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setLoading(false);
    });
    return () => { unsubAssets(); unsubReturns(); };
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const selectedAsset = allocatedAssets.find(a => a.id === data.assetId);
      const newStatus = (data.condition === 'Poor' || data.condition === 'Damaged') ? 'Maintenance' : 'Available';

      // 1. Log the return
      await localStorageDB.add('returns', {
        assetId: data.assetId,
        assetName: `${selectedAsset.name} (${selectedAsset.tag})`,
        returnedBy: data.returnedBy,
        returnDate: data.returnDate,
        condition: data.condition,
        notes: data.notes,
        createdAt: new Date().toISOString()
      });

      // 2. Update asset status
      await localStorageDB.update('assets', data.assetId, {
        status: newStatus,
        department: 'Warehouse'
      });

      // 3. Mark active allocation as returned
      const allocations = await localStorageDB.getWhere('allocations', 'assetId', '==', data.assetId);
      const activeAllocation = allocations.find(a => a.status === 'Active');
      if (activeAllocation) {
        await localStorageDB.update('allocations', activeAllocation.id, { status: 'Returned' });
      }

      // 4. Log Activity
      await logActivity(
        currentUser,
        'Returns',
        'Asset Returned',
        `Returned by ${data.returnedBy}. Condition: ${data.condition}. ${data.notes || ''}`
      );

      // 5. Create Notification
      await createNotification(
        'Admin',
        'Asset Returned',
        `Asset ${selectedAsset.tag} has been returned by ${data.returnedBy}`,
        'info'
      );

      toast.success(`Return logged. Asset is now ${newStatus}.`);
      reset();
    } catch (error) {
      console.error("Return Error:", error);
      toast.error('Failed to process return.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Asset Returns</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Log assets that have been returned by employees or departments.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/30">
          <h2 className="text-base font-semibold text-foreground flex items-center">
            <RotateCcw className="w-4 h-4 mr-2 text-primary" />
            Process Return
          </h2>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Select Allocated Asset *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Box className="h-4 w-4 text-muted-foreground" />
                </div>
                <select
                  {...register("assetId", { required: true })}
                  className="w-full pl-9 pr-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                >
                  <option value="">-- Choose asset --</option>
                  {allocatedAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.tag} - {asset.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.assetId && <span className="text-xs text-destructive mt-1">Please select an asset</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Returned By *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  {...register("returnedBy", { required: true })}
                  className="w-full pl-9 pr-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                  placeholder="Employee Name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Return Date *</label>
              <input
                type="date"
                {...register("returnDate", { required: true })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Condition Upon Return *</label>
              <select
                {...register("condition", { required: true })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
              >
                <option value="Good">Good (Working Condition)</option>
                <option value="Fair">Fair (Normal Wear)</option>
                <option value="Poor">Poor (Needs Repair)</option>
                <option value="Damaged">Damaged (Unusable)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Return Notes / Reason</label>
            <textarea
              {...register("notes")}
              rows="3"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm resize-none"
              placeholder="Any physical damage or software issues to report?"
            ></textarea>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 shrink-0" />
            <p className="text-sm text-amber-800">
              Returning an asset will automatically change its status to <strong>Available</strong> or <strong>Maintenance</strong> depending on the condition reported above.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting || allocatedAssets.length === 0}
              className="px-6 py-2.5 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm flex justify-center items-center disabled:opacity-50"
            >
              {isSubmitting ? (
                 <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : null}
              {isSubmitting ? 'Processing...' : 'Log Return'}
            </button>
          </div>
        </form>
      </div>
      <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden mt-6">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="text-base font-semibold text-foreground flex items-center">
            Return History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-5 py-3">Asset</th>
                <th className="px-5 py-3">Returned By</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : returnHistory.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-muted-foreground">
                    No return history found.
                  </td>
                </tr>
              ) : (
                returnHistory.map((ret) => (
                  <tr key={ret.id} className="hover:bg-muted/30">
                    <td className="px-5 py-4 font-medium text-foreground">{ret.assetName}</td>
                    <td className="px-5 py-4 text-muted-foreground">{ret.returnedBy}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {ret.returnDate ? new Date(ret.returnDate).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        ret.condition === 'Good' || ret.condition === 'Fair' 
                          ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
                          : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                      }`}>
                        {ret.condition}
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
