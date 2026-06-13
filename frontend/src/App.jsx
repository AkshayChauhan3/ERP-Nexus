import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import NewSalesOrder from './pages/NewSalesOrder';
import InventoryMonitor from './pages/InventoryMonitor';
import SalesMonitor from './pages/SalesMonitor';
import PurchaseMonitor from './pages/PurchaseMonitor';
import ManufacturingMonitor from './pages/ManufacturingMonitor';
import ProcurementMonitor from './pages/ProcurementMonitor';
import UserManagement from './pages/UserManagement';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';
import MfgDashboard    from './pages/manufacturing/MfgDashboard';
import MfgBOM          from './pages/manufacturing/MfgBOM';
import MfgOrders       from './pages/manufacturing/MfgOrders';
import MfgWorkOrders   from './pages/manufacturing/MfgWorkOrders';
import MfgWorkCenters  from './pages/manufacturing/MfgWorkCenters';
import MfgTracking     from './pages/manufacturing/MfgTracking';
import MfgConsumption  from './pages/manufacturing/MfgConsumption';
import MfgHistory      from './pages/manufacturing/MfgHistory';
import MfgReports      from './pages/manufacturing/MfgReports';

// Purchase Module Pages
import PurchaseDashboard from './pages/purchase/PurchaseDashboard';
import PurchaseVendors from './pages/purchase/PurchaseVendors';
import PurchaseMaterials from './pages/purchase/PurchaseMaterials';
import PurchaseOrders from './pages/purchase/PurchaseOrders';
import PurchaseGoodsReceipts from './pages/purchase/PurchaseGoodsReceipts';
import PurchaseVendorBills from './pages/purchase/PurchaseVendorBills';
import PurchaseInventory from './pages/purchase/PurchaseInventory';
import PurchaseProcurement from './pages/purchase/PurchaseProcurement';
import PurchaseHistory from './pages/purchase/PurchaseHistory';
import PurchaseReports from './pages/purchase/PurchaseReports';

// Inventory Module Pages
import InvDashboard from './pages/inventory/InvDashboard';
import InvOverview from './pages/inventory/InvOverview';
import InvProductDetails from './pages/inventory/InvProductDetails';
import InvWarehouses from './pages/inventory/InvWarehouses';
import InvStockLedger from './pages/inventory/InvStockLedger';
import InvStockTransfers from './pages/inventory/InvStockTransfers';
import InvStockAdjustments from './pages/inventory/InvStockAdjustments';
import InvReservedStock from './pages/inventory/InvReservedStock';
import InvLowStockAlerts from './pages/inventory/InvLowStockAlerts';
import InvHistory from './pages/inventory/InvHistory';
import InvReports from './pages/inventory/InvReports';

// Sales Module Pages
import SalesDashboard from './pages/sales/SalesDashboard';
import SalesCustomers from './pages/sales/SalesCustomers';
import SalesQuotations from './pages/sales/SalesQuotations';
import SalesOrders from './pages/sales/SalesOrders';
import SalesDeliveries from './pages/sales/SalesDeliveries';
import SalesCatalog from './pages/sales/SalesCatalog';
import SalesReservedStock from './pages/sales/SalesReservedStock';
import SalesHistory from './pages/sales/SalesHistory';
import SalesReports from './pages/sales/SalesReports';
import SalesAnalytics from './pages/sales/SalesAnalytics';

// Owner Module Pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerOverview from './pages/owner/OwnerOverview';
import OwnerApprovals from './pages/owner/OwnerApprovals';
import OwnerFinancials from './pages/owner/OwnerFinancials';
import OwnerUsers from './pages/owner/OwnerUsers';
import OwnerEmployees from './pages/owner/OwnerEmployees';
import OwnerInventory from './pages/owner/OwnerInventory';
import OwnerSales from './pages/owner/OwnerSales';
import OwnerPurchase from './pages/owner/OwnerPurchase';
import OwnerManufacturing from './pages/owner/OwnerManufacturing';
import OwnerNotifications from './pages/owner/OwnerNotifications';
import OwnerReports from './pages/owner/OwnerReports';
import OwnerAuditLogs from './pages/owner/OwnerAuditLogs';
import OwnerSettings from './pages/owner/OwnerSettings';

