// HOD Dashboard JS

// API URL
const API_URL = 'http://localhost:5001/api/hod';

// Authentication Check - Runs immediately
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const token = localStorage.getItem('hodToken');
  const user = JSON.parse(localStorage.getItem('hodUser') || '{}');
  
  // Only redirect if we're on the dashboard page and not logged in
  if (window.location.pathname.includes('admin-dashboard') && (!token || !user.id)) {
    // Create and show notification
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#f44336';
    notification.style.color = 'white';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.style.zIndex = '9999';
    notification.textContent = 'Please log in to access the HOD dashboard';
    document.body.appendChild(notification);
    
    // Redirect to home page after a short delay
    setTimeout(function() {
      window.location.href = 'index.html';
    }, 2000);
  }
  
  // Initialize dashboard components
  console.log('HOD Dashboard initializing...');
  initializeHODDashboard();
  checkExistingToken();
  handleNavbarOnScroll();
});

// Global variables
let signInBtn;
let heroSignInBtn;
let viewDashboardBtn;
let heroViewDashboardBtn;
let signInModal;
let closeModalBtn;
let loginForm;
let loginError;
let dashboardSection;
let requestDetailsModal;
let changePasswordModal;
let changePasswordForm;
let closeModalBtns;
let heroSection;
let hodLogoutBtn;
let changePasswordBtn;

// Function to handle navbar visibility on scroll
function handleNavbarOnScroll() {
  const navbar = document.querySelector('.navbar');
  let lastScrollTop = 0;
  
  window.addEventListener('scroll', function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop && scrollTop > 100) {
      // Scrolling down & past the threshold
      navbar.classList.add('hidden');
    } else {
      // Scrolling up or at the top
      navbar.classList.remove('hidden');
    }
    
    lastScrollTop = scrollTop;
  });
}

// Initialize all DOM elements
function initializeHODDashboard() {
  // Get all DOM elements
  signInBtn = document.getElementById('signInBtn');
  heroSignInBtn = document.getElementById('heroSignInBtn');
  viewDashboardBtn = document.getElementById('viewDashboardBtn');
  heroViewDashboardBtn = document.getElementById('heroViewDashboardBtn');
  signInModal = document.getElementById('signInModal');
  closeModalBtn = document.getElementById('closeModalBtn');
  loginForm = document.getElementById('loginForm');
  loginError = document.getElementById('loginError');
  dashboardSection = document.getElementById('dashboardSection');
  requestDetailsModal = document.getElementById('requestDetailsModal');
  changePasswordModal = document.getElementById('changePasswordModal');
  changePasswordForm = document.getElementById('changePasswordForm');
  closeModalBtns = document.querySelectorAll('.close-modal');
  heroSection = document.querySelector('.hero');
  hodLogoutBtn = document.getElementById('hodLogoutBtn');
  changePasswordBtn = document.getElementById('changePasswordBtn');
  
  // Initialize tables
  initializeTables();
  
  // Initialize event listeners
  initializeEventListeners();
  
  // Check if user is already logged in
  const token = localStorage.getItem('hodToken');
  if (token) {
    showDashboard();
    loadDashboardData();
  }
  
  // Check for existing token
  checkExistingToken();
}

// Handle login form submission
function handleLogin(e) {
  e.preventDefault();
  console.log('HOD login form submitted');
  
  // Clear previous error messages
  if (loginError) loginError.textContent = '';
  
  // Get form values
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    if (loginError) loginError.textContent = 'Please provide email and password';
    return;
  }
  
  // Show loading state
  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (!submitBtn) {
    console.error('Submit button not found');
    return;
  }
  
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
  submitBtn.disabled = true;
  
  console.log('Making API call to:', 'http://localhost:5001/api/hod/login');
  
  // Make API call to login
  fetch('http://localhost:5001/api/hod/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })
  .then(response => {
    console.log('API response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Login API response:', data);
    
    // Reset button state
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    
    if (data.success) {
      // Store token and user data in localStorage
      localStorage.setItem('hodToken', data.token);
      
      if (data.user) {
        localStorage.setItem('hodUser', JSON.stringify(data.user));
      }
      
      console.log('Login successful, token stored');
      
      // Hide login modal
      closeSignInModal();
      
      // Update UI
      updateHODNavUI(true);
      
      // Show dashboard
      if (heroSection) heroSection.style.display = 'none';
      if (dashboardSection) dashboardSection.style.display = 'block';
      
      // Load dashboard data
      updateUserInfo();
      loadDashboardData();
      
      // Show success notification
      showNotification('Login successful!', 'success');
    } else {
      // Show error message
      if (loginError) loginError.textContent = data.message || 'Invalid credentials';
    }
  })
  .catch(error => {
    console.error('Login error details:', error);
    
    // Reset button state
    submitBtn.innerHTML = originalBtnText;
    submitBtn.disabled = false;
    
    // Show error message
    if (loginError) loginError.textContent = 'Server error. Please try again.';
  });
}

// Initialize event listeners
function initializeEventListeners() {
  // Sign in button event listeners
  if (signInBtn) {
    signInBtn.addEventListener('click', openSignInModal);
  }
  
  if (heroSignInBtn) {
    heroSignInBtn.addEventListener('click', openSignInModal);
  }
  
  // Login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Logout button event listener
  if (hodLogoutBtn) {
    hodLogoutBtn.addEventListener('click', handleLogout);
  }
  
  // Change password button event listener
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', openChangePasswordModal);
  }
  
  // Change password form submission
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', handleChangePassword);
  }
  
  // Close modal buttons
  if (closeModalBtns) {
    closeModalBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const modal = this.closest('.modal');
        if (modal.id === 'signInModal') {
          closeSignInModal();
        } else if (modal.id === 'changePasswordModal') {
          closeChangePasswordModal();
        } else if (modal.id === 'requestDetailsModal') {
          closeRequestDetailsModal();
        }
      });
    });
  }
}

// Handle logout
function handleLogout(e) {
  e.preventDefault();
  
  // Clear local storage
  localStorage.removeItem('hodToken');
  localStorage.removeItem('hodUser');
  
  // Update UI
  updateHODNavUI(false);
  
  // Show hero section, hide dashboard
  if (heroSection) heroSection.style.display = 'flex';
  if (dashboardSection) dashboardSection.style.display = 'none';
  
  // Clear any active timers
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  if (pendingRequestsTimer) clearInterval(pendingRequestsTimer);
  if (approvedRequestsTimer) clearInterval(approvedRequestsTimer);
  
  // Show notification
  showNotification('Logged out successfully', 'success');
  
  // Redirect to the top of the page
  window.scrollTo(0, 0);
}

// Tables
let requestsTableBody;
let pendingRequestsTable;
let approvedRequestsTable;

// Initialize table references
function initializeTables() {
    requestsTableBody = document.getElementById('requestsTableBody');
    pendingRequestsTable = document.getElementById('pendingRequestsTable');
    approvedRequestsTable = document.getElementById('approvedRequestsTable');
    console.log('Tables initialized:', {
        pendingRequestsTable: !!pendingRequestsTable,
        approvedRequestsTable: !!approvedRequestsTable
    });
}

// State
let currentUser = null;
let currentRequest = null;
let autoRefreshTimer = null;
let pendingRequestsTimer = null;
let approvedRequestsTimer = null;

// Modal functions for sign-in
function openSignInModal() { 
  if (signInModal) {
    signInModal.style.display = 'block';
    signInModal.classList.add('active');
    
    // Make sure the modal content is also activated
    const modalContent = signInModal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.classList.add('active');
    }
    
    document.body.classList.add('modal-open');
    console.log('HOD sign-in modal displayed and activated');
  } else {
    console.error('HOD sign-in modal element not found');
  }
}

function closeSignInModal() {
  if (signInModal) {
    signInModal.style.display = 'none';
    signInModal.classList.remove('active');
    
    // Also deactivate the modal content
    const modalContent = signInModal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.classList.remove('active');
    }
    
    document.body.classList.remove('modal-open');
    console.log('HOD sign-in modal hidden and deactivated');
  }
}

// Close modal when clicking outside of it
window.addEventListener('click', function(e) {
  if (e.target === signInModal) {
    closeSignInModal();
  }
});

// Close modal when escape key is pressed
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && signInModal && signInModal.classList.contains('active')) {
    closeSignInModal();
  }
});

// Ensure close button works
if (closeModalBtn) {
  closeModalBtn.onclick = closeSignInModal;
}

