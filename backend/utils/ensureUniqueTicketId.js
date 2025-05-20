/**
 * Utility function to ensure each request has a unique ticketId
 * This helps prevent the E11000 duplicate key error
 */
const crypto = require('crypto');

/**
 * Generates a unique ticket ID for a gatepass request
 * @param {string} requestId - The MongoDB ID of the request
 * @returns {string} A unique ticket ID
 */
const generateUniqueTicketId = (requestId) => {
  // Create a unique ID based on the request ID and current timestamp
  const timestamp = Date.now().toString(36);
  const randomString = crypto.randomBytes(3).toString('hex');
  const requestIdShort = requestId.toString().substring(0, 6);
  
  // Format: GP-[requestId first 6 chars]-[timestamp]-[random string]
  return `GP-${requestIdShort}-${timestamp}-${randomString}`.toUpperCase();
};

/**
 * Ensures a request has a unique ticketId
 * @param {Object} request - The gatepass request object
 * @returns {string} The unique ticket ID
 */
const ensureUniqueTicketId = (request) => {
  // If the request already has a valid ticketId, return it
  if (request.ticketId && typeof request.ticketId === 'string' && request.ticketId.length > 0) {
    return request.ticketId;
  }
  
  // Otherwise, generate a new unique ticketId
  return generateUniqueTicketId(request._id);
};

module.exports = ensureUniqueTicketId;
