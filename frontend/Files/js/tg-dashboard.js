// TG Dashboard JS

// API URL
const API_URL = 'http://localhost:5001/api/tg';

// Authentication Check - Runs immediately
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const token = localStorage.getItem('tgToken');
  const user = JSON.parse(localStorage.getItem('tgUser') || '{}');
  
  // Only redirect if we're not on the landing page of the dashboard
  // This allows users to see the login form
  if (window.location.hash && (!token || !user.id)) {
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
    notification.textContent = 'Please log in to access the TG dashboard';
    document.body.appendChild(notification);
    
    // Redirect to home page after a short delay
    setTimeout(function() {
      window.location.href = 'index.html';
    }, 2000);
  }
});

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

const signInBtn = document.getElementById('signInBtn');
const heroSignInBtn = document.getElementById('heroSignInBtn');
const viewDashboardBtn = document.getElementById('viewDashboardBtn');
const signInModal = document.getElementById('signInModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const dashboardSection = document.getElementById('dashboardSection');
const requestsTable = document.getElementById('requestsTable');
const dashboardHeader = document.querySelector('.dashboard-header');

// Create HOD selection modal
const hodModal = document.createElement('div');
hodModal.className = 'modal';
hodModal.id = 'hodModal';
hodModal.innerHTML = `
  <div class="modal-content">
    <div class="modal-header">
      <h2>Select HOD</h2>
      <button class="close-modal" onclick="closeHODModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div id="hodList" class="hod-list"></div>
    </div>
  </div>
`;
document.body.appendChild(hodModal);

let currentRequestId = null;

function openHODModal(requestId) {
  currentRequestId = requestId;
  hodModal.style.display = 'flex';
  fetchHODs();
}

function closeHODModal() {
  hodModal.style.display = 'none';
  currentRequestId = null;
}

function openModal() { 
  signInModal.classList.add('active'); 
  document.body.classList.add('modal-open');
}

function closeModal() { 
  signInModal.classList.remove('active'); 
  loginError.textContent = ''; 
  document.body.classList.remove('modal-open');
}

signInBtn.onclick = openModal;
heroSignInBtn.onclick = openModal;
viewDashboardBtn.onclick = function() {
  // Always open the login form when View Dashboard is clicked
  showNotification('Please log in to view the dashboard', 'info');
  openModal();
};
closeModalBtn.onclick = closeModal;
window.onclick = (e) => { if (e.target === signInModal) closeModal(); };

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

function updateTGNavUI(isLoggedIn) {
  const loginMenuItem = document.getElementById('tgLoginMenuItem');
  const logoutMenuItem = document.getElementById('tgLogoutMenuItem');
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

function handleTGLogout() {
  // Remove token and user data
  localStorage.removeItem('tgToken');
  localStorage.removeItem('tgUser');
  
  // Update UI
  updateTGNavUI(false);
  
  // Stop auto-refresh when logging out
  stopAutoRefresh();
  
  // Show notification
  showNotification('You have been logged out successfully', 'info');
  
  // Reload page after a short delay
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

const tgLogoutBtn = document.getElementById('tgLogoutBtn');
if (tgLogoutBtn) {
  tgLogoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handleTGLogout();
  });
}

loginForm.onsubmit = async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  
  // Show loading state
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    submitBtn.disabled = true;
    
    try {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      
      console.log('Sending TG login request for:', email);
      
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      console.log('TG login response status:', res.status);
      const data = await res.json();
      console.log('TG login response data:', data);
      
      if (data.success) {
        console.log('TG login successful');
        localStorage.setItem('tgToken', data.token);
        
        // Store user information
        if (data.user) {
          localStorage.setItem('tgUser', JSON.stringify(data.user));
        }
        
        // Show success notification
        showNotification('Login successful!', 'success');
        
        closeModal();
        updateTGNavUI(true);
        showDashboard();
        
        // Start auto-refresh when logged in
        startAutoRefresh();
        
        // Show notification about auto-refresh
        setTimeout(() => {
          showNotification('Auto-refresh enabled. New requests will appear automatically.', 'info');
        }, 1000);
      } else {
        console.log('TG login failed:', data.message);
        loginError.textContent = data.message || 'Invalid credentials';
      }
    } catch (error) {
      console.error('TG login error:', error);
      loginError.textContent = 'Server error. Try again.';
    } finally {
      // Reset button state
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  } else {
    try {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('tgToken', data.token);
        
        // Store user information
        if (data.user) {
          localStorage.setItem('tgUser', JSON.stringify(data.user));
        }
        
        closeModal();
        updateTGNavUI(true);
        showDashboard();
        
        // Start auto-refresh when logged in
        startAutoRefresh();
        
        // Show notification about auto-refresh
        showNotification('Auto-refresh enabled. New requests will appear automatically.', 'info');
      } else {
        loginError.textContent = data.message || 'Invalid credentials';
      }
    } catch (error) {
      console.error('TG login error:', error);
      loginError.textContent = 'Server error. Try again.';
    }
  }
};

