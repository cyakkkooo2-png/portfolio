import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/admin', { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(username, password);
      loginUser(data.token, data.user);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inpCls = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #08080c 0%, #16162a 50%, #0d0d20 100%)' }}>
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full opacity-[0.04]" style={{ width: '50vw', height: '50vw', background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', top: '-10%', left: '-10%', filter: 'blur(80px)' }} />
        <div className="absolute rounded-full opacity-[0.04]" style={{ width: '40vw', height: '40vw', background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', bottom: '-10%', right: '-10%', filter: 'blur(80px)' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>C</div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>CCY<span style={{ color: '#8b5cf6' }}>.</span>SPACE</h1>
          <p className="text-sm text-gray-500 mt-1">管理员登录</p>
        </div>

        <form onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
          {error && (
            <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-xl border border-red-500/20">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">用户名</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              className={inpCls} placeholder="请输入用户名" required
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">密码</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className={inpCls} placeholder="请输入密码" required
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="text-center mt-6">
          <a href="/" className="text-xs text-gray-600 hover:text-gray-400 no-underline transition-colors">← 返回首页</a>
        </p>
      </div>
    </div>
  );
}