// Show dashboard section
function showDashboard() {
    console.log('Showing dashboard...');
    if (heroSection) heroSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
    
    // Ensure dashboard is visible
    setTimeout(() => {
        if (dashboardSection && dashboardSection.style.display !== 'block') {
            console.log('Forcing dashboard display...');
            dashboardSection.style.display = 'block';
        }
    }, 100);
}

// Update HOD Nav UI
function updateHODNavUI(isLoggedIn) {
    const loginMenuItem = document.getElementById('hodLoginMenuItem');
    const logoutMenuItem = document.getElementById('hodLogoutMenuItem');
    const changePasswordMenuItem = document.getElementById('changePasswordMenuItem');
    
    if (isLoggedIn) {
        loginMenuItem.style.display = 'none';
        logoutMenuItem.style.display = 'block';
        if (changePasswordMenuItem) {
            changePasswordMenuItem.style.display = 'block';
        }
    } else {
        loginMenuItem.style.display = 'block';
        logoutMenuItem.style.display = 'none';
        if (changePasswordMenuItem) {
            changePasswordMenuItem.style.display = 'none';
        }
    }
}

// Function to show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.color = '#fff';
        notification.style.zIndex = '9999';
        notification.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(notification);
    }
    
    // Set background color based on notification type
    if (type === 'success') {
        notification.style.backgroundColor = '#28a745';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#dc3545';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#ffc107';
        notification.style.color = '#212529';
    } else {
        notification.style.backgroundColor = '#17a2b8';
    }
    
    notification.textContent = message;
    notification.style.opacity = '1';
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Event listeners are initialized in the initializeEventListeners function

// Logout functionality is handled in the initializeEventListeners function

// Initialize event listeners
function initializeEventListeners() {
  console.log('Initializing event listeners...');
  
  // Sign in button event listeners
  if (signInBtn) {
    signInBtn.addEventListener('click', openSignInModal);
  }
  
  if (heroSignInBtn) {
    heroSignInBtn.addEventListener('click', openSignInModal);
  }
  
  // View dashboard buttons
  if (viewDashboardBtn) {
    viewDashboardBtn.addEventListener('click', function() {
      // Check if user is logged in
      const token = localStorage.getItem('hodToken');
      if (token) {
        // If logged in, show dashboard
        showDashboard();
      } else {
        // If not logged in, show notification and open login form
        showNotification('Please log in to view the dashboard', 'info');
        openSignInModal();
      }
    });
  }
  
  if (heroViewDashboardBtn) {
    heroViewDashboardBtn.addEventListener('click', function() {
      // Always open the login form when View Dashboard is clicked
      showNotification('Please log in to view the dashboard', 'info');
      openSignInModal();
    });
  }
  
  // Close modal button
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeSignInModal);
  }
  
  // Login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Logout button event listener
  if (hodLogoutBtn) {
    hodLogoutBtn.addEventListener('click', handleLogout);
  }
  
  // Change password button event listener
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', openChangePasswordModal);
  }
  
  // Change password form submission
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', handleChangePassword);
  }
  
  // Close modal buttons
  if (closeModalBtns) {
    closeModalBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const modal = this.closest('.modal');
        if (modal.id === 'signInModal') {
          closeSignInModal();
        } else if (modal.id === 'changePasswordModal') {
          closeChangePasswordModal();
        } else if (modal.id === 'requestDetailsModal') {
          closeRequestDetailsModal();
        }
      });
    });
  }
  
  // Add event listeners for dashboard control buttons
  // Refresh Dashboard button
  const refreshDashboardBtn = document.getElementById('refreshDashboardBtn');
  if (refreshDashboardBtn) {
    refreshDashboardBtn.addEventListener('click', function() {
      fetchRequests();
      showNotification('Dashboard refreshed', 'success');
    });
  }
  
  // Clear History Dropdown Toggle
  const clearHistoryDropdownBtn = document.getElementById('clearHistoryDropdownBtn');
  const clearHistoryDropdown = document.getElementById('clearHistoryDropdown');
    
    if (clearHistoryDropdownBtn && clearHistoryDropdown) {
      clearHistoryDropdownBtn.addEventListener('click', function(e) {
        e.preventDefault();
        clearHistoryDropdown.classList.toggle('show-dropdown');
      });
      
      // Close dropdown when clicking outside
      window.addEventListener('click', function(e) {
        if (!e.target.matches('#clearHistoryDropdownBtn') && !e.target.closest('#clearHistoryDropdownBtn')) {
          if (clearHistoryDropdown.classList.contains('show-dropdown')) {
            clearHistoryDropdown.classList.remove('show-dropdown');
          }
        }
      });
    }
    
    // Clear All History button
    const clearAllHistoryBtn = document.getElementById('clearAllHistoryBtn');
    if (clearAllHistoryBtn) {
      clearAllHistoryBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to clear all request history? This will permanently hide all approved and rejected requests.')) {
          // Close dropdown
          clearHistoryDropdown.classList.remove('show-dropdown');
          // Get all requests and filter out approved and rejected ones
          const token = localStorage.getItem('hodToken');
          if (!token) {
            showNotification('Authentication required', 'error');
            return;
          }
          
          fetch(`${API_URL}/requests`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              // Filter to keep only pending and forwarded requests
              const activeRequests = data.requests.filter(req => 
                req.status === 'pending' || req.status === 'forwarded'
              );
              
              if (activeRequests.length === 0) {
                showNotification('No active requests to display after clearing history.', 'info');
              } else {
                // Update the tables with only active requests
                populateRequestsTables(activeRequests, false, true);
                showNotification('Request history cleared. Showing only active requests.', 'success');
              }
            } else {
              showNotification('Failed to load requests', 'error');
            }
          })
          .catch(error => {
            console.error('Error fetching requests:', error);
            showNotification('Error fetching requests', 'error');
          });
        }
      });
    }
    
    // Clear Older Than 30 Days button
    const clearOlderThan30DaysBtn = document.getElementById('clearOlderThan30DaysBtn');
    if (clearOlderThan30DaysBtn) {
      clearOlderThan30DaysBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to clear requests older than 30 days?')) {
          // Close dropdown
          clearHistoryDropdown.classList.remove('show-dropdown');
          
          // Get all requests and filter out those older than 30 days
          const token = localStorage.getItem('hodToken');
          if (!token) {
            showNotification('Authentication required', 'error');
            return;
          }
          
          fetch(`${API_URL}/requests`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              // Calculate date 30 days ago
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              
              // Filter to keep only requests newer than 30 days or pending/forwarded
              const filteredRequests = data.requests.filter(req => {
                const requestDate = new Date(req.createdAt);
                return requestDate >= thirtyDaysAgo || req.status === 'pending' || req.status === 'forwarded';
              });
              
              // Update the tables with filtered requests
              populateRequestsTables(filteredRequests);
              showNotification('Requests older than 30 days have been cleared.', 'success');
            } else {
              showNotification('Failed to load requests', 'error');
            }
          })
          .catch(error => {
            console.error('Error fetching requests:', error);
            showNotification('Error fetching requests', 'error');
          });
        }
      });
    }
    
    // Clear Older Than 7 Days button
    const clearOlderThan7DaysBtn = document.getElementById('clearOlderThan7DaysBtn');
    if (clearOlderThan7DaysBtn) {
      clearOlderThan7DaysBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to clear requests older than 7 days?')) {
          // Close dropdown
          clearHistoryDropdown.classList.remove('show-dropdown');
          
          // Get all requests and filter out those older than 7 days
          const token = localStorage.getItem('hodToken');
          if (!token) {
            showNotification('Authentication required', 'error');
            return;
          }
          
          fetch(`${API_URL}/requests`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              // Calculate date 7 days ago
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              
              // Filter to keep only requests newer than 7 days or pending/forwarded
              const filteredRequests = data.requests.filter(req => {
                const requestDate = new Date(req.createdAt);
                return requestDate >= sevenDaysAgo || req.status === 'pending' || req.status === 'forwarded';
              });
              
              // Update the tables with filtered requests
              populateRequestsTables(filteredRequests);
              showNotification('Requests older than 7 days have been cleared.', 'success');
            } else {
              showNotification('Failed to load requests', 'error');
            }
          })
          .catch(error => {
            console.error('Error fetching requests:', error);
            showNotification('Error fetching requests', 'error');
          });
        }
      });
    }
    
    // Clear Completed Requests Only button
    const clearCompletedRequestsBtn = document.getElementById('clearCompletedRequestsBtn');
    if (clearCompletedRequestsBtn) {
      clearCompletedRequestsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to clear all completed (approved/rejected) requests?')) {
          // Close dropdown
          clearHistoryDropdown.classList.remove('show-dropdown');
          
          // Get all requests and filter out completed ones
          const token = localStorage.getItem('hodToken');
          if (!token) {
            showNotification('Authentication required', 'error');
            return;
          }
          
          fetch(`${API_URL}/requests`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              // Filter to keep only pending and forwarded requests
              const activeRequests = data.requests.filter(req => 
                req.status === 'pending' || req.status === 'forwarded'
              );
              
              // Update the tables with only active requests
              populateRequestsTables(activeRequests);
              showNotification('Completed requests have been cleared.', 'success');
            } else {
              showNotification('Failed to load requests', 'error');
            }
          })
          .catch(error => {
            console.error('Error fetching requests:', error);
            showNotification('Error fetching requests', 'error');
          });
        }
      });
    }
    
    // Priority View button
    const priorityViewBtn = document.getElementById('priorityViewBtn');
    if (priorityViewBtn) {
      priorityViewBtn.addEventListener('click', function() {
        fetchRequests(true, false);
      });
    }
    
    // Reset View button
    const resetViewBtn = document.getElementById('resetViewBtn');
    if (resetViewBtn) {
      resetViewBtn.addEventListener('click', function() {
        fetchRequests(false, false);
      });
    }
  
  // Modal functions are already set up above
  
  // Close modal when clicking outside of it
  window.addEventListener('click', function(e) {
    if (e.target === signInModal) {
      closeSignInModal();
    }
  });
  
  // Close modal when escape key is pressed
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && signInModal && signInModal.classList.contains('active')) {
      closeSignInModal();
    }
  });
  
  // Logout button
  if (hodLogoutBtn) {
    hodLogoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      handleHODLogout();
    });
  }
  
  // Setup login form submission
  setupLoginForm();
  
  // Clear Approved History button
  const clearApprovedHistoryBtn = document.getElementById('clearApprovedHistory');
  if (clearApprovedHistoryBtn) {
    clearApprovedHistoryBtn.addEventListener('click', function(e) {
      e.preventDefault();
      clearApprovedRequestsHistory();
    });
  }
}