// Auto-refresh variables
let autoRefreshInterval = null;
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

async function showDashboard() {
  // Verify token
  const token = localStorage.getItem('tgToken');
  if (!token) return;
  const res = await fetch(`${API_URL}/verify`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!data.success) { localStorage.removeItem('tgToken'); return; }
  document.querySelector('.hero').style.display = 'none';
  dashboardSection.style.display = 'block';
  await fetchHODs();
  fetchRequests();
  
  // Start auto-refresh
  startAutoRefresh();
}

// Function to start auto-refresh
function startAutoRefresh() {
  // Clear any existing interval first
  stopAutoRefresh();
  
  // Set up new interval
  autoRefreshInterval = setInterval(() => {
    console.log('Auto-refreshing TG dashboard data...');
    fetchRequests();
  }, AUTO_REFRESH_INTERVAL);
  
  // Update UI to show auto-refresh is active
  const refreshToggle = document.getElementById('autoRefreshToggle');
  if (refreshToggle) {
    refreshToggle.checked = true;
  }
  
  // Show notification
  showNotification('Auto-refresh enabled. Data will update every 30 seconds.', 'info');
  console.log('Auto-refresh started for TG dashboard');
}

// Function to stop auto-refresh
function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    
    // Update UI to show auto-refresh is inactive
    const refreshToggle = document.getElementById('autoRefreshToggle');
    if (refreshToggle) {
      refreshToggle.checked = false;
    }
    
    showNotification('Auto-refresh disabled. You will need to refresh manually.', 'info');
    console.log('Auto-refresh stopped for TG dashboard');
  }
}

// Set up auto-refresh toggle event listener
document.addEventListener('DOMContentLoaded', function() {
  const autoRefreshToggle = document.getElementById('autoRefreshToggle');
  if (autoRefreshToggle) {
    autoRefreshToggle.addEventListener('change', function() {
      if (this.checked) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
    });
  }
});

