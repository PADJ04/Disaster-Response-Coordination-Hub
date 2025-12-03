import { useState } from 'react';
import Navbar from './components/Navbar';
import ActionDock from './components/ActionDock';
import HomePage from './pages/HomePage';
import VolunteerPage from './pages/VolunteerPage';
import ReportPage from './pages/ReportPage';
import type { TabType } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Navigation Logic
  const renderContent = () => {
    switch (activeTab) {
      case 'volunteer':
        return <VolunteerPage onBack={() => setActiveTab('home')} />;
      case 'report':
        return <ReportPage onBack={() => setActiveTab('home')} />;
      default:
        return <HomePage onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90"></div>
      </div>

      {/* Navigation Bar */}
      <Navbar setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="relative z-10 pt-20 pb-32 min-h-screen flex flex-col">
        {renderContent()}
      </main>

      {/* Fixed Bottom Action Dock */}
      <ActionDock activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}