// Setup login form submission
function setupLoginForm() {
  if (loginForm) {
    console.log('Setting up HOD login form handler');
    loginForm.onsubmit = async (e) => {
    e.preventDefault();
    console.log('HOD login form submitted');
    
    if (!loginError) {
        console.error('Login error element not found');
        return;
    }
    
    loginError.textContent = '';
    
    // Show loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (!submitBtn) {
        console.error('Submit button not found');
        return;
    }
    
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    submitBtn.disabled = true;
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    try {
        console.log('Sending HOD login request for:', email);
        
        // Make sure we're using the full API URL with the correct endpoint
        const res = await fetch('http://localhost:5001/api/hod/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        console.log('HOD login response status:', res.status);
        const data = await res.json();
        console.log('HOD login response data:', data);
        
        if (data.success) {
            console.log('HOD login successful');
            localStorage.setItem('hodToken', data.token);
            
            if (data.user) {
                localStorage.setItem('hodUser', JSON.stringify(data.user));
            }
            
            // Show success notification
            showNotification('Login successful!', 'success');
            
            // Update UI
            closeSignInModal();
            updateHODNavUI(true);
            
            // Show dashboard
            heroSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            
            // Load dashboard data
            try {
                updateUserInfo();
                loadDashboardData();
            } catch (err) {
                console.error('Error loading dashboard data:', err);
            }
        } else {
            console.log('HOD login failed:', data.message);
            loginError.textContent = data.message || 'Invalid credentials';
        }
    } catch (error) {
        console.error('HOD login error:', error);
        loginError.textContent = 'Server error. Please try again.';
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
};

// Login form is already handled by the direct onsubmit handler
// No need for additional event listeners
  }
}

// Function to generate a token for a request
async function generateTokenForRequest(requestId) {
  try {
    const token = localStorage.getItem('hodToken');
    if (!token) return false;
    
    console.log('Generating token for request:', requestId);
    
    // Call the API to generate a token
    const response = await fetch(`${API_URL}/request/${requestId}/generate-token`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Token generated successfully:', data.request.gatepassToken);
      showNotification('Gatepass token generated successfully', 'success');
      return true;
    } else {
      console.error('Failed to generate token:', data.message);
      showNotification('Failed to generate token', 'error');
      return false;
    }
  } catch (error) {
    console.error('Error generating token:', error);
    showNotification('Error generating token: ' + error.message, 'error');
    return false;
  }
}

// Function to load dashboard data
async function loadDashboardData() {
    console.log('Loading dashboard data...');
    try {
        const token = localStorage.getItem('hodToken');
        if (!token) {
            console.error('No token found for loading dashboard data');
            return;
        }
        
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`${API_URL}/requests?_=${timestamp}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Dashboard data loaded:', data);
        
        if (data.success) {
            // Update dashboard counts
            updateDashboardCounts(data.requests);
            
            // Add dashboard control buttons if they don't exist
            addDashboardControlButtons();
            
            // Populate tables
            populateRequestsTables(data.requests);
        } else {
            console.error('Failed to load dashboard data:', data.message);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Function to add dashboard control buttons
function addDashboardControlButtons() {
    // Check if control buttons container already exists
    let controlsContainer = document.querySelector('.dashboard-controls');
    
    if (!controlsContainer) {
        // Create controls container
        controlsContainer = document.createElement('div');
        controlsContainer.className = 'dashboard-controls';
        
        // Add styles for the controls
        const style = document.createElement('style');
        style.textContent = `
            .dashboard-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            .control-btn {
                padding: 8px 15px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 5px;
                transition: all 0.3s ease;
            }
            .priority-btn {
                background-color: #17a2b8;
                color: white;
                border: none;
            }
            .priority-btn:hover {
                background-color: #138496;
            }
            .clear-btn {
                background-color: #dc3545;
                color: white;
                border: none;
            }
            .clear-btn:hover {
                background-color: #c82333;
            }
            .reset-btn {
                background-color: #6c757d;
                color: white;
                border: none;
            }
            .reset-btn:hover {
                background-color: #5a6268;
            }
            .priority-view-container {
                margin-bottom: 20px;
                border: 1px solid #ddd;
                border-radius: 5px;
                overflow: hidden;
            }
            .priority-view-header {
                background-color: #f8f9fa;
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
            }
            .priority-view-header h3 {
                margin: 0;
                color: #333;
            }
            .priority-view-header p {
                margin: 5px 0 0;
                color: #6c757d;
            }
            .status-pending-row {
                background-color: rgba(255, 193, 7, 0.1);
            }
            .status-forwarded-row {
                background-color: rgba(23, 162, 184, 0.1);
            }
            .status-approved-row {
                background-color: rgba(40, 167, 69, 0.1);
            }
            .status-rejected-row {
                background-color: rgba(220, 53, 69, 0.1);
            }
        `;
        document.head.appendChild(style);
        
        // Create priority view button
        const priorityViewBtn = document.createElement('button');
        priorityViewBtn.className = 'control-btn priority-btn';
        priorityViewBtn.innerHTML = '<i class="fas fa-sort"></i> Priority View';
        priorityViewBtn.addEventListener('click', () => {
            fetchRequests(true, false);
        });
        
        // Create clear history button
        const clearHistoryBtn = document.createElement('button');
        clearHistoryBtn.className = 'control-btn clear-btn';
        clearHistoryBtn.innerHTML = '<i class="fas fa-broom"></i> Clear History';
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear request history? This will hide all approved and rejected requests.')) {
                fetchRequests(false, true);
            }
        });
        
        // Create reset view button
        const resetViewBtn = document.createElement('button');
        resetViewBtn.className = 'control-btn reset-btn';
        resetViewBtn.innerHTML = '<i class="fas fa-undo"></i> Reset View';
        resetViewBtn.addEventListener('click', () => {
            fetchRequests();
        });
        
        // Add buttons to container
        controlsContainer.appendChild(priorityViewBtn);
        controlsContainer.appendChild(clearHistoryBtn);
        controlsContainer.appendChild(resetViewBtn);
        
        // Add container to dashboard
        const dashboardHeader = document.querySelector('.dashboard-header');
        if (dashboardHeader) {
            dashboardHeader.appendChild(controlsContainer);
        } else {
            const dashboardContent = document.querySelector('.dashboard-content');
            if (dashboardContent) {
                dashboardContent.insertBefore(controlsContainer, dashboardContent.firstChild);
            }
        }
    }
}

// Function to update user info in the dashboard
function updateUserInfo() {
    console.log('Updating user info...');
    try {
        const userData = JSON.parse(localStorage.getItem('hodUser') || '{}');
        const userNameElement = document.getElementById('userName');
        
        if (userNameElement && userData.name) {
            userNameElement.textContent = userData.name;
        }
        
        // Update other user-related elements if needed
        const userRoleElement = document.getElementById('userRole');
        if (userRoleElement) {
            userRoleElement.textContent = userData.role || 'HOD';
        }
        
        console.log('User info updated successfully');
    } catch (error) {
        console.error('Error updating user info:', error);
    }
}

function updateDashboardCounts(requests) {
    if (!requests) return;
    
    // Count requests by status
    const pendingCount = requests.filter(req => req.status === 'pending').length;
    const approvedCount = requests.filter(req => req.status === 'approved').length;
    const rejectedCount = requests.filter(req => req.status === 'rejected').length;
    const forwardedCount = requests.filter(req => req.status === 'forwarded').length;
    const totalCount = requests.length;
    
    // Update counts in the UI
    const pendingCountElement = document.getElementById('pendingCount');
    const approvedCountElement = document.getElementById('approvedCount');
    const rejectedCountElement = document.getElementById('rejectedCount');
    const forwardedCountElement = document.getElementById('forwardedCount');
    const totalCountElement = document.getElementById('totalCount');
    
    if (pendingCountElement) pendingCountElement.textContent = pendingCount;
    if (approvedCountElement) approvedCountElement.textContent = approvedCount;
    if (rejectedCountElement) rejectedCountElement.textContent = rejectedCount;
    if (forwardedCountElement) forwardedCountElement.textContent = forwardedCount;
    if (totalCountElement) totalCountElement.textContent = totalCount;
    
    // Update stat cards
    const pendingRequestsCountElement = document.getElementById('pendingRequestsCount');
    const approvedPassesCountElement = document.getElementById('approvedPassesCount');
    const totalRequestsCountElement = document.getElementById('totalRequestsCount');
    
    if (pendingRequestsCountElement) pendingRequestsCountElement.textContent = pendingCount + forwardedCount;
    if (approvedPassesCountElement) approvedPassesCountElement.textContent = approvedCount;
    if (totalRequestsCountElement) totalRequestsCountElement.textContent = totalCount;
}

// Function to populate requests tables
function populateRequestsTables(requests, priorityView = false, clearHistory = false) {
    console.log('Populating requests tables...');
    try {
        if (!Array.isArray(requests)) {
            console.error('Invalid requests data for populating tables');
            return;
        }
        
        // Filter requests by status
        let pendingRequests = requests.filter(req => req.status === 'pending');
        let forwardedRequests = requests.filter(req => req.status === 'forwarded');
        let approvedRequests = requests.filter(req => req.status === 'approved');
        let rejectedRequests = requests.filter(req => req.status === 'rejected');
        
        // If clear history is enabled, hide approved and rejected requests
        if (clearHistory) {
            approvedRequests = [];
            rejectedRequests = [];
            showNotification('History cleared. Showing only active requests.', 'success');
        }
        
        // If priority view is enabled, show a combined view with pending first
        if (priorityView) {
            // Create a priority-sorted array of all requests
            const priorityRequests = [
                ...pendingRequests,
                ...forwardedRequests,
                ...approvedRequests,
                ...rejectedRequests
            ];
            
            // Add a priority view section at the top of the dashboard
            const dashboardContent = document.querySelector('.dashboard-content');
            const existingPriorityView = document.getElementById('priorityViewContainer');
            
            if (existingPriorityView) {
                existingPriorityView.remove();
            }
            
            const priorityViewContainer = document.createElement('div');
            priorityViewContainer.id = 'priorityViewContainer';
            priorityViewContainer.className = 'priority-view-container';
            
            const priorityViewHeader = document.createElement('div');
            priorityViewHeader.className = 'priority-view-header';
            priorityViewHeader.innerHTML = `
                <h3><i class="fas fa-sort"></i> Priority View</h3>
                <p>Showing requests in priority order: Pending → Forwarded → Approved → Rejected</p>
                <button id="exitPriorityViewBtn" class="btn-secondary"><i class="fas fa-times"></i> Exit Priority View</button>
            `;
            
            priorityViewContainer.appendChild(priorityViewHeader);
            
            // Create the priority table
            const priorityTable = document.createElement('table');
            priorityTable.className = 'data-table';
            priorityTable.innerHTML = `
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>Enrollment</th>
                        <th>Department</th>
                        <th>Ticket ID</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${priorityRequests.map((req, index) => {
                        // Use the centralized function to generate a consistent ticket ID
                        const displayTicketId = window.generateTicketId ? window.generateTicketId(req) : (req.ticketId || `GP-${req._id ? req._id.substring(0, 8) : ''}`.toUpperCase());
                        
                        // Determine status badge class
                        let statusBadgeClass = '';
                        switch(req.status) {
                            case 'pending': statusBadgeClass = 'status-pending'; break;
                            case 'forwarded': statusBadgeClass = 'status-forwarded'; break;
                            case 'approved': statusBadgeClass = 'status-approved'; break;
                            case 'rejected': statusBadgeClass = 'status-rejected'; break;
                        }
                        
                        // Determine action buttons based on status
                        let actionButtons = '';
                        if (req.status === 'pending' || req.status === 'forwarded') {
                            actionButtons = `
                                <button class="btn-approve" data-request-id="${req._id}">Approve</button>
                                <button class="btn-reject" data-request-id="${req._id}">Reject</button>
                            `;
                        } else {
                            actionButtons = `<span>No actions available</span>`;
                        }
                        
                        return `
                        <tr class="${statusBadgeClass}-row">
                            <td>${index + 1}</td>
                            <td>${req.student?.name || 'N/A'}</td>
                            <td>${req.student?.enrollmentNumber || 'N/A'}</td>
                            <td>${req.student?.department || 'N/A'}</td>
                            <td><span style="color: #007bff; font-weight: bold;"><i class="fas fa-ticket-alt"></i> ${displayTicketId}</span></td>
                            <td>${req.reason || 'N/A'}</td>
                            <td><span class="status-badge ${statusBadgeClass}">${req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span></td>
                            <td>${actionButtons}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            `;
            
            priorityViewContainer.appendChild(priorityTable);
            
            // Hide the regular tables
            const tablesContainer = document.querySelector('.tables-container');
            if (tablesContainer) {
                tablesContainer.style.display = 'none';
            }
            
            // Insert the priority view before the tables container
            dashboardContent.insertBefore(priorityViewContainer, tablesContainer);
            
            // Add event listener to exit priority view button
            document.getElementById('exitPriorityViewBtn').addEventListener('click', () => {
                priorityViewContainer.remove();
                if (tablesContainer) {
                    tablesContainer.style.display = 'block';
                }
                showNotification('Exited priority view.', 'info');
            });
            
            // Add event listeners for action buttons in priority view
            const approveButtons = priorityViewContainer.querySelectorAll('.btn-approve');
            approveButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const requestId = this.getAttribute('data-request-id');
                    approveRequest(requestId);
                });
            });
            
            const rejectButtons = priorityViewContainer.querySelectorAll('.btn-reject');
            rejectButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const requestId = this.getAttribute('data-request-id');
                    rejectRequest(requestId);
                });
            });
            
            showNotification('Showing requests in priority order.', 'info');
            return; // Exit early since we're showing the priority view
        }
        
        // Continue with normal view if not in priority mode
        
        // Populate pending requests table
        if (pendingRequestsTable) {
            const pendingTableBody = pendingRequestsTable.querySelector('tbody') || pendingRequestsTable;
            
            if (pendingTableBody) {
                pendingTableBody.innerHTML = pendingRequests.length > 0 ? 
                    pendingRequests.map((req, index) => {
                        // Use the centralized function to generate a consistent ticket ID
                        const displayTicketId = window.generateTicketId ? window.generateTicketId(req) : (req.ticketId || `GP-${req._id ? req._id.substring(0, 8) : ''}`.toUpperCase());
                        
                        return `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${req.student?.name || 'N/A'}</td>
                            <td>${req.student?.enrollmentNumber || 'N/A'}</td>
                            <td>${req.student?.department || 'N/A'}</td>
                            <td><span style="color: #007bff; font-weight: bold;"><i class="fas fa-ticket-alt"></i> ${displayTicketId}</span></td>
                            <td>${req.reason || 'N/A'}</td>
                            <td>${new Date(req.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-sm btn-primary view-btn" data-id="${req._id}">View</button>
                            </td>
                        </tr>
                        `;
                    }).join('') : 
                    '<tr><td colspan="8" class="text-center">No pending requests</td></tr>';
            }
        }
        
        // Populate approved requests table
        if (approvedRequestsTable) {
            const approvedTableBody = approvedRequestsTable.querySelector('tbody') || approvedRequestsTable;
            
            if (approvedTableBody) {
                approvedTableBody.innerHTML = approvedRequests.length > 0 ? 
                    approvedRequests.map((req, index) => {
                        // Use the centralized function to generate a consistent ticket ID
                        const displayTicketId = window.generateTicketId ? window.generateTicketId(req) : (req.ticketId || `GP-${req._id ? req._id.substring(0, 8) : ''}`.toUpperCase());
                        
                        return `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${req.student?.name || 'N/A'}</td>
                            <td>${req.student?.enrollmentNumber || 'N/A'}</td>
                            <td>${req.student?.department || 'N/A'}</td>
                            <td><span style="color: #007bff; font-weight: bold;"><i class="fas fa-ticket-alt"></i> ${displayTicketId}</span></td>
                            <td>${req.reason || 'N/A'}</td>
                            <td>${new Date(req.updatedAt).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-sm btn-primary view-btn" data-id="${req._id}">View</button>
                            </td>
                        </tr>
                        `;
                    }).join('') : 
                    '<tr><td colspan="8" class="text-center">No approved requests</td></tr>';
            }
        }
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const requestId = btn.getAttribute('data-id');
                if (requestId) {
                    viewRequestDetails(requestId);
                }
            });
        });
        
        console.log('Requests tables populated successfully');
    } catch (error) {
        console.error('Error populating requests tables:', error);
    }
}

