import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import WorkDetail from './pages/WorkDetail';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import UploadWork from './pages/admin/UploadWork';
import EditWork from './pages/admin/EditWork';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work/:id" element={<WorkDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/upload" element={<ProtectedRoute><UploadWork /></ProtectedRoute>} />
          <Route path="/admin/edit/:id" element={<ProtectedRoute><EditWork /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}
