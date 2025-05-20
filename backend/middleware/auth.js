const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  try {
    // Check for token in authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token found
    if (!token) {
      console.log('No token provided in request:', req.originalUrl);
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`Token verified for user ID: ${decoded.id}, accessing: ${req.originalUrl}`);

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      console.log(`User not found for ID: ${decoded.id}`);
      return res.status(401).json({
        success: false,
        message: 'User account not found. Please sign in again.'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      console.log(`Inactive user attempted access: ${user._id}, ${user.email}`);
      return res.status(401).json({
        success: false,
        message: 'Your account is inactive. Please contact the administrator.'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      console.error('Invalid token:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token. Please sign in again.'
      });
    } else if (error.name === 'TokenExpiredError') {
      console.error('Token expired');
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please sign in again.'
      });
    }
    
    // Generic error
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please sign in again.'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
}; 