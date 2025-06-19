import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './components/ui/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import Login from '@/pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import Customers from './pages/Customers';
import { Orders } from './pages/Orders';
import { Inventory } from './pages/Inventory';
import { Finances } from './pages/Finances';
import { Warranties } from './pages/Warranties';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { CreateOrder } from './pages/CreateOrder';
import EditOrder from './pages/EditOrder';
import { OrderDetails } from './pages/OrderDetails';
import CustomerDetails from './pages/CustomerDetails';
import { Catalog } from './pages/Catalog';
import Tracking from './pages/Tracking';
import Logs from '@/pages/Logs';
import Users from '@/pages/Users';
import Branches from '@/pages/Branches';
import Products from '@/pages/Products';
import CreateProduct from '@/pages/CreateProduct';
import Roles from '@/pages/Roles';
import { useAuth } from './contexts/AuthContext';
import { BranchProvider } from '@/contexts/BranchContext';
import RepairsPage from './pages/RepairsPage';
import RepairDetailsPage from './pages/RepairDetailsPage';

const AppRoutes = () => {
  const { user, isLoading } = useAuth();
  const isAuthenticated = !!user;

  console.log('ROUTES DEBUG:', {
    user,
    isAuthenticated,
    isLoading,
    userRole: user?.role,
    userEmail: user?.email,
    userBranchId: user?.branchId,
    userBranch: user?.branch,
  });

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/track" element={<Tracking />} />
      <Route path="/logs" element={<Logs />} />
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetails />} />
        <Route path="/orders/create" element={<CreateOrder />} />
        <Route path="/orders/edit/:id" element={<EditOrder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetails />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/finances" element={<Finances />} />
        <Route path="/warranties" element={<Warranties />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/users" element={<Users />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="/products" element={<Products />} />
        <Route path="/create-product" element={<CreateProduct />} />
        <Route path="/repairs" element={<RepairsPage />} />
        <Route path="/repairs/:id" element={<RepairDetailsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <GlobalErrorBoundary>
      <ErrorBoundary>
        <AuthProvider>
          <BranchProvider>
            <ThemeProvider defaultTheme="light" storageKey="ui-theme">
              <AppRoutes />
            </ThemeProvider>
          </BranchProvider>
        </AuthProvider>
      </ErrorBoundary>
    </GlobalErrorBoundary>
  );
};

export default App; 