// Function to view request details
async function viewRequestDetails(requestId) {
    console.log('Viewing request details for ID:', requestId);
    try {
        const token = localStorage.getItem('hodToken');
        if (!token) {
            console.error('No token found for viewing request details');
            return;
        }
        
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`${API_URL}/request/${requestId}?_=${timestamp}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Request details loaded:', data);
        
        if (data.success && data.request) {
            // Generate token if this is an approved request and doesn't have a token yet
            if (data.request.status === 'approved' && !data.request.gatepassToken) {
                await generateTokenForRequest(data.request._id);
                
                // Refresh the request data to get the token
                const refreshResponse = await fetch(`${API_URL}/request/${requestId}?_=${new Date().getTime()}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
                    }
                });
                
                if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    if (refreshData.success && refreshData.request) {
                        data.request = refreshData.request;
                    }
                }
            }
            
            // Show request details in modal
            showRequestDetailsModal(data.request);
            
            // If this is an approved request with a token, show the token section
            if (data.request.status === 'approved' && data.request.gatepassToken) {
                const tokenGenerationSection = document.getElementById('tokenGenerationSection');
                const gatepassTokenElement = document.getElementById('gatepassToken');
                
                if (tokenGenerationSection) {
                    tokenGenerationSection.style.display = 'block';
                }
                
                if (gatepassTokenElement) {
                    gatepassTokenElement.textContent = data.request.gatepassToken;
                }
            }
        } else {
            console.error('Failed to load request details:', data.message);
            showNotification('Failed to load request details', 'error');
        }
    } catch (error) {
        console.error('Error viewing request details:', error);
        showNotification('Error loading request details', 'error');
    }
}

