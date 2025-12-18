import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ActionDock from './components/ActionDock';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import VolunteerSignupPage from './pages/VolunteerSignupPage';
import DistrictSignupPage from './pages/DistrictSignupPage';
import ReportPage from './pages/ReportPage';
import LiveDataPage from './pages/LiveDataPage';
import VolunteerDashboard from './pages/VolunteerDashboard';
import DistrictDashboard from './pages/DistrictDashboard';
import type { TabType } from './types';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggedInRole, setLoggedInRole] = useState<'volunteer' | 'district' | null>(() => {
    const stored = localStorage.getItem('role');
    return stored === 'volunteer' || stored === 'district' ? (stored as 'volunteer' | 'district') : null;
  });

  const handleNavigate = (tab: TabType) => {
    switch (tab) {
      case 'home': navigate('/'); break;
      case 'login': navigate('/login'); break;
      case 'volunteer-signup': navigate('/volunteer-signup'); break;
      case 'district-signup': navigate('/district-signup'); break;
      case 'report': navigate('/report'); break;
      case 'live-data': navigate('/live-data'); break;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {/* Simple Gradient Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black"></div>
      </div>

      {/* Navigation Bar */}
      <Navbar 
        setActiveTab={handleNavigate} 
        loggedInRole={loggedInRole} 
        onLogout={() => {
          setLoggedInRole(null);
          navigate('/');
        }} 
      />

      {/* Main Content Area */}
      <main className={`relative z-10 flex flex-col ${location.pathname === '/live-data' ? 'h-screen p-0' : 'pt-20 pb-32 min-h-screen'}` }>
        <Routes>
          <Route path="/" element={<HomePage onNavigate={handleNavigate} />} />
          <Route path="/login" element={
            <LoginPage 
              onNavigate={handleNavigate} 
              onLogin={(role) => {
                setLoggedInRole(role);
                localStorage.setItem('role', role);
                navigate(role === 'volunteer' ? '/volunteer-dashboard' : '/district-dashboard');
              }} 
            />
          } />
          <Route path="/volunteer-signup" element={<VolunteerSignupPage onBack={() => navigate('/')} />} />
          <Route path="/district-signup" element={<DistrictSignupPage onBack={() => navigate('/login')} />} />
          <Route path="/report" element={<ReportPage onBack={() => navigate('/')} />} />
          <Route path="/live-data" element={<LiveDataPage onBack={() => navigate('/')} />} />
          <Route path="/volunteer-dashboard" element={
            (loggedInRole === 'volunteer' || loggedInRole === 'district') ? 
            <VolunteerDashboard onLogout={() => { setLoggedInRole(null); localStorage.removeItem('role'); localStorage.removeItem('token'); localStorage.removeItem('user_id'); navigate('/'); }} /> : 
            <Navigate to="/login" />
          } />
          <Route path="/district-dashboard" element={
            loggedInRole === 'district' ? 
            <DistrictDashboard onLogout={() => { setLoggedInRole(null); localStorage.removeItem('role'); localStorage.removeItem('token'); localStorage.removeItem('user_id'); navigate('/'); }} /> : 
            <Navigate to="/login" />
          } />
        </Routes>
      </main>

      {/* Fixed Bottom Action Dock */}
      {location.pathname === '/' && (
        <ActionDock activeTab={location.pathname === '/' ? 'home' : (location.pathname as string).substring(1) as TabType} setActiveTab={handleNavigate} />
      )}
    </div>
  );
}
