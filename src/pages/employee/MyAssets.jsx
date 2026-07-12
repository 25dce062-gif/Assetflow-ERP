import { useState, useEffect } from 'react';
import { Package, Search, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { localStorageDB } from '../../services/localStorageDB';
import { useAuth } from '../../context/AuthContext';

export default function MyAssets() {
  const [assets, setAssets] = useState([]);
  const [allAssets, setAllAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    
    const userName = currentUser.name || currentUser.displayName || 'Unknown';
    // We fetch allocations where assignee matches the user
    const unsubscribe = localStorageDB.subscribe('allocations', (data) => {
      setAssets(data.filter(a => a.assignee === userName && a.status === 'Active'));
      setLoading(false);
    });
    
    const unsubscribeAssets = localStorageDB.subscribe('assets', (data) => {
      setAllAssets(data);
    });

    return () => {
      unsubscribe();
      unsubscribeAssets();
    };
  }, [currentUser]);

  const handleAssetClick = (allocation) => {
    const assetDetail = allAssets.find(a => a.id === allocation.assetId);
    if (assetDetail) {
      setSelectedAsset({ ...assetDetail, allocation });
    }
  };

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
                <th className="px-6 py-3 text-right">Details</th>
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
                  <tr 
                    key={item.id} 
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleAssetClick(item)}
                  >
                    <td className="px-6 py-4 font-medium text-foreground flex items-center">
                      <Package className="w-4 h-4 mr-2 text-primary" />
                      {item.assetName}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{item.returnDate || 'Permanent'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border text-blue-500 bg-blue-500/10 border-blue-500/20">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Info className="w-4 h-4 text-muted-foreground inline-block" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedAsset && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-card w-full max-w-lg rounded-xl shadow-xl border border-border overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
                <h3 className="font-semibold text-foreground flex items-center">
                  <Package className="w-4 h-4 mr-2 text-primary" />
                  Asset Details
                </h3>
                <button 
                  onClick={() => setSelectedAsset(null)}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Asset Name</p>
                    <p className="text-sm font-medium text-foreground">{selectedAsset.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Asset Tag</p>
                    <p className="text-sm font-medium text-foreground">{selectedAsset.tag}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="text-sm font-medium text-foreground">{selectedAsset.category || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Serial Number</p>
                    <p className="text-sm font-medium text-foreground">{selectedAsset.serialNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Allocated On</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedAsset.allocation?.createdAt ? new Date(selectedAsset.allocation.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Return Date</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedAsset.allocation?.returnDate || 'Permanent'}
                    </p>
                  </div>
                </div>
                
                {selectedAsset.specifications && (
                  <div className="pt-4 border-t border-border mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Specifications</p>
                    <div className="bg-muted p-3 rounded-lg text-sm whitespace-pre-wrap text-foreground">
                      {selectedAsset.specifications}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => setSelectedAsset(null)}
                    className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