// Function to show request details modal
function showRequestDetailsModal(request) {
    console.log('Showing request details modal for:', request);
    try {
        // Check if modal exists
        if (!requestDetailsModal) {
            console.error('Request details modal not found');
            return;
        }
        
        // Reset token section
        const tokenGenerationSection = document.getElementById('tokenGenerationSection');
        if (tokenGenerationSection) {
            tokenGenerationSection.style.display = 'none';
        }
        
        // If this is an approved request with a token, show the token section
        if (request.status === 'approved' && request.gatepassToken) {
            if (tokenGenerationSection) {
                tokenGenerationSection.style.display = 'block';
            }
            
            const gatepassTokenElement = document.getElementById('gatepassToken');
            if (gatepassTokenElement) {
                gatepassTokenElement.textContent = request.gatepassToken;
            }
        }
        
        // Set current request
        currentRequest = request;
        
        // Populate modal with request details
        const studentName = document.getElementById('detailsStudentName');
        const enrollmentNumber = document.getElementById('detailsEnrollmentNumber');
        const department = document.getElementById('detailsDepartment');
        const reason = document.getElementById('detailsReason');
        const status = document.getElementById('detailsStatus');
        const createdAt = document.getElementById('detailsCreatedAt');
        
        if (studentName) studentName.textContent = request.student?.name || 'N/A';
        if (enrollmentNumber) enrollmentNumber.textContent = request.student?.enrollmentNumber || 'N/A';
        if (department) department.textContent = request.student?.department || 'N/A';
        if (reason) reason.textContent = request.reason || 'N/A';
        if (status) status.textContent = request.status || 'N/A';
        if (createdAt) createdAt.textContent = new Date(request.createdAt).toLocaleString() || 'N/A';
        
        // Show/hide action buttons based on status
        const approveBtn = document.getElementById('approveBtn');
        const rejectBtn = document.getElementById('rejectBtn');
        
        if (approveBtn && rejectBtn) {
            if (request.status === 'pending') {
                approveBtn.style.display = 'inline-block';
                rejectBtn.style.display = 'inline-block';
            } else {
                approveBtn.style.display = 'none';
                rejectBtn.style.display = 'none';
            }
        }
        
        // Show modal
        requestDetailsModal.style.display = 'block';
        
        console.log('Request details modal shown successfully');
    } catch (error) {
        console.error('Error showing request details modal:', error);
    }
}

// Check for existing token
async function checkExistingToken() {
    console.log('Checking for existing HOD token...');
    const token = localStorage.getItem('hodToken');
    const user = JSON.parse(localStorage.getItem('hodUser') || '{}');
    
    if (token && user.id) {
        console.log('HOD token found, showing dashboard');
        // Show dashboard immediately without waiting for verification
        updateHODNavUI(true);
        showDashboard();
        loadDashboardData();
        
        // Verify token in background but don't log out on failure
        // This prevents logout on page refresh
        try {
            await verifyToken(token);
        } catch (error) {
            console.error('Token verification failed:', error);
            // Don't log out, just show a warning
            showNotification('Connection issue. Some features may be limited.', 'warning');
        }
    } else {
        console.log('No HOD token found');
        updateHODNavUI(false);
        // Make sure dashboard is hidden and hero section is shown
        if (heroSection) heroSection.style.display = 'flex';
        if (dashboardSection) dashboardSection.style.display = 'none';
    }
}

