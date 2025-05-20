// API URL
const API_URL = 'http://localhost:5001/api';

// DOM Elements
const adminDashboard = document.querySelector('.admin-dashboard');
const totalHODsEl = document.getElementById('totalHODs');
const totalTGsEl = document.getElementById('totalTGs');
const totalStudentsEl = document.getElementById('totalStudents');
const usersTableBody = document.getElementById('usersTableBody');
const addUserBtn = document.getElementById('addUserBtn');
const addUserModal = document.getElementById('addUserModal');
const addUserForm = document.getElementById('addUserForm');
const roleFilterEl = document.getElementById('roleFilter');
const loginForm = document.getElementById('loginForm');
const loginModal = document.getElementById('loginModal');
const logoutBtn = document.getElementById('logoutBtn');
const loginMenuItem = document.getElementById('loginMenuItem');
const logoutMenuItem = document.getElementById('logoutMenuItem');
const signInBtn = document.getElementById('signInBtn');

// Fetch dashboard stats
async function fetchDashboardStats() {
  try {
    console.log('Fetching dashboard stats...');
    // Get admin token from localStorage
    const token = localStorage.getItem('adminToken');
    if (!token) {
      console.error('No admin token found');
      showNotification('Please log in as admin to access dashboard stats', 'error');
      // Redirect to login
      showLoginModal();
      return;
    }
    
    // Make API call to fetch stats
    const response = await fetch(`${API_URL}/admin/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Unauthorized or forbidden - token might be invalid
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        updateAdminNavUI(false);
        showLoginModal();
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      // Update dashboard stats
      if (totalHODsEl) totalHODsEl.textContent = data.stats.hodCount || 0;
      if (totalTGsEl) totalTGsEl.textContent = data.stats.tgCount || 0;
      if (totalStudentsEl) totalStudentsEl.textContent = data.stats.studentCount || 0;
    } else {
      throw new Error(data.message || 'Failed to fetch dashboard stats');
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    showNotification('Error fetching dashboard stats: ' + error.message, 'error');
  }
}

// Update user statistics based on role
function updateUserStatistics() {
  const tableRows = document.querySelectorAll('#usersTableBody tr');
  let hodCount = 0;
  let tgCount = 0;
  let studentCount = 0;
  
  tableRows.forEach(row => {
    const roleCell = row.querySelector('td:nth-child(3)');
    if (roleCell) {
      const role = roleCell.textContent.toLowerCase();
      if (role === 'hod') hodCount++;
      else if (role === 'tg') tgCount++;
      else if (role === 'student') studentCount++;
    }
  });
  
  // Update the dashboard counters
  if (totalHODsEl) totalHODsEl.textContent = hodCount;
  if (totalTGsEl) totalTGsEl.textContent = tgCount;
  if (totalStudentsEl) totalStudentsEl.textContent = studentCount;
}

// Filter users by role
function filterUsersByRole() {
  const selectedRole = roleFilterEl ? roleFilterEl.value : 'all';
  const tableRows = document.querySelectorAll('#usersTableBody tr');
  
  tableRows.forEach(row => {
    const roleCell = row.querySelector('td:nth-child(3)');
    
    if (selectedRole === 'all' || (roleCell && roleCell.textContent.toLowerCase() === selectedRole)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// Fetch users
async function fetchUsers() {
  try {
    console.log('Fetching users...');
    // Get admin token from localStorage
    const token = localStorage.getItem('adminToken');
    if (!token) {
      console.error('No admin token found');
      showNotification('Please log in as admin to access user data', 'error');
      // Redirect to login
      showLoginModal();
      return;
    }

    // Make API call to fetch users
    const response = await fetch(`${API_URL}/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Unauthorized or forbidden - token might be invalid
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        updateAdminNavUI(false);
        showLoginModal();
        throw new Error('Session expired. Please log in again.');
      }
      
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Render users in the table
      renderUsers(data.users);
      // Update dashboard stats
      updateUserStatistics();
    } else {
      throw new Error(data.message || 'Failed to fetch users');
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    showNotification('Error fetching users: ' + error.message, 'error');
    
    // If we have no users data, show some mock data for demo purposes
    const mockUsers = [
      {
        _id: 'tg1',
        fullName: 'John Smith',
        email: 'johnsmith@example.com',
        role: 'tg',
        status: 'active',
        department: 'Computer Science'
      },
      {
        _id: 'tg2',
        fullName: 'Emily Johnson',
        email: 'emily@example.com',
        role: 'tg',
        status: 'active',
        department: 'Electrical Engineering'
      },
      {
        _id: 'hod1',
        fullName: 'Dr. Robert Williams',
        email: 'robert@example.com',
        role: 'hod',
        status: 'active',
        department: 'Computer Science'
      },
      {
        _id: 'student1',
        fullName: 'Alice Cooper',
        email: 'alice@example.com',
        role: 'student',
        status: 'active',
        enrollmentNumber: 'CS2023001',
        semester: '5',
        section: 'A'
      },
      {
        _id: 'student2',
        fullName: 'Bob Miller',
        email: 'bob@example.com',
        role: 'student',
        status: 'active',
        enrollmentNumber: 'CS2023002',
        semester: '5',
        section: 'B'
      }
    ];

    renderUsers(mockUsers);
    updateUserStatistics();
  }
}

