
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from 'lucide-react';

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const savedBookings = localStorage.getItem('hotelBookings');
    if (savedBookings) {
      setBookings(JSON.parse(savedBookings));
    }
  }, []);

  const allRooms = {
    AC: [
      ...Array.from({length: 10}, (_, i) => 101 + i),
      ...Array.from({length: 6}, (_, i) => 114 + i),
      ...Array.from({length: 26}, (_, i) => 201 + i)
    ],
    'Non-AC': Array.from({length: 26}, (_, i) => 301 + i)
  };

  const getBookedRoomsForDate = (date) => {
    const dateStr = date.toDateString();
    return bookings
      .filter(booking => {
        const checkIn = new Date(booking.checkInDateTime);
        const checkOut = new Date(booking.checkOutDateTime);
        const targetDate = new Date(dateStr);
        return booking.status === 'checked-in' && 
               targetDate >= checkIn.setHours(0,0,0,0) && 
               targetDate <= checkOut.setHours(23,59,59,999);
      })
      .flatMap(booking => booking.roomNumbers);
  };

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      days.push(currentDate);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const bookedRooms = getBookedRoomsForDate(selectedDate);

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
          <Calendar className="w-8 h-8 mr-3 text-blue-600" />
          Room Availability Calendar
        </h1>
        <p className="text-gray-600 mt-1">View room availability across dates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-semibold">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
                    ←
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
                    →
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                  const isSelected = day.toDateString() === selectedDate.toDateString();
                  const isToday = day.toDateString() === new Date().toDateString();
                  const bookedCount = getBookedRoomsForDate(day).length;
                  const totalRooms = allRooms.AC.length + allRooms['Non-AC'].length;
                  const availableRooms = totalRooms - bookedCount;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(day)}
                      className={`p-2 text-sm border rounded-md transition-all hover:bg-blue-50 ${
                        isSelected 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : isToday 
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : isCurrentMonth 
                              ? 'bg-white border-gray-200 text-gray-900'
                              : 'bg-gray-50 border-gray-100 text-gray-400'
                      }`}
                    >
                      <div className="font-medium">{day.getDate()}</div>
                      {isCurrentMonth && (
                        <div className="text-xs mt-1">
                          <div className="text-green-600">{availableRooms} free</div>
                          {bookedCount > 0 && (
                            <div className="text-red-600">{bookedCount} booked</div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Room Status - {selectedDate.toLocaleDateString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">AC Rooms</h3>
                  <div className="grid grid-cols-5 gap-1">
                    {allRooms.AC.map(room => (
                      <div
                        key={room}
                        className={`p-2 text-xs rounded border text-center ${
                          bookedRooms.includes(room)
                            ? 'bg-red-100 border-red-300 text-red-700'
                            : 'bg-green-100 border-green-300 text-green-700'
                        }`}
                      >
                        {room}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Non-AC Rooms</h3>
                  <div className="grid grid-cols-5 gap-1">
                    {allRooms['Non-AC'].map(room => (
                      <div
                        key={room}
                        className={`p-2 text-xs rounded border text-center ${
                          bookedRooms.includes(room)
                            ? 'bg-red-100 border-red-300 text-red-700'
                            : 'bg-green-100 border-green-300 text-green-700'
                        }`}
                      >
                        {room}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Total Rooms:</span>
                      <span className="font-medium">{allRooms.AC.length + allRooms['Non-AC'].length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available:</span>
                      <span className="font-medium text-green-600">
                        {allRooms.AC.length + allRooms['Non-AC'].length - bookedRooms.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Booked:</span>
                      <span className="font-medium text-red-600">{bookedRooms.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></div>
                    Available
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-100 border border-red-300 rounded mr-1"></div>
                    Booked
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
