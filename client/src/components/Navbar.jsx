import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
          🎨 我的作品集
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">作品展示</Link>

          {user ? (
            <>
              <Link to="/admin" className="text-gray-600 hover:text-blue-600 transition-colors">管理后台</Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">👤 {user.username}</span>
              <button onClick={handleLogout} className="text-red-500 hover:text-red-700 transition-colors">退出</button>
            </>
          ) : (
            <Link to="/login" className="text-gray-500 hover:text-blue-600 transition-colors">管理员登录</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