// Function to fetch HODs
async function fetchHODs() {
  try {
    const token = localStorage.getItem('tgToken');
    if (!token) return;

    const res = await fetch(`${API_URL}/hods`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    
    if (data.success) {
      const hodList = document.getElementById('hodList');
      hodList.innerHTML = '';
      
      if (data.hods.length === 0) {
        hodList.innerHTML = '<p class="no-hods">No HODs available</p>';
        return;
      }

      // Add HODs to list
      data.hods.forEach(hod => {
        const hodItem = document.createElement('div');
        hodItem.className = 'hod-item';
        hodItem.innerHTML = `
          <div class="hod-info">
            <h3>${hod.fullName}</h3>
            <p>${hod.email}</p>
          </div>
          <button onclick="selectHOD('${hod._id}', '${hod.fullName}')" class="btn-select">
            Select
          </button>
        `;
        hodList.appendChild(hodItem);
      });
    }
  } catch (error) {
    console.error('Error fetching HODs:', error);
    showNotification('Failed to load HODs. Please try again.', 'error');
  }
}

// Function to select HOD and forward request
async function selectHOD(hodId, hodName) {
  if (!currentRequestId) return;

  try {
    const token = localStorage.getItem('tgToken');
    const res = await fetch(`${API_URL}/requests/${currentRequestId}/forward`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ hodId })
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    
    if (data.success) {
      showNotification(`Request forwarded to ${hodName} successfully`, 'success');
      closeHODModal();
      fetchRequests();
    } else {
      throw new Error(data.message || 'Failed to forward request');
    }
  } catch (error) {
    console.error('Error forwarding request:', error);
    showNotification(error.message || 'An error occurred while forwarding the request', 'error');
  }
}

