// API URL
const API_URL = 'http://localhost:5001/api';

// Admin credentials
const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'password245';

// DOM Elements
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authTabs = document.querySelectorAll('.auth-tab');
const closeModalBtn = document.querySelector('.close-modal');
const signInBtn = document.getElementById('signInBtn');
const mobileSignInBtn = document.getElementById('mobileSignInBtn');
const logoutBtn = document.getElementById('logoutBtn');
const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
const loginMenuItem = document.getElementById('loginMenuItem');
const logoutMenuItem = document.getElementById('logoutMenuItem');
const mobileLoginMenuItem = document.getElementById('mobileLoginMenuItem');
const mobileLogoutMenuItem = document.getElementById('mobileLogoutMenuItem');
const hamburgerButton = document.querySelector('.hamburger-button');
const mobileMenu = document.querySelector('.mobile-menu');
const getStartedBtn = document.getElementById('getStartedBtn');
const requestGatepassBtn = document.getElementById('requestGatepassBtn');
const gatepassModal = document.getElementById('gatepassModal');
const gatepassForm = document.getElementById('gatepassForm');

// Mobile menu toggle
hamburgerButton.addEventListener('click', () => {
  mobileMenu.classList.toggle('active');
  hamburgerButton.classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
  if (!hamburgerButton.contains(e.target) && !mobileMenu.contains(e.target)) {
    mobileMenu.classList.remove('active');
    hamburgerButton.classList.remove('active');
  }
});

// Get Started button functionality
if (getStartedBtn) {
  getStartedBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Please log in to get started.', 'error');
      openAuthModal();
    } else {
      openGatepassModal();
    }
  });
}

// Show/Hide Modal
function openAuthModal() {
  authModal.classList.add('active');
}

function closeAuthModal() {
  authModal.classList.remove('active');
  loginForm.reset();
  registerForm.reset();
  document.querySelectorAll('.error-message').forEach(el => el.remove());
}

// Switch between login and register forms
authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    authTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    if (tabName === 'login') {
      loginForm.classList.add('active');
      registerForm.classList.remove('active');
    } else {
      loginForm.classList.remove('active');
      registerForm.classList.add('active');
    }
    
    document.querySelectorAll('.error-message').forEach(el => el.remove());
  });
});

// Handle form footer links to switch between login and register forms
const switchFormLinks = document.querySelectorAll('.switch-form');
switchFormLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const formToShow = link.dataset.form;
    
    // Update tabs to match the form being shown
    authTabs.forEach(tab => {
      if (tab.dataset.tab === formToShow) {
        tab.click(); // Trigger the tab click event to switch forms
      }
    });
  });
});

// Show loading state
function setLoading(form, isLoading) {
  const button = form.querySelector('button[type="submit"]');
  if (isLoading) {
    form.classList.add('loading');
    button.disabled = true;
  } else {
    form.classList.remove('loading');
    button.disabled = false;
  }
}

// Show error message
function showError(form, message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  form.insertBefore(errorDiv, form.firstChild);
}

// Handle Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  document.querySelectorAll('.error-message').forEach(el => el.remove());
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) {
    showError(loginForm, 'Please fill in all fields');
    return;
  }
  
  setLoading(loginForm, true);
  
  try {
    // Check for admin credentials first
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser = {
        id: 'admin',
        fullName: 'Admin User',
        email: ADMIN_EMAIL,
        role: 'admin'
      };
      
      // Generate a simple token for admin
      const adminToken = btoa(JSON.stringify(adminUser));
      
      localStorage.setItem('token', adminToken);
      localStorage.setItem('user', JSON.stringify(adminUser));
      updateAuthUI(true);
      closeAuthModal();
      showNotification('Successfully logged in as admin!', 'success');
      
      // Redirect to admin dashboard if on admin page
      if (window.location.pathname.includes('admin-dashboard.html')) {
        window.location.reload();
      }
      return;
    }
    
    // Regular user login
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      updateAuthUI(true);
      closeAuthModal();
      showNotification('Successfully logged in!', 'success');
    } else {
      showError(loginForm, data.message || 'Invalid credentials');
    }
  } catch (error) {
    showError(loginForm, 'An error occurred. Please try again.');
  } finally {
    setLoading(loginForm, false);
  }
});

