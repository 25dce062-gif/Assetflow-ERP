import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import AssetDirectory from './pages/AssetDirectory';
import AssetRegistration from './pages/AssetRegistration';
import AssetDetails from './pages/AssetDetails';
import Allocations from './pages/Allocations';
import Transfers from './pages/Transfers';
import Returns from './pages/Returns';
import Maintenance from './pages/Maintenance';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Redirect them to the /login page, but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

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

          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="assets" element={<AssetDirectory />} />
            <Route path="assets/new" element={<AssetRegistration />} />
            <Route path="assets/:id" element={<AssetDetails />} />
            <Route path="allocations" element={<Allocations />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="returns" element={<Returns />} />
            <Route path="maintenance" element={<Maintenance />} />
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
