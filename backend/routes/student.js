const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const GatepassRequest = require('../models/GatepassRequest');
const User = require('../models/User');
const mongoose = require('mongoose');

// Example route (you can expand this later)
router.get('/', (req, res) => {
    res.json({ message: 'Student route is working.' });
});

// Get all requests for a student
router.get('/requests', protect, async (req, res) => {
    try {
        const student = await User.findById(req.user.id);
        
        if (!student || student.role !== 'student') {
            return res.status(401).json({ 
                success: false,
                message: 'Not authorized as student' 
            });
        }
        
        const requests = await GatepassRequest.find({ student: student._id })
            .populate('tg', 'fullName email')
            .populate('forwardedTo', 'fullName email')
            .populate('approvedBy', 'fullName email')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            requests
        });
    } catch (error) {
        console.error('Error fetching student requests:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
});

// Get approved request with gatepass token
router.get('/approved-request/:id', protect, async (req, res) => {
    try {
        const student = await User.findById(req.user.id);
        
        if (!student || student.role !== 'student') {
            return res.status(401).json({ 
                success: false,
                message: 'Not authorized as student' 
            });
        }
        
        const request = await GatepassRequest.findOne({
            _id: req.params.id,
            student: student._id,
            status: 'approved',
            gatepassToken: { $exists: true, $ne: null }
        }).populate('tg', 'fullName email')
          .populate('forwardedTo', 'fullName email')
          .populate('approvedBy', 'fullName email');
        
        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: 'Approved request with gatepass not found' 
            });
        }
        
        // Check if token is expired
        const now = new Date();
        if (request.gatepassTokenExpiry && now > request.gatepassTokenExpiry) {
            return res.status(400).json({ 
                success: false,
                message: 'Gatepass token has expired' 
            });
        }
        
        res.status(200).json({
            success: true,
            request: {
                _id: request._id,
                ticketId: request.ticketId,
                reason: request.reason,
                status: request.status,
                createdAt: request.createdAt,
                approvedAt: request.approvedAt,
                gatepassToken: request.gatepassToken,
                gatepassTokenExpiry: request.gatepassTokenExpiry,
                qrCodeUrl: request.qrCodeUrl,
                student: {
                    id: student._id,
                    name: student.fullName,
                    enrollmentNumber: student.enrollmentNumber,
                    department: student.department
                },
                approvedBy: request.approvedBy ? {
                    name: request.approvedBy.fullName,
                    email: request.approvedBy.email
                } : null
            }
        });
    } catch (error) {
        console.error('Error fetching approved request:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
});

// Get gatepass by enrollment number
router.get('/gatepass/:enrollmentNumber', protect, async (req, res) => {
    try {
        const { enrollmentNumber } = req.params;
        
        // Find student by enrollment number
        const student = await User.findOne({ 
            enrollmentNumber: enrollmentNumber,
            role: 'student'
        });
        
        if (!student) {
            return res.status(404).json({ 
                success: false,
                message: 'Student not found with the provided enrollment number' 
            });
        }
        
        // Find the latest approved gatepass request for this student
        const request = await GatepassRequest.findOne({
            student: student._id,
            status: 'approved',
            gatepassToken: { $exists: true, $ne: null }
        }).sort({ approvedAt: -1 })
          .populate('tg', 'fullName email')
          .populate('forwardedTo', 'fullName email')
          .populate('approvedBy', 'fullName email');
        
        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: 'No approved gatepass found for this student' 
            });
        }
        
        // Check if token is expired
        const now = new Date();
        if (request.gatepassTokenExpiry && now > request.gatepassTokenExpiry) {
            return res.status(400).json({ 
                success: false,
                message: 'Gatepass token has expired' 
            });
        }
        
        res.status(200).json({
            success: true,
            request: {
                _id: request._id,
                ticketId: request.ticketId,
                reason: request.reason,
                status: request.status,
                createdAt: request.createdAt,
                approvedAt: request.approvedAt,
                gatepassToken: request.gatepassToken,
                gatepassTokenExpiry: request.gatepassTokenExpiry,
                qrCodeUrl: request.qrCodeUrl,
                student: {
                    id: student._id,
                    name: student.fullName,
                    enrollmentNumber: student.enrollmentNumber,
                    department: student.department
                },
                approvedBy: request.approvedBy ? {
                    name: request.approvedBy.fullName,
                    email: request.approvedBy.email
                } : null
            }
        });
    } catch (error) {
        console.error('Error fetching gatepass by enrollment number:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
});

// Get or generate token for an approved request
router.get('/request/:id/token', protect, async (req, res) => {
    try {
        // Find the request by ID and check if it belongs to the authenticated student
        const request = await GatepassRequest.findOne({ 
            _id: req.params.id,
            student: req.user.id,
            status: 'approved'
        });
        
        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: 'Approved request not found' 
            });
        }
        
        // If request already has a token, return it
        if (request.gatepassToken) {
            return res.json({
                success: true,
                request: request
            });
        }
        
        // If no token exists, generate one
        // Get student details for the token
        const student = await User.findById(req.user.id).select('fullName enrollmentNumber department email');
        
        if (!student) {
            return res.status(404).json({ 
                success: false,
                message: 'Student not found' 
            });
        }
        
        // Generate a 6-digit token
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Set expiry date (24 hours from now)
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 24);
        
        // Add token details to the request
        request.gatepassToken = token;
        request.gatepassTokenExpiry = expiryDate;
        
        // Save the updated request
        await request.save();
        
        res.json({
            success: true,
            message: 'Gatepass token generated successfully',
            request: request
        });
    } catch (error) {
        console.error('Error getting/generating token:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
});

module.exports = router;