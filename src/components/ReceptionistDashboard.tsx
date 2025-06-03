
import React from 'react';
import Header from './Header';
import BookingsPage from './BookingsPage';
import CalendarPage from './CalendarPage';

const ReceptionistDashboard = ({ user, onLogout, currentView, setCurrentView }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header 
        user={user} 
        onLogout={onLogout}
        currentView={currentView}
        setCurrentView={setCurrentView}
        userRole="receptionist"
      />
      <main className="pt-20">
        {currentView === 'bookings' && <BookingsPage />}
        {currentView === 'calendar' && <CalendarPage />}
      </main>
    </div>
  );
};

export default ReceptionistDashboard;