// Handle Registration
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  document.querySelectorAll('.error-message').forEach(el => el.remove());
  
  const fullName = document.getElementById('registerName').value;
  const enrollmentNumber = document.getElementById('registerEnrollment').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  
  if (!fullName || !enrollmentNumber || !email || !password || !confirmPassword) {
    showError(registerForm, 'Please fill in all fields');
    return;
  }
  
  if (password !== confirmPassword) {
    showError(registerForm, 'Passwords do not match');
    return;
  }
  
  if (password.length < 6) {
    showError(registerForm, 'Password must be at least 6 characters long');
    return;
  }
  
  setLoading(registerForm, true);
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fullName,
        enrollmentNumber,
        email,
        password
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('Registration successful! Please log in.', 'success');
      authTabs.forEach(t => t.classList.remove('active'));
      authTabs[0].classList.add('active');
      loginForm.classList.add('active');
      registerForm.classList.remove('active');
      registerForm.reset();
    } else {
      showError(registerForm, data.message || 'Registration failed');
    }
  } catch (error) {
    showError(registerForm, 'An error occurred. Please try again.');
  } finally {
    setLoading(registerForm, false);
  }
});

// Handle Logout
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  updateAuthUI(false);
  showNotification('Successfully logged out!', 'success');
}

// Update UI based on auth state
function updateAuthUI(isLoggedIn) {
  const viewMyGatepassBtn = document.getElementById('viewMyGatepassBtn');
  const dashboardMenuItem = document.getElementById('dashboardMenuItem');
  const myRequestsMenuItem = document.getElementById('myRequestsMenuItem');
  const mobileDashboardMenuItem = document.getElementById('mobileDashboardMenuItem');
  const mobileMyRequestsMenuItem = document.getElementById('mobileMyRequestsMenuItem');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || '';
  
  if (isLoggedIn) {
    // Hide login buttons, show logout buttons
    loginMenuItem.style.display = 'none';
    logoutMenuItem.style.display = 'block';
    mobileLoginMenuItem.style.display = 'none';
    mobileLogoutMenuItem.style.display = 'block';
    
    // Show role-specific navigation items
    if (role === 'student') {
      // For students
      if (viewMyGatepassBtn) viewMyGatepassBtn.style.display = 'inline-block';
      if (myRequestsMenuItem) myRequestsMenuItem.style.display = 'block';
      if (mobileMyRequestsMenuItem) mobileMyRequestsMenuItem.style.display = 'block';
      
      // Hide dashboard for students
      if (dashboardMenuItem) dashboardMenuItem.style.display = 'none';
      if (mobileDashboardMenuItem) mobileDashboardMenuItem.style.display = 'none';
    } else if (role === 'tg' || role === 'hod' || role === 'admin') {
      // For TG, HOD, and Admin
      if (dashboardMenuItem) dashboardMenuItem.style.display = 'block';
      if (mobileDashboardMenuItem) mobileDashboardMenuItem.style.display = 'block';
      
      // Set correct dashboard link based on role
      const dashboardLink = role === 'tg' ? 'tg-dashboard.html' : 
                           role === 'hod' ? 'hod-dashboard.html' : 
                           'admin-dashboard.html';
      
      if (document.getElementById('dashboardBtn')) {
        document.getElementById('dashboardBtn').href = dashboardLink;
      }
      
      if (document.getElementById('mobileDashboardBtn')) {
        document.getElementById('mobileDashboardBtn').href = dashboardLink;
      }
      
      // Keep View My Gatepass button visible for all users
      // if (viewMyGatepassBtn) viewMyGatepassBtn.style.display = 'none';
      if (myRequestsMenuItem) myRequestsMenuItem.style.display = 'none';
      if (mobileMyRequestsMenuItem) mobileMyRequestsMenuItem.style.display = 'none';
    }
  } else {
    // Show login buttons, hide all other navigation items
    loginMenuItem.style.display = 'block';
    logoutMenuItem.style.display = 'none';
    mobileLoginMenuItem.style.display = 'block';
    mobileLogoutMenuItem.style.display = 'none';
    
    if (dashboardMenuItem) dashboardMenuItem.style.display = 'none';
    if (mobileDashboardMenuItem) mobileDashboardMenuItem.style.display = 'none';
    if (myRequestsMenuItem) myRequestsMenuItem.style.display = 'none';
    if (mobileMyRequestsMenuItem) mobileMyRequestsMenuItem.style.display = 'none';
    // Keep View My Gatepass button always visible
    // if (viewMyGatepassBtn) viewMyGatepassBtn.style.display = 'none';
  }
}

