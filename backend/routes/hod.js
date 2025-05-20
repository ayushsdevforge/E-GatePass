const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const GatepassRequest = require('../models/GatepassRequest');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// HOD Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Please provide email and password' 
            });
        }

        // Find HOD user by email and role
        const hod = await User.findOne({ 
            email: email.toLowerCase(),
            role: 'hod'
        });

        if (!hod) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        // Check if account is active
        if (hod.status !== 'active') {
            return res.status(401).json({ 
                success: false,
                message: 'Account is inactive. Please contact administrator.' 
            });
        }

        // Verify password
        const isMatch = await hod.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        // Generate JWT token
        const token = generateToken(hod._id);

        // Log successful login
        console.log(`HOD login successful: ${hod.email}`);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: hod._id,
                name: hod.fullName,
                email: hod.email,
                role: hod.role
            }
        });

    } catch (error) {
        console.error('HOD login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
});

// Verify HOD Token
router.get('/verify', async (req, res) => {
    try {
        // Get token from header
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.query.token) {
            // Allow token as query parameter for easier testing
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get HOD user
        const hod = await User.findById(decoded.id);
        
        if (!hod || hod.role !== 'hod') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized as HOD'
            });
        }

        if (hod.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive'
            });
        }

        // Log successful verification
        console.log(`HOD token verified: ${hod.email}`);

        res.json({
            success: true,
            user: {
                id: hod._id,
                name: hod.fullName,
                email: hod.email,
                role: hod.role
            }
        });
    } catch (error) {
        console.error('HOD verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Token verification failed',
            error: error.message
        });
    }
});

