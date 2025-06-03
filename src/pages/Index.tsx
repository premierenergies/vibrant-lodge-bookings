
import React, { useState, useEffect } from 'react';
import Login from '../components/Login';
import ReceptionistDashboard from '../components/ReceptionistDashboard';
import AdminDashboard from '../components/AdminDashboard';

const Index = () => {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('bookings');

  useEffect(() => {
    const savedUser = localStorage.getItem('hotelUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('hotelUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('hotelUser');
    setCurrentView('bookings');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {user.role === 'receptionist' ? (
        <ReceptionistDashboard 
          user={user} 
          onLogout={handleLogout}
          currentView={currentView}
          setCurrentView={setCurrentView}
        />
      ) : (
        <AdminDashboard 
          user={user} 
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default Index;