// Render users
function renderUsers(users) {
  if (!usersTableBody) return;
  
  // Clear existing rows
  usersTableBody.innerHTML = '';
  
  if (!users || users.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
      <td colspan="5" class="text-center">No users found</td>
    `;
    usersTableBody.appendChild(emptyRow);
    return;
  }
  
  // Add user rows
  users.forEach(user => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.fullName}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td>
        <span class="status-badge ${user.status === 'active' ? 'active' : 'inactive'}">
          ${user.status}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon edit-user" data-id="${user._id}" title="Edit User">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon delete-user" data-id="${user._id}" title="Delete User">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
    `;
    
    // Add delete event listener
    const deleteBtn = row.querySelector('.delete-user');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this user?')) {
          deleteUser(user._id);
        }
      });
    }
    
    usersTableBody.appendChild(row);
  });
  
  // Update filter
  filterUsersByRole();
}

// Delete user
async function deleteUser(userId) {
  try {
    // Get admin token
    const token = localStorage.getItem('adminToken');
    if (!token) {
      showNotification('You must be logged in as admin to delete users', 'error');
      showLoginModal();
      return;
    }
    
    // Make API call to delete user
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // Refresh user list
      fetchUsers();
      
      // Show success notification
      showNotification('User deleted successfully!', 'success');
    } else {
      throw new Error(data.message || 'Failed to delete user');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    showNotification('Error deleting user: ' + error.message, 'error');
  }
}