// Verify token and get user data
async function verifyToken(token) {
    try {
        console.log('Verifying token with API...');
        const response = await fetch('http://localhost:5001/api/hod/verify', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
        
        if (!response.ok) {
            console.error('Token verification API error:', response.status);
            return false;
        }
        
        const data = await response.json();
        console.log('Token verification response:', data);
        
        if (data.success) {
            currentUser = data.user;
            // Save user data to localStorage for persistence across refreshes
            localStorage.setItem('hodUser', JSON.stringify(data.user));
            // Just update the user info, don't trigger other actions here
            // to prevent duplicate calls
            updateUserInfo();
            return true;
        } else {
            console.error('Token verification failed:', data.message);
            return false;
        }
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

// Update user information in the UI
function updateUserInfo() {
    // Use currentUser if available, otherwise try to get from sessionStorage
    const userData = currentUser || JSON.parse(sessionStorage.getItem('hodUserData') || '{}');
    
    if (userData && userData.name) {
        // Update elements with user information if they exist
        const userNameElement = document.getElementById('userName');
        if (userNameElement) userNameElement.textContent = userData.name;
        
        const profileNameElement = document.getElementById('profileName');
        if (profileNameElement) profileNameElement.textContent = userData.name;
        
        const profileFullNameElement = document.getElementById('profileFullName');
        if (profileFullNameElement) profileFullNameElement.textContent = userData.name;
        
        const profileEmailElement = document.getElementById('profileEmail');
        if (profileEmailElement) profileEmailElement.textContent = userData.email;
        
        const profileEmailDetailElement = document.getElementById('profileEmailDetail');
        if (profileEmailDetailElement) profileEmailDetailElement.textContent = userData.email;
        
        const profileStatusElement = document.getElementById('profileStatus');
        if (profileStatusElement) profileStatusElement.textContent = userData.status || 'Active';
        
        // Also update any elements with class names for flexibility
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = userData.name;
        });
        
        const userEmailElements = document.querySelectorAll('.user-email');
        userEmailElements.forEach(el => {
            el.textContent = userData.email;
        });
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('hodToken');
        if (!token) {
            console.error('No token found');
            showNotification('Please sign in to view dashboard data', 'warning');
            return;
        }

        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        
        console.log('Fetching dashboard data...');
        
        // Fetch all requests for the HOD
        const response = await fetch(`${API_URL}/requests?_=${timestamp}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
        
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', response.status, errorText);
            
            if (response.status === 401) {
                // Token might be invalid or expired
                localStorage.removeItem('hodToken');
                showNotification('Your session has expired. Please sign in again.', 'error');
                return;
            }
            
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        
        if (data.success) {
            // Filter out any cleared requests from localStorage
            const clearedRequests = JSON.parse(localStorage.getItem('hodClearedRequests') || '[]');
            const filteredRequests = data.requests.filter(req => !clearedRequests.includes(req._id));
            
            console.log('Filtered requests:', filteredRequests.length);
            
            // Update dashboard stats with filtered requests
            updateDashboardStats(filteredRequests);
            updateDashboardCounts(filteredRequests);
            
            // Update pending requests table
            const pendingRequests = filteredRequests.filter(req => req.status === 'forwarded' || req.status === 'pending');
            console.log('Pending requests:', pendingRequests.length);
            updatePendingRequestsTable(pendingRequests);
            
            // Update approved requests table
            const approvedRequests = filteredRequests.filter(req => req.status === 'approved');
            console.log('Approved requests:', approvedRequests.length);
            updateApprovedRequestsTable(approvedRequests);
            
            // Start auto-refresh for real-time updates if not already started
            if (!autoRefreshTimer) {
                startAutoRefresh();
            }
            
            showNotification('Dashboard data loaded successfully', 'success');
        } else {
            console.error('API returned success: false', data);
            showNotification(data.message || 'Failed to load dashboard data', 'error');
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Silently log errors without showing notification popups
        // showNotification('Failed to load dashboard data: ' + error.message, 'error');
    }
}

// Fetch pending requests specifically
async function fetchPendingRequests() {
    try {
        const token = localStorage.getItem('hodToken');
        if (!token) return [];

        // Fetch all requests for the HOD
        const response = await fetch(`${API_URL}/requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Check if the response is valid
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        // Parse the response data
        const data = await response.json();
        
        // Handle the new response format
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch requests');
        }
        
        // Filter for only forwarded (pending) requests
        const pendingRequests = Array.isArray(data.requests) 
            ? data.requests.filter(req => req.status === 'forwarded')
            : [];
        
        // Update the pending requests table
        updatePendingRequestsTable(pendingRequests);
        
        // Show notification if no pending requests are found
        if (pendingRequests.length === 0) {
            showNotification('No pending requests found', 'info');
        }
        
        return pendingRequests;
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        showNotification('Error fetching pending requests: ' + error.message, 'error');
        return [];
    }
}

// Update dashboard statistics
function updateDashboardStats(requests) {
    const pendingCount = document.getElementById('pendingCount');
    const approvedCount = document.getElementById('approvedCount');
    const rejectedCount = document.getElementById('rejectedCount');
    const totalCount = document.getElementById('totalCount');
    
    if (pendingCount && approvedCount && rejectedCount && totalCount) {
        const pending = requests.filter(req => req.status === 'forwarded').length;
        const approved = requests.filter(req => req.status === 'approved').length;
        const rejected = requests.filter(req => req.status === 'rejected').length;
        
        pendingCount.textContent = pending;
        approvedCount.textContent = approved;
        rejectedCount.textContent = rejected;
        totalCount.textContent = requests.length;
    }
}

// Update requests table with all requests
function updateRequestsTable(requests) {
    if (!requestsTableBody) return;
    
    requestsTableBody.innerHTML = '';
    
    if (requests.length === 0) {
        requestsTableBody.innerHTML = `<tr><td colspan="6">No requests found</td></tr>`;
        return;
    }
    
    // Sort by date, newest first
    const sortedRequests = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Take the most recent 10 requests
    const recentRequests = sortedRequests.slice(0, 10);
    
    recentRequests.forEach(request => {
        const row = document.createElement('tr');
        
        // Handle different response formats
        const studentName = request.student?.fullName || request.student?.name || 'N/A';
        const studentDept = request.student?.department || 'N/A';
        const enrollmentNum = request.student?.enrollmentNumber || 'N/A';
        const requestReason = request.reason || 'N/A';
        
        row.innerHTML = `
            <td>${studentName}</td>
            <td>${studentDept}</td>
            <td>${enrollmentNum}</td>
            <td>${requestReason}</td>
            <td><span class="status-badge ${request.status}">${request.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-request" data-id="${request._id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;
        requestsTableBody.appendChild(row);
    });
}

// Update pending requests table
function updatePendingRequestsTable(requests) {
    if (!pendingRequestsTable) return;
    
    pendingRequestsTable.innerHTML = '';
    
    if (requests.length === 0) {
        pendingRequestsTable.innerHTML = `<tr><td colspan="6">No pending requests found</td></tr>`;
        return;
    }
    
    requests.forEach(request => {
        const row = document.createElement('tr');
        
        // Handle different response formats - check if student is populated object or just an ID
        const studentName = request.student?.fullName || request.student?.name || '';
        const studentDept = request.student?.department || '';
        const enrollmentNum = request.student?.enrollmentNumber || '';
        const requestReason = request.reason || '';
        
        // Format the request time
        const requestTime = request.createdAt ? 
            new Date(request.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
            '';
        
        row.innerHTML = `
            <td>${studentName}</td>
            <td>${enrollmentNum}</td>
            <td>${requestReason}</td>
            <td>${requestTime}</td>
            <td><span class="status-badge forwarded">Pending</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-request" data-id="${request._id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn approve" onclick="approveRequest('${request._id}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="action-btn reject" onclick="rejectRequest('${request._id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        `;
        pendingRequestsTable.appendChild(row);
    });
}

// Update approved requests table
function updateApprovedRequestsTable(requests) {
    if (!approvedRequestsTable) return;
    
    approvedRequestsTable.innerHTML = '';
    
    if (requests.length === 0) {
        approvedRequestsTable.innerHTML = `<tr><td colspan="7">No approved requests found</td></tr>`;
        return;
    }
    
    requests.forEach(request => {
        const row = document.createElement('tr');
        
        // Handle different response formats
        const studentName = request.student?.fullName || request.student?.name || 'N/A';
        const studentDept = request.student?.department || 'N/A';
        const enrollmentNum = request.student?.enrollmentNumber || 'N/A';
        const requestReason = request.reason || 'N/A';
        
        // Use the same ticket ID format as the TG dashboard
        const displayTicketId = window.generateTicketId ? window.generateTicketId(request) : 
            (request.ticketId || `GP-${request._id ? request._id.substring(0, 8) : ''}`.toUpperCase() || request.gatepassToken || 'Not Generated');
        
        // Format the date - use approvedAt if available, otherwise use updatedAt
        const approvedDate = request.approvedAt ? 
            new Date(request.approvedAt).toLocaleDateString() : 
            new Date(request.updatedAt || Date.now()).toLocaleDateString();
            
        // Format the time - use approvedAt if available, otherwise use updatedAt
        const approvedTime = request.approvedAt ? 
            new Date(request.approvedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
            new Date(request.updatedAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        row.innerHTML = `
            <td>${studentName}</td>
            <td>${enrollmentNum}</td>
            <td>${requestReason}</td>
            <td><span class="status-badge approved">Approved</span></td>
            <td><span class="token-id" style="font-weight: bold; color: #007bff;"><i class="fas fa-ticket-alt"></i> ${displayTicketId}</span></td>
            <td>${approvedDate}</td>
            <td>${approvedTime}</td>
        `;
        approvedRequestsTable.appendChild(row);
    });
}

// Current request is already declared at the top of the file

// Show request details
async function showRequestDetails(requestId) {
    try {
        const token = localStorage.getItem('hodToken');
        if (!token) return;

        // Reset token generation section
        const tokenGenerationSection = document.getElementById('tokenGenerationSection');
        if (tokenGenerationSection) {
            tokenGenerationSection.style.display = 'none';
        }
        
        const gatepassTokenElement = document.getElementById('gatepassToken');
        if (gatepassTokenElement) {
            gatepassTokenElement.textContent = '------';
        }

        // Show loading state
        document.getElementById('detailStudentName').textContent = 'Loading...';
        document.getElementById('detailDepartment').textContent = 'Loading...';
        document.getElementById('detailEnrollment').textContent = 'Loading...';
        document.getElementById('detailReason').textContent = 'Loading...';
        document.getElementById('detailDate').textContent = 'Loading...';
        document.getElementById('detailStatus').textContent = 'Loading...';

        // Fetch request details
        const response = await fetch(`${API_URL}/request/${requestId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        currentRequest = data.request;

        // Update modal with request details
        document.getElementById('detailStudentName').textContent = currentRequest.student?.name || 'N/A';
        document.getElementById('detailDepartment').textContent = currentRequest.student?.department || 'N/A';
        document.getElementById('detailEnrollment').textContent = currentRequest.student?.enrollmentNumber || 'N/A';
        document.getElementById('detailReason').textContent = currentRequest.reason || 'N/A';
        document.getElementById('detailDate').textContent = new Date(currentRequest.createdAt).toLocaleString() || 'N/A';
        document.getElementById('detailStatus').textContent = currentRequest.status.toUpperCase() || 'N/A';

        // Show/hide action buttons based on status
        const approveBtn = document.getElementById('approveRequestBtn');
        const rejectBtn = document.getElementById('rejectRequestBtn');
        
        if (currentRequest.status === 'forwarded') {
            approveBtn.style.display = 'inline-block';
            rejectBtn.style.display = 'inline-block';
        } else {
            approveBtn.style.display = 'none';
            rejectBtn.style.display = 'none';
        }

        // Show modal
        const requestDetailsModal = document.getElementById('requestDetailsModal');
        if (requestDetailsModal) {
            requestDetailsModal.classList.add('active');
        }
    } catch (error) {
        console.error('Error fetching request details:', error);
        showNotification('Error fetching request details: ' + error.message, 'error');
    }
}

// Handle request approval
async function approveRequest(requestId) {
    try {
        const token = localStorage.getItem('hodToken');
        if (!token) return;
        
        // Show token generation section
        const tokenGenerationSection = document.getElementById('tokenGenerationSection');
        if (tokenGenerationSection) {
            tokenGenerationSection.style.display = 'block';
        }
        
        // Display loading state for token
        const gatepassTokenElement = document.getElementById('gatepassToken');
        if (gatepassTokenElement) {
            gatepassTokenElement.textContent = 'Generating...';
        }

        // Approve the request and generate token
        const response = await fetch(`${API_URL}/request/${requestId}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Display the generated token
        if (gatepassTokenElement && data.request && data.request.gatepassToken) {
            gatepassTokenElement.textContent = data.request.gatepassToken;
        }
        
        showNotification('Request approved successfully with token', 'success');
        
        // Don't close the modal immediately so user can see the token
        // Instead, update the approve button to say "Close"
        const approveBtn = document.getElementById('approveRequestBtn');
        const rejectBtn = document.getElementById('rejectRequestBtn');
        
        if (approveBtn) {
            approveBtn.innerHTML = '<i class="fas fa-check"></i> Close';
            approveBtn.classList.remove('btn-success');
            approveBtn.classList.add('btn-primary');
            approveBtn.onclick = function() {
                closeModal(requestDetailsModal);
                loadDashboardData(); // Refresh the dashboard data
            };
        }
        
        if (rejectBtn) {
            rejectBtn.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error approving request:', error);
        showNotification('Error approving request: ' + error.message, 'error');
        
        // Hide token section on error
        const tokenGenerationSection = document.getElementById('tokenGenerationSection');
        if (tokenGenerationSection) {
            tokenGenerationSection.style.display = 'none';
        }
    }
}

// Handle request rejection
async function rejectRequest(requestId) {
    try {
        const token = localStorage.getItem('hodToken');
        if (!token) return;

        const response = await fetch(`${API_URL}/request/${requestId}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        showNotification('Request rejected successfully');
        closeModal(requestDetailsModal);
        
        // Refresh the dashboard data to show the updated status
        await loadDashboardData();
    } catch (error) {
        console.error('Error rejecting request:', error);
        showNotification('Error rejecting request: ' + error.message, 'error');
    }
}

// Show request details
async function showRequestDetails(requestId) {
    try {
        const token = localStorage.getItem('hodToken');
        if (!token) return;

        const response = await fetch(`${API_URL}/request/${requestId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const request = await response.json();
        
        // Check if we got a valid request object
        if (request && request._id) {
            currentRequest = request;
            updateRequestDetailsModal(request);
            openModal(requestDetailsModal);
        } else {
            showNotification('Error loading request details: Invalid response', 'error');
        }
    } catch (error) {
        console.error('Error showing request details:', error);
        showNotification('Error loading request details', 'error');
    }
}

// Update request details modal
function updateRequestDetailsModal(request) {
    // Handle different response formats
    const studentName = request.student?.fullName || request.student?.name || 'N/A';
    const studentDept = request.student?.department || 'N/A';
    const enrollmentNum = request.student?.enrollmentNumber || 'N/A';
    const requestReason = request.reason || 'N/A';
    const requestDate = new Date(request.createdAt || Date.now()).toLocaleDateString();
    
    document.getElementById('detailStudentName').textContent = studentName;
    document.getElementById('detailDepartment').textContent = studentDept;
    document.getElementById('detailEnrollment').textContent = enrollmentNum;
    document.getElementById('detailReason').textContent = requestReason;
    document.getElementById('detailDate').textContent = requestDate;
    document.getElementById('detailStatus').textContent = request.status;

    // Show/hide action buttons based on request status
    const actionButtons = document.querySelector('.action-buttons');
    if (request.status === 'forwarded') {
        actionButtons.style.display = 'flex';
    } else {
        actionButtons.style.display = 'none';
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('hodToken');
    window.location.href = 'index.html';
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    // Add animation class
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Modal functions for other modals
function openModal(modal) {
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
}

function closeModal(modal) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
}

// Event Listeners for tab navigation
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Add event listener for modal close buttons
closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        closeModal(modal);
    });
});

// Request action buttons
document.addEventListener('click', async (e) => {
    // View request details
    if (e.target.closest('.view-request')) {
        const requestId = e.target.closest('.view-request').dataset.id;
        await showRequestDetails(requestId);
    }
    
    // Approve request
    if (e.target.closest('#approveRequestBtn')) {
        if (currentRequest) {
            await approveRequest(currentRequest._id);
        }
    }
    
    // Reject request
    if (e.target.closest('#rejectRequestBtn')) {
        if (currentRequest) {
            await rejectRequest(currentRequest._id);
        }
    }
});

// Search functionality has been removed as requested

// Department filter functionality has been removed as requested

// Handle change password form submission
if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate passwords
        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }
        
        try {
            const token = localStorage.getItem('hodToken');
            if (!token) return;
            
            const response = await fetch(`${API_URL}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Password changed successfully');
                closeModal(changePasswordModal);
                // Clear form
                changePasswordForm.reset();
            } else {
                showNotification(data.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showNotification('Error changing password', 'error');
        }
    });
}

// Add event listener for change password button
if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
        openModal(changePasswordModal);
    });
}

// Refresh functions for each table section
function refreshRecentRequests() {
    const refreshBtn = document.getElementById('refreshRecentRequests');
    if (refreshBtn) {
        refreshBtn.classList.add('rotating');
        
        // Get the token and fetch the latest data
        const token = localStorage.getItem('hodToken');
        if (!token) {
            refreshBtn.classList.remove('rotating');
            return;
        }
        
        fetch(`${API_URL}/requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update only the recent requests table
                updateRequestsTable(data.requests);
                showNotification('Recent requests refreshed successfully');
            } else {
                showNotification('Failed to refresh recent requests', 'error');
            }
        })
        .catch(error => {
            console.error('Error refreshing recent requests:', error);
            showNotification('Error refreshing recent requests', 'error');
        })
        .finally(() => {
            refreshBtn.classList.remove('rotating');
        });
    }
}

function refreshPendingRequests() {
    const refreshBtn = document.getElementById('refreshPendingRequests');
    if (refreshBtn) {
        refreshBtn.classList.add('rotating');
        
        // Use the dedicated function to fetch pending requests
        fetchPendingRequests()
            .then(requests => {
                if (requests) {
                    showNotification('Pending requests refreshed successfully');
                } else {
                    showNotification('No pending requests found');
                }
            })
            .catch(error => {
                console.error('Error refreshing pending requests:', error);
                showNotification('Error refreshing pending requests', 'error');
            })
            .finally(() => {
                refreshBtn.classList.remove('rotating');
            });
    }
}

function refreshApprovedRequests() {
    const refreshBtn = document.getElementById('refreshApprovedRequests');
    if (refreshBtn) {
        refreshBtn.classList.add('rotating');
        
        // Get the token and fetch the latest data
        const token = localStorage.getItem('hodToken');
        if (!token) {
            refreshBtn.classList.remove('rotating');
            return;
        }
        
        fetch(`${API_URL}/requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update only the approved requests table
                updateApprovedRequestsTable(data.requests.filter(req => req.status === 'approved'));
                showNotification('Approved requests refreshed successfully');
            } else {
                showNotification('Failed to refresh approved requests', 'error');
            }
        })
        .catch(error => {
            console.error('Error refreshing approved requests:', error);
            showNotification('Error refreshing approved requests', 'error');
        })
        .finally(() => {
            refreshBtn.classList.remove('rotating');
        });
    }
}

// Add event listeners for refresh buttons
const refreshRecentRequestsBtn = document.getElementById('refreshRecentRequests');
if (refreshRecentRequestsBtn) {
    refreshRecentRequestsBtn.addEventListener('click', refreshRecentRequests);
}

const refreshPendingRequestsBtn = document.getElementById('refreshPendingRequests');
if (refreshPendingRequestsBtn) {
    refreshPendingRequestsBtn.addEventListener('click', refreshPendingRequests);
}

const refreshApprovedRequestsBtn = document.getElementById('refreshApprovedRequests');
if (refreshApprovedRequestsBtn) {
    refreshApprovedRequestsBtn.addEventListener('click', refreshApprovedRequests);
}

// Add event listener for clearing approved requests history
const clearApprovedHistoryBtn = document.getElementById('clearApprovedHistory');
if (clearApprovedHistoryBtn) {
    clearApprovedHistoryBtn.addEventListener('click', clearApprovedRequestsHistory);
}

// Auto-refresh timer variables
// All timer variables are already declared at the top of the file

// Function to start auto-refresh
function startAutoRefresh() {
    // Clear any existing timers
    stopAutoRefresh();
    
    // Set auto-refresh for all requests every 30 seconds
    autoRefreshTimer = setInterval(() => {
        console.log('Auto-refreshing all requests...');
        loadDashboardData();
    }, 30000); // 30 seconds for more real-time updates
    
    // Set auto-refresh for pending requests every 15 seconds
    pendingRequestsTimer = setInterval(() => {
        console.log('Auto-refreshing pending requests...');
        fetchPendingRequests();
    }, 15000); // 15 seconds for more responsive pending updates
    
    // Set auto-refresh for dashboard counts every 10 seconds
    const countUpdateTimer = setInterval(async () => {
        console.log('Updating dashboard counts...');
        try {
            const token = localStorage.getItem('hodToken');
            if (!token) return;
            
            const response = await fetch(`${API_URL}/requests/count`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Filter out cleared requests
                    const clearedRequests = JSON.parse(localStorage.getItem('hodClearedRequests') || '[]');
                    if (clearedRequests.length > 0) {
                        // If we have cleared requests, we need to fetch all and filter
                        const fullResponse = await fetch(`${API_URL}/requests`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Cache-Control': 'no-cache'
                            }
                        });
                        
                        if (fullResponse.ok) {
                            const fullData = await fullResponse.json();
                            if (fullData.success) {
                                const filteredRequests = fullData.requests.filter(req => !clearedRequests.includes(req._id));
                                updateDashboardCounts(filteredRequests);
                            }
                        }
                    } else {
                        // If no cleared requests, use the count data directly
                        updateDashboardCounts(data.requests || []);
                    }
                }
            }
        } catch (error) {
            console.error('Error updating counts:', error);
        }
    }, 10000); // 10 seconds for real-time count updates
}

