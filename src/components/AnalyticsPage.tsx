
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const AnalyticsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [timeFilter, setTimeFilter] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    const savedBookings = localStorage.getItem('hotelBookings');
    if (savedBookings) {
      setBookings(JSON.parse(savedBookings));
    }
  }, []);

  const getFilteredBookings = () => {
    const now = new Date();
    let startDate;
    
    switch (timeFilter) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          return bookings.filter(booking => {
            if (!booking.checkOutDateTime || booking.status !== 'checked-out') return false;
            const checkOutDate = new Date(booking.checkOutDateTime);
            return checkOutDate >= startDate && checkOutDate <= endDate;
          });
        }
        return bookings.filter(booking => booking.status === 'checked-out');
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    return bookings.filter(booking => {
      if (!booking.checkOutDateTime || booking.status !== 'checked-out') return false;
      const checkOutDate = new Date(booking.checkOutDateTime);
      return checkOutDate >= startDate;
    });
  };

  const filteredBookings = getFilteredBookings();
  
  const totalRevenue = filteredBookings.reduce((sum, booking) => sum + (Number(booking.totalAmount) || 0), 0);
  const totalBookings = filteredBookings.length;
  const averageStay = totalBookings > 0 ? 
    filteredBookings.reduce((sum, booking) => {
      const checkIn = new Date(booking.checkInDateTime);
      const checkOut = new Date(booking.checkOutDateTime);
      return sum + ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    }, 0) / totalBookings : 0;

  // Room Category Analytics with SR calculation
  const getRoomCategory = (booking) => {
    if (booking.numberOfAdults === 1 && (booking.roomCategory === 'DR' || booking.roomCategory === 'TR' || booking.roomCategory === 'QR')) {
      return 'SR';
    }
    return booking.roomCategory || 'Unknown';
  };

  const roomCategoryData = filteredBookings.reduce((acc, booking) => {
    const category = getRoomCategory(booking);
    acc[category] = (acc[category] || 0) + (Number(booking.totalAmount) || 0);
    return acc;
  }, {});

  const roomCategoryPieData = Object.entries(roomCategoryData).map(([category, revenue]) => ({
    name: category,
    value: revenue,
    count: filteredBookings.filter(b => getRoomCategory(b) === category).length
  }));

  // Booking Type Analytics
  const bookingTypeData = filteredBookings.reduce((acc, booking) => {
    const type = booking.bookingType || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const bookingTypePieData = Object.entries(bookingTypeData).map(([type, count]) => ({
    name: type,
    value: count
  }));

  // Monthly Sales Data
  const monthlySales = filteredBookings.reduce((acc, booking) => {
    if (!booking.checkOutDateTime) return acc;
    const month = new Date(booking.checkOutDateTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + (Number(booking.totalAmount) || 0);
    return acc;
  }, {});

  const monthlyData = Object.entries(monthlySales).map(([month, revenue]) => ({
    month,
    revenue
  })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  // Daily Revenue (for current month)
  const dailyRevenue = filteredBookings.reduce((acc, booking) => {
    if (!booking.checkOutDateTime) return acc;
    const date = new Date(booking.checkOutDateTime).toLocaleDateString();
    acc[date] = (acc[date] || 0) + (Number(booking.totalAmount) || 0);
    return acc;
  }, {});

  const dailyData = Object.entries(dailyRevenue).map(([date, revenue]) => ({
    date,
    revenue
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 mt-1">Track performance and make data-driven decisions</p>
      </div>

      {/* Filter Controls */}
      <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Time Period Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Period</label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {timeFilter === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="text-sm opacity-90">Total Revenue</div>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="text-sm opacity-90">Total Bookings</div>
            <div className="text-2xl font-bold">{totalBookings}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="text-sm opacity-90">Average Stay</div>
            <div className="text-2xl font-bold">{averageStay.toFixed(1)} days</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="text-sm opacity-90">Avg. Revenue/Booking</div>
            <div className="text-2xl font-bold">
              ₹{totalBookings > 0 ? Math.round(totalRevenue / totalBookings).toLocaleString() : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Revenue Trend */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Room Category Revenue with SR */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Revenue by Room Category (SR/DR/TR/QR)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roomCategoryPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roomCategoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Revenue */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Daily Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Booking Types */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Bookings by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bookingTypePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {bookingTypePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Top Performing Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium">Peak Revenue Day</span>
                <span className="text-blue-600 font-bold">
                  {dailyData.length > 0 ? 
                    dailyData.reduce((max, day) => day.revenue > max.revenue ? day : max).date : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium">Most Popular Room Type</span>
                <span className="text-green-600 font-bold">
                  {roomTypePieData.length > 0 ? 
                    roomTypePieData.reduce((max, type) => type.count > max.count ? type : max).name : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium">Preferred Booking Method</span>
                <span className="text-purple-600 font-bold">
                  {bookingTypePieData.length > 0 ? 
                    bookingTypePieData.reduce((max, type) => type.value > max.value ? type : max).name : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Occupancy Rate</span>
                <span className="font-bold text-gray-900">
                  {bookings.filter(b => b.status === 'checked-in').length > 0 ? 
                    `${Math.round((bookings.filter(b => b.status === 'checked-in').length / 62) * 100)}%` : '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Rooms</span>
                <span className="font-bold text-gray-900">62</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Currently Occupied</span>
                <span className="font-bold text-gray-900">
                  {bookings.filter(b => b.status === 'checked-in').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Available Rooms</span>
                <span className="font-bold text-green-600">
                  {62 - bookings.filter(b => b.status === 'checked-in').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
