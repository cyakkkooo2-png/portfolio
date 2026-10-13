import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import UploadWork from './pages/admin/UploadWork';
import EditWork from './pages/admin/EditWork';
import SiteEditor from './pages/admin/SiteEditor';
import ProtectedRoute from './components/ProtectedRoute';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import { startAnalyticsLifecycle } from './analytics';

export default function App() {
  useEffect(() => startAnalyticsLifecycle(), []);
  return (
    <div style={{ background: '#08080c', minHeight: '100vh' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/upload" element={<ProtectedRoute><UploadWork /></ProtectedRoute>} />
        <Route path="/admin/edit/:id" element={<ProtectedRoute><EditWork /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><SiteEditor /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}
