import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { localStorageDB } from '../../services/localStorageDB';
import toast from 'react-hot-toast';

export default function ReturnRequest() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myAssets, setMyAssets] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    const userName = currentUser.name || currentUser.displayName || 'Unknown';
    const unsubscribe = localStorageDB.subscribe('allocations', (data) => {
      setMyAssets(data.filter(a => a.assignee === userName && a.status === 'Active'));
    });
    return () => unsubscribe();
  }, [currentUser]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const selectedAsset = myAssets.find(a => a.assetId === data.assetId);
      
      await localStorageDB.add('requests', {
        employeeId: currentUser.uid,
        employeeName: currentUser.name || currentUser.displayName || 'Unknown',
        requestType: 'Return',
        assetId: data.assetId,
        assetName: selectedAsset?.assetName || 'Unknown Asset',
        returnDate: new Date().toISOString().split('T')[0],
        condition: data.condition,
        notes: data.notes,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });

      toast.success('Return initiated. Please drop off the asset at IT.');
      reset();
    } catch (error) {
      toast.error(error.message || 'Failed to initiate return.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Return Asset</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Initiate a return for equipment currently assigned to you.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/30">
          <h2 className="text-base font-semibold text-foreground flex items-center">
            <RotateCcw className="w-4 h-4 mr-2 text-primary" />
            Return Details
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Select Asset *</label>
            <select
              {...register("assetId", { required: true })}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            >
              <option value="">-- Select an assigned asset --</option>
              {myAssets.map(asset => (
                <option key={asset.assetId} value={asset.assetId}>{asset.assetName}</option>
              ))}
            </select>
            {errors.assetId && <span className="text-destructive text-xs mt-1 block">Please select an asset</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Current Condition *</label>
            <select
              {...register("condition", { required: true })}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            >
              <option value="Good">Good (Working normally)</option>
              <option value="Fair">Fair (Minor wear and tear)</option>
              <option value="Poor">Poor (Needs repair/maintenance)</option>
              <option value="Damaged">Damaged (Broken)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Additional Notes</label>
            <textarea
              {...register("notes")}
              rows="3"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              placeholder="Any issues IT should know about?"
            ></textarea>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || myAssets.length === 0}
              className="w-full flex justify-center items-center px-4 py-2.5 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                 <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                 <RotateCcw className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? 'Processing...' : 'Initiate Return'}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
