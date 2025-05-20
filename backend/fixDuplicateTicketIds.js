const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully');
    
    try {
      // Get the GatepassRequest collection directly to bypass schema validation
      const db = mongoose.connection.db;
      const collection = db.collection('gatepassrequests');
      
      // First, let's drop the unique index on ticketId
      console.log('Dropping the existing unique index on ticketId...');
      try {
        await collection.dropIndex('ticketId_1');
        console.log('Successfully dropped the index');
      } catch (error) {
        console.log('No existing index to drop or error dropping index:', error.message);
      }
      
      // Find all documents with null ticketId and update them with a unique value
      console.log('Finding and updating documents with null ticketId...');
      const nullTicketIdDocs = await collection.find({ ticketId: null }).toArray();
      console.log(`Found ${nullTicketIdDocs.length} documents with null ticketId`);
      
      let updateCount = 0;
      for (const doc of nullTicketIdDocs) {
        // Generate a unique ticketId based on the document's _id
        const uniqueTicketId = `TICKET-${doc._id.toString().substr(-6)}`;
        
        await collection.updateOne(
          { _id: doc._id },
          { $set: { ticketId: uniqueTicketId } }
        );
        updateCount++;
      }
      
      console.log(`Updated ${updateCount} documents with unique ticketId values`);
      
      // Now recreate the index with sparse option
      console.log('Creating new sparse unique index on ticketId...');
      await collection.createIndex({ ticketId: 1 }, { unique: true, sparse: true });
      console.log('Successfully created new sparse unique index');
      
      console.log('Database fix completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error fixing database:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
