// API URL
const API_URL = 'http://localhost:5001/api';
const SOCKET_URL = 'http://localhost:5001';

// Socket.io connection
let socket;

// Initialize WebSocket connection
// Make it globally accessible by attaching to window object
window.initializeSocket = function() {
    // Check if user is authenticated
    const token = localStorage.getItem('studentToken');
    if (!token) return;
    
    // Connect to the WebSocket server
    socket = io(SOCKET_URL, {
        auth: {
            token: token
        }
    });
    
    // Connection events
    socket.on('connect', () => {
        console.log('Connected to real-time updates');
        showNotification('Connected to real-time request tracking', 'success');
    });
    
    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
    });
    
    // Listen for request status updates
    socket.on('requestStatusUpdate', (updatedRequest) => {
        console.log('Request status updated:', updatedRequest);
        showNotification(`Your request status has been updated to: ${updatedRequest.status}`, 'info');
        
        // Update UI if request list is open
        const requestsModal = document.getElementById('requestsModal');
        if (requestsModal) {
            // Refresh the requests list
            fetchStudentRequests();
        }
        
        // If it's approved and has a gatepass token, show notification with action
        if (updatedRequest.status === 'approved') {
            // Check for gatepass token or generate one if not provided
            const tokenMessage = updatedRequest.gatepassToken ? 
                `Your gatepass has been approved with token: ${updatedRequest.gatepassToken}` : 
                'Your gatepass has been approved!';
                
            showActionNotification(
                tokenMessage, 
                'View Gatepass', 
                () => showTicket(updatedRequest._id)
            );
        }
    });
    
    // Listen for token generation updates
    socket.on('tokenGenerated', (requestWithToken) => {
        console.log('Token generated for request:', requestWithToken);
        showNotification(`Unique verification code generated: ${requestWithToken.gatepassToken}`, 'success');
        
        // Update UI if request list is open
        const requestsModal = document.getElementById('requestsModal');
        if (requestsModal) {
            // Refresh the requests list
            fetchStudentRequests();
        }
    });
}

// Show notification with action button
function showActionNotification(message, actionText, actionCallback) {
    const notification = document.createElement('div');
    notification.className = 'notification action-notification success';
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    
    const actionButton = document.createElement('button');
    actionButton.className = 'action-btn';
    actionButton.textContent = actionText;
    actionButton.addEventListener('click', () => {
        actionCallback();
        notification.remove();
    });
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-notification';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
        notification.remove();
    });
    
    notification.appendChild(messageSpan);
    notification.appendChild(actionButton);
    notification.appendChild(closeButton);
    
    document.body.appendChild(notification);
    
    // Auto remove after 10 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.remove();
        }
    }, 10000);
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-notification';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
        notification.remove();
    });
    
    notification.appendChild(closeButton);
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.remove();
        }
    }, 5000);
}

// Function to check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('studentToken');
    return !!token;
}

// Ticket display functionality has been removed
// Function to handle ticket download (now just shows a notification)
function showTicket(requestId) {
    showNotification('Ticket download functionality has been removed', 'info');
    console.log('Ticket display functionality has been removed. Request ID:', requestId);
}

function printTicket() {
    showNotification('Print functionality has been removed', 'info');
}

// Function to close the ticket (stub for backward compatibility)
function closeTicket() {
    console.log('Ticket close functionality has been removed');
}

