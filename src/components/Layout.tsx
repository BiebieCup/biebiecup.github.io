import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home, Bell, Download, Upload, User, LogOut, LogIn, Shield, Menu, X, Music2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('已退出登录');
    navigate('/');
    setMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: '首页', icon: <Home size={18} /> },
    { to: '/announcements', label: '公告', icon: <Bell size={18} /> },
    { to: '/downloads', label: '谱面下载', icon: <Download size={18} /> },
    ...(user ? [{ to: '/submit', label: '投稿', icon: <Upload size={18} /> }] : []),
    ...(user ? [{ to: '/my-submissions', label: '我的投稿', icon: <User size={18} /> }] : []),
    ...(isAdmin ? [{ to: '/admin', label: '管理后台', icon: <Shield size={18} /> }] : []),
  ];

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-purple-800/40 sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" onClick={() => setMenuOpen(false)}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow">
              <Music2 size={20} className="text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-black text-lg tracking-wide bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">憋憋杯</span>
              <span className="text-xs text-gray-500 block -mt-1">BBC · Phigros 自制谱赛事</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-purple-700/40 text-purple-300'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{profile?.username || user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={16} />
                  退出
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <LogIn size={16} />
                  登录
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all shadow"
                >
                  注册
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 pb-4">
            <nav className="flex flex-col gap-1 mt-2">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-purple-700/40 text-purple-300'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-gray-800 mt-2 pt-2">
                {user ? (
                  <>
                    <div className="px-3 py-2 text-sm text-gray-500">{profile?.username || user.email}</div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut size={16} />
                      退出登录
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 text-center px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                      登录
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white transition-colors"
                    >
                      注册
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900 text-center text-xs text-gray-600 py-4 px-4">
        <p>憋憋杯 (BBC) · Phigros 自制谱赛事 · 官方网站</p>
        <p className="mt-1">fzso5071.github.io/bbc</p>
      </footer>
    </div>
  );
};

export default Layout;
