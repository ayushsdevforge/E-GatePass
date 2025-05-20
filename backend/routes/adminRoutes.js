const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Get all users - protected route for admins only
router.get('/users', protect, adminController.getUsers);

// Add new user - protected route for admins only
router.post('/users', protect, adminController.addUser);

// Delete user - protected route for admins only
router.delete('/users/:userId', protect, adminController.deleteUser);

// Get dashboard stats - protected route for admins only
router.get('/stats', protect, adminController.getDashboardStats);

// Admin token verification route
router.get('/verify', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized as admin'
      });
    }

    // Return user data
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.fullName,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Admin login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      });
    }

    // Find admin user by email and role
    const User = require('../models/User');
    const admin = await User.findOne({ 
      email: email.toLowerCase(),
      role: 'admin'
    });

    if (!admin) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check if account is active
    if (admin.status !== 'active') {
      return res.status(401).json({ 
        success: false,
        message: 'Account is inactive. Please contact administrator.' 
      });
    }

    // Verify password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const generateToken = require('../utils/generateToken');
    const token = generateToken(admin._id);

    // Log successful login
    console.log(`Admin login successful: ${admin.email}`);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: admin._id,
        name: admin.fullName,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;