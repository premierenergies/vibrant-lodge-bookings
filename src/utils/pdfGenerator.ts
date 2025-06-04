
import jsPDF from 'jspdf';

export const generateAdvancePDF = (bookingData: any) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(16);
  doc.text('HOTEL MANAGEMENT SYSTEM', 20, 20);
  doc.setFontSize(14);
  doc.text('ADVANCE PAYMENT RECEIPT', 20, 35);
  
  doc.setFontSize(10);
  doc.text(`No. ${String(bookingData.registrationNumber).padStart(4, '0')}`, 20, 50);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);
  doc.text(`Time: ${new Date().toLocaleTimeString()}`, 20, 70);
  
  doc.text('Received deposit towards Room Rent from', 20, 90);
  
  const companyName = bookingData.companyName || 'HOTEL MANAGEMENT SYSTEM';
  const guestName = bookingData.guests && bookingData.guests.length > 0 ? bookingData.guests[0].name : bookingData.name;
  
  doc.text(`Shri: ${guestName}`, 20, 105);
  doc.text(`Occupant of Room No: ${bookingData.roomNumbers.join(', ')}`, 20, 115);
  doc.text(`Rent Charges Rs: ${bookingData.roomRent} per Day`, 20, 125);
  doc.text(`the sum of Rupees: ${bookingData.advancePayment} Only`, 20, 135);
  doc.text('towards Advance', 20, 145);
  
  doc.text(`For ${companyName}`, 20, 165);
  doc.text('CASHIER', 150, 175);
  doc.text(`Rs. ${bookingData.advancePayment}`, 20, 185);
  
  doc.text('The Guest\'s are requested to deposit and', 20, 205);
  doc.text('withdraw the amount in person', 20, 215);
  doc.text('only producing this receipt', 20, 225);
  doc.text('GUEST SIGN.', 150, 235);
  
  doc.save(`Advance_Receipt_${bookingData.registrationNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateFinalPDF = (bookingData: any) => {
  const doc = new jsPDF();
  
  const checkInDate = new Date(bookingData.checkInDateTime);
  const checkOutDate = new Date(bookingData.checkOutDateTime);
  const hours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
  const days = Math.ceil(hours / 24);
  
  const baseAmount = Number(bookingData.roomRent) * Number(bookingData.numberOfRooms) * days;
  const taxInfo = calculateTax(baseAmount);
  const totalWithGST = baseAmount + taxInfo.totalTax;
  const finalAmount = totalWithGST - Number(bookingData.advancePayment);
  
  const companyName = bookingData.companyName || 'HOTEL MANAGEMENT SYSTEM';
  const companyAddress = bookingData.companyAddress || '';
  const companyGST = bookingData.companyGST || '36AAHFH7018Q3ZS';
  
  // Header
  doc.setFontSize(16);
  doc.text(companyName, 20, 20);
  doc.setFontSize(12);
  doc.text('FINAL PAYMENT RECEIPT - CASH BILL', 20, 35);
  
  doc.setFontSize(10);
  doc.text(`Bill No. ${String(bookingData.registrationNumber).padStart(4, '0')}`, 20, 50);
  doc.text(`GSTIN: ${companyGST}`, 20, 60);
  
  const guestName = bookingData.guests && bookingData.guests.length > 0 ? bookingData.guests[0].name : bookingData.name;
  const guestAddress = bookingData.guests && bookingData.guests.length > 0 ? bookingData.guests[0].address : bookingData.address;
  
  doc.text(`Name: ${guestName}`, 20, 75);
  doc.text(`From: ${guestAddress}`, 20, 85);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 95);
  
  // Guest details
  const totalAdults = bookingData.numberOfAdults || 1;
  const totalChildren = bookingData.numberOfChildren || 0;
  const totalPersons = totalAdults + totalChildren;
  
  doc.text(`No. of Person: ${totalPersons}`, 20, 105);
  doc.text(`Adults: ${totalAdults}, Children: ${totalChildren}`, 20, 115);
  
  // Guest names and ages
  let yPos = 125;
  if (bookingData.guests && bookingData.guests.length > 0) {
    doc.text('Guest Details:', 20, yPos);
    yPos += 10;
    bookingData.guests.forEach((guest: any, index: number) => {
      if (guest.name) {
        doc.text(`${index + 1}. ${guest.name} (Age: ${guest.age})`, 25, yPos);
        yPos += 8;
      }
    });
  }
  
  yPos += 10;
  doc.text('ARRIVAL', 20, yPos);
  doc.text('DEPARTURE', 80, yPos);
  doc.text('ROOM No.', 140, yPos);
  doc.text('TYPE OF ROOM', 170, yPos);
  
  yPos += 10;
  doc.text(`Date: ${checkInDate.toLocaleDateString()}`, 20, yPos);
  doc.text(`Date: ${checkOutDate.toLocaleDateString()}`, 80, yPos);
  doc.text(`${bookingData.roomNumbers.join(', ')}`, 140, yPos);
  doc.text(`${bookingData.roomCategory}`, 170, yPos);
  
  yPos += 10;
  doc.text(`Time: ${checkInDate.toLocaleTimeString()}`, 20, yPos);
  doc.text(`Time: ${checkOutDate.toLocaleTimeString()}`, 80, yPos);
  doc.text(`Rate per day: Rs. ${Number(bookingData.roomRent)}`, 140, yPos);
  
  yPos += 20;
  doc.text(`1. Room Rent for ${days} days`, 20, yPos);
  doc.text(`Rs. ${baseAmount.toFixed(2)}`, 150, yPos);
  
  yPos += 10;
  doc.text(`2. CGST @ ${taxInfo.taxRate === '12%' ? '6%' : '9%'}`, 20, yPos);
  doc.text(`Rs. ${taxInfo.cgst.toFixed(2)}`, 150, yPos);
  
  yPos += 10;
  doc.text(`3. SGST @ ${taxInfo.taxRate === '12%' ? '6%' : '9%'}`, 20, yPos);
  doc.text(`Rs. ${taxInfo.sgst.toFixed(2)}`, 150, yPos);
  
  yPos += 10;
  doc.text('4. Miscellaneous / Sundries', 20, yPos);
  doc.text('Rs. 0', 150, yPos);
  
  yPos += 15;
  doc.text(`Total GST (${taxInfo.taxRate}): Rs. ${taxInfo.totalTax.toFixed(2)}`, 20, yPos);
  
  yPos += 10;
  doc.text(`TOTAL: Rs. ${totalWithGST.toFixed(2)}`, 120, yPos);
  
  yPos += 15;
  doc.text('Advance', 20, yPos);
  doc.text('Date', 60, yPos);
  doc.text('Amount', 100, yPos);
  doc.text('Less Advance', 140, yPos);
  
  yPos += 10;
  doc.text('Receipt No.', 20, yPos);
  doc.text(`${checkInDate.toLocaleDateString()}`, 60, yPos);
  doc.text(`Rs. ${Number(bookingData.advancePayment).toFixed(2)}`, 100, yPos);
  doc.text(`Rs. ${Number(bookingData.advancePayment).toFixed(2)}`, 140, yPos);
  
  yPos += 15;
  doc.text(`Balance Received / Refunded: Rs. ${finalAmount.toFixed(2)}`, 20, yPos);
  
  yPos += 20;
  doc.text('Check Out Time 24 Hours', 20, yPos);
  
  yPos += 15;
  doc.text('Regd. No.', 20, yPos);
  doc.text('Guest Signature', 80, yPos);
  doc.text('Receptionist', 140, yPos);
  
  yPos += 15;
  doc.text('THANK YOU', 20, yPos);
  doc.text('HAPPY JOURNEY', 80, yPos);
  doc.text('VISIT AGAIN', 140, yPos);
  
  doc.save(`Final_Receipt_${bookingData.registrationNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
};

const calculateTax = (baseAmount: number) => {
  const numericBaseAmount = Number(baseAmount);
  if (numericBaseAmount <= 7500) {
    const cgst = numericBaseAmount * 0.06;
    const sgst = numericBaseAmount * 0.06;
    return { cgst, sgst, totalTax: cgst + sgst, taxRate: '12%' };
  } else {
    const cgst = numericBaseAmount * 0.09;
    const sgst = numericBaseAmount * 0.09;
    return { cgst, sgst, totalTax: cgst + sgst, taxRate: '18%' };
  }
};
