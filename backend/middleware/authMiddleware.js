const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Not authorized, user not found' 
                });
            }

            // Check if user is active
            if (user.status !== 'active') {
                return res.status(401).json({ 
                    success: false,
                    message: 'Not authorized, user is inactive' 
                });
            }

            // Add user to request object
            req.user = user;
            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            res.status(401).json({ 
                success: false,
                message: 'Not authorized, token failed' 
            });
        }
    }

    if (!token) {
        res.status(401).json({ 
            success: false,
            message: 'Not authorized, no token' 
        });
    }
};

// Middleware to check if user is HOD
const isHOD = (req, res, next) => {
    if (req.user && req.user.role === 'hod') {
        next();
    } else {
        res.status(403).json({ 
            success: false,
            message: 'Not authorized as HOD' 
        });
    }
};

module.exports = { protect, isHOD }; 