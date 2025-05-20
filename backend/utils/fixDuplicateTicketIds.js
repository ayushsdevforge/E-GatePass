/**
 * Script to fix duplicate ticketId errors in the GatepassRequest collection
 * Run this script to update the schema and fix existing records
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const GatepassRequest = require('../models/GatepassRequest');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Function to generate a unique ticket ID
const generateUniqueTicketId = (requestId) => {
  const timestamp = Date.now().toString(36);
  const requestIdShort = requestId.toString().substring(0, 6);
  return `GP-${requestIdShort}-${timestamp}`.toUpperCase();
};

// Function to fix duplicate ticketId errors
const fixDuplicateTicketIds = async () => {
  try {
    console.log('Starting to fix duplicate ticketId errors...');
    
    // Find all requests with null ticketId
    const requests = await GatepassRequest.find({ 
      $or: [
        { ticketId: null },
        { ticketId: { $exists: false } }
      ]
    });
    
    console.log(`Found ${requests.length} requests with null or missing ticketId`);
    
    // Update each request with a unique ticketId
    for (const request of requests) {
      const ticketId = generateUniqueTicketId(request._id);
      console.log(`Updating request ${request._id} with ticketId ${ticketId}`);
      
      await GatepassRequest.updateOne(
        { _id: request._id },
        { $set: { ticketId: ticketId } }
      );
    }
    
    console.log('Successfully updated all requests with unique ticketIds');
    
    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error fixing duplicate ticketId errors:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Run the fix function
fixDuplicateTicketIds();
