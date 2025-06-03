
import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, Edit } from 'lucide-react';

const Header = ({ user, onLogout, currentView, setCurrentView, userRole }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Hotel Management
              </h1>
              <p className="text-sm text-gray-600 capitalize">{user.role} Panel</p>
            </div>
          </div>

          {userRole === 'receptionist' && (
            <nav className="flex space-x-1">
              <Button
                variant={currentView === 'bookings' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('bookings')}
                className={`${currentView === 'bookings' ? 'bg-gradient-to-r from-blue-500 to-purple-600' : ''}`}
              >
                <Edit className="w-4 h-4 mr-2" />
                Bookings
              </Button>
              <Button
                variant={currentView === 'calendar' ? 'default' : 'ghost'}
                onClick={() => setCurrentView('calendar')}
                className={`${currentView === 'calendar' ? 'bg-gradient-to-r from-blue-500 to-purple-600' : ''}`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Button>
            </nav>
          )}

          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              Welcome, {user.name}
            </span>
            <Button 
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
