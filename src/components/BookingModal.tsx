import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const BookingModal = ({ booking, onSave, onCheckOut, onClose }) => {
  const [formData, setFormData] = useState({
    bookingNumber: 0,
    name: '',
    address: '',
    phoneNumber: '',
    age: '',
    occupation: '',
    checkInDateTime: new Date().toISOString().slice(0, 16),
    numberOfRooms: 1,
    numberOfAdults: 1,
    numberOfChildren: 0,
    bookingType: 'Walk-In',
    checkOutDateTime: '',
    roomType: 'AC',
    roomNumbers: [],
    roomTariff: 1500,
    advancePayment: 0,
    totalAmount: 0,
    status: 'checked-in'
  });

  const roomData = {
    AC: [
      ...Array.from({length: 10}, (_, i) => 101 + i),
      ...Array.from({length: 6}, (_, i) => 114 + i),
      ...Array.from({length: 26}, (_, i) => 201 + i)
    ],
    'Non-AC': Array.from({length: 26}, (_, i) => 301 + i)
  };

  const calculateTax = (baseAmount) => {
    if (baseAmount <= 7500) {
      // 12% GST (6% CGST + 6% SGST)
      const cgst = baseAmount * 0.06;
      const sgst = baseAmount * 0.06;
      return { cgst, sgst, totalTax: cgst + sgst, taxRate: '12%' };
    } else {
      // 18% GST (9% CGST + 9% SGST)
      const cgst = baseAmount * 0.09;
      const sgst = baseAmount * 0.09;
      return { cgst, sgst, totalTax: cgst + sgst, taxRate: '18%' };
    }
  };

  useEffect(() => {
    if (booking) {
      setFormData(booking);
    } else {
      const nextBookingNumber = generateBookingNumber();
      const defaultCheckOut = new Date();
      defaultCheckOut.setHours(defaultCheckOut.getHours() + 24);
      
      setFormData(prev => ({
        ...prev,
        bookingNumber: nextBookingNumber,
        checkOutDateTime: defaultCheckOut.toISOString().slice(0, 16)
      }));
    }
  }, [booking]);

  useEffect(() => {
    const tariff = formData.roomType === 'AC' ? 1500 : 1000;
    const checkInDate = new Date(formData.checkInDateTime);
    const checkOutDate = new Date(formData.checkOutDateTime);
    const hours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
    const days = Math.ceil(hours / 24);
    const baseAmount = tariff * formData.numberOfRooms * Math.max(1, days);
    const taxInfo = calculateTax(baseAmount);
    const total = baseAmount + taxInfo.totalTax;
    
    setFormData(prev => ({
      ...prev,
      roomTariff: tariff,
      totalAmount: total
    }));
  }, [formData.roomType, formData.numberOfRooms, formData.checkInDateTime, formData.checkOutDateTime]);

  const generateBookingNumber = () => {
    const savedBookings = localStorage.getItem('hotelBookings');
    const bookings = savedBookings ? JSON.parse(savedBookings) : [];
    return bookings.length + 1;
  };

  const getAvailableRooms = () => {
    const savedBookings = localStorage.getItem('hotelBookings');
    const bookings = savedBookings ? JSON.parse(savedBookings) : [];
    
    const bookedRooms = bookings
      .filter(b => b.status === 'checked-in')
      .flatMap(b => b.roomNumbers);
    
    return roomData[formData.roomType].filter(room => 
      !bookedRooms.includes(room) || 
      (booking && booking.roomNumbers && booking.roomNumbers.includes(room))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.roomNumbers.length !== formData.numberOfRooms) {
      toast({
        title: "Error",
        description: `Please select ${formData.numberOfRooms} room(s).`,
        variant: "destructive",
      });
      return;
    }

    onSave(formData);
    
    if (formData.advancePayment > 0 && !booking) {
      generateAdvanceReceipt(formData);
    }
  };

  const generateAdvanceReceipt = (bookingData) => {
    const receiptContent = `
HOTEL MANAGEMENT SYSTEM
========================
ADVANCE PAYMENT RECEIPT
========================

No. ${String(bookingData.bookingNumber).padStart(4, '0')}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

Received deposit towards Room Rent from

Shri: ${bookingData.name}

Occupant of Room No: ${bookingData.roomNumbers.join(', ')}

Rent Charges Rs: ${bookingData.roomTariff} per Day

the sum of Rupees: ${bookingData.advancePayment} Only

towards Advance

For Hotel Management System
                                                    CASHIER

Rs. ${bookingData.advancePayment}

The Guest's are requested to deposit and
withdraw the amount in person
only producing this receipt                        GUEST SIGN.
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Advance_Receipt_${bookingData.bookingNumber}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isEditing = !!booking;
  const availableRooms = getAvailableRooms();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isEditing ? 'Edit Booking' : 'New Check-In'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bookingNumber">Booking Number</Label>
              <Input
                id="bookingNumber"
                value={formData.bookingNumber}
                disabled
                className="bg-gray-50"
              />
            </div>
            
            <div>
              <Label htmlFor="name">Guest Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="bookingType">Booking Type</Label>
              <Select value={formData.bookingType} onValueChange={(value) => setFormData(prev => ({ ...prev, bookingType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Walk-In">Walk-In</SelectItem>
                  <SelectItem value="Reference">Reference</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="checkInDateTime">Check-In Date & Time</Label>
              <Input
                id="checkInDateTime"
                type="datetime-local"
                value={formData.checkInDateTime}
                onChange={(e) => setFormData(prev => ({ ...prev, checkInDateTime: e.target.value }))}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>
            
            <div>
              <Label htmlFor="checkOutDateTime">Check-Out Date & Time</Label>
              <Input
                id="checkOutDateTime"
                type="datetime-local"
                value={formData.checkOutDateTime}
                onChange={(e) => setFormData(prev => ({ ...prev, checkOutDateTime: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="numberOfRooms">Number of Rooms</Label>
              <Input
                id="numberOfRooms"
                type="number"
                min="1"
                value={formData.numberOfRooms}
                onChange={(e) => setFormData(prev => ({ ...prev, numberOfRooms: parseInt(e.target.value) || 1, roomNumbers: [] }))}
              />
            </div>
            
            <div>
              <Label htmlFor="numberOfAdults">Number of Adults</Label>
              <Input
                id="numberOfAdults"
                type="number"
                min="1"
                value={formData.numberOfAdults}
                onChange={(e) => setFormData(prev => ({ ...prev, numberOfAdults: parseInt(e.target.value) || 1 }))}
              />
            </div>
            
            <div>
              <Label htmlFor="numberOfChildren">Number of Children</Label>
              <Input
                id="numberOfChildren"
                type="number"
                min="0"
                value={formData.numberOfChildren}
                onChange={(e) => setFormData(prev => ({ ...prev, numberOfChildren: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <Label htmlFor="roomType">Room Type</Label>
              <Select value={formData.roomType} onValueChange={(value) => setFormData(prev => ({ ...prev, roomType: value, roomNumbers: [] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AC">AC</SelectItem>
                  <SelectItem value="Non-AC">Non-AC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Room Tariff (24hrs)</Label>
              <Input
                value={`₹${formData.roomTariff}`}
                disabled
                className="bg-gray-50"
              />
            </div>
            
            <div>
              <Label>Total Amount (incl. GST)</Label>
              <Input
                value={`₹${formData.totalAmount.toFixed(2)}`}
                disabled
                className="bg-gray-50"
              />
            </div>
            
            <div>
              <Label htmlFor="advancePayment">Advance Payment</Label>
              <Input
                id="advancePayment"
                type="number"
                min="0"
                max={formData.totalAmount}
                value={formData.advancePayment}
                onChange={(e) => setFormData(prev => ({ ...prev, advancePayment: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          
          <div>
            <Label>Select Room Numbers ({formData.numberOfRooms} required)</Label>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 mt-2 max-h-32 overflow-y-auto border rounded-md p-3">
              {availableRooms.map(room => (
                <button
                  key={room}
                  type="button"
                  onClick={() => {
                    const isSelected = formData.roomNumbers.includes(room);
                    if (isSelected) {
                      setFormData(prev => ({
                        ...prev,
                        roomNumbers: prev.roomNumbers.filter(r => r !== room)
                      }));
                    } else if (formData.roomNumbers.length < formData.numberOfRooms) {
                      setFormData(prev => ({
                        ...prev,
                        roomNumbers: [...prev.roomNumbers, room]
                      }));
                    }
                  }}
                  className={`p-2 text-xs rounded-md border transition-colors ${
                    formData.roomNumbers.includes(room)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {room}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Selected: {formData.roomNumbers.join(', ')} ({formData.roomNumbers.length}/{formData.numberOfRooms})
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {isEditing && (
              <Button
                type="button"
                onClick={() => onCheckOut(formData)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Check-Out
              </Button>
            )}
            <Button 
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isEditing ? 'Update Booking' : 'Check In'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
