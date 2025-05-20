const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyTG, changePassword, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.get('/profile', protect, getUserProfile);
router.post('/change-password', protect, changePassword);

module.exports = router;