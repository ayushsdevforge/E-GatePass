const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict this to your frontend domain
    methods: ['GET', 'POST']
  }
});

// Socket.IO middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.id}`);
  
  // Join a room based on user ID for targeted updates
  socket.join(`user-${socket.user.id}`);
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));
app.use('/qrcodes', express.static('public/qrcodes'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    // Create admin user if it doesn't exist
    createAdminUser();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Function to create admin user if it doesn't exist
async function createAdminUser() {
  try {
    const User = require('./models/User');
    
    // Check if admin user exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      console.log('Creating default admin user...');
      
      // Create admin user
      const admin = new User({
        fullName: 'Admin',
        email: 'admin@gatepass.com',
        password: '@admin_3127',
        role: 'admin',
        status: 'active'
      });
      
      await admin.save();
      console.log('Default admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminRoutes');
const tgRoutes = require('./routes/tg');
const studentRoutes = require('./routes/student');
const gatepassRoutes = require('./routes/gatepass');
const hodRoutes = require('./routes/hod');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tg', tgRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/gatepass', gatepassRoutes);
app.use('/api/hod', hodRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = 5001;
server.listen(PORT, () => {
  console.log(`Server with Socket.IO is running on port ${PORT}`);
}); 