// Show notification
function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Re-get elements to ensure they exist
  const signInBtn = document.getElementById('signInBtn');
  const mobileSignInBtn = document.getElementById('mobileSignInBtn');
  const closeModalBtn = document.querySelector('.close-modal');
  const logoutBtn = document.getElementById('logoutBtn');
  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
  
  if (signInBtn) signInBtn.addEventListener('click', openAuthModal);
  if (mobileSignInBtn) mobileSignInBtn.addEventListener('click', openAuthModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeAuthModal);
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', handleLogout);
  
  // Check auth state
  const token = localStorage.getItem('token');
  if (token) {
    updateAuthUI(true);
  }
});

// My Requests button event listeners
const myRequestsBtn = document.getElementById('myRequestsBtn');
const mobileMyRequestsBtn = document.getElementById('mobileMyRequestsBtn');

if (myRequestsBtn) {
  myRequestsBtn.addEventListener('click', function(e) {
    e.preventDefault();
    // Check for token - could be stored as 'token' or 'studentToken'
    const token = localStorage.getItem('token') || localStorage.getItem('studentToken');
    if (!token) {
      showNotification('Please log in to view your requests', 'error');
      return;
    }
    // Call the bridge function to fetch and display student requests
    if (typeof window.checkAndCallFetchRequests === 'function') {
      window.checkAndCallFetchRequests();
    } else {
      showNotification('Unable to fetch requests at this time. Please refresh the page and try again.', 'error');
    }
  });
}

if (mobileMyRequestsBtn) {
  mobileMyRequestsBtn.addEventListener('click', function(e) {
    e.preventDefault();
    // Check for token - could be stored as 'token' or 'studentToken'
    const token = localStorage.getItem('token') || localStorage.getItem('studentToken');
    if (!token) {
      showNotification('Please log in to view your requests', 'error');
      return;
    }
    // Close mobile menu
    mobileMenu.classList.remove('active');
    hamburgerButton.classList.remove('active');
    
    // Call the bridge function to fetch and display student requests
    if (typeof window.checkAndCallFetchRequests === 'function') {
      window.checkAndCallFetchRequests();
    } else {
      showNotification('Unable to fetch requests at this time. Please refresh the page and try again.', 'error');
    }
  });
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === authModal) {
    closeAuthModal();
  }
  if (e.target === gatepassModal) {
    closeGatepassModal();
  }
});

// Check auth state is now handled in the main DOMContentLoaded event listener above

// Request Gatepass Button Auth Check
if (requestGatepassBtn) {
  requestGatepassBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Log in first to request gatepass.', 'error');
      openAuthModal();
      return;
    }
    openGatepassModal();
  });
}

// Prefill gatepass form with user info
function prefillGatepassForm() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  document.getElementById('gpName').value = user.fullName || '';
  document.getElementById('gpEnrollment').value = user.enrollmentNumber || '';
}

// Open gatepass modal and prefill
async function populateTGDropdown() {
  const tgSelect = document.getElementById('gpTG');
  tgSelect.innerHTML = '<option value="">Select TG</option>';
  try {
    const res = await fetch('http://localhost:5001/api/gatepass/tgs');
    const data = await res.json();
    if (data.success && data.tgs.length) {
      data.tgs.forEach(tg => {
        const option = document.createElement('option');
        option.value = tg.email;
        option.textContent = tg.fullName;
        tgSelect.appendChild(option);
      });
    }
  } catch (err) {
    // Optionally show an error or fallback
  }
}

function openGatepassModal() {
  prefillGatepassForm();
  populateTGDropdown(); // Fetch TGs dynamically
  if (gatepassModal) {
    gatepassModal.style.display = 'flex';
  }
}

// Handle gatepass form submission
if (gatepassForm) {
  gatepassForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const reason = document.getElementById('gpReason').value;
    const tg = document.getElementById('gpTG').value;
    
    if (!reason || !tg) {
      showNotification('Please fill in all fields.', 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Please log in to submit a gatepass request.', 'error');
        openAuthModal();
        return;
      }
      
      const response = await fetch(`${API_URL}/gatepass/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason, tg })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showNotification('Gatepass request submitted successfully!', 'success');
        gatepassForm.reset();
        closeGatepassModal();
      } else {
        showNotification(data.message || 'Failed to submit gatepass request.', 'error');
      }
    } catch (error) {
      showNotification('An error occurred. Please try again.', 'error');
    }
  });
}

// Close gatepass modal
function closeGatepassModal() {
  if (gatepassModal) {
    gatepassModal.style.display = 'none';
  }
} 