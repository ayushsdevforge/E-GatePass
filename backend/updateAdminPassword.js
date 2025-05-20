const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import User model
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully');
    
    try {
      // Find admin user
      const admin = await User.findOne({ role: 'admin', email: 'admin@gatepass.com' });
      
      if (!admin) {
        console.log('Admin user not found');
        process.exit(1);
      }
      
      // Update password
      admin.password = '@admin_3127';
      
      // Save the updated user (this will trigger the password hashing middleware)
      await admin.save();
      
      console.log('Admin password updated successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error updating admin password:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