// Handle Add User Form Submit
function handleAddUser(e) {
  e.preventDefault();
  
  // Get form data
  const fullName = document.getElementById('fullName').value;
  const email = document.getElementById('email').value;
  const role = document.getElementById('role').value;
  const status = document.getElementById('status').value || 'active';
  const password = document.getElementById('password')?.value || '';
  
  if (!fullName || !email || !role) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  // Role-specific fields
  let userData = { fullName, email, role, status, password };
  
  // Add department if applicable
  const departmentEl = document.getElementById('department');
  if (departmentEl && departmentEl.value) {
    userData.department = departmentEl.value;
  }
  
  // Add student-specific fields if role is student
  if (role === 'student') {
    const enrollmentEl = document.getElementById('enrollmentNumber');
    const semesterEl = document.getElementById('semester');
    const sectionEl = document.getElementById('section');
    
    if (enrollmentEl && enrollmentEl.value) {
      userData.enrollmentNumber = enrollmentEl.value;
    }
    
    if (semesterEl && semesterEl.value) {
      userData.semester = semesterEl.value;
    }
    
    if (sectionEl && sectionEl.value) {
      userData.section = sectionEl.value;
    }
  }
  
  // Get admin token
  const token = localStorage.getItem('adminToken');
  if (!token) {
    showNotification('You must be logged in as admin to add users', 'error');
    showLoginModal();
    return;
  }
  
  // Show loading state
  const submitBtn = addUserForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding User...';
  submitBtn.disabled = true;
  
  // Make API call to add user
  fetch(`${API_URL}/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.message || `HTTP error! Status: ${response.status}`);
      });
    }
    return response.json();
  })
  .then(data => {
    // Reset button state
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    
    if (data.success) {
      // Close modal
      closeAddUserModal();
      
      // Reset form
      addUserForm.reset();
      
      // Refresh user list
      fetchUsers();
      
      // Show success notification
      showNotification('User added successfully!', 'success');
    } else {
      // Show error notification
      showNotification(data.message || 'Failed to add user', 'error');
    }
  })
  .catch(error => {
    // Reset button state
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    
    // Show error notification
    showNotification(error.message || 'An error occurred while adding user', 'error');
    console.error('Add user error:', error);
  });
}

// Show notification
function showNotification(message, type = 'info') {
  // Check if notification container exists, create if not
  let notificationContainer = document.getElementById('notificationContainer');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notificationContainer';
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  // Add icon based on notification type
  let icon = '';
  switch(type) {
    case 'success':
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case 'error':
      icon = '<i class="fas fa-exclamation-circle"></i>';
      break;
    case 'warning':
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    default:
      icon = '<i class="fas fa-info-circle"></i>';
  }
  
  notification.innerHTML = `${icon} <span>${message}</span>`;
  
  // Add to container
  notificationContainer.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 3000);
}

// Modal functions
function openAddUserModal() {
  addUserModal.style.display = 'block';
  // Initialize the form fields based on default role
  updateFormFields();
}

function closeAddUserModal() {
  addUserModal.style.display = 'none';
  addUserForm.reset();
}

// Update form fields based on role
function updateFormFields() {
  const role = document.getElementById('role').value;
  const passwordFieldContainer = document.getElementById('passwordFieldContainer');
  
  if (!passwordFieldContainer) {
    console.error('Password field container not found');
    return;
  }
  
  // Clear previous fields
  passwordFieldContainer.innerHTML = '';
  
  // Always add password field for TG and HOD
  if (role === 'tg' || role === 'hod') {
    passwordFieldContainer.innerHTML = `
      <div class="form-group">
        <label for="password">Password</label>
        <div class="input-with-icon">
          <input type="password" id="password" required>
          <i class="fas fa-lock"></i>
        </div>
      </div>
    `;
  } else {
    passwordFieldContainer.innerHTML = `
      <div class="form-group">
        <label for="password">Password (Optional)</label>
        <div class="input-with-icon">
          <input type="password" id="password">
          <i class="fas fa-lock"></i>
        </div>
      </div>
    `;
  }
  
  // Add department field for all roles
  passwordFieldContainer.innerHTML += `
    <div class="form-group">
      <label for="department">Department</label>
      <div class="input-with-icon">
        <select id="department" ${role === 'student' ? 'required' : ''}>
          <option value="">Select Department</option>
          <option value="CSE">Computer Science</option>
          <option value="ECE">Electronics</option>
          <option value="ME">Mechanical</option>
          <option value="CE">Civil</option>
        </select>
        <i class="fas fa-building"></i>
      </div>
    </div>
  `;
  
  // Add student-specific fields
  if (role === 'student') {
    passwordFieldContainer.innerHTML += `
      <div class="form-group">
        <label for="enrollmentNumber">Enrollment Number</label>
        <div class="input-with-icon">
          <input type="text" id="enrollmentNumber" required>
          <i class="fas fa-id-card"></i>
        </div>
      </div>
      <div class="form-group">
        <label for="semester">Semester</label>
        <div class="input-with-icon">
          <select id="semester" required>
            <option value="">Select Semester</option>
            <option value="1">1st Semester</option>
            <option value="2">2nd Semester</option>
            <option value="3">3rd Semester</option>
            <option value="4">4th Semester</option>
            <option value="5">5th Semester</option>
            <option value="6">6th Semester</option>
            <option value="7">7th Semester</option>
            <option value="8">8th Semester</option>
          </select>
          <i class="fas fa-calendar"></i>
        </div>
      </div>
      <div class="form-group">
        <label for="section">Section</label>
        <div class="input-with-icon">
          <select id="section" required>
            <option value="">Select Section</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
          </select>
          <i class="fas fa-users"></i>
        </div>
      </div>
    `;
  }
}

// Verify admin token
async function verifyAdminToken(token) {
  try {
    const response = await fetch(`${API_URL}/admin/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Token verification failed');
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}

// Initialize admin dashboard
function initializeDashboard() {
  // Check if admin is logged in
  const token = localStorage.getItem('adminToken');
  const adminUser = localStorage.getItem('adminUser');
  
  if (token && adminUser) {
    // Verify token
    verifyAdminToken(token)
      .then(isValid => {
        if (isValid) {
          // Update UI
          updateAdminNavUI(true);
          
          // Show dashboard
          if (adminDashboard) {
            adminDashboard.style.display = 'block';
          }
          
          // Fetch dashboard data
          fetchDashboardStats();
          fetchUsers();
        } else {
          // Token is invalid, clear localStorage
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          
          // Update UI
          updateAdminNavUI(false);
          
          // Show login modal
          showLoginModal();
        }
      })
      .catch(error => {
        console.error('Token verification error:', error);
        
        // Clear localStorage
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        
        // Update UI
        updateAdminNavUI(false);
        
        // Show login modal
        showLoginModal();
      });
  } else {
    // No token or user data, show login modal
    updateAdminNavUI(false);
    showLoginModal();
  }
  
  // Setup event listeners
  if (addUserBtn) {
    addUserBtn.addEventListener('click', openAddUserModal);
  }
  
  if (addUserForm) {
    addUserForm.addEventListener('submit', handleAddUser);
  }
  
  if (loginForm) {
    loginForm.addEventListener('submit', handleAdminLogin);
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Clear localStorage
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      
      // Update UI
      updateAdminNavUI(false);
      
      // Show login modal
      showLoginModal();
      
      // Show notification
      showNotification('Logged out successfully', 'success');
    });
  }
  
  if (signInBtn) {
    signInBtn.addEventListener('click', showLoginModal);
  }
  
  // Set up role filter change event
  if (roleFilterEl) {
    roleFilterEl.addEventListener('change', filterUsersByRole);
  }
  
  // Set up role field change event for add user form
  const roleField = document.getElementById('role');
  if (roleField) {
    roleField.addEventListener('change', updateFormFields);
  }
}

