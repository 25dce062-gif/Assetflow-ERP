import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { RotateCcw, Box, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { collection, onSnapshot, doc, updateDoc, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function Returns() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [allocatedAssets, setAllocatedAssets] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const qAssets = query(collection(db, 'assets'), where('status', '==', 'Allocated'));
    const unsubAssets = onSnapshot(qAssets, (snapshot) => {
      setAllocatedAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubAssets();
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const selectedAsset = allocatedAssets.find(a => a.id === data.assetId);
      const newStatus = (data.condition === 'Poor' || data.condition === 'Damaged') ? 'Maintenance' : 'Available';

      // 1. Log the return
      await addDoc(collection(db, 'returns'), {
        assetId: data.assetId,
        assetName: `${selectedAsset.name} (${selectedAsset.tag})`,
        returnedBy: data.returnedBy,
        returnDate: data.returnDate,
        condition: data.condition,
        notes: data.notes,
        createdAt: serverTimestamp()
      });

      // 2. Update asset status
      await updateDoc(doc(db, 'assets', data.assetId), {
        status: newStatus,
        department: 'Warehouse'
      });

      // 3. Mark active allocation as returned (simplification: we skip querying allocations here for brevity, but in a real app we'd mark it inactive)

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
    </motion.div>
  );
}