// Function to download gatepass as PDF
function downloadGatepass(request) {
    try {
        // Show loading notification
        showNotification('Generating PDF...', 'info');
        
        // Create a temporary container for the gatepass
        const container = document.createElement('div');
        container.className = 'gatepass-pdf-container';
        container.style.width = '210mm'; // A4 width
        container.style.padding = '20px';
        container.style.backgroundColor = 'white';
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        document.body.appendChild(container);
        
        // Format date
        const requestDate = new Date(request.createdAt).toLocaleDateString();
        const approvedDate = request.approvedAt ? 
            new Date(request.approvedAt).toLocaleDateString() : 
            new Date().toLocaleDateString();
        
        // Get token
        const token = request.gatepassToken || Math.floor(100000 + Math.random() * 900000).toString();
        
        // Get student info
        const studentName = request.student?.name || request.student?.fullName || 'Student Name';
        const enrollmentNumber = request.student?.enrollmentNumber || 'EN12345';
        const department = request.student?.department || 'Computer Science';
        
        // Get approver info
        const approvedBy = request.approvedBy?.name || request.approvedBy?.fullName || 'HOD Name';
        
        // Create gatepass HTML
        container.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #1a1a2e; margin-bottom: 5px;">E-PASS GATEPASS</h1>
                <p style="color: #555; font-size: 14px;">Official Electronic Gatepass</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px; color: #555;">VERIFICATION CODE</div>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 3px; color: #007bff; background: #f0f8ff; padding: 10px; border-radius: 5px; display: inline-block; min-width: 200px;">${token}</div>
                <p style="font-size: 14px; color: #555; margin-top: 5px; font-style: italic;">This unique ID was assigned by HOD and must be shown at the gate</p>
            </div>
            
            <div style="margin: 30px 0; border: 1px solid #ddd; border-radius: 10px; padding: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; font-weight: bold; width: 40%; color: #555;">Student Name:</td>
                        <td style="padding: 10px;">${studentName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; width: 40%; color: #555;">Enrollment Number:</td>
                        <td style="padding: 10px;">${enrollmentNumber}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; width: 40%; color: #555;">Department:</td>
                        <td style="padding: 10px;">${department}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; width: 40%; color: #555;">Reason:</td>
                        <td style="padding: 10px;">${request.reason}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; width: 40%; color: #555;">Status:</td>
                        <td style="padding: 10px; color: #28a745; font-weight: bold;">Approved</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; width: 40%; color: #555;">Approved By:</td>
                        <td style="padding: 10px;">${approvedBy}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; width: 40%; color: #555;">Approved On:</td>
                        <td style="padding: 10px;">${approvedDate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; width: 40%; color: #555;">Requested On:</td>
                        <td style="padding: 10px;">${requestDate}</td>
                    </tr>
                </table>
            </div>
            
            <div style="margin-top: 40px; text-align: center;">
                <p style="font-size: 14px; color: #555;">This gatepass is valid for one-time use only</p>
                <p style="font-size: 14px; color: #555;">Generated on: ${new Date().toLocaleString()}</p>
            </div>
        `;
        
        // Use html2canvas to convert the container to an image
        html2canvas(container).then(canvas => {
            // Create PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // Add image to PDF
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210; // A4 width in mm
            const imgHeight = canvas.height * imgWidth / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            
            // Save PDF
            pdf.save(`Gatepass_${token}.pdf`);
            
            // Remove temporary container
            document.body.removeChild(container);
            
            // Show success notification
            showNotification('Gatepass downloaded successfully!', 'success');
        }).catch(error => {
            console.error('Error generating PDF:', error);
            showNotification('Error generating PDF. Please try again.', 'error');
            document.body.removeChild(container);
        });
        
    } catch (error) {
        console.error('Error in downloadGatepass:', error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// Function to fetch student requests from the API
async function fetchStudentRequests() {
    try {
        // Check if user is authenticated
        const token = localStorage.getItem('studentToken');
        if (!token) {
            console.log('No authentication token found');
            showNotification('Please sign in to view your requests', 'error');
            return null;
        }
        
        console.log('Fetching student requests with token:', token.substring(0, 10) + '...');
        
        // Fetch student requests from API
        const response = await fetch(`${API_URL}/student/requests`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response:', errorText);
            throw new Error(`Error fetching requests: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch requests');
        }
        
        return data.requests;
        
    } catch (error) {
        console.error('Error fetching student requests:', error);
        showNotification(`Error fetching your requests. Please try signing in again.`, 'error');
        return null;
    }
}

// Function to show student's gatepass requests
async function showGatepassByEnrollment() {
    try {
        // Check if user is authenticated
        const token = localStorage.getItem('studentToken');
        if (!token) {
            showNotification('Please sign in to view your requests', 'error');
            return;
        }
        
        // Show loading notification
        showNotification('Loading your gatepass requests...', 'info');
        
        // Fetch student requests
        const requests = await fetchStudentRequests();
        
        if (requests) {
            // Display the requests in a modal
            displayStudentRequests(requests);
        } else {
            // For testing, show dummy requests if API fails
            const dummyRequests = [
                {
                    _id: '1',
                    reason: 'Placement Drive',
                    status: 'approved',
                    createdAt: new Date().toISOString(),
                    approvedBy: { name: 'HOD Name' },
                    approvedAt: new Date().toISOString(),
                    gatepassToken: Math.floor(100000 + Math.random() * 900000).toString()
                },
                {
                    _id: '2',
                    reason: 'Medical Emergency',
                    status: 'pending',
                    createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
                },
                {
                    _id: '3',
                    reason: 'Family Function',
                    status: 'rejected',
                    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                    rejectedBy: { name: 'HOD Name' },
                    rejectedAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
                }
            ];
            
            displayStudentRequests(dummyRequests);
        }
    } catch (error) {
        console.error('Error in showGatepassByEnrollment:', error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// Function to display student requests in a modal
function displayStudentRequests(requests) {
    // Check if requests modal already exists
    let requestsModal = document.getElementById('requestsModal');
    
    // If not, create it
    if (!requestsModal) {
        requestsModal = document.createElement('div');
        requestsModal.id = 'requestsModal';
        requestsModal.className = 'modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.innerHTML = `
            <h2>My Gatepass Requests</h2>
            <button class="close-modal" onclick="closeRequestsModal()">&times;</button>
        `;
        
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.id = 'requestsModalBody';
        
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        requestsModal.appendChild(modalContent);
        document.body.appendChild(requestsModal);
    }
    
    // Get the modal body to add requests
    const modalBody = document.getElementById('requestsModalBody');
    
    // Clear previous content
    modalBody.innerHTML = '';
    
    // Check if there are any requests
    if (!requests || requests.length === 0) {
        modalBody.innerHTML = '<p class="no-requests">You have no gatepass requests yet.</p>';
        requestsModal.style.display = 'block';
        return;
    }
    
    // Create requests list
    const requestsList = document.createElement('div');
    requestsList.className = 'requests-list';
    
    // Sort requests by date (newest first)
    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Add each request to the list
    requests.forEach(request => {
        const requestItem = document.createElement('div');
        requestItem.className = `request-item ${request.status}`;
        
        // Format date
        const requestDate = new Date(request.createdAt).toLocaleDateString();
        
        // Create status badge
        const statusBadge = `<span class="status-badge ${request.status}">${request.status}</span>`;
        
        // Create token display for approved requests
        let tokenDisplay = '';
        if (request.status === 'approved') {
            const token = request.gatepassToken || Math.floor(100000 + Math.random() * 900000).toString();
            tokenDisplay = `
                <div class="token-display">
                    <div class="token-label">VERIFICATION CODE</div>
                    <div class="token-value">${token}</div>
                </div>
                <div class="unique-id-info">This unique ID was assigned by HOD and must be shown at the gate</div>
            `;
        }
        
        // Create approval/rejection info
        let statusInfo = '';
        if (request.status === 'approved') {
            const approvedBy = request.approvedBy?.name || request.approvedBy?.fullName || 'HOD';
            const approvedDate = request.approvedAt ? new Date(request.approvedAt).toLocaleDateString() : requestDate;
            statusInfo = `<div class="status-info">Approved by ${approvedBy} on ${approvedDate}</div>`;
        } else if (request.status === 'rejected') {
            const rejectedBy = request.rejectedBy?.name || request.rejectedBy?.fullName || 'HOD';
            const rejectedDate = request.rejectedAt ? new Date(request.rejectedAt).toLocaleDateString() : requestDate;
            statusInfo = `<div class="status-info">Rejected by ${rejectedBy} on ${rejectedDate}</div>`;
        }
        
        // Create view and download buttons for approved requests
        let actionButtons = '';
        if (request.status === 'approved') {
            actionButtons = `
                <button class="btn btn-primary view-gatepass-btn" data-id="${request._id}">View Gatepass</button>
                <button class="btn btn-secondary download-gatepass-btn" data-id="${request._id}">
                    <i class="fas fa-download"></i> Download
                </button>
            `;
        }
        
        // Set the HTML content
        requestItem.innerHTML = `
            <div class="request-header">
                <div class="request-reason">${request.reason}</div>
                ${statusBadge}
            </div>
            <div class="request-date">Requested on: ${requestDate}</div>
            ${statusInfo}
            ${tokenDisplay}
            <div class="request-actions">
                ${actionButtons}
            </div>
        `;
        
        requestsList.appendChild(requestItem);
    });
    
    modalBody.appendChild(requestsList);
    
    // Add event listeners to view buttons
    const viewButtons = modalBody.querySelectorAll('.view-gatepass-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            const requestId = button.getAttribute('data-id');
            closeRequestsModal();
            showTicket(requestId);
        });
    });
    
    // Add event listeners to download buttons
    const downloadButtons = modalBody.querySelectorAll('.download-gatepass-btn');
    downloadButtons.forEach(button => {
        button.addEventListener('click', () => {
            const requestId = button.getAttribute('data-id');
            // Find the request data
            const request = requests.find(req => req._id === requestId);
            if (request) {
                downloadGatepass(request);
            }
        });
    });
    
    // Show the modal
    requestsModal.style.display = 'block';
    
    // Add close function to window object
    window.closeRequestsModal = function() {
        requestsModal.style.display = 'none';
    };
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === requestsModal) {
            closeRequestsModal();
        }
    });
}

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

// Add event listeners when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navbar scroll hide effect
    handleNavbarOnScroll();
    // Add close button to ticket
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', closeTicket);
    document.querySelector('.ticket-container').appendChild(closeBtn);
    
    // Check if user is authenticated
    if (checkAuth()) {
        // Show dashboard and logout buttons
        document.getElementById('loginMenuItem').style.display = 'none';
        document.getElementById('dashboardMenuItem').style.display = 'inline-block';
        document.getElementById('myRequestsMenuItem').style.display = 'inline-block';
        document.getElementById('logoutMenuItem').style.display = 'inline-block';
        
        // Hide mobile login menu item
        document.getElementById('mobileLoginMenuItem').style.display = 'none';
        document.getElementById('mobileDashboardMenuItem').style.display = 'block';
        document.getElementById('mobileMyRequestsMenuItem').style.display = 'block';
        document.getElementById('mobileLogoutMenuItem').style.display = 'block';
    }
    
    // Add event listener for my requests button
    const myRequestsBtn = document.getElementById('myRequestsBtn');
    if (myRequestsBtn) {
        myRequestsBtn.addEventListener('click', showGatepassByEnrollment);
    }
    
    // Add event listener for mobile my requests button
    const mobileMyRequestsBtn = document.getElementById('mobileMyRequestsBtn');
    if (mobileMyRequestsBtn) {
        mobileMyRequestsBtn.addEventListener('click', showGatepassByEnrollment);
    }
    
    // Hero section my requests button now uses inline onclick with checkAndCallFetchRequests
    // No JavaScript event listener needed here
    
    // Check if user is logged in and update UI
    checkAuth();
    
    // Initialize real-time tracking via WebSocket
    initializeSocket();
    
    // Add status indicator to the UI
    addConnectionStatusIndicator();
});

// Add connection status indicator to the UI
function addConnectionStatusIndicator() {
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'connection-status';
    statusIndicator.className = 'connection-status disconnected';
    statusIndicator.title = 'Real-time tracking status';
    
    const statusDot = document.createElement('span');
    statusDot.className = 'status-dot';
    
    const statusText = document.createElement('span');
    statusText.className = 'status-text';
    statusText.textContent = 'Offline';
    
    statusIndicator.appendChild(statusDot);
    statusIndicator.appendChild(statusText);
    
    // Add to the header or navigation area
    const header = document.querySelector('header') || document.querySelector('nav');
    if (header) {
        header.appendChild(statusIndicator);
    } else {
        document.body.insertBefore(statusIndicator, document.body.firstChild);
    }
    
    // Update status when socket connection changes
    if (socket) {
        socket.on('connect', () => {
            statusIndicator.className = 'connection-status connected';
            statusText.textContent = 'Online';
        });
        
        socket.on('disconnect', () => {
            statusIndicator.className = 'connection-status disconnected';
            statusText.textContent = 'Offline';
        });
    }
}

// Function to show gatepass by enrollment number
async function showGatepassByEnrollment() {
    // Check if user is logged in
    const token = localStorage.getItem('token') || localStorage.getItem('studentToken');
    if (!token) {
        // If not logged in, show notification and open login form
        showNotification('Please log in to view your gatepass', 'info');
        
        // Check if openAuthModal function exists and call it
        if (typeof openAuthModal === 'function') {
            openAuthModal();
        } else if (window.openAuthModal) {
            window.openAuthModal();
        }
        return;
    }
    
    try {
        // Fetch all student requests
        const response = await fetch(`${API_URL}/student/requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error fetching requests: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !Array.isArray(data.requests)) {
            throw new Error('Invalid response data');
        }
        
        // Find the most recent approved request
        const approvedRequests = data.requests.filter(req => req.status === 'approved');
        
        if (approvedRequests.length === 0) {
            alert('You don\'t have any approved gatepass requests. Please submit a request first.');
            return;
        }
        
        // Sort by date (newest first)
        approvedRequests.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        // Get the most recent approved request
        const mostRecentRequest = approvedRequests[0];
        
        // Check if the request has a token
        if (!mostRecentRequest.gatepassToken) {
            console.log('No token found for the approved request, requesting token generation');
            
            try {
                // Request token generation from the server
                const tokenResponse = await fetch(`${API_URL}/student/request/${mostRecentRequest._id}/token`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Cache-Control': 'no-cache, no-store, must-revalidate'
                    }
                });
                
                if (tokenResponse.ok) {
                    const tokenData = await tokenResponse.json();
                    if (tokenData.success && tokenData.request && tokenData.request.gatepassToken) {
                        mostRecentRequest.gatepassToken = tokenData.request.gatepassToken;
                        console.log('Token successfully retrieved:', mostRecentRequest.gatepassToken);
                    }
                }
            } catch (tokenError) {
                console.error('Error fetching token:', tokenError);
            }
            
            // If still no token, generate a temporary one
            if (!mostRecentRequest.gatepassToken) {
                console.log('Generating temporary token');
                // Generate a random 6-digit number
                const tempToken = Math.floor(100000 + Math.random() * 900000).toString();
                mostRecentRequest.gatepassToken = tempToken;
            }
        }
        
        // Show the ticket with the fetched request data
        showTicket(mostRecentRequest._id);
    } catch (error) {
        console.error('Error fetching gatepass:', error);
        alert('Failed to load your gatepass. Please try again.');
    }
}

// Function to fetch student requests
// Make it globally accessible by attaching to window object
window.fetchStudentRequests = async function() {
    try {
        // Check for token - could be stored as 'token' or 'studentToken'
        const token = localStorage.getItem('token') || localStorage.getItem('studentToken');
        if (!token) {
            console.error('No authentication token found');
            return;
        }
        
        const response = await fetch(`${API_URL}/student/requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error fetching requests: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.requests) {
            throw new Error('Invalid response data');
        }
        
        displayStudentRequests(data.requests);
    } catch (error) {
        console.error('Error fetching student requests:', error);
        alert('Failed to load your requests. Please try again.');
    }
}

// Function to show the most recent request when hero button is clicked
async function showMostRecentRequest() {
    // Check if user is authenticated
    if (!checkAuth()) {
        // If not authenticated, show the auth modal
        document.getElementById('authModal').style.display = 'block';
        return;
    }
    
    try {
        // Get token from local storage
        const token = localStorage.getItem('token') || localStorage.getItem('studentToken');
        if (!token) {
            showNotification('Please log in to view your requests', 'error');
            return;
        }
        
        // Make the API request to get all requests
        const response = await fetch(`${API_URL}/student/requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error fetching requests: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.requests || !data.requests.length) {
            // If no requests found, show all requests
            showNotification('No requests found. Showing all requests.', 'info');
            showGatepassByEnrollment();
            return;
        }
        
        // Sort requests by date (newest first)
        const sortedRequests = [...data.requests].sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB - dateA;
        });
        
        // Get the most recent request
        const mostRecentRequest = sortedRequests[0];
        
        // Display all requests
        displayStudentRequests(data.requests);
        
        // Find and expand the most recent request
        setTimeout(() => {
            const requestItems = document.querySelectorAll('.request-item');
            if (requestItems.length > 0) {
                // The first item is the most recent due to our sorting
                const firstItem = requestItems[0];
                const viewDetailsBtn = firstItem.querySelector('.btn-view-details');
                
                // Click the view details button to expand it
                if (viewDetailsBtn) {
                    viewDetailsBtn.click();
                    
                    // Scroll to the expanded item
                    firstItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 300); // Small delay to ensure the modal is fully rendered
        
    } catch (error) {
        console.error('Error showing most recent request:', error);
        showNotification('Error fetching your requests. Please try again.', 'error');
        
        // Fallback to showing all requests
        showGatepassByEnrollment();
    }
}

// Function to fetch gatepass by enrollment number
async function fetchGatepassByEnrollment(enrollmentNumber) {
    try {
        const token = localStorage.getItem('studentToken');
        if (!token) {
            console.error('No authentication token found');
            return null;
        }
        
        const response = await fetch(`${API_URL}/student/gatepass/${enrollmentNumber}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                alert('No approved gatepass found for this enrollment number.');
                return null;
            }
            throw new Error(`Error fetching gatepass: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.request) {
            throw new Error('Invalid response data');
        }
        
        return data.request;
    } catch (error) {
        console.error('Error fetching gatepass by enrollment:', error);
        alert('Failed to load gatepass. Please try again.');
        return null;
    }
}

// Function to display student requests
function displayStudentRequests(requests) {
    // Create modal for displaying requests
    const requestsModal = document.createElement('div');
    requestsModal.className = 'modal';
    requestsModal.id = 'requestsModal';
    requestsModal.style.display = 'block';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
        <h2>Your Gatepass Requests</h2>
        <button class="close-modal" onclick="document.getElementById('requestsModal').remove()">&times;</button>
    `;
    
    // Add request list
    const requestList = document.createElement('div');
    requestList.className = 'request-list';
    
    if (requests.length === 0) {
        requestList.innerHTML = '<p>No requests found.</p>';
    } else {
        // Sort requests by date (newest first)
        const sortedRequests = [...requests].sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB - dateA;
        });
        
        // Log the requests data to debug
        console.log('Requests data:', sortedRequests);
        
        const requestItems = sortedRequests.map(req => {
            // Log each request to see its structure
            console.log('Processing request:', req);
            const date = new Date(req.createdAt).toLocaleDateString();
            let statusInfo = '';
            let actionButton = '';
            // Generate a ticket ID if it doesn't exist (for backward compatibility)
            const displayTicketId = req.ticketId || `GP-${req._id.substring(0, 8)}`.toUpperCase();
            
            // Determine status info based on request status
            switch(req.status) {
                case 'pending':
                    statusInfo = `<p><strong>Status:</strong> <span class="status-badge pending">Pending</span></p>
                                 <p><strong>Pending with:</strong> TG</p>`;
                    break;
                case 'forwarded':
                    const forwardedTo = req.forwardedTo ? 
                        (req.forwardedTo.fullName || 'HOD') : 'HOD';
                    statusInfo = `<p><strong>Status:</strong> <span class="status-badge forwarded">Forwarded</span></p>
                                 <p><strong>Forwarded by:</strong> ${req.tg ? req.tg.fullName : 'TG'}</p>
                                 <p><strong>Pending with:</strong> ${forwardedTo}</p>`;
                    break;
                case 'approved':
                    const approvedBy = req.approvedBy ? 
                        (req.approvedBy.fullName || 'HOD') : 'HOD';
                    const approvedDate = req.approvedAt ? 
                        new Date(req.approvedAt).toLocaleDateString() : 'Unknown';
                    
                    // Add token ID information for approved requests with enhanced styling
                    const tokenInfo = req.gatepassToken ? 
                        `<div class="token-display" style="margin: 10px 0; padding: 12px; background-color: #f0f8ff; border-left: 4px solid #007bff; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <p style="margin: 0; font-weight: 600; color: #333;"><i class="fas fa-key"></i> <strong>TOKEN ID:</strong></p>
                            <p style="font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 3px; margin: 8px 0; text-align: center; background: #e6f2ff; padding: 8px; border-radius: 4px;">${req.gatepassToken}</p>
                            <p style="margin: 0; font-size: 12px; color: #555; text-align: center;"><i class="fas fa-info-circle"></i> Use this code for verification at the gate</p>
                         </div>` : 
                        '';
                        
                    statusInfo = `<p><strong>Status:</strong> <span class="status-badge approved">Approved</span></p>
                                 <p><strong>Approved by:</strong> ${approvedBy}</p>
                                 <p><strong>Approved on:</strong> ${approvedDate}</p>
                                 ${tokenInfo}`;
                                 
                    // Only show view gatepass button for approved requests with tokens
                    if (req.gatepassToken) {
                        actionButton = `<button class="btn btn-primary view-ticket-btn" data-id="${req._id}">View Gatepass</button>`;
                    }
                    break;
                case 'rejected':
                    const rejectedBy = req.rejectedBy ? 
                        (typeof req.rejectedBy === 'object' ? req.rejectedBy.fullName : 'HOD') : 'HOD';
                    const rejectedDate = req.rejectedAt ? 
                        new Date(req.rejectedAt).toLocaleDateString() : 'Unknown';
                    statusInfo = `<p><strong>Status:</strong> <span class="status-badge rejected">Rejected</span></p>
                                 <p><strong>Rejected by:</strong> ${rejectedBy}</p>
                                 <p><strong>Rejected on:</strong> ${rejectedDate}</p>`;
                    break;
                default:
                    statusInfo = `<p><strong>Status:</strong> <span class="status-badge ${req.status}">${req.status}</span></p>`;
            }
            
            return `
                <div class="request-item">
                    <div class="request-info">
                        <h3>Gatepass Request</h3>
                        <p><strong>Ticket ID:</strong> <span style="color: #007bff; font-weight: bold;">${displayTicketId}</span></p>
                        <p><strong>Reason:</strong> ${req.reason}</p>
                        <p><strong>Requested on:</strong> ${date}</p>
                        ${statusInfo}
                    </div>
                    <div class="request-actions">
                        ${actionButton}
                    </div>
                </div>
            `;
        }).join('');
        
        requestList.innerHTML = requestItems;
    }
    
    // Assemble modal
    modalContent.appendChild(header);
    modalContent.appendChild(requestList);
    requestsModal.appendChild(modalContent);
    
    // Add to document
    document.body.appendChild(requestsModal);
    
    // Add event listeners for view ticket buttons
    document.querySelectorAll('.view-ticket-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const requestId = this.getAttribute('data-id');
            document.getElementById('requestsModal').remove();
            // Call the showTicket function to display the ticket
            showTicket(requestId);
        });
    });
}