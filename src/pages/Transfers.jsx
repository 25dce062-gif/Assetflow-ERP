import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRightLeft, Search, Clock, Check, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { localStorageDB } from '../services/localStorageDB';
import { useAuth } from '../context/AuthContext';

const MOCK_PENDING = [
  { id: 1, asset: 'MacBook Pro M2 (AF-0001)', from: 'Engineering', to: 'Design', requestedBy: 'Sarah Connor', date: 'Today, 09:41 AM' },
  { id: 2, asset: 'Sony A7IV Camera (AF-0004)', from: 'Marketing', to: 'Media Team', requestedBy: 'John Doe', date: 'Yesterday, 14:30 PM' },
];

export default function Transfers() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [allocatedAssets, setAllocatedAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Fetch Pending Transfers
    const unsubTransfers = localStorageDB.subscribe('transfers', (data) => {
      setPendingTransfers(data.filter(t => t.status === 'Pending'));
      setLoading(false);
    });

    // Fetch Allocated Assets for the dropdown
    const unsubAssets = localStorageDB.subscribe('assets', (data) => {
      setAllocatedAssets(data.filter(a => a.status === 'Allocated'));
    });

    return () => {
      unsubTransfers();
      unsubAssets();
    };
  }, []);
  
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const selectedAsset = allocatedAssets.find(a => a.id === data.assetId);
      
      await localStorageDB.add('transfers', {
        assetId: data.assetId,
        assetName: `${selectedAsset.name} (${selectedAsset.tag})`,
        from: selectedAsset.department || 'Unknown',
        to: data.newAssignee,
        reason: data.reason,
        requestedBy: currentUser?.displayName || currentUser?.name || 'Unknown Employee',
        status: 'Pending',
        createdAt: new Date().toISOString()
      });

      toast.success('Transfer request submitted for approval.');
      reset();
    } catch (error) {
      console.error("Transfer Request Error:", error);
      toast.error(error.message || 'Failed to request transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (transferId, assetId, newLocation) => {
    try {
      // Update the transfer request
      await localStorageDB.update('transfers', transferId, { status: 'Approved' });
      // Update the asset's location/department
      await localStorageDB.update('assets', assetId, { department: newLocation });
      
      toast.success(`Transfer approved.`);
    } catch (error) {
      toast.error(error.message || 'Failed to approve transfer.');
    }
  };

  const handleReject = async (transferId) => {
    try {
      await localStorageDB.update('transfers', transferId, { status: 'Rejected' });
      toast.success(`Transfer rejected.`);
    } catch (error) {
      toast.error(error.message || 'Failed to reject transfer.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Asset Transfers</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Manage and approve asset transfers between departments or individuals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Transfer Request Form */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden sticky top-24">
            <div className="p-5 border-b border-border bg-muted/30">
              <h2 className="text-base font-semibold text-foreground flex items-center">
                <ArrowRightLeft className="w-4 h-4 mr-2 text-primary" />
                Request Transfer
              </h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Select Asset *</label>
                <select
                  {...register("assetId", { required: true })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                >
                  <option value="">-- Choose allocated asset --</option>
                  {allocatedAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.tag} - {asset.name}
                    </option>
                  ))}
                </select>
                {errors.assetId && <span className="text-xs text-destructive mt-1">Please select an asset</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">New Assignee / Location *</label>
                <input
                  {...register("newAssignee", { required: true })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                  placeholder="e.g. Design Dept"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Reason for Transfer *</label>
                <textarea
                  {...register("reason", { required: true })}
                  rows="3"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm resize-none"
                  placeholder="Why is this transfer needed?"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || allocatedAssets.length === 0}
                className="w-full py-2.5 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm flex justify-center items-center disabled:opacity-50"
              >
                {isSubmitting ? (
                   <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : null}
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="text-base font-semibold text-foreground flex items-center">
                <Clock className="w-4 h-4 mr-2 text-amber-500" />
                Pending Approvals
              </h2>
            </div>
            
            <div className="divide-y divide-border">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                   <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                   Loading transfer requests...
                </div>
              ) : pendingTransfers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No pending transfer requests.
                </div>
              ) : (
                pendingTransfers.map((req) => (
                  <div key={req.id} className="p-5 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-foreground mb-1">{req.assetName}</h4>
                        <div className="flex items-center text-xs text-muted-foreground mt-2">
                          <span className="font-medium bg-muted px-2 py-1 rounded text-foreground border border-border">{req.from}</span>
                          <ArrowRightLeft className="w-3 h-3 mx-2 text-muted-foreground" />
                          <span className="font-medium bg-muted px-2 py-1 rounded text-foreground border border-border">{req.to}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">Requested by <span className="font-semibold text-foreground">{req.requestedBy}</span> on {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Unknown'}</p>
                      </div>
                      <div className="flex space-x-2 shrink-0">
                        <button 
                          onClick={() => handleReject(req.id)}
                          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleApprove(req.id, req.assetId, req.to)}
                          className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm font-medium shadow-sm flex items-center"
                        >
                          <Check className="w-4 h-4 mr-1.5" /> Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
