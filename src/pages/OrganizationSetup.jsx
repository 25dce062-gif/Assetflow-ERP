import { useState, useEffect } from 'react';
import { localStorageDB } from '../services/localStorageDB';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../utils/firebaseUtils';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Building2, MapPin, Tags, Plus, Edit2, Trash2 } from 'lucide-react';

export default function OrganizationSetup() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('departments');
  const [data, setData] = useState({ departments: [], categories: [], locations: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const unsubDepts = localStorageDB.subscribe('departments', (data) => {
      setData(prev => ({ ...prev, departments: data }));
    });
    const unsubCats = localStorageDB.subscribe('assetCategories', (data) => {
      setData(prev => ({ ...prev, categories: data }));
    });
    const unsubLocs = localStorageDB.subscribe('locations', (data) => {
      setData(prev => ({ ...prev, locations: data }));
    });
    return () => { unsubDepts(); unsubCats(); unsubLocs(); };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Name is required");
    
    setIsSubmitting(true);
    const collectionName = activeTab === 'departments' ? 'departments' : activeTab === 'categories' ? 'assetCategories' : 'locations';
    const itemName = activeTab === 'departments' ? 'Department' : activeTab === 'categories' ? 'Category' : 'Location';

    try {
      if (editingId) {
        await localStorageDB.update(collectionName, editingId, formData);
        await logActivity(currentUser, 'Organization Setup', 'Update', `Updated ${itemName}: ${formData.name}`);
        toast.success(`${itemName} updated successfully`);
      } else {
        await localStorageDB.add(collectionName, { ...formData, createdAt: new Date().toISOString() });
        await logActivity(currentUser, 'Organization Setup', 'Create', `Created ${itemName}: ${formData.name}`);
        toast.success(`${itemName} created successfully`);
      }
      setFormData({ name: '', description: '' });
      setEditingId(null);
    } catch (error) {
      toast.error(`Failed to save ${itemName}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({ name: item.name, description: item.description || '' });
    setEditingId(item.id);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    
    const collectionName = activeTab === 'departments' ? 'departments' : activeTab === 'categories' ? 'assetCategories' : 'locations';
    const itemName = activeTab === 'departments' ? 'Department' : activeTab === 'categories' ? 'Category' : 'Location';

    try {
      await localStorageDB.delete(collectionName, id);
      await logActivity(currentUser, 'Organization Setup', 'Delete', `Deleted ${itemName}: ${name}`);
      toast.success(`${itemName} deleted`);
    } catch (error) {
      toast.error(`Failed to delete ${itemName}`);
    }
  };

  const tabs = [
    { id: 'departments', name: 'Departments', icon: Building2 },
    { id: 'categories', name: 'Asset Categories', icon: Tags },
    { id: 'locations', name: 'Locations', icon: MapPin },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Organization Setup</h1>
        <p className="text-muted-foreground mt-2">Manage departments, asset categories, and physical locations.</p>
      </div>

      <div className="flex space-x-1 bg-muted p-1 rounded-xl mb-8 w-full sm:w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setEditingId(null);
              setFormData({ name: '', description: '' });
            }}
            className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Panel */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 rounded-2xl border border-border sticky top-24">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Edit' : 'Add'} {tabs.find(t => t.id === activeTab)?.name.slice(0, -1)}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="e.g. IT Department"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description (Optional)</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Details..."
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Add'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setFormData({ name: '', description: '' }); }}
                    className="flex-1 bg-muted text-foreground py-2 px-4 rounded-lg font-medium hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List Panel */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Description</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {data[activeTab].length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-muted-foreground">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  data[activeTab].map((item) => (
                    <motion.tr 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      key={item.id} 
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{item.name}</div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">{item.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => handleEdit(item)} className="p-2 text-muted-foreground hover:text-primary transition-colors bg-muted/50 rounded-lg">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id, item.name)} className="p-2 text-muted-foreground hover:text-destructive transition-colors bg-muted/50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
