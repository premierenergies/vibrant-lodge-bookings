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

  const calculateTax = (baseAmount) => {
    const numericBaseAmount = Number(baseAmount);
    if (numericBaseAmount <= 7500) {
      // 12% GST (6% CGST + 6% SGST)
      const cgst = numericBaseAmount * 0.06;
      const sgst = numericBaseAmount * 0.06;
      return { cgst, sgst, totalTax: cgst + sgst, taxRate: '12%' };
    } else {
      // 18% GST (9% CGST + 9% SGST)
      const cgst = numericBaseAmount * 0.09;
      const sgst = numericBaseAmount * 0.09;
      return { cgst, sgst, totalTax: cgst + sgst, taxRate: '18%' };
    }
  };

  const handleCheckOut = (booking) => {
    if (!booking || !booking.checkInDateTime) {
      toast({
        title: "Error",
        description: "Invalid booking data",
        variant: "destructive",
      });
      return;
    }

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
    if (!booking || !booking.checkInDateTime || !booking.checkOutDateTime) {
      console.error('Invalid booking data for receipt generation');
      return;
    }

    const checkInDate = new Date(booking.checkInDateTime);
    const checkOutDate = new Date(booking.checkOutDateTime);
    const hours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
    const days = Math.ceil(hours / 24);
    
    const baseAmount = Number(booking.roomTariff) * Number(booking.numberOfRooms) * days;
    const taxInfo = calculateTax(baseAmount);
    const totalWithGST = baseAmount + taxInfo.totalTax;
    const finalAmount = totalWithGST - Number(booking.advancePayment);

    const receiptContent = `
HOTEL MANAGEMENT SYSTEM
========================
FINAL PAYMENT RECEIPT - CASH BILL
========================

Bill No. ${String(booking.bookingNumber).padStart(4, '0')}
GSTIN: 36AAHFH7018Q3ZS

Name: ${booking.name}
From: ${booking.address}
Date: ${new Date().toLocaleDateString()}
No. of Person: ${Number(booking.numberOfAdults) + Number(booking.numberOfChildren)}

ARRIVAL                    DEPARTURE               ROOM No.    TYPE OF ROOM
Date: ${checkInDate.toLocaleDateString()}    Date: ${checkOutDate.toLocaleDateString()}    ${booking.roomNumbers ? booking.roomNumbers.join(', ') : 'N/A'}    ${booking.roomType}
Time: ${checkInDate.toLocaleTimeString()}    Time: ${checkOutDate.toLocaleTimeString()}    
                                                            Rate per day: Rs. ${Number(booking.roomTariff)}    Ps.

1. Room Rent for ${days} days                                                Rs. ${baseAmount.toFixed(2)}

2. CGST @ ${taxInfo.taxRate === '12%' ? '6%' : '9%'}                                                                     Rs. ${taxInfo.cgst.toFixed(2)}

3. SGST @ ${taxInfo.taxRate === '12%' ? '6%' : '9%'}                                                                     Rs. ${taxInfo.sgst.toFixed(2)}

4. Miscellaneous / Sundries                                                 Rs. 0

Total GST (${taxInfo.taxRate}): Rs. ${taxInfo.totalTax.toFixed(2)}

Rupees: ${numberToWords(Math.round(totalWithGST))}                                 TOTAL: Rs. ${totalWithGST.toFixed(2)}

Advance         Date              Amount      Less Advance
Receipt No.     ${checkInDate.toLocaleDateString()}    Rs. ${Number(booking.advancePayment).toFixed(2)}    Rs. ${Number(booking.advancePayment).toFixed(2)}

                                              Balance Received / Refunded: Rs. ${finalAmount.toFixed(2)}

Check Out Time 24 Hours

Regd. No.                    Guest Signature                    Receptionist

THANK YOU                    HAPPY JOURNEY                      VISIT AGAIN
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Final_Receipt_${booking.bookingNumber}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const numInt = Math.floor(num);
    
    if (numInt === 0) return 'Zero';
    if (numInt < 10) return ones[numInt];
    if (numInt < 20) return teens[numInt - 10];
    if (numInt < 100) {
      const remainder = numInt % 10;
      return tens[Math.floor(numInt / 10)] + (remainder !== 0 ? ' ' + ones[remainder] : '');
    }
    if (numInt < 1000) {
      const remainder = numInt % 100;
      return ones[Math.floor(numInt / 100)] + ' Hundred' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '');
    }
    if (numInt < 100000) {
      const remainder = numInt % 1000;
      return numberToWords(Math.floor(numInt / 1000)) + ' Thousand' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '');
    }
    
    return numInt.toString();
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
                      {booking.checkInDateTime ? new Date(booking.checkInDateTime).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.checkOutDateTime ? new Date(booking.checkOutDateTime).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.roomNumbers ? booking.roomNumbers.join(', ') : 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{booking.roomType}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      A:{booking.numberOfAdults} C:{booking.numberOfChildren}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{Number(booking.totalAmount).toFixed(2)}
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
