import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Gastos from './pages/Gastos.jsx';
import Ingresos from './pages/Ingresos.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import Reportes from './pages/Reportes.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Talleres from './pages/Talleres.jsx';
import PrivateRoute from './routes/PrivateRoute.jsx';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/*"
        element={(
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/ingresos" element={<Ingresos />} />
                <Route path="/gastos" element={<Gastos />} />
                <Route path="/talleres" element={<Talleres />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        )}
      />
    </Routes>
  );
}

export default App;
