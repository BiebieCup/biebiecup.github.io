import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import { AnnouncementsListPage, AnnouncementDetailPage } from './pages/AnnouncementsPage';
import DownloadsPage from './pages/DownloadsPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import SubmitPage from './pages/SubmitPage';
import MySubmissionsPage from './pages/MySubmissionsPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter basename="/bbc">
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid #374151',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#a855f7', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/announcements" element={<AnnouncementsListPage />} />
            <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/submit" element={<SubmitPage />} />
            <Route path="/my-submissions" element={<MySubmissionsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