// Function to update admin navigation UI based on login status
function updateAdminNavUI(isLoggedIn) {
  if (isLoggedIn) {
    if (loginMenuItem) loginMenuItem.style.display = 'none';
    if (logoutMenuItem) logoutMenuItem.style.display = 'block';
  } else {
    if (loginMenuItem) loginMenuItem.style.display = 'block';
    if (logoutMenuItem) logoutMenuItem.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'none';
  }
}

// Show login modal
function showLoginModal() {
  if (loginModal) {
    loginModal.style.display = 'block';
  }
}

// Hide login modal
function hideLoginModal() {
  if (loginModal) {
    loginModal.style.display = 'none';
    if (loginForm) loginForm.reset();
    document.querySelectorAll('.error-message').forEach(el => el.remove());
  }
}

// Show error message
function showError(form, message) {
  // Remove any existing error messages
  form.querySelectorAll('.error-message').forEach(el => el.remove());
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  form.insertBefore(errorDiv, form.firstChild);
}

// Handle admin login
function handleAdminLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  
  if (!email || !password) {
    showError(loginForm, 'Please provide email and password');
    return;
  }
  
  // Clear previous error messages
  const errorElement = document.querySelector('.error-message');
  if (errorElement) errorElement.remove();
  
  // Show loading state
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
  submitBtn.disabled = true;
  
  // Make API call to login
  fetch(`${API_URL}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.message || `HTTP error! Status: ${response.status}`);
      });
    }
    return response.json();
  })
  .then(data => {
    // Reset button state
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    
    if (data.success) {
      // Store token and user data in localStorage
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      
      // Hide login modal
      hideLoginModal();
      
      // Update UI
      updateAdminNavUI(true);
      
      // Show dashboard
      adminDashboard.style.display = 'block';
      
      // Fetch dashboard data
      fetchDashboardStats();
      fetchUsers();
      
      // Show success notification
      showNotification('Login successful!', 'success');
    } else {
      // Show error message
      showError(loginForm, data.message || 'Login failed');
    }
  })
  .catch(error => {
    // Reset button state
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    
    // Show error message
    showError(loginForm, error.message || 'An error occurred. Please try again.');
    console.error('Login error:', error);
  });
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeDashboard);