import './styles/tokens.css';
import './styles/global.css';
import './styles/animations.css';

function ProtectedRoute({ children, allowedRoles }) {
  const authData = JSON.parse(localStorage.getItem('auth_data') || 'null');
  const location = useLocation();

  if (!authData?.accessToken) {
    return <Navigate to="/login" replace />;
  }
  const role = authData.user?.role || '';

  // Owner role must only have access to /owner/*
  if (role === 'owner') {
    if (location.pathname.startsWith('/owner')) {
      return children;
    } else {
      return <Navigate to="/owner/dashboard" replace />;
    }
  }

  // Prevent non-owner roles from accessing /owner/*
  if (location.pathname.startsWith('/owner')) {
    if (role === 'admin') {
      return children;
    }
    if (role === 'sales') return <Navigate to="/sales/dashboard" replace />;
    if (role === 'inventory') return <Navigate to="/inventory/dashboard" replace />;
    if (role === 'purchase') return <Navigate to="/purchase/dashboard" replace />;
    if (role === 'manufacturing') return <Navigate to="/manufacturing/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  if (role === 'admin') {
    return children;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === 'sales') {
      return <Navigate to="/sales/dashboard" replace />;
    }
    if (role === 'inventory') {
      return <Navigate to="/inventory/dashboard" replace />;
    }
    if (role === 'purchase') {
      return <Navigate to="/purchase/dashboard" replace />;
    }
    if (role === 'manufacturing') {
      return <Navigate to="/manufacturing/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<Landing />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        
        {/* Main Dashboard & Basic Screens (Forbidden for inventory/purchase/manufacturing/sales roles, they get auto-redirected) */}
        <Route path="/dashboard"       element={<ProtectedRoute allowedRoles={[]}><Dashboard /></ProtectedRoute>} />
        <Route path="/products"        element={<ProtectedRoute allowedRoles={[]}><Products /></ProtectedRoute>} />
        <Route path="/orders"          element={<ProtectedRoute allowedRoles={[]}><Dashboard /></ProtectedRoute>} />
        <Route path="/new-sales-order" element={<ProtectedRoute allowedRoles={[]}><NewSalesOrder /></ProtectedRoute>} />
        <Route path="/warehouse"       element={<ProtectedRoute allowedRoles={[]}><Dashboard /></ProtectedRoute>} />
        <Route path="/logistics"       element={<ProtectedRoute allowedRoles={[]}><Dashboard /></ProtectedRoute>} />
        <Route path="/settings"        element={<ProtectedRoute allowedRoles={[]}><Dashboard /></ProtectedRoute>} />

        {/* Admin Panels */}
        <Route path="/inventory"       element={<ProtectedRoute allowedRoles={[]}><InventoryMonitor /></ProtectedRoute>} />
        <Route path="/sales"           element={<ProtectedRoute allowedRoles={[]}><SalesMonitor /></ProtectedRoute>} />
        <Route path="/purchase"        element={<ProtectedRoute allowedRoles={[]}><PurchaseMonitor /></ProtectedRoute>} />
        <Route path="/manufacturing"   element={<ProtectedRoute allowedRoles={[]}><ManufacturingMonitor /></ProtectedRoute>} />
        <Route path="/procurement"     element={<ProtectedRoute allowedRoles={[]}><ProcurementMonitor /></ProtectedRoute>} />
        <Route path="/users"           element={<ProtectedRoute allowedRoles={[]}><UserManagement /></ProtectedRoute>} />
        <Route path="/audit-logs"      element={<ProtectedRoute allowedRoles={[]}><AuditLogs /></ProtectedRoute>} />
        <Route path="/reports"         element={<ProtectedRoute allowedRoles={[]}><Reports /></ProtectedRoute>} />

        {/* Manufacturing Module */}
        <Route path="/manufacturing/dashboard"     element={<ProtectedRoute allowedRoles={['manufacturing']}><MfgDashboard /></ProtectedRoute>} />
        <Route path="/manufacturing/bom"           element={<ProtectedRoute allowedRoles={['manufacturing']}><MfgBOM /></ProtectedRoute>} />
        <Route path="/manufacturing/orders"        element={<ProtectedRoute allowedRoles={['manufacturing']}><MfgOrders /></ProtectedRoute>} />
        <Route path="/manufacturing/work-orders"   element={<ProtectedRoute allowedRoles={['manufacturing']}><MfgWorkOrders /></ProtectedRoute>} />
        <Route path="/manufacturing/work-centers"  element={<ProtectedRoute allowedRoles={['manufacturing']}><MfgWorkCenters /></ProtectedRoute>} />
        <Route path="/manufacturing/tracking"      element={<ProtectedRoute allowedRoles={['manufacturing']}><MfgTracking /></ProtectedRoute>} />
        <Route path="/manufacturing/consumption"   element={<ProtectedRoute allowedRoles={['manufacturing']}><MfgConsumption /></ProtectedRoute>} />
        <Route path="/manufacturing/history"       element={<ProtectedRoute allowedRoles={['manufacturing']}><MfgHistory /></ProtectedRoute>} />
        <Route path="/manufacturing/reports"       element={<ProtectedRoute allowedRoles={['manufacturing']}><MfgReports /></ProtectedRoute>} />
        

        {/* Purchase & Procurement Module */}
        <Route path="/purchase/dashboard"       element={<ProtectedRoute allowedRoles={['purchase']}><PurchaseDashboard /></ProtectedRoute>} />
        <Route path="/purchase/vendors"         element={<ProtectedRoute allowedRoles={['purchase']}><PurchaseVendors /></ProtectedRoute>} />
        <Route path="/purchase/materials"       element={<ProtectedRoute allowedRoles={['purchase']}><PurchaseMaterials /></ProtectedRoute>} />
        <Route path="/purchase/orders"          element={<ProtectedRoute allowedRoles={['purchase']}><PurchaseOrders /></ProtectedRoute>} />
        <Route path="/purchase/goods-receipts"  element={<ProtectedRoute allowedRoles={['purchase']}><PurchaseGoodsReceipts /></ProtectedRoute>} />
        <Route path="/purchase/vendor-bills"    element={<ProtectedRoute allowedRoles={['purchase']}><PurchaseVendorBills /></ProtectedRoute>} />
        <Route path="/purchase/inventory"       element={<ProtectedRoute allowedRoles={['purchase']}><PurchaseInventory /></ProtectedRoute>} />
        <Route path="/purchase/procurement"     element={<ProtectedRoute allowedRoles={['purchase']}><PurchaseProcurement /></ProtectedRoute>} />
        <Route path="/purchase/history"         element={<ProtectedRoute allowedRoles={['purchase']}><PurchaseHistory /></ProtectedRoute>} />
        <Route path="/purchase/reports"         element={<ProtectedRoute allowedRoles={['purchase']}><PurchaseReports /></ProtectedRoute>} />

        {/* Inventory Module */}
        <Route path="/inventory/dashboard"      element={<ProtectedRoute allowedRoles={['inventory']}><InvDashboard /></ProtectedRoute>} />
        <Route path="/inventory/overview"       element={<ProtectedRoute allowedRoles={['inventory']}><InvOverview /></ProtectedRoute>} />
        <Route path="/inventory/products"       element={<ProtectedRoute allowedRoles={['inventory']}><InvProductDetails /></ProtectedRoute>} />
        <Route path="/inventory/warehouses"     element={<ProtectedRoute allowedRoles={['inventory']}><InvWarehouses /></ProtectedRoute>} />
        <Route path="/inventory/ledger"         element={<ProtectedRoute allowedRoles={['inventory']}><InvStockLedger /></ProtectedRoute>} />
        <Route path="/inventory/transfers"      element={<ProtectedRoute allowedRoles={['inventory']}><InvStockTransfers /></ProtectedRoute>} />
        <Route path="/inventory/adjustments"    element={<ProtectedRoute allowedRoles={['inventory']}><InvStockAdjustments /></ProtectedRoute>} />
        <Route path="/inventory/reserved"       element={<ProtectedRoute allowedRoles={['inventory']}><InvReservedStock /></ProtectedRoute>} />
        <Route path="/inventory/alerts"         element={<ProtectedRoute allowedRoles={['inventory']}><InvLowStockAlerts /></ProtectedRoute>} />
        <Route path="/inventory/history"        element={<ProtectedRoute allowedRoles={['inventory']}><InvHistory /></ProtectedRoute>} />
        <Route path="/inventory/reports"        element={<ProtectedRoute allowedRoles={['inventory']}><InvReports /></ProtectedRoute>} />

        {/* Sales Module */}
        <Route path="/sales/dashboard"          element={<ProtectedRoute allowedRoles={['sales']}><SalesDashboard /></ProtectedRoute>} />
        <Route path="/sales/customers"          element={<ProtectedRoute allowedRoles={['sales']}><SalesCustomers /></ProtectedRoute>} />
        <Route path="/sales/quotations"         element={<ProtectedRoute allowedRoles={['sales']}><SalesQuotations /></ProtectedRoute>} />
        <Route path="/sales/orders"             element={<ProtectedRoute allowedRoles={['sales']}><SalesOrders /></ProtectedRoute>} />
        <Route path="/sales/deliveries"         element={<ProtectedRoute allowedRoles={['sales']}><SalesDeliveries /></ProtectedRoute>} />
        <Route path="/sales/catalog"            element={<ProtectedRoute allowedRoles={['sales']}><SalesCatalog /></ProtectedRoute>} />
        <Route path="/sales/reserved"           element={<ProtectedRoute allowedRoles={['sales']}><SalesReservedStock /></ProtectedRoute>} />
        <Route path="/sales/history"            element={<ProtectedRoute allowedRoles={['sales']}><SalesHistory /></ProtectedRoute>} />
        <Route path="/sales/reports"            element={<ProtectedRoute allowedRoles={['sales']}><SalesReports /></ProtectedRoute>} />
        <Route path="/sales/analytics"          element={<ProtectedRoute allowedRoles={['sales']}><SalesAnalytics /></ProtectedRoute>} />

        {/* Owner Module */}
        <Route path="/owner/dashboard"          element={<ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
        <Route path="/owner/overview"           element={<ProtectedRoute allowedRoles={['owner']}><OwnerOverview /></ProtectedRoute>} />
        <Route path="/owner/approvals"          element={<ProtectedRoute allowedRoles={['owner']}><OwnerApprovals /></ProtectedRoute>} />
        <Route path="/owner/financials"         element={<ProtectedRoute allowedRoles={['owner']}><OwnerFinancials /></ProtectedRoute>} />
        <Route path="/owner/users"              element={<ProtectedRoute allowedRoles={['owner']}><OwnerUsers /></ProtectedRoute>} />
        <Route path="/owner/employees"          element={<ProtectedRoute allowedRoles={['owner']}><OwnerEmployees /></ProtectedRoute>} />
        <Route path="/owner/inventory"          element={<ProtectedRoute allowedRoles={['owner']}><OwnerInventory /></ProtectedRoute>} />
        <Route path="/owner/sales"              element={<ProtectedRoute allowedRoles={['owner']}><OwnerSales /></ProtectedRoute>} />
        <Route path="/owner/purchase"           element={<ProtectedRoute allowedRoles={['owner']}><OwnerPurchase /></ProtectedRoute>} />
        <Route path="/owner/manufacturing"      element={<ProtectedRoute allowedRoles={['owner']}><OwnerManufacturing /></ProtectedRoute>} />
        <Route path="/owner/notifications"      element={<ProtectedRoute allowedRoles={['owner']}><OwnerNotifications /></ProtectedRoute>} />
        <Route path="/owner/reports"            element={<ProtectedRoute allowedRoles={['owner']}><OwnerReports /></ProtectedRoute>} />
        <Route path="/owner/audit-logs"         element={<ProtectedRoute allowedRoles={['owner']}><OwnerAuditLogs /></ProtectedRoute>} />
        <Route path="/owner/settings"           element={<ProtectedRoute allowedRoles={['owner']}><OwnerSettings /></ProtectedRoute>} />

        <Route path="*"                element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

