import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import DashboardLayout from './components/layout/DashboardLayout';
import EmployeeLayout from './components/layout/EmployeeLayout';
import Dashboard from './pages/Dashboard';
import AssetDirectory from './pages/AssetDirectory';
import AssetRegistration from './pages/AssetRegistration';
import AssetDetails from './pages/AssetDetails';
import Allocations from './pages/Allocations';
import Transfers from './pages/Transfers';
import Returns from './pages/Returns';
import Maintenance from './pages/Maintenance';
import Login from './pages/Login';
import AccessDenied from './pages/AccessDenied';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import MyAssets from './pages/employee/MyAssets';
import RequestAsset from './pages/employee/RequestAsset';
import ReturnRequest from './pages/employee/ReturnRequest';
import { AuthProvider, useAuth } from './context/AuthContext';

// Admin Route Wrapper
function AdminRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;
  if (currentUser.role !== 'Admin') return <Navigate to="/access-denied" replace />;

  return children;
}

// Employee Route Wrapper
function EmployeeRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{ 
          className: 'text-sm font-medium rounded-xl shadow-soft',
          style: { padding: '16px', color: '#1E293B' }
        }} />
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <DashboardLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="assets" element={<AssetDirectory />} />
            <Route path="assets/new" element={<AssetRegistration />} />
            <Route path="assets/:id" element={<AssetDetails />} />
            <Route path="allocations" element={<Allocations />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="returns" element={<Returns />} />
            <Route path="maintenance" element={<Maintenance />} />
          </Route>

          {/* Employee Routes */}
          <Route 
            path="/employee" 
            element={
              <EmployeeRoute>
                <EmployeeLayout />
              </EmployeeRoute>
            }
          >
            <Route index element={<Navigate to="/employee/dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="assets" element={<MyAssets />} />
            <Route path="request" element={<RequestAsset />} />
            <Route path="return" element={<ReturnRequest />} />
          </Route>
          
          {/* Catch all */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
