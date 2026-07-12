import { useForm } from 'react-hook-form';
import { Package, UploadCloud, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useState } from 'react';
import { withTimeout } from '../utils/firebaseUtils';

export default function AssetRegistration() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      let fileUrl = null;
      
      // Handle file upload if a file was selected
      if (data.file && data.file.length > 0) {
        const file = data.file[0];
        const storageRef = ref(storage, `assets/${file.name}-${Date.now()}`);
        // Upload with timeout
        const snapshot = await withTimeout(uploadBytes(storageRef, file));
        fileUrl = await getDownloadURL(snapshot.ref);
      }

      // Create the asset document in Firestore
      const assetData = {
        name: data.name,
        category: data.category,
        serialNumber: data.serialNumber || 'N/A',
        condition: data.condition,
        status: 'Available', // Default status for new assets
        department: 'Unassigned',
        location: 'Warehouse',
        imageUrl: fileUrl,
        createdAt: serverTimestamp(),
        // Generate a random tag for now (in production, use a sequential generator)
        tag: `AF-${Math.floor(1000 + Math.random() * 9000)}`
      };

      // Wrap Firestore call in timeout
      await withTimeout(addDoc(collection(db, 'assets'), assetData));
      
      toast.success('Asset registered successfully!');
      reset();
      navigate('/admin/assets');
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error(error.message || 'Failed to register asset. Check database connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Register New Asset</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Enter the details to add a new asset to the organizational directory.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
          <div className="p-5 border-b border-border bg-muted/30">
            <h2 className="text-base font-semibold text-foreground flex items-center">
              <Package className="w-4 h-4 mr-2 text-primary" />
              Basic Information
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Asset Name *</label>
              <input
                {...register("name", { required: true })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                placeholder="e.g. MacBook Pro M2"
              />
              {errors.name && <span className="text-destructive text-xs mt-1 block">This field is required</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Asset Tag</label>
              <input
                disabled
                value="Auto-generated"
                className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground text-sm shadow-sm cursor-not-allowed font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">Tag assigned upon save</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Category *</label>
              <select
                {...register("category", { required: true })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              >
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Machinery">Machinery</option>
                <option value="IT Equipment">IT Equipment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Serial Number</label>
              <input
                {...register("serialNumber")}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                placeholder="SN-123456789"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Condition *</label>
              <select
                {...register("condition", { required: true })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
          <div className="p-5 border-b border-border bg-muted/30">
            <h2 className="text-base font-semibold text-foreground flex items-center">
              <UploadCloud className="w-4 h-4 mr-2 text-primary" />
              Media & Documents
            </h2>
          </div>
          <div className="p-6">
            <div className="flex justify-center px-6 py-10 border-2 border-dashed border-border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
              <div className="space-y-2 text-center">
                <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="text-sm text-foreground">
                  <label className="relative cursor-pointer rounded-md font-medium text-primary hover:underline focus-within:outline-none">
                    <span>Upload a file</span>
                    <input type="file" {...register("file")} className="sr-only" />
                  </label>
                  <span className="pl-1 text-muted-foreground">or drag and drop</span>
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG, PDF up to 10MB</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/admin/assets')}
            className="px-4 py-2 border border-input rounded-lg bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
               <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
               <Save className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? 'Saving...' : 'Save Asset'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
