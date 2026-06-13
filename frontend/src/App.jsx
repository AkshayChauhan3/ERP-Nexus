import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import NewSalesOrder from './pages/NewSalesOrder';

// Admin Monitoring Pages
import InventoryMonitor from './pages/InventoryMonitor';
import SalesMonitor from './pages/SalesMonitor';
import PurchaseMonitor from './pages/PurchaseMonitor';
import ManufacturingMonitor from './pages/ManufacturingMonitor';
import ProcurementMonitor from './pages/ProcurementMonitor';
import UserManagement from './pages/UserManagement';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';

// Manufacturing Module Pages
import MfgDashboard    from './pages/manufacturing/MfgDashboard';
import MfgBOM          from './pages/manufacturing/MfgBOM';
import MfgOrders       from './pages/manufacturing/MfgOrders';
import MfgWorkOrders   from './pages/manufacturing/MfgWorkOrders';
import MfgWorkCenters  from './pages/manufacturing/MfgWorkCenters';
import MfgTracking     from './pages/manufacturing/MfgTracking';
import MfgConsumption  from './pages/manufacturing/MfgConsumption';
import MfgHistory      from './pages/manufacturing/MfgHistory';
import MfgReports      from './pages/manufacturing/MfgReports';

import './styles/tokens.css';
import './styles/global.css';
import './styles/animations.css';

// Route guard to protect pages that require authentication
function ProtectedRoute({ children }) {
  const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
  if (!authData?.accessToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                index element={<Navigate to="/login" replace />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        
        {/* Protected Operational Routes */}
        <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/products"        element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/orders"          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/new-sales-order" element={<ProtectedRoute><NewSalesOrder /></ProtectedRoute>} />
        <Route path="/warehouse"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/logistics"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/settings"        element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Protected Admin Routes */}
        <Route path="/inventory"       element={<ProtectedRoute><InventoryMonitor /></ProtectedRoute>} />
        <Route path="/sales"           element={<ProtectedRoute><SalesMonitor /></ProtectedRoute>} />
        <Route path="/purchase"        element={<ProtectedRoute><PurchaseMonitor /></ProtectedRoute>} />
        <Route path="/manufacturing"   element={<ProtectedRoute><ManufacturingMonitor /></ProtectedRoute>} />
        <Route path="/procurement"     element={<ProtectedRoute><ProcurementMonitor /></ProtectedRoute>} />
        <Route path="/users"           element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/audit-logs"      element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
        <Route path="/reports"         element={<ProtectedRoute><Reports /></ProtectedRoute>} />

        {/* Manufacturing Role Module Routes */}
        <Route path="/manufacturing"              element={<ProtectedRoute><MfgDashboard /></ProtectedRoute>} />
        <Route path="/manufacturing/bom"           element={<ProtectedRoute><MfgBOM /></ProtectedRoute>} />
        <Route path="/manufacturing/orders"        element={<ProtectedRoute><MfgOrders /></ProtectedRoute>} />
        <Route path="/manufacturing/work-orders"   element={<ProtectedRoute><MfgWorkOrders /></ProtectedRoute>} />
        <Route path="/manufacturing/work-centers"  element={<ProtectedRoute><MfgWorkCenters /></ProtectedRoute>} />
        <Route path="/manufacturing/tracking"      element={<ProtectedRoute><MfgTracking /></ProtectedRoute>} />
        <Route path="/manufacturing/consumption"   element={<ProtectedRoute><MfgConsumption /></ProtectedRoute>} />
        <Route path="/manufacturing/history"       element={<ProtectedRoute><MfgHistory /></ProtectedRoute>} />
        <Route path="/manufacturing/reports"       element={<ProtectedRoute><MfgReports /></ProtectedRoute>} />
        
        <Route path="*"                element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

