import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit, Tag, Package, Building, MapPin, Calendar, 
  DollarSign, Activity, FileText, Image as ImageIcon, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function AssetDetails() {
  const { id } = useParams(); // 'id' corresponds to the tag based on the routing setup
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const q = query(collection(db, 'assets'), where('tag', '==', id));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setAsset({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
        }
      } catch (error) {
        console.error("Error fetching asset details: ", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAsset();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground font-medium">Loading asset details...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold text-foreground">Asset Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">The asset with tag {id} does not exist.</p>
        <Link to="/admin/assets" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
          Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/admin/assets" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border bg-background shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{asset.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                asset.status === 'Available' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' :
                asset.status === 'Allocated' ? 'text-blue-500 bg-blue-500/10 border-blue-500/20' :
                'text-amber-500 bg-amber-500/10 border-amber-500/20'
              }`}>
                {asset.status}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-sm font-medium flex items-center">
              <Tag className="w-4 h-4 mr-1.5" /> {asset.tag}
            </p>
          </div>
        </div>
        <button className="inline-flex items-center justify-center rounded-lg bg-background border border-border px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors">
          <Edit className="mr-2 h-4 w-4" />
          Edit Details
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl shadow-soft">
            <div className="p-5 border-b border-border bg-muted/30">
              <h2 className="text-base font-semibold text-foreground flex items-center">
                <Package className="w-4 h-4 mr-2 text-primary" />
                Asset Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Category</p>
                <p className="text-sm font-semibold text-foreground flex items-center">
                  {asset.category || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Serial Number</p>
                <p className="text-sm font-semibold text-foreground font-mono">{asset.serialNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Department</p>
                <p className="text-sm font-semibold text-foreground flex items-center">
                  <Building className="w-4 h-4 mr-2 text-muted-foreground" />
                  {asset.department || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Location</p>
                <p className="text-sm font-semibold text-foreground flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                  {asset.location || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Registration Date</p>
                <p className="text-sm font-semibold text-foreground flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  {asset.createdAt?.toDate().toLocaleDateString() || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Condition</p>
                <p className="text-sm font-semibold text-foreground flex items-center">
                  {asset.condition || 'N/A'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Description</p>
                <p className="text-sm text-foreground">{asset.description || 'No description provided.'}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-soft">
            <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
              <h2 className="text-base font-semibold text-foreground flex items-center">
                <Activity className="w-4 h-4 mr-2 text-primary" />
                History & Activity
              </h2>
            </div>
            <div className="p-6">
              <div className="relative border-l-2 border-border ml-3 space-y-8">
                
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 ring-4 ring-card"></div>
                  <p className="text-sm text-foreground"><span className="font-semibold">Allocated</span> to Sarah Connor</p>
                  <p className="text-xs text-muted-foreground mt-1">Oct 15, 2023 - 09:41 AM</p>
                </div>

                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-muted-foreground rounded-full -left-[7px] top-1.5 ring-4 ring-card"></div>
                  <p className="text-sm text-foreground"><span className="font-semibold">Registered</span> by System Admin</p>
                  <p className="text-xs text-muted-foreground mt-1">Jan 15, 2023 - 11:20 AM</p>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {asset.status === 'Allocated' && (
            <div className="bg-card border border-border rounded-xl shadow-soft p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Current Assignment</h3>
              <div className="flex items-center p-3 rounded-lg bg-muted/50 border border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                  {asset.department?.charAt(0) || 'U'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-semibold text-foreground">Allocated</p>
                  <p className="text-xs text-muted-foreground">{asset.department}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl shadow-soft">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Documents & Media</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group">
                <FileText className="w-8 h-8 text-primary opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-foreground">Invoice_0123.pdf</p>
                  <p className="text-xs text-muted-foreground">245 KB</p>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group">
                <ImageIcon className="w-8 h-8 text-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-foreground">Asset_Photo.jpg</p>
                  <p className="text-xs text-muted-foreground">1.2 MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
