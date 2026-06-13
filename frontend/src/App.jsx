import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import NewSalesOrder from './pages/NewSalesOrder';
import './styles/tokens.css';
import './styles/global.css';
import './styles/animations.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                index element={<Navigate to="/login" replace />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/products"        element={<Products />} />
        <Route path="/orders"          element={<Dashboard />} />
        <Route path="/new-sales-order" element={<NewSalesOrder />} />
        <Route path="/warehouse"       element={<Dashboard />} />
        <Route path="/logistics"       element={<Dashboard />} />
        <Route path="/settings"        element={<Dashboard />} />
        <Route path="*"                element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
