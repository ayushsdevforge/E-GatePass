const User = require('../models/User');

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -__v')
      .sort({ createdAt: -1 }); // Sort by newest first

    if (!users) {
      return res.status(404).json({
        success: false,
        message: 'No users found'
      });
    }

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Add new user
exports.addUser = async (req, res) => {
  try {
    console.log('Add user request received:', req.body);
    const { fullName, email, role, status, password, department, semester, section, enrollmentNumber } = req.body;

    // Validate required fields
    if (!fullName || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate password for TG and HOD roles
    if (role === 'tg' || role === 'hod') {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required for TG and HOD users'
        });
      }
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }
    }

    // Create user data object
    const userData = {
      fullName,
      email,
      role,
      status: status || 'active'
    };

    // Add department if provided
    if (department) {
      userData.department = department;
    }

    // Add student-specific fields if role is student
    if (role === 'student') {
      // Use provided enrollment number or generate from email
      userData.enrollmentNumber = enrollmentNumber || email.split('@')[0];
      
      // Add semester and section if provided
      if (semester) userData.semester = semester;
      if (section) userData.section = section;
      
      // Ensure department is set for students
      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Department is required for student users'
        });
      }
    }

    // Add password if provided or set default
    if (password) {
      userData.password = password;
    } else {
      userData.password = 'password123'; // Default password
    }

    console.log('Creating user with data:', userData);

    // Create new user
    const user = new User(userData);

    // Save user
    const savedUser = await user.save();

    // Return user data without password
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    console.log('User created successfully:', userResponse);

    res.status(201).json({
      success: true,
      message: 'User added successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error adding user:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email or enrollment number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error adding user',
      error: error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('Fetching dashboard stats...');
    // Count users by role
    const [hodCount, tgCount, studentCount] = await Promise.all([
      User.countDocuments({ role: 'hod' }),
      User.countDocuments({ role: 'tg' }),
      User.countDocuments({ role: 'student' })
    ]);

    const stats = {
      hodCount,
      tgCount,
      studentCount,
      totalUsers: hodCount + tgCount + studentCount,
      activeUsers: await User.countDocuments({ status: 'active' }),
      inactiveUsers: await User.countDocuments({ status: 'inactive' })
    };

    console.log('Dashboard stats:', stats);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};