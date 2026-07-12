import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Wrench, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { localStorageDB } from '../services/localStorageDB';
import { useAuth } from '../context/AuthContext';
import { logActivity, createNotification } from '../utils/firebaseUtils';

export default function Maintenance() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('Active');
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const unsubTickets = localStorageDB.subscribe('maintenance', (data) => {
      // Sort by createdAt desc
      const sortedData = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTickets(sortedData);
      setLoading(false);
    });

    const unsubAssets = localStorageDB.subscribe('assets', (data) => {
      setAssets(data);
    });

    return () => {
      unsubTickets();
      unsubAssets();
    };
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const selectedAsset = assets.find(a => a.id === data.assetId);
      
      await localStorageDB.add('maintenance', {
        assetId: data.assetId,
        assetName: `${selectedAsset.name} (${selectedAsset.tag})`,
        issue: data.issue,
        vendor: data.vendor || 'Internal',
        technician: data.technician || 'Unassigned',
        cost: data.cost || 0,
        status: 'In Progress',
        createdAt: new Date().toISOString()
      });

      // Optionally, put the asset into Maintenance status
      await localStorageDB.update('assets', data.assetId, { status: 'Maintenance' });

      // Log Activity
      await logActivity(
        currentUser,
        'Maintenance',
        'Maintenance Requested',
        `Issue: ${data.issue}. Tech: ${data.technician || 'Unassigned'}`
      );

      // Create Notification
      await createNotification(
        'Admin',
        'Maintenance Requested',
        `Maintenance requested for ${selectedAsset.tag}`,
        'warning'
      );

      toast.success('Maintenance ticket created.');
      reset();
    } catch (error) {
      console.error("Maintenance Error:", error);
      toast.error(error.message || 'Failed to create ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeMaintenance = async (id, assetId) => {
    try {
      await localStorageDB.update('maintenance', id, { status: 'Completed' });
      await localStorageDB.update('assets', assetId, { status: 'Available' });

      const asset = await localStorageDB.getById('assets', assetId);
      await logActivity(
        currentUser,
        'Maintenance',
        'Maintenance Completed',
        `Maintenance finished for ${asset?.tag || 'Unknown'}. Asset is now Available.`
      );

      await createNotification(
        'Admin',
        'Maintenance Completed',
        `Maintenance completed for ${asset?.tag || 'Unknown'}`,
        'success'
      );

      toast.success(`Maintenance completed. Asset is now Available.`);
    } catch (error) {
      toast.error(error.message || 'Failed to complete maintenance.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Maintenance Log</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Track asset repairs, servicing, and maintenance schedules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Maintenance Request Form */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden sticky top-24">
            <div className="p-5 border-b border-border bg-muted/30">
              <h2 className="text-base font-semibold text-foreground flex items-center">
                <Wrench className="w-4 h-4 mr-2 text-primary" />
                New Maintenance Ticket
              </h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Select Asset *</label>
                <select
                  {...register("assetId", { required: true })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                >
                  <option value="">-- Choose asset --</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.tag} - {asset.name}
                    </option>
                  ))}
                </select>
                {errors.assetId && <span className="text-xs text-destructive mt-1">Please select an asset</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Issue Description *</label>
                <textarea
                  {...register("issue", { required: true })}
                  rows="3"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm resize-none"
                  placeholder="Describe the problem..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Service Vendor (Optional)</label>
                <input
                  {...register("vendor")}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                  placeholder="e.g. Apple Care"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Technician Name (Optional)</label>
                <input
                  {...register("technician")}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                  placeholder="e.g. Mike Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Estimated Cost ($)</label>
                <input
                  type="number"
                  {...register("cost")}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                  placeholder="0.00"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || assets.length === 0}
                className="w-full py-2.5 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm flex justify-center items-center disabled:opacity-50"
              >
                {isSubmitting ? (
                   <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : null}
                {isSubmitting ? 'Creating...' : 'Create Ticket'}
              </button>
            </form>
          </div>
        </div>

        {/* Maintenance Tickets Display */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl shadow-soft">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between sm:items-center bg-muted/30 gap-4">
              <h2 className="text-base font-semibold text-foreground">Maintenance Records</h2>
              <div className="flex bg-muted p-1 rounded-lg border border-border">
                <button
                  onClick={() => setActiveTab('Active')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === 'Active' 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Active Tickets
                </button>
                <button
                  onClick={() => setActiveTab('History')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === 'History' 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  History
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-border">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                   <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                   Loading tickets...
                </div>
              ) : (
                (() => {
                  const filteredTickets = activeTab === 'Active' 
                    ? tickets.filter(t => t.status !== 'Completed')
                    : tickets.filter(t => t.status === 'Completed');
                    
                  if (filteredTickets.length === 0) {
                    return (
                      <div className="p-8 text-center text-muted-foreground">
                        No {activeTab.toLowerCase()} maintenance tickets.
                      </div>
                    );
                  }
                  
                  return filteredTickets.map((ticket) => (
                    <div key={ticket.id} className="p-5 hover:bg-muted/30 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <h4 className="text-sm font-bold text-foreground">{ticket.assetName}</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              ticket.status === 'Completed' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 
                              ticket.status === 'In Progress' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20' : 
                              'text-amber-500 bg-amber-500/10 border-amber-500/20'
                            }`}>
                              {ticket.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">{ticket.issue}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Just now'}</span>
                            <span className="flex items-center"><Wrench className="w-3.5 h-3.5 mr-1" /> {ticket.vendor}</span>
                            {ticket.technician && <span className="flex items-center text-primary/80 bg-primary/10 px-2 py-0.5 rounded border border-primary/20">Tech: {ticket.technician}</span>}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {ticket.status !== 'Completed' && (
                            <button 
                              onClick={() => completeMaintenance(ticket.id, ticket.assetId)}
                              className="px-4 py-2 rounded-lg bg-background border border-border text-foreground hover:bg-muted transition-colors text-sm font-medium shadow-sm flex items-center"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
