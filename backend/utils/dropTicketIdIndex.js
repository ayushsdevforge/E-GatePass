/**
 * Script to drop the problematic ticketId index causing E11000 duplicate key errors
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to drop the problematic index
const dropTicketIdIndex = async () => {
  try {
    console.log('Attempting to drop the ticketId_1 index...');
    
    // Get the native MongoDB connection
    const db = mongoose.connection.db;
    
    // Drop the problematic index
    await db.collection('gatepassrequests').dropIndex('ticketId_1');
    
    console.log('Successfully dropped the ticketId_1 index');
  } catch (error) {
    if (error.code === 27) {
      console.log('Index does not exist or was already dropped');
    } else {
      console.error('Error dropping index:', error);
    }
  } finally {
    // Disconnect from MongoDB
    mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

// Run the function
dropTicketIdIndex();