async function fetchRequests(priorityView = false, clearHistory = false) {
  try {
    const token = localStorage.getItem('tgToken');
    if (!token) {
      requestsTable.innerHTML = '<tr><td colspan="6">Please login to view requests.</td></tr>';
      return;
    }

    const res = await fetch(`${API_URL}/requests`, { 
      headers: { Authorization: `Bearer ${token}` } 
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    let requests = data.requests || [];
    
    // Handle empty requests
    if (!requests.length) {
      document.querySelector('.table-container').style.display = 'none';
      document.getElementById('dynamicContentArea').style.display = 'block';
      return;
    }
    
    // Apply filters based on parameters
    if (clearHistory) {
      // Keep only pending and forwarded requests
      requests = requests.filter(req => req.status === 'pending' || req.status === 'forwarded');
    }
    
    // If no requests after filtering, show empty state
    if (!requests.length) {
      document.querySelector('.table-container').style.display = 'none';
      document.getElementById('dynamicContentArea').style.display = 'block';
      return;
    }
    
    // Sort by priority if requested
    if (priorityView) {
      // Sort to show pending and forwarded requests first
      requests.sort((a, b) => {
        if ((a.status === 'pending' || a.status === 'forwarded') && 
            (b.status !== 'pending' && b.status !== 'forwarded')) {
          return -1;
        }
        if ((b.status === 'pending' || b.status === 'forwarded') && 
            (a.status !== 'pending' && a.status !== 'forwarded')) {
          return 1;
        }
        return 0;
      });
    }
    
    // Show table and hide empty state
    document.querySelector('.table-container').style.display = 'block';
    document.getElementById('dynamicContentArea').style.display = 'none';
    
    // Populate the table
    requestsTable.innerHTML = '';
    
    if (requests.length) {
      requests.forEach(req => {
        // Get enrollment number from student data
        const enrollmentNumber = req.student.enrollmentNumber || 'N/A';
        
        // Use the centralized function to generate a consistent ticket ID
        const displayTicketId = window.generateTicketId ? window.generateTicketId(req) : (req.ticketId || `GP-${req._id ? req._id.substring(0, 8) : ''}`.toUpperCase());
        
        requestsTable.innerHTML += `
          <tr data-request-id="${req._id}">
            <td>${req.student.fullName}</td>
            <td>${enrollmentNumber}</td>
            <td><span style="color: #007bff; font-weight: bold;"><i class="fas fa-ticket-alt"></i> ${displayTicketId}</span></td>
            <td>${req.reason}</td>
            <td>
              <span class="status-badge status-${req.status.toLowerCase()}">
                ${req.status}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button onclick="openHODModal('${req._id}')" class="btn-forward">
                  <i class="fas fa-forward"></i> Forward
                </button>
                <button onclick="clearRequest('${req._id}')" class="btn-clear">
                  <i class="fas fa-trash"></i> Clear
                </button>
              </div>
            </td>
          </tr>
        `;
      });
    } else {
      requestsTable.innerHTML = '<tr><td colspan="6">No requests found.</td></tr>';
    }
  } catch (error) {
    console.error('Error fetching requests:', error);
    requestsTable.innerHTML = '<tr><td colspan="6">Error loading requests. Please try again.</td></tr>';
    showNotification('Failed to load requests. Please refresh the page.', 'error');
  }
}

// Function to reject a request
window.rejectRequest = async (id) => {
  if (!confirm('Are you sure you want to reject this request?')) {
    return;
  }

  try {
  const token = localStorage.getItem('tgToken');
    const res = await fetch(`${API_URL}/requests/${id}/reject`, {
    method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
  });
  const data = await res.json();
    
    if (data.success) {
      showNotification('Request rejected successfully', 'success');
      fetchRequests();
    } else {
      showNotification(data.message || 'Failed to reject request', 'error');
    }
  } catch (error) {
    console.error('Error rejecting request:', error);
    showNotification('An error occurred while rejecting the request', 'error');
  }
};

// Function to clear a request
window.clearRequest = async (id) => {
  if (!confirm('Are you sure you want to clear this request? This action cannot be undone.')) {
    return;
  }

  try {
    const token = localStorage.getItem('tgToken');
    if (!token) {
      showNotification('Authentication error. Please login again.', 'error');
      return;
    }

    const res = await fetch(`${API_URL}/request/${id}`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    
    if (data.success) {
      // Remove the request row from the table
      const requestRow = document.querySelector(`tr[data-request-id="${id}"]`);
      if (requestRow) {
        requestRow.remove();
      }
      
      // If no requests left, show "No requests found" message
      const remainingRows = requestsTable.querySelectorAll('tr');
      if (remainingRows.length === 0) {
        requestsTable.innerHTML = '<tr><td colspan="5">No requests found.</td></tr>';
      }
      
      showNotification('Request cleared successfully', 'success');
    } else {
      throw new Error(data.message || 'Failed to clear request');
    }
  } catch (error) {
    console.error('Error clearing request:', error);
    showNotification(error.message || 'An error occurred while clearing the request', 'error');
    
    // If there's an error, refresh the requests list to ensure consistency
    fetchRequests();
  }
};

// Function to show notifications
function showNotification(message, type) {
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

// Add refresh button functionality
const refreshBtn = document.createElement('button');
refreshBtn.className = 'btn btn-primary';
refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
refreshBtn.onclick = async () => {
  await Promise.all([fetchRequests(), fetchHODs()]);
};

// Add refresh button to dashboard header
dashboardHeader.appendChild(refreshBtn);

// Auto-refresh timer variable
let autoRefreshTimer;

// Function to start auto-refresh
function startAutoRefresh() {
  // Clear any existing timer
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
  }
  
  // Set auto-refresh every 30 seconds
  autoRefreshTimer = setInterval(() => {
    console.log('Auto-refreshing requests...');
    fetchRequests();
  }, 30000); // 30 seconds
}

// Function to stop auto-refresh
function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

// Add event listeners for dashboard control buttons
document.addEventListener('DOMContentLoaded', function() {
  // Initialize navbar scroll hide effect
  handleNavbarOnScroll();
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
        const token = localStorage.getItem('tgToken');
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
            fetchRequests(false, true);
            showNotification('All history has been cleared.', 'success');
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
        const token = localStorage.getItem('tgToken');
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
            fetchRequests(false, true);
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
        const token = localStorage.getItem('tgToken');
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
            fetchRequests(false, true);
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
        const token = localStorage.getItem('tgToken');
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
            fetchRequests(false, true);
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
});

// On page load, check if already logged in
window.onload = function() {
  const token = localStorage.getItem('tgToken');
  if (token) {
    updateTGNavUI(true);
    showDashboard();
    fetchRequests();
    startAutoRefresh();
  } else {
    updateTGNavUI(false);
  }
};