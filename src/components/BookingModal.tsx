
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { generateAdvancePDF } from '../utils/pdfGenerator';

const BookingModal = ({ booking, onSave, onCheckOut, onClose }) => {
  const [formData, setFormData] = useState({
    registrationNumber: 0,
    numberOfAdults: 1,
    numberOfChildren: 0,
    guests: [],
    phoneNumber: '',
    address: '',
    checkInDateTime: new Date().toISOString().slice(0, 16),
    checkOutDateTime: '',
    numberOfRooms: 1,
    bookingType: 'Walk-In',
    roomCategory: 'DR',
    roomNumbers: [],
    roomRent: 1500,
    advancePayment: 0,
    totalAmount: 0,
    status: 'checked-in',
    otaName: '',
    bookingId: '',
    aadharCard: null,
    email: '',
    alternateContact: '',
    companyName: '',
    companyAddress: '',
    companyGST: ''
  });

  const roomData = {
    QR: [301, 306, 307, 201, 206, 207],
    TR: [302, 303, 305, 308, 312, 313, 315, 316, 319, 322, 202, 205, 208, 212, 213, 215, 216, 219, 222, 109, 116, 117],
    DR: [304, 309, 310, 311, 314, 317, 318, 320, 321, 323, 324, 325, 326, 203, 204, 209, 210, 211, 214, 217, 218, 220, 221, 223, 224, 225, 226, 101, 102, 103, 104, 105, 106, 107, 108, 110, 111, 114, 118, 119]
  };

  const otaOptions = ['MakeMyTrip', 'Goibibo', 'Booking.com', 'Agoda', 'Expedia', 'Yatra', 'Cleartrip', 'RedDoorz', 'OYO'];

  const calculateTax = (baseAmount) => {
    if (baseAmount <= 7500) {
      const cgst = baseAmount * 0.06;
      const sgst = baseAmount * 0.06;
      return { cgst, sgst, totalTax: cgst + sgst, taxRate: '12%' };
    } else {
      const cgst = baseAmount * 0.09;
      const sgst = baseAmount * 0.09;
      return { cgst, sgst, totalTax: cgst + sgst, taxRate: '18%' };
    }
  };

  const generateGuestFields = () => {
    const totalGuests = formData.numberOfAdults + formData.numberOfChildren;
    const guests = [];
    
    for (let i = 0; i < totalGuests; i++) {
      const existingGuest = formData.guests[i] || {};
      const isAdult = i < formData.numberOfAdults;
      guests.push({
        name: existingGuest.name || '',
        phoneNumber: i === 0 ? formData.phoneNumber : (existingGuest.phoneNumber || ''),
        address: i === 0 ? formData.address : (existingGuest.address || ''),
        age: existingGuest.age || '',
        occupation: existingGuest.occupation || '',
        type: isAdult ? 'adult' : 'child',
        required: i === 0
      });
    }
    
    setFormData(prev => ({ ...prev, guests }));
  };

  useEffect(() => {
    if (booking) {
      setFormData({
        ...booking,
        guests: booking.guests || []
      });
    } else {
      const nextRegistrationNumber = generateRegistrationNumber();
      const defaultCheckOut = new Date();
      defaultCheckOut.setHours(defaultCheckOut.getHours() + 24);
      
      setFormData(prev => ({
        ...prev,
        registrationNumber: nextRegistrationNumber,
        checkOutDateTime: defaultCheckOut.toISOString().slice(0, 16)
      }));
    }
  }, [booking]);

  useEffect(() => {
    generateGuestFields();
  }, [formData.numberOfAdults, formData.numberOfChildren]);

  useEffect(() => {
    const checkInDate = new Date(formData.checkInDateTime);
    const checkOutDate = new Date(formData.checkOutDateTime);
    const hours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
    const days = Math.ceil(hours / 24);
    const baseAmount = Number(formData.roomRent) * formData.numberOfRooms * Math.max(1, days);
    const taxInfo = calculateTax(baseAmount);
    const total = baseAmount + taxInfo.totalTax;
    
    setFormData(prev => ({
      ...prev,
      totalAmount: total
    }));
  }, [formData.roomRent, formData.numberOfRooms, formData.checkInDateTime, formData.checkOutDateTime]);

  useEffect(() => {
    if (!booking) {
      const rent = formData.roomCategory === 'QR' ? 2000 : formData.roomCategory === 'TR' ? 1800 : 1500;
      setFormData(prev => ({
        ...prev,
        roomRent: rent
      }));
    }
  }, [formData.roomCategory, booking]);

  const generateRegistrationNumber = () => {
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
    
    return roomData[formData.roomCategory].filter(room => 
      !bookedRooms.includes(room) || 
      (booking && booking.roomNumbers && booking.roomNumbers.includes(room))
    );
  };

  const handleGuestChange = (index, field, value) => {
    const updatedGuests = [...formData.guests];
    updatedGuests[index] = { ...updatedGuests[index], [field]: value };
    
    if (index === 0) {
      if (field === 'phoneNumber') {
        setFormData(prev => ({ ...prev, phoneNumber: value, guests: updatedGuests }));
      } else if (field === 'address') {
        setFormData(prev => ({ ...prev, address: value, guests: updatedGuests }));
      } else {
        setFormData(prev => ({ ...prev, guests: updatedGuests }));
      }
    } else {
      setFormData(prev => ({ ...prev, guests: updatedGuests }));
    }
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

    const requiredGuest = formData.guests[0];
    if (!requiredGuest?.name || !requiredGuest?.age) {
      toast({
        title: "Error",
        description: "Please fill in the required guest details (Name and Age for first guest).",
        variant: "destructive",
      });
      return;
    }

    if (formData.bookingType === 'OTA' && (!formData.otaName || !formData.bookingId)) {
      toast({
        title: "Error",
        description: "Please fill in OTA Name and Booking ID for OTA bookings.",
        variant: "destructive",
      });
      return;
    }

    const checkInDate = new Date(formData.checkInDateTime);
    const checkOutDate = new Date(formData.checkOutDateTime);
    
    if (checkOutDate <= checkInDate) {
      toast({
        title: "Error",
        description: "Check-out date and time must be after check-in date and time.",
        variant: "destructive",
      });
      return;
    }

    // Check if advance payment increased for updates
    if (booking && formData.advancePayment > booking.advancePayment) {
      generateAdvancePDF(formData);
    }

    onSave(formData);
    
    if (formData.advancePayment > 0 && !booking) {
      generateAdvancePDF(formData);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, aadharCard: file }));
    }
  };

  const isEditing = !!booking;
  const availableRooms = getAvailableRooms();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isEditing ? 'Edit Booking' : 'New Check-In'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="registrationNumber">Registration Number</Label>
              <Input
                id="registrationNumber"
                value={formData.registrationNumber}
                disabled
                className="bg-gray-50"
              />
            </div>
            
            <div>
              <Label htmlFor="numberOfAdults">Number of Adults *</Label>
              <Input
                id="numberOfAdults"
                type="number"
                min="1"
                value={formData.numberOfAdults}
                onChange={(e) => setFormData(prev => ({ ...prev, numberOfAdults: parseInt(e.target.value) || 1 }))}
                required
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
          </div>

          {/* Guest Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Guest Details</h3>
            {formData.guests.map((guest, index) => (
              <div key={index} className="border p-4 rounded-lg">
                <h4 className="font-medium mb-3">
                  {guest.type === 'adult' ? 'Adult' : 'Child'} {index + 1} 
                  {guest.required && <span className="text-red-500"> *</span>}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Guest Name {guest.required && '*'}</Label>
                    <Input
                      value={guest.name}
                      onChange={(e) => handleGuestChange(index, 'name', e.target.value)}
                      required={guest.required}
                    />
                  </div>
                  <div>
                    <Label>Phone Number {guest.required && '*'}</Label>
                    <Input
                      value={guest.phoneNumber}
                      onChange={(e) => handleGuestChange(index, 'phoneNumber', e.target.value)}
                      required={guest.required}
                    />
                  </div>
                  <div>
                    <Label>Address {guest.required && '*'}</Label>
                    <Input
                      value={guest.address}
                      onChange={(e) => handleGuestChange(index, 'address', e.target.value)}
                      required={guest.required}
                    />
                  </div>
                  <div>
                    <Label>Age {guest.required && '*'}</Label>
                    <Input
                      type="number"
                      value={guest.age}
                      onChange={(e) => handleGuestChange(index, 'age', e.target.value)}
                      required={guest.required}
                    />
                  </div>
                  <div>
                    <Label>Occupation</Label>
                    <Input
                      value={guest.occupation}
                      onChange={(e) => handleGuestChange(index, 'occupation', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bookingType">Booking Type</Label>
              <Select value={formData.bookingType} onValueChange={(value) => setFormData(prev => ({ ...prev, bookingType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Walk-In">Walk-In</SelectItem>
                  <SelectItem value="Reference">Reference</SelectItem>
                  <SelectItem value="OTA">OTA</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.bookingType === 'OTA' && (
              <>
                <div>
                  <Label htmlFor="otaName">OTA Name *</Label>
                  <Select value={formData.otaName} onValueChange={(value) => setFormData(prev => ({ ...prev, otaName: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select OTA" />
                    </SelectTrigger>
                    <SelectContent>
                      {otaOptions.map(ota => (
                        <SelectItem key={ota} value={ota}>{ota}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bookingId">Booking ID *</Label>
                  <Input
                    id="bookingId"
                    value={formData.bookingId}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookingId: e.target.value }))}
                    required
                  />
                </div>
              </>
            )}
            
            <div>
              <Label htmlFor="checkInDateTime">Date and Time of Arrival</Label>
              <Input
                id="checkInDateTime"
                type="datetime-local"
                value={formData.checkInDateTime}
                onChange={(e) => setFormData(prev => ({ ...prev, checkInDateTime: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="checkOutDateTime">Date and Time of Departure</Label>
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
              <Label htmlFor="roomCategory">Room Category</Label>
              <Select value={formData.roomCategory} onValueChange={(value) => setFormData(prev => ({ ...prev, roomCategory: value, roomNumbers: [] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Double">Double</SelectItem>
                  <SelectItem value="Triple">Triple</SelectItem>
                  <SelectItem value="Quadruple">Quadruple</SelectItem>
                  <SelectItem value="DR">DR</SelectItem>
                  <SelectItem value="TR">TR</SelectItem>
                  <SelectItem value="QR">QR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="roomRent">Room Rent</Label>
              <Input
                id="roomRent"
                type="number"
                min="0"
                value={formData.roomRent}
                onChange={(e) => setFormData(prev => ({ ...prev, roomRent: parseInt(e.target.value) || 0 }))}
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

            <div>
              <Label htmlFor="email">Email ID</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="alternateContact">Alternate Contact Number</Label>
              <Input
                id="alternateContact"
                value={formData.alternateContact}
                onChange={(e) => setFormData(prev => ({ ...prev, alternateContact: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="aadharCard">Aadhar Card</Label>
              <Input
                id="aadharCard"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </div>

            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="companyAddress">Company Address</Label>
              <Input
                id="companyAddress"
                value={formData.companyAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="companyGST">Company GST</Label>
              <Input
                id="companyGST"
                value={formData.companyGST}
                onChange={(e) => setFormData(prev => ({ ...prev, companyGST: e.target.value }))}
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
