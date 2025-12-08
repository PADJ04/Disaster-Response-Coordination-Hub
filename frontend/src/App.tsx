import { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [loggedInRole, setLoggedInRole] = useState<'volunteer' | 'district' | null>(null);

  // Navigation Logic
  const renderContent = () => {
    if (!loggedInRole) {
      switch (activeTab) {
        case 'login':
          // Pass a callback to LoginPage to set login state
          return <LoginPage onNavigate={setActiveTab} onLogin={(role) => {
            setLoggedInRole(role);
          }} />;
        case 'volunteer-signup':
          return <VolunteerSignupPage onBack={() => setActiveTab('home')} />;
        case 'district-signup':
          return <DistrictSignupPage onBack={() => setActiveTab('login')} />;
        case 'report':
          return <ReportPage onBack={() => setActiveTab('home')} />;
        case 'live-data':
          return <LiveDataPage onBack={() => setActiveTab('home')} />;
        default:
          return <HomePage onNavigate={setActiveTab} />;
      }
    } else {
      // After login, show only dashboard for the role
      if (loggedInRole === 'volunteer') {
        return <VolunteerDashboard onLogout={() => {
          setLoggedInRole(null);
          setActiveTab('home');
        }} />;
      } else {
        return <DistrictDashboard onLogout={() => {
          setLoggedInRole(null);
          setActiveTab('home');
        }} />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {/* Simple Gradient Background (removed Unsplash/map image) */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black"></div>
      </div>

      {/* Navigation Bar */}
      <Navbar setActiveTab={setActiveTab} loggedInRole={loggedInRole} onLogout={() => {
        setLoggedInRole(null);
        setActiveTab('home');
      }} />

      {/* Main Content Area */}
      <main className={`relative z-10 flex flex-col ${activeTab === 'live-data' ? 'h-screen p-0' : 'pt-20 pb-32 min-h-screen'}` }>
        {renderContent()}
      </main>

      {/* Fixed Bottom Action Dock: only show before login and not on live-data */}
      {!loggedInRole && activeTab !== 'live-data' && (
        <ActionDock activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
}
