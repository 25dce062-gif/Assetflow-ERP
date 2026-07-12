import { useState, useEffect } from 'react';
import { localStorageDB } from '../services/localStorageDB';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../utils/firebaseUtils';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Search, ShieldAlert, ShieldCheck, UserCheck, UserX } from 'lucide-react';

export default function EmployeeManagement() {
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    const unsubscribe = localStorageDB.subscribe('users', (data) => {
      const sortedData = [...data].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setEmployees(sortedData);
    });
    return unsubscribe;
  }, []);

  const handleUpdateRole = async (employee, newRole) => {
    if (!window.confirm(`Are you sure you want to promote ${employee.name} to ${newRole}?`)) return;
    
    setLoadingId(employee.id);
    try {
      await localStorageDB.update('users', employee.id, { role: newRole });
      await logActivity(currentUser, 'Employee Management', 'Role Update', `Updated role of ${employee.name} to ${newRole}`);
      toast.success(`${employee.name} is now a ${newRole}`);
    } catch (error) {
      toast.error('Failed to update role');
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggleStatus = async (employee) => {
    const newStatus = employee.status === 'Active' ? 'Inactive' : 'Active';
    if (!window.confirm(`Are you sure you want to mark ${employee.name} as ${newStatus}?`)) return;
    
    setLoadingId(employee.id);
    try {
      await localStorageDB.update('users', employee.id, { status: newStatus });
      await logActivity(currentUser, 'Employee Management', 'Status Update', `Marked ${employee.name} as ${newStatus}`);
      toast.success(`${employee.name} is now ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setLoadingId(null);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(search.toLowerCase()) || 
    emp.email?.toLowerCase().includes(search.toLowerCase()) ||
    emp.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Employee Management</h1>
          <p className="text-muted-foreground mt-2">Manage employee roles, access, and status.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {filteredEmployees.map((emp) => (
                <motion.tr 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  key={emp.id} 
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {emp.photoURL ? (
                        <img src={emp.photoURL} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-background" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold ring-2 ring-background">
                          {emp.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-foreground">{emp.name}</div>
                        <div className="text-sm text-muted-foreground">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                      emp.role === 'Admin' ? 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400' :
                      emp.role === 'Asset Manager' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                      emp.role === 'Department Head' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {emp.role || 'Employee'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center space-x-1.5 ${
                      emp.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${emp.status === 'Active' ? 'bg-emerald-500' : 'bg-destructive'}`}></span>
                      <span className="text-sm font-medium">{emp.status || 'Active'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <select 
                        className="text-xs bg-background border border-input rounded-lg px-2 py-1.5 font-medium cursor-pointer"
                        value={emp.role || 'Employee'}
                        onChange={(e) => handleUpdateRole(emp, e.target.value)}
                        disabled={loadingId === emp.id || emp.id === currentUser.uid}
                      >
                        <option value="Employee">Employee</option>
                        <option value="Department Head">Department Head</option>
                        <option value="Asset Manager">Asset Manager</option>
                        <option value="Admin">Admin</option>
                      </select>
                      
                      <button 
                        onClick={() => handleToggleStatus(emp)}
                        disabled={loadingId === emp.id || emp.id === currentUser.uid}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          emp.status === 'Active' 
                            ? 'border-destructive/20 text-destructive hover:bg-destructive hover:text-white'
                            : 'border-emerald-500/20 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                        }`}
                        title={emp.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                      >
                        {emp.status === 'Active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-muted-foreground">
                    No employees found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
