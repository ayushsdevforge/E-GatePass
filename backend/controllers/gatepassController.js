const GatepassRequest = require('../models/GatepassRequest');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Define all functions first
const getTGRequests = async (req, res) => {
    const tgId = req.user.id;
    const requests = await GatepassRequest.find({ tg: tgId, status: 'pending' }).populate('student', 'fullName email enrollmentNumber');
    res.json({ success: true, requests });
};

const forwardToHOD = async (req, res) => {
    try {
        const { id } = req.params;
        const { hodId } = req.body;
        const tgId = req.user.id;

        const request = await GatepassRequest.findOne({ _id: id, tg: tgId }).populate('student', 'fullName email enrollmentNumber');
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or you do not have permission to forward it'
            });
        }

        const hod = await User.findOne({ _id: hodId, role: 'hod', status: 'active' });
        if (!hod) {
            return res.status(404).json({
                success: false,
                message: 'Selected HOD not found or is inactive'
            });
        }

        request.status = 'forwarded';
        request.forwardedTo = hodId;
        request.forwardedAt = Date.now();
        await request.save();
        
        // Get the updated request with populated fields
        const updatedRequest = await GatepassRequest.findById(id)
            .populate('student', 'fullName email enrollmentNumber')
            .populate('tg', 'fullName email')
            .populate('forwardedTo', 'fullName email');
        
        // Emit WebSocket event for real-time tracking
        const io = req.app.get('io');
        if (io && updatedRequest.student) {
            // Emit to the specific student's room
            io.to(`user-${updatedRequest.student._id}`).emit('requestStatusUpdate', updatedRequest);
            console.log(`Emitted status update to user-${updatedRequest.student._id}`);
        }

        res.json({
            success: true,
            message: 'Request forwarded to HOD successfully',
            request: updatedRequest
        });
    } catch (error) {
        console.error('Error forwarding request:', error);
        res.status(500).json({
            success: false,
            message: 'Error forwarding request',
            error: error.message
        });
    }
};

const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const tgId = req.user.id;

        const request = await GatepassRequest.findOne({ _id: id, tg: tgId });
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or you do not have permission to delete it'
            });
        }

        await GatepassRequest.findByIdAndDelete(id);
        res.json({
            success: true,
            message: 'Request deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting request',
            error: error.message
        });
    }
};

const getHODs = async (req, res) => {
    try {
        const hods = await User.find({ role: 'hod', status: 'active' })
            .select('fullName email')
            .sort({ fullName: 1 });

        res.json({
            success: true,
            hods
        });
    } catch (error) {
        console.error('Error fetching HODs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching HODs',
            error: error.message
        });
    }
};

// Export all functions
module.exports = {
    getTGRequests,
    forwardToHOD,
    deleteRequest,
    getHODs
}; 