// Request Bridge JS
// This file serves as a bridge between auth.js and index.js
// It makes the necessary functions globally accessible

// Function to check if index.js functions are available
function checkAndCallFetchRequests() {
    // Check if the index.js functions are loaded
    if (typeof window.fetchStudentRequests === 'function') {
        // If available, call it directly
        window.fetchStudentRequests();
    } else {
        // If not available, define a temporary function that will retry
        window.fetchStudentRequests = async function() {
            try {
                // Check for token - could be stored as 'token' or 'studentToken'
                const token = localStorage.getItem('token') || localStorage.getItem('studentToken');
                if (!token) {
                    console.error('No authentication token found');
                    showNotification('Please log in to view your requests', 'error');
                    return;
                }
                
                // Make the API request
                const response = await fetch(`http://localhost:5001/api/student/requests`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Error fetching requests: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error('Invalid response data');
                }
                
                // Create a simple display function if the original is not available
                if (typeof window.displayStudentRequests !== 'function') {
                    window.displayStudentRequests = function(requests) {
                        // Create modal with backdrop effect
                        const requestsModal = document.createElement('div');
                        requestsModal.className = 'modal';
                        requestsModal.id = 'requestsModal';
                        requestsModal.style.display = 'block';
                        
                        // Create modal content
                        const modalContent = document.createElement('div');
                        modalContent.className = 'modal-content request-list-modal';
                        
                        // Create header with close button and counter
                        const header = document.createElement('div');
                        header.className = 'modal-header';
                        
                        // Add request count badge to title
                        const requestCount = requests.length;
                        const countBadge = `<span class="request-count">${requestCount}</span>`;
                        header.innerHTML = `<h2>My Requests ${countBadge}</h2>`;
                        
                        const closeBtn = document.createElement('span');
                        closeBtn.className = 'close-modal';
                        closeBtn.innerHTML = '&times;';
                        closeBtn.onclick = function() {
                            // Add fade-out animation before removing
                            document.getElementById('requestsModal').classList.add('fade-out');
                            setTimeout(() => {
                                document.getElementById('requestsModal').remove();
                            }, 300);
                        };
                        header.appendChild(closeBtn);
                        
                        // Create filter options with clear history button
                        const filterContainer = document.createElement('div');
                        filterContainer.className = 'request-filter';
                        filterContainer.innerHTML = `
                            <div class="filter-label">Filter by status:</div>
                            <div class="filter-options">
                                <button class="filter-btn active" data-filter="all">All</button>
                                <button class="filter-btn" data-filter="forwarded">Forwarded</button>
                                <button class="filter-btn" data-filter="approved">Approved</button>
                                <button class="filter-btn" data-filter="rejected">Rejected</button>
                                <button class="filter-btn clear-btn" data-action="clear"><i class="fas fa-broom"></i> Clear History</button>
                            </div>
                        `;
                        
                        // Create request list
                        const requestList = document.createElement('div');
                        requestList.className = 'request-list';
                        
                        if (requests.length === 0) {
                            requestList.innerHTML = '<div class="no-requests">You haven\'t made any requests yet.</div>';
                        } else {
                            // Default sort by date (newest first)
                            let sortedRequests = [...requests].sort((a, b) => {
                                const dateA = new Date(a.createdAt);
                                const dateB = new Date(b.createdAt);
                                return dateB - dateA;
                            });
                            
                            // Store the original sorting for reference
                            const originalSortedRequests = [...sortedRequests];
                            
                            // Function to sort by priority (pending/forwarded first, then others)
                            const sortByPriority = () => {
                                return [...requests].sort((a, b) => {
                                    // Define priority order: pending > forwarded > others
                                    const getPriority = (status) => {
                                        if (status === 'pending') return 0;
                                        if (status === 'forwarded') return 1;
                                        return 2;
                                    };
                                    
                                    const priorityA = getPriority(a.status);
                                    const priorityB = getPriority(b.status);
                                    
                                    // If priorities are different, sort by priority
                                    if (priorityA !== priorityB) {
                                        return priorityA - priorityB;
                                    }
                                    
                                    // If priorities are the same, sort by date (newest first)
                                    const dateA = new Date(a.createdAt);
                                    const dateB = new Date(b.createdAt);
                                    return dateB - dateA;
                                });
                            };
                            
                            const requestItems = sortedRequests.map((req, index) => {
                                // Format date with time
                                const requestDate = new Date(req.createdAt);
                                const formattedDate = requestDate.toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                });
                                const formattedTime = requestDate.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                                
                                // Calculate time elapsed
                                const now = new Date();
                                const diffTime = Math.abs(now - requestDate);
                                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
                                
                                let timeElapsed = '';
                                if (diffDays > 0) {
                                    timeElapsed = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                                } else if (diffHours > 0) {
                                    timeElapsed = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                                } else {
                                    timeElapsed = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
                                }
                                
                                let statusInfo = '';
                                let statusIcon = '';
                                
                                // Determine status info based on request status
                                switch(req.status) {
                                    case 'pending':
                                        statusIcon = '<i class="fas fa-clock"></i>';
                                        statusInfo = `<p><strong>Status:</strong> <span class="status-badge pending">${statusIcon} Pending</span></p>
                                                    <p><strong>Pending with:</strong> TG</p>`;
                                        break;
                                    case 'forwarded':
                                        statusIcon = '<i class="fas fa-share"></i>';
                                        const forwardedTo = req.forwardedTo ? 
                                            (req.forwardedTo.fullName || 'HOD') : 'HOD';
                                        statusInfo = `<p><strong>Status:</strong> <span class="status-badge forwarded">${statusIcon} Forwarded</span></p>
                                                    <p><strong>Forwarded by:</strong> ${req.tg ? req.tg.fullName : 'TG'}</p>
                                                    <p><strong>Pending with:</strong> ${forwardedTo}</p>`;
                                        break;
                                    case 'approved':
                                        statusIcon = '<i class="fas fa-check-circle"></i>';
                                        const approvedBy = req.approvedBy ? 
                                            (req.approvedBy.fullName || 'HOD') : 'HOD';
                                        const approvedDate = req.approvedAt ? 
                                            new Date(req.approvedAt).toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'short', 
                                                day: 'numeric' 
                                            }) : 'Unknown';
                                        statusInfo = `<p><strong>Status:</strong> <span class="status-badge approved">${statusIcon} Approved</span></p>
                                                    <p><strong>Approved by:</strong> ${approvedBy}</p>
                                                    <p><strong>Approved on:</strong> ${approvedDate}</p>`;
                                        break;
                                    case 'rejected':
                                        statusIcon = '<i class="fas fa-times-circle"></i>';
                                        const rejectedBy = req.rejectedBy ? 
                                            (typeof req.rejectedBy === 'object' ? req.rejectedBy.fullName : 'HOD') : 'HOD';
                                        const rejectedDate = req.rejectedAt ? 
                                            new Date(req.rejectedAt).toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'short', 
                                                day: 'numeric' 
                                            }) : 'Unknown';
                                        statusInfo = `<p><strong>Status:</strong> <span class="status-badge rejected">${statusIcon} Rejected</span></p>
                                                    <p><strong>Rejected by:</strong> ${rejectedBy}</p>
                                                    <p><strong>Rejected on:</strong> ${rejectedDate}</p>`;
                                        break;
                                    default:
                                        statusInfo = `<p><strong>Status:</strong> <span class="status-badge ${req.status}">${req.status}</span></p>`;
                                }
                                
                                // Add animation delay based on index
                                const animationDelay = index * 0.1;
                                
                                // Use the centralized function to generate a consistent ticket ID
                                const displayTicketId = generateTicketId(req);
                                
                                return `
                                    <div class="request-item" data-status="${req.status}" style="animation-delay: ${animationDelay}s">
                                        <div class="request-info">
                                            <h3>Gatepass Request</h3>
                                            <div class="request-meta">
                                                <span class="request-date"><i class="far fa-calendar-alt"></i> ${formattedDate} at ${formattedTime}</span>
                                                <span class="request-time-ago"><i class="far fa-clock"></i> ${timeElapsed}</span>
                                            </div>
                                            <p><strong>Ticket ID:</strong> <span style="color: #007bff; font-weight: bold; letter-spacing: 1px;"><i class="fas fa-ticket-alt"></i> ${displayTicketId}</span> <button class="btn-download-ticket" data-ticket-id="${displayTicketId}" data-request-info='${JSON.stringify({id: req._id, reason: req.reason, status: req.status, date: formattedDate, time: formattedTime, student: req.student?.name || 'Student'}).replace(/'/g, "&apos;")}' title="Download Ticket"><i class="fas fa-download"></i></button></p>
                                            <p><strong>Reason:</strong> ${req.reason}</p>
                                            ${statusInfo}
                                        </div>
                                        <div class="request-actions">
                                            <button class="btn-view-details" data-request-id="${req._id || index}">View Details</button>
                                        </div>
                                    </div>
                                `;
                            }).join('');
                            
                            requestList.innerHTML = requestItems;
                        }
                        
                        // Assemble modal
                        modalContent.appendChild(header);
                        modalContent.appendChild(filterContainer);
                        modalContent.appendChild(requestList);
                        requestsModal.appendChild(modalContent);
                        
                        // Add to document
                        document.body.appendChild(requestsModal);
                        
                        // Add event listener to close when clicking outside
                        window.onclick = function(event) {
                            if (event.target === requestsModal) {
                                // Add fade-out animation before removing
                                requestsModal.classList.add('fade-out');
                                setTimeout(() => {
                                    requestsModal.remove();
                                }, 300);
                            }
                        };
                        
                        // Add filter and sorting functionality
                        const filterButtons = document.querySelectorAll('.filter-btn');
                        filterButtons.forEach(button => {
                            button.addEventListener('click', function() {
                                const action = this.getAttribute('data-action');
                                const sort = this.getAttribute('data-sort');
                                
                                // Handle clear history action
                                if (action === 'clear') {
                                    if (confirm('Are you sure you want to clear your request history? This will permanently delete ALL requests.')) {
                                        // Get the token for API request
                                        const token = localStorage.getItem('token') || localStorage.getItem('studentToken');
                                        if (!token) {
                                            showNotification('Authentication required to clear history.', 'error');
                                            return;
                                        }
                                        
                                        // Store ALL request IDs to be cleared (including pending ones)
                                        const requestsToClear = requests.map(req => req._id);
                                            
                                        if (requestsToClear.length === 0) {
                                            showNotification('No requests to clear.', 'info');
                                            return;
                                        }
                                        
                                        // Store the cleared request IDs in localStorage for persistence
                                        const existingClearedRequests = JSON.parse(localStorage.getItem('clearedRequests') || '[]');
                                        const updatedClearedRequests = [...existingClearedRequests, ...requestsToClear];
                                        localStorage.setItem('clearedRequests', JSON.stringify(updatedClearedRequests));
                                        
                                        // Close current modal
                                        document.getElementById('requestsModal').remove();
                                        
                                        // Display empty state
                                        displayStudentRequests([]);
                                        showNotification('All requests cleared permanently.', 'success');
                                        return;
                                    }
                                    return;
                                }
                                
                                // Priority sort removed
                                
                                // Handle regular filtering
                                // Remove active class from all buttons except sort and clear buttons
                                filterButtons.forEach(btn => {
                                    if (!btn.classList.contains('sort-btn') && !btn.classList.contains('clear-btn')) {
                                        btn.classList.remove('active');
                                    }
                                });
                                
                                // Add active class to clicked button if it's a filter button
                                if (!this.classList.contains('sort-btn') && !this.classList.contains('clear-btn')) {
                                    this.classList.add('active');
                                }
                                
                                const filter = this.getAttribute('data-filter');
                                if (!filter) return;
                                
                                const requestItems = document.querySelectorAll('.request-item');
                                
                                requestItems.forEach(item => {
                                    if (filter === 'all') {
                                        item.style.display = 'flex';
                                    } else {
                                        const itemStatus = item.getAttribute('data-status');
                                        if (itemStatus === filter) {
                                            item.style.display = 'flex';
                                        } else {
                                            item.style.display = 'none';
                                        }
                                    }
                                });
                            });
                        });
                        
                        // Add view details button functionality
                        const viewDetailsButtons = document.querySelectorAll('.btn-view-details');
                        viewDetailsButtons.forEach(button => {
                            button.addEventListener('click', function() {
                                const requestId = this.getAttribute('data-request-id');
                                const requestItem = this.closest('.request-item');
                                
                                // Toggle expanded class
                                if (requestItem.classList.contains('expanded')) {
                                    requestItem.classList.remove('expanded');
                                    this.textContent = 'View Details';
                                } else {
                                    // Remove expanded class from all items
                                    document.querySelectorAll('.request-item.expanded').forEach(item => {
                                        item.classList.remove('expanded');
                                        item.querySelector('.btn-view-details').textContent = 'View Details';
                                    });
                                    
                                    requestItem.classList.add('expanded');
                                    this.textContent = 'Hide Details';
                                }
                            });
                        });
                        
                        // Add download ticket functionality
                        const downloadTicketButtons = document.querySelectorAll('.btn-download-ticket');
                        downloadTicketButtons.forEach(button => {
                            button.addEventListener('click', function(e) {
                                e.stopPropagation(); // Prevent event bubbling
                                const ticketId = this.getAttribute('data-ticket-id');
                                const requestInfoStr = this.getAttribute('data-request-info');
                                const requestInfo = JSON.parse(requestInfoStr.replace(/&apos;/g, "'"));
                                
                                // Generate ticket content
                                downloadTicket(ticketId, requestInfo);
                            });
                        });
                    };
                }
                // Filter out any cleared requests from localStorage
                const clearedRequests = JSON.parse(localStorage.getItem('clearedRequests') || '[]');
                const filteredRequests = data.requests.filter(req => !clearedRequests.includes(req._id));
                
                // Display the filtered requests
                window.displayStudentRequests(filteredRequests);
                
            } catch (error) {
                console.error('Error fetching student requests:', error);
                showNotification('Error fetching your requests. Please try again.', 'error');
            }
        };
        
        // Call the temporary function
        window.fetchStudentRequests();
    }
}

// Function to show notification
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

// Function to show ticket as a compact virtual card with QR code
async function downloadTicket(ticketId, requestInfo) {
    console.log('Request Info received:', requestInfo);
    
    // Create modal backdrop
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop';
    document.body.appendChild(modalBackdrop);
    
    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<div class="spinner"></div><p>Loading ticket data...</p>';
    document.body.appendChild(loadingIndicator);
    
    // Store references to elements that need to be removed in case of errors
    let ticketContainer = null;
    
    try {
        // Generate ticket ID if not provided
        if (!ticketId && requestInfo) {
            ticketId = generateTicketId(requestInfo);
        }
        
        // Initialize enrollment number variable
        let enrollmentNumber = '';
        
        // Fetch enrollment number from the database - using multiple approaches to ensure we get it
        if (requestInfo) {
            try {
                // First check if enrollment number is directly available in the request object
                if (requestInfo.student && typeof requestInfo.student === 'object' && requestInfo.student.enrollmentNumber) {
                    enrollmentNumber = requestInfo.student.enrollmentNumber;
                    console.log('Got enrollment number directly from request object:', enrollmentNumber);
                }
                // If not available, check if studentEnrollment is available
                else if (requestInfo.studentEnrollment) {
                    enrollmentNumber = requestInfo.studentEnrollment;
                    console.log('Got enrollment number from studentEnrollment property:', enrollmentNumber);
                }
                // If still not available, make an API call to get the full request with populated student data
                else if (requestInfo._id) {
                    // Get token from localStorage
                    const token = localStorage.getItem('token') || localStorage.getItem('studentToken') || localStorage.getItem('hodToken');
                    
                    if (token) {
                        // Try to get request from HOD endpoint first (most likely to have full student data)
                        const hodResponse = await fetch(`http://localhost:5001/api/hod/request/${requestInfo._id}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        
                        if (hodResponse.ok) {
                            const hodData = await hodResponse.json();
                            console.log('Request data from HOD endpoint:', hodData);
                            
                            if (hodData.success && hodData.request && hodData.request.student) {
                                if (typeof hodData.request.student === 'object') {
                                    enrollmentNumber = hodData.request.student.enrollmentNumber || '';
                                    console.log('Fetched enrollment number from HOD endpoint:', enrollmentNumber);
                                }
                            }
                        } else {
                            // Fallback to generic request endpoint
                            const response = await fetch(`http://localhost:5001/api/student/approved-request/${requestInfo._id}`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            
                            if (response.ok) {
                                const data = await response.json();
                                console.log('Request data from student endpoint:', data);
                                
                                if (data.success && data.request && data.request.student) {
                                    if (typeof data.request.student === 'object') {
                                        enrollmentNumber = data.request.student.enrollmentNumber || '';
                                        console.log('Fetched enrollment number from student endpoint:', enrollmentNumber);
                                    }
                                }
                            }
                        }
                    }
                }
                
                // If we still don't have the enrollment number, try to get it from localStorage
                if (!enrollmentNumber) {
                    const userData = localStorage.getItem('userData') || localStorage.getItem('user') || localStorage.getItem('currentUser');
                    if (userData) {
                        try {
                            const parsedUserData = JSON.parse(userData);
                            if (parsedUserData.enrollmentNumber) {
                                enrollmentNumber = parsedUserData.enrollmentNumber;
                                console.log('Got enrollment number from localStorage:', enrollmentNumber);
                            }
                        } catch (e) {
                            console.error('Error parsing user data from localStorage:', e);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching enrollment number:', error);
            }
        }
        
        // Format date
        const requestDate = requestInfo.createdAt ? new Date(requestInfo.createdAt) : new Date();
        const formattedDate = requestDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Calculate expiration time (30 minutes from now)
        const expirationDate = new Date();
        expirationDate.setMinutes(expirationDate.getMinutes() + 30);
        const formattedExpirationTime = expirationDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Create compact ticket container with enrollment number and expiration time
        ticketContainer = document.createElement('div');
        ticketContainer.className = 'compact-ticket';
        ticketContainer.innerHTML = `
            <div class="ticket-header">
                <h3>E-PASS</h3>
                <button class="close-ticket" id="close-ticket-btn">&times;</button>
            </div>
            <div class="ticket-body">
                <div class="ticket-info">
                    <p><strong>ID:</strong> ${ticketId}</p>
                    <p><strong>Enrollment:</strong> ${enrollmentNumber || 'Not available'}</p>
                    <p><strong>Reason:</strong> ${requestInfo.reason || 'Not specified'}</p>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${requestInfo.status}">${requestInfo.status.toUpperCase()}</span></p>
                    <p><strong>Expires:</strong> <span class="expiration-time">${formattedExpirationTime}</span></p>
                </div>
                <div class="ticket-qr" id="ticket-qr-${ticketId}"></div>
            </div>
        `;
        
        // Log the final HTML content for debugging
        console.log('Ticket HTML content:', ticketContainer.innerHTML);
        
        // Remove loading indicator
        document.body.removeChild(loadingIndicator);
        
        // Append ticket to body
        document.body.appendChild(ticketContainer);
        
        // Generate QR code data
        const qrData = JSON.stringify({
            id: ticketId,
            reason: requestInfo.reason || 'Not specified',
            status: requestInfo.status,
            date: formattedDate
        });
        
        // Create QR code using a more realistic approach
        const qrContainer = document.getElementById(`ticket-qr-${ticketId}`);
        
        // Check if we can use a QR code library
        if (typeof QRCode !== 'undefined') {
            // Use QRCode library if available
            new QRCode(qrContainer, {
                text: qrData,
                width: 128,
                height: 128,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            // Fallback to our custom QR code implementation
            const qrSize = 128;
            const qrCanvas = document.createElement('canvas');
            qrCanvas.width = qrSize;
            qrCanvas.height = qrSize;
            const qrContext = qrCanvas.getContext('2d');
            
            // Simple representation of a QR code
            qrContext.fillStyle = '#ffffff';
            qrContext.fillRect(0, 0, qrSize, qrSize);
            qrContext.fillStyle = '#000000';
            
            // Draw a pattern that resembles a QR code
            const blockSize = Math.floor(qrSize / 10);
            
            // Use a more deterministic pattern based on the ticket data
            const dataString = ticketId + requestInfo.reason;
            
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    // Create a pattern based on the ticket data to make it unique
                    const charIndex = (i * 10 + j) % dataString.length;
                    const charCode = dataString.charCodeAt(charIndex);
                    
                    if (charCode % 2 === 0 || (i + j) % 3 === 0) {
                        qrContext.fillRect(i * blockSize, j * blockSize, blockSize, blockSize);
                    }
                }
            }
            
            // Add corner squares (typical for QR codes)
            qrContext.fillRect(0, 0, blockSize * 3, blockSize * 3);
            qrContext.fillRect(qrSize - blockSize * 3, 0, blockSize * 3, blockSize * 3);
            qrContext.fillRect(0, qrSize - blockSize * 3, blockSize * 3, blockSize * 3);
            
            // Add white squares inside the corner markers
            qrContext.fillStyle = '#ffffff';
            qrContext.fillRect(blockSize, blockSize, blockSize, blockSize);
            qrContext.fillRect(qrSize - blockSize * 2, blockSize, blockSize, blockSize);
            qrContext.fillRect(blockSize, qrSize - blockSize * 2, blockSize, blockSize);
            
            // Add text label to indicate this is a QR code
            qrContext.fillStyle = '#000000';
            qrContext.font = '10px Arial';
            qrContext.fillText('Scan QR Code', qrSize/2 - 35, qrSize - 5);
            
            qrContainer.appendChild(qrCanvas);
        }
    } catch (error) {
        console.error('Error generating ticket:', error);
        // Remove loading indicator if there was an error
        if (document.body.contains(loadingIndicator)) {
            document.body.removeChild(loadingIndicator);
        }
        showNotification('Error generating ticket', 'error');
        return;
    }
    
    // Function to close the ticket
    const closeTicket = function() {
        if (document.body.contains(ticketContainer)) {
            document.body.removeChild(ticketContainer);
        }
        if (document.body.contains(modalBackdrop)) {
            document.body.removeChild(modalBackdrop);
        }
    };
    
    // Close ticket when clicking the close button
    document.getElementById('close-ticket-btn').onclick = closeTicket;
    
    // Close ticket when clicking outside
    modalBackdrop.onclick = closeTicket;
    
    // Set auto-expiration timer (30 minutes = 1800000 milliseconds)
    const expirationTimer = setTimeout(function() {
        closeTicket();
        showNotification('E-Pass has expired', 'info');
    }, 30 * 60 * 1000); // 30 minutes
    
    // Add countdown timer to update every minute
    const countdownInterval = setInterval(function() {
        const now = new Date();
        const timeLeft = expirationDate - now;
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            return;
        }
        
        // Calculate minutes and seconds left
        const minutesLeft = Math.floor(timeLeft / (60 * 1000));
        const secondsLeft = Math.floor((timeLeft % (60 * 1000)) / 1000);
        
        // Update the expiration time display
        const expirationElement = ticketContainer.querySelector('.expiration-time');
        if (expirationElement) {
            expirationElement.textContent = `${formattedExpirationTime} (${minutesLeft}m ${secondsLeft}s left)`;
            
            // Change color when less than 5 minutes remaining
            if (minutesLeft < 5) {
                expirationElement.style.color = 'red';
                expirationElement.style.fontWeight = 'bold';
            }
        }
    }, 1000); // Update every second
    
    // No PDF download functionality as per requirement
    
    // Show success notification
    showNotification('Ticket generated successfully', 'success');
}

// Function to generate consistent ticket IDs across the application
function generateTicketId(request) {
    // If the request has a ticketId property, use it
    if (request && request.ticketId) {
        return request.ticketId;
    }
    
    // Otherwise, generate a consistent ID based on the MongoDB document ID
    if (request && request._id) {
        return `GP-${request._id.substring(0, 8)}`.toUpperCase();
    }
    
    // Fallback for when no ID is available
    return 'GP-UNKNOWN';
}

// Function to clear request history permanently
function clearRequestHistory() {
    const token = localStorage.getItem('token') || localStorage.getItem('studentToken');
    if (!token) {
        showNotification('Authentication required to clear history.', 'error');
        return false;
    }
    
    // Clear the localStorage entry
    localStorage.removeItem('clearedRequests');
    showNotification('Request history reset successfully.', 'success');
    return true;
}

// Make the functions globally accessible
window.checkAndCallFetchRequests = checkAndCallFetchRequests;
window.downloadTicket = downloadTicket;
window.generateTicketId = generateTicketId;
window.clearRequestHistory = clearRequestHistory;