// Get all requests for HOD
router.get('/requests', protect, async (req, res) => {
    try {
        // Check if user is HOD
        const hod = await User.findById(req.user.id);
        if (!hod || hod.role !== 'hod') {
            return res.status(401).json({ 
                success: false,
                message: 'Not authorized' 
            });
        }
        
        // Fetch requests for this HOD
        const requests = await GatepassRequest.find({
            forwardedTo: hod._id
        })
        .populate('student', 'fullName email phone department semester section enrollmentNumber')
        .populate('tg', 'fullName email')
        .sort({ createdAt: -1 });
        
        // Return requests
        res.status(200).json({
            success: true,
            requests
        });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
});

const generateGatepassToken = require('../utils/generateGatepassToken');

// Generate token for a request
router.put('/request/:id/generate-token', protect, async (req, res) => {
    try {
        // Find the request by ID
        const request = await GatepassRequest.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: 'Request not found' 
            });
        }
        
        // Only generate token for approved requests
        if (request.status !== 'approved') {
            return res.status(400).json({ 
                success: false,
                message: 'Can only generate token for approved requests' 
            });
        }
        
        // Get student details for the token
        const student = await User.findById(request.student).select('fullName enrollmentNumber department email');
        
        if (!student) {
            return res.status(404).json({ 
                success: false,
                message: 'Student not found' 
            });
        }
        
        // Generate gatepass token and QR code
        const { token, expiryDate, qrCodeUrl } = await generateGatepassToken(request, student);
        
        // Add token details to the request
        request.gatepassToken = token;
        request.gatepassTokenExpiry = expiryDate;
        request.qrCodeUrl = qrCodeUrl;
        
        // Save the updated request
        await request.save();
        
        // Get the fully populated request
        const populatedRequest = await GatepassRequest.findById(req.params.id)
            .populate('student', 'fullName email phone department semester section enrollmentNumber')
            .populate('tg', 'fullName email')
            .populate('approvedBy', 'fullName email');
        
        // Emit WebSocket event for real-time tracking
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${request.student}`).emit('token-generated', {
                requestId: request._id,
                token: token
            });
        }
        
        res.json({
            success: true,
            message: 'Gatepass token generated successfully',
            request: populatedRequest
        });
    } catch (error) {
        console.error('Error generating token:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
});

// Approve request
router.put('/request/:id/approve', protect, async (req, res) => {
    try {
        // Find the request by ID
        const request = await GatepassRequest.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: 'Request not found' 
            });
        }
        
        if (request.status !== 'forwarded') {
            return res.status(400).json({ 
                success: false,
                message: 'Request cannot be approved in its current state' 
            });
        }
        
        // Get student details for the token
        const student = await User.findById(request.student).select('fullName enrollmentNumber department email');
        
        if (!student) {
            return res.status(404).json({ 
                success: false,
                message: 'Student not found' 
            });
        }
        
        // Update request status
        request.status = 'approved';
        request.approvedBy = req.user.id;
        request.approvedAt = Date.now();
        
        // Generate gatepass token and QR code
        const { token, expiryDate, qrCodeUrl } = await generateGatepassToken(request, student);
        
        // Add token details to the request
        request.gatepassToken = token;
        request.gatepassTokenExpiry = expiryDate;
        request.qrCodeUrl = qrCodeUrl;
        
        // Save the updated request
        await request.save();
        
        // Get the fully populated request for WebSocket event
        const populatedRequest = await GatepassRequest.findById(req.params.id)
            .populate('student', 'fullName email phone department semester section enrollmentNumber')
            .populate('tg', 'fullName email')
            .populate('approvedBy', 'fullName email');
        
        // Emit WebSocket event for real-time tracking
        const io = req.app.get('io');
        if (io && populatedRequest.student) {
            // Emit to the specific student's room
            io.to(`user-${populatedRequest.student._id}`).emit('requestStatusUpdate', populatedRequest);
            console.log(`Emitted approval status update to user-${populatedRequest.student._id}`);
        }
        
        // Return the updated request with token information
        res.status(200).json({
            success: true,
            message: 'Request approved successfully',
            request: {
                _id: request._id,
                student: {
                    id: student._id,
                    name: student.fullName,
                    enrollmentNumber: student.enrollmentNumber,
                    department: student.department,
                    email: student.email
                },
                status: request.status,
                approvedAt: request.approvedAt,
                gatepassToken: token,
                gatepassTokenExpiry: expiryDate,
                qrCodeUrl: qrCodeUrl
            }
        });
    } catch (error) {
        console.error('Error approving request:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
});

// Reject request
router.put('/request/:id/reject', protect, async (req, res) => {
    try {
        // Find the request by ID
        const request = await GatepassRequest.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: 'Request not found' 
            });
        }
        
        if (request.status !== 'forwarded') {
            return res.status(400).json({ 
                success: false,
                message: 'Request cannot be rejected in its current state' 
            });
        }
        
        // Update request status
        request.status = 'rejected';
        request.rejectedBy = req.user.id;
        request.rejectedAt = Date.now();
        
        // Save the updated request
        await request.save();
        
        // Get the fully populated request for WebSocket event
        const populatedRequest = await GatepassRequest.findById(req.params.id)
            .populate('student', 'fullName email phone department semester section enrollmentNumber')
            .populate('tg', 'fullName email')
            .populate('rejectedBy', 'fullName email');
        
        // Emit WebSocket event for real-time tracking
        const io = req.app.get('io');
        if (io && populatedRequest.student) {
            // Emit to the specific student's room
            io.to(`user-${populatedRequest.student._id}`).emit('requestStatusUpdate', populatedRequest);
            console.log(`Emitted rejection status update to user-${populatedRequest.student._id}`);
        }
        
        // Return success response
        res.status(200).json({
            success: true,
            message: 'Request rejected successfully',
            request: {
                _id: request._id,
                status: request.status,
                rejectedAt: request.rejectedAt
            }
        });
    } catch (error) {
        console.error('Error rejecting request:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
});

// Delete request
router.delete('/request/:id', protect, async (req, res) => {
    try {
        // Check if user is HOD
        const hod = await User.findById(req.user.id);
        if (!hod || hod.role !== 'hod') {
            return res.status(401).json({ 
                success: false,
                message: 'Not authorized' 
            });
        }
        
        // Find the request
        const request = await GatepassRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: 'Request not found' 
            });
        }
        
        // Check if HOD is authorized to delete this request
        if (request.forwardedTo.toString() !== req.user.id.toString()) {
            return res.status(401).json({ 
                success: false,
                message: 'Not authorized to delete this request' 
            });
        }
        
        // Delete the request
        // Note: remove() is deprecated in newer Mongoose versions, using deleteOne() instead
        await request.deleteOne();
        
        // Return success response
        res.status(200).json({
            success: true,
            message: 'Request deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
});

// Clear all approved requests
router.delete('/requests/clear-approved', protect, async (req, res) => {
    try {
        // Check if user is HOD
        if (req.user.role !== 'hod') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to perform this action'
            });
        }

        // Find and delete all approved requests
        const result = await GatepassRequest.deleteMany({ status: 'approved' });

        res.status(200).json({
            success: true,
            message: `Successfully cleared ${result.deletedCount} approved requests`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error clearing approved requests:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;