// Function to stop auto-refresh
function stopAutoRefresh() {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
    }
    if (pendingRequestsTimer) {
        clearInterval(pendingRequestsTimer);
        pendingRequestsTimer = null;
    }
    if (approvedRequestsTimer) {
        clearInterval(approvedRequestsTimer);
        approvedRequestsTimer = null;
    }
}

// Function to clear all request history
async function clearApprovedRequestsHistory() {
    try {
        if (confirm('Are you sure you want to clear ALL request history? This will permanently delete all requests including pending, approved, and rejected ones.')) {
            const token = localStorage.getItem('hodToken');
            if (!token) {
                showNotification('You must be logged in to perform this action', 'error');
                return;
            }
            
            // Show loading notification
            showNotification('Clearing all request history...', 'info');
            
            // Store cleared request IDs in localStorage for persistence
            try {
                // Fetch all requests first to get their IDs
                const fetchResponse = await fetch(`${API_URL}/requests`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!fetchResponse.ok) {
                    throw new Error(`Failed to fetch requests: ${fetchResponse.status}`);
                }
                
                const fetchData = await fetchResponse.json();
                
                if (fetchData.success && Array.isArray(fetchData.requests)) {
                    // Get all request IDs
                    const requestIds = fetchData.requests.map(req => req._id);
                    
                    // Store in localStorage for permanent clearing
                    const existingClearedRequests = JSON.parse(localStorage.getItem('hodClearedRequests') || '[]');
                    const updatedClearedRequests = [...existingClearedRequests, ...requestIds];
                    localStorage.setItem('hodClearedRequests', JSON.stringify(updatedClearedRequests));
                    
                    // Try server-side clearing if API endpoint exists
                    try {
                        const clearResponse = await fetch(`${API_URL}/requests/clear-all`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        
                        if (clearResponse.ok) {
                            const clearData = await clearResponse.json();
                            console.log('Server-side clearing successful:', clearData);
                        }
                    } catch (serverError) {
                        console.log('Server-side clearing not available, using client-side only');
                    }
                    
                    // Clear all tables
                    if (pendingRequestsTable) {
                        pendingRequestsTable.innerHTML = '<tr><td colspan="8">No pending requests found</td></tr>';
                    }
                    if (approvedRequestsTable) {
                        approvedRequestsTable.innerHTML = '<tr><td colspan="8">No approved requests found</td></tr>';
                    }
                    if (requestsTableBody) {
                        requestsTableBody.innerHTML = '<tr><td colspan="6">No requests found</td></tr>';
                    }
                    
                    // Update dashboard counts with empty data
                    updateDashboardCounts([]);
                    
                    showNotification('All request history cleared permanently', 'success');
                } else {
                    throw new Error('Failed to process requests data');
                }
            } catch (error) {
                console.error('Error in client-side clearing:', error);
                showNotification('Error clearing request history: ' + error.message, 'error');
            }
        }
    } catch (error) {
        console.error('Error clearing request history:', error);
        showNotification('Error clearing request history: ' + error.message, 'error');
    }
}

// Function to reset cleared history (for admin use)
async function resetClearedHistory() {
    if (confirm('Are you sure you want to reset the cleared history? This will make previously cleared requests visible again.')) {
        localStorage.removeItem('hodClearedRequests');
        showNotification('Cleared history has been reset. Refreshing data...', 'success');
        await loadDashboardData();
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('hodToken');
    const savedUserData = sessionStorage.getItem('hodUserData');
    
    if (token) {
        // If we have saved user data, restore it immediately to prevent flashing of login screen
        if (savedUserData) {
            try {
                currentUser = JSON.parse(savedUserData);
                updateHODNavUI(true);
                showDashboard();
                updateUserInfo();
                // Start auto-refresh
                startAutoRefresh();
            } catch (e) {
                console.error('Error parsing saved user data:', e);
            }
        }
        
        // Always verify the token with the server
        verifyToken(token).then(isValid => {
            // If token is valid, start auto-refresh
            if (isValid && !autoRefreshTimer) {
                startAutoRefresh();
            }
        });
    }
});