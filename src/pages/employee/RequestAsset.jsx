import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Send, Box } from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { withTimeout } from '../../utils/firebaseUtils';
import toast from 'react-hot-toast';

export default function RequestAsset() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await withTimeout(addDoc(collection(db, 'requests'), {
        requestedBy: currentUser.name || currentUser.displayName || 'Unknown',
        department: currentUser.department || 'Unknown',
        category: data.category,
        reason: data.reason,
        status: 'Pending',
        createdAt: serverTimestamp()
      }));

      toast.success('Asset request submitted successfully!');
      reset();
    } catch (error) {
      toast.error(error.message || 'Failed to submit request.');
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Request Asset</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Submit a request for new hardware or equipment.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/30">
          <h2 className="text-base font-semibold text-foreground flex items-center">
            <Box className="w-4 h-4 mr-2 text-primary" />
            Request Details
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Equipment Category *</label>
            <select
              {...register("category", { required: true })}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            >
              <option value="">Select Category</option>
              <option value="Laptop">Laptop / Computer</option>
              <option value="Mobile Phone">Mobile Phone</option>
              <option value="Monitor">Monitor</option>
              <option value="Accessories">Keyboard / Mouse / Accessories</option>
              <option value="Other">Other</option>
            </select>
            {errors.category && <span className="text-destructive text-xs mt-1 block">Category is required</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Business Justification / Reason *</label>
            <textarea
              {...register("reason", { required: true })}
              rows="4"
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              placeholder="Why do you need this equipment?"
            ></textarea>
            {errors.reason && <span className="text-destructive text-xs mt-1 block">Reason is required</span>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center px-4 py-2.5 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                 <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                 <Send className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
