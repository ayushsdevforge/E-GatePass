const crypto = require('crypto');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const ensureUniqueTicketId = require('./ensureUniqueTicketId');

/**
 * Generates a unique gatepass token and QR code for an approved request
 * @param {Object} request - The approved gatepass request object
 * @param {Object} student - The student user object
 * @returns {Object} Object containing token, expiry date and QR code URL
 */
const generateGatepassToken = async (request, student) => {
  try {
    // Create a directory for QR codes if it doesn't exist
    const qrDir = path.join(__dirname, '../public/qrcodes');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    // Generate a unique 6-digit numeric token
    const generateSixDigitToken = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };
    
    const token = generateSixDigitToken();
    
    // Generate a unique ticket ID for this request using our utility function
    const ticketId = ensureUniqueTicketId(request);
    
    // Set expiry date (24 hours from approval)
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24);
    
    // Create token data with all necessary information
    const tokenData = {
      token,
      ticketId,
      requestId: request._id,
      studentName: student.fullName,
      enrollmentNumber: student.enrollmentNumber,
      department: student.department,
      reason: request.reason,
      approvedAt: request.approvedAt,
      expiryDate,
      status: 'APPROVED'
    };
    
    // Generate QR code with the token data
    const qrFileName = `gatepass_${request._id}_${token}.png`;
    const qrFilePath = path.join(qrDir, qrFileName);
    const qrCodeUrl = `/qrcodes/${qrFileName}`;
    
    // Convert token data to JSON string for QR code
    const qrData = JSON.stringify(tokenData);
    
    // Generate and save QR code
    await QRCode.toFile(qrFilePath, qrData, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300
    });
    
    return {
      token,
      ticketId,
      expiryDate,
      qrCodeUrl
    };
  } catch (error) {
    console.error('Error generating gatepass token:', error);
    throw error;
  }
};

module.exports = generateGatepassToken;
