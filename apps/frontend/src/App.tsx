import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import PricingSettings from './pages/PricingSettings';
import Onboarding from './pages/Onboarding';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './i18n/ThemeContext';

function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element; allowedRoles?: string[] }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;

  if (allowedRoles) {
    const currentRole = localStorage.getItem('role') || 'user';
    if (!allowedRoles.includes(currentRole)) return <Navigate to="/" />;
  }

  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Admin /></ProtectedRoute>} />
            <Route path="/admin/pricing" element={<ProtectedRoute allowedRoles={['admin']}><PricingSettings /></ProtectedRoute>} />
            <Route path="/admin/onboarding" element={<ProtectedRoute allowedRoles={['admin']}><Onboarding /></ProtectedRoute>} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}
