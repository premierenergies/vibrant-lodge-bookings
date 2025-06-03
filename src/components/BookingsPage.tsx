import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit } from 'lucide-react';
import BookingModal from './BookingModal';
import { toast } from "@/hooks/use-toast";

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  useEffect(() => {
    const savedBookings = localStorage.getItem('hotelBookings');
    if (savedBookings) {
      setBookings(JSON.parse(savedBookings));
    }
  }, []);

  const saveBookings = (newBookings) => {
    setBookings(newBookings);
    localStorage.setItem('hotelBookings', JSON.stringify(newBookings));
  };

  const handleNewCheckIn = () => {
    setEditingBooking(null);
    setShowModal(true);
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setShowModal(true);
  };

  const handleSaveBooking = (bookingData) => {
    let newBookings;
    if (editingBooking) {
      newBookings = bookings.map(b => 
        b.bookingNumber === editingBooking.bookingNumber ? bookingData : b
      );
      toast({
        title: "Booking Updated",
        description: `Booking ${bookingData.bookingNumber} has been updated successfully.`,
      });
    } else {
      newBookings = [...bookings, bookingData];
      toast({
        title: "Check-In Successful",
        description: `Guest ${bookingData.name} has been checked in successfully.`,
      });
    }
    saveBookings(newBookings);
    setShowModal(false);
  };

  const handleCheckOut = (booking) => {
    const checkOutTime = new Date().toISOString();
    const updatedBooking = { ...booking, checkOutDateTime: checkOutTime, status: 'checked-out' };
    const newBookings = bookings.map(b => 
      b.bookingNumber === booking.bookingNumber ? updatedBooking : b
    );
    saveBookings(newBookings);
    
    // Generate and download receipt
    generateReceipt(updatedBooking);
    
    toast({
      title: "Check-Out Successful",
      description: `Guest ${booking.name} has been checked out. Receipt generated.`,
    });
  };

  const generateReceipt = (booking) => {
    const receiptContent = `
HOTEL MANAGEMENT SYSTEM
========================
FINAL PAYMENT RECEIPT
========================

Booking Number: ${booking.bookingNumber}
Guest Name: ${booking.name}
Address: ${booking.address}
Phone: ${booking.phoneNumber}

Check-In: ${new Date(booking.checkInDateTime).toLocaleString()}
Check-Out: ${new Date(booking.checkOutDateTime).toLocaleString()}

Room Details:
- Room Numbers: ${booking.roomNumbers.join(', ')}
- Room Type: ${booking.roomType}
- Number of Rooms: ${booking.numberOfRooms}

Guests:
- Adults: ${booking.numberOfAdults}
- Children: ${booking.numberOfChildren}

Financial Details:
- Room Tariff (24hrs): ₹${booking.roomTariff}
- Total Amount: ₹${booking.totalAmount}
- Advance Paid: ₹${booking.advancePayment}
- Final Amount: ₹${booking.totalAmount - booking.advancePayment}

Thank you for staying with us!
Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${booking.bookingNumber}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeBookings = bookings.filter(b => b.status !== 'checked-out');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Bookings Management
          </h1>
          <p className="text-gray-600 mt-1">Manage guest check-ins and check-outs</p>
        </div>
        <Button 
          onClick={handleNewCheckIn}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        >
          + New Check-In
        </Button>
      </div>

      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">
            Active Bookings ({activeBookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-In</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-Out</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rooms</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeBookings.map((booking) => (
                  <tr key={booking.bookingNumber} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditBooking(booking)}
                        className="mr-2"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.bookingNumber}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{booking.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{booking.phoneNumber}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(booking.checkInDateTime).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(booking.checkOutDateTime).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.roomNumbers.join(', ')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{booking.roomType}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      A:{booking.numberOfAdults} C:{booking.numberOfChildren}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{booking.totalAmount}
                    </td>
                  </tr>
                ))}
                {activeBookings.length === 0 && (
                  <tr>
                    <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                      No active bookings found. Click "New Check-In" to add a booking.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <BookingModal
          booking={editingBooking}
          onSave={handleSaveBooking}
          onCheckOut={handleCheckOut}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default BookingsPage;
