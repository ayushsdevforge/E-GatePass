/**
 * Script to fix the E11000 duplicate key error by modifying the MongoDB collection directly
 */
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB connection URI - using a hardcoded fallback if environment variable is not available
const uri = process.env.MONGODB_URI ;

// Connect to MongoDB and fix the issue
async function fixDuplicateKeyError() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get the database and collection
    const db = client.db();
    const collection = db.collection('gatepassrequests');
    
    // 1. First, drop the problematic index if it exists
    try {
      console.log('Attempting to drop the ticketId_1 index...');
      await collection.dropIndex('ticketId_1');
      console.log('Successfully dropped the ticketId_1 index');
    } catch (error) {
      console.log('Index may not exist or was already dropped:', error.message);
    }
    
    // 2. Update all documents with null ticketId to have unique values
    console.log('Updating documents with null ticketId values...');
    
    // Find all documents with null ticketId
    const nullTicketDocs = await collection.find({ ticketId: null }).toArray();
    console.log(`Found ${nullTicketDocs.length} documents with null ticketId`);
    
    // Update each document with a unique ticketId
    let updateCount = 0;
    for (const doc of nullTicketDocs) {
      const uniqueTicketId = `GP-${doc._id.toString().substring(0, 8)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      await collection.updateOne(
        { _id: doc._id },
        { $set: { ticketId: uniqueTicketId } }
      );
      
      updateCount++;
      if (updateCount % 10 === 0) {
        console.log(`Updated ${updateCount} documents so far...`);
      }
    }
    
    console.log(`Successfully updated ${updateCount} documents with unique ticketId values`);
    
    console.log('Fix completed successfully');
  } catch (error) {
    console.error('Error fixing duplicate key issue:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix function
fixDuplicateKeyError();
