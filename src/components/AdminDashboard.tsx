
import React, { useState } from 'react';
import Header from './Header';
import AnalyticsPage from './AnalyticsPage';

const AdminDashboard = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState('analytics');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header 
        user={user} 
        onLogout={onLogout}
        currentView={currentView}
        setCurrentView={setCurrentView}
        userRole="admin"
      />
      <main className="pt-20">
        <AnalyticsPage />
      </main>
    </div>
  );
};

export default AdminDashboard;
