// Change Password Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const changePasswordModal = document.getElementById('changePasswordModal');
  const changePasswordForm = document.getElementById('changePasswordForm');
  const passwordError = document.getElementById('passwordError');
  const passwordSuccess = document.getElementById('passwordSuccess');
  const newPasswordInput = document.getElementById('newPassword');
  const passwordStrengthBar = document.querySelector('.password-strength-bar');
  const passwordStrengthText = document.querySelector('.password-strength-text');
  const closeModalBtns = document.querySelectorAll('.close-modal');
  
  // Show change password modal
  function openChangePasswordModal() {
    if (changePasswordModal) {
      changePasswordModal.style.display = 'flex';
      document.body.classList.add('modal-open');
    }
  }
  
  // Hide change password modal
  function closeChangePasswordModal() {
    if (changePasswordModal) {
      changePasswordModal.style.display = 'none';
      document.body.classList.remove('modal-open');
      
      // Reset form and UI elements
      if (changePasswordForm) {
        changePasswordForm.reset();
        resetPasswordStrength();
      }
      
      // Clear messages
      if (passwordError) {
        passwordError.textContent = '';
        passwordError.style.display = 'none';
      }
      
      if (passwordSuccess) {
        passwordSuccess.textContent = '';
        passwordSuccess.style.display = 'none';
      }
    }
  }
  
  // Event listener for change password button
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openChangePasswordModal();
    });
  }
  
  // Event listeners for close modal buttons
  if (closeModalBtns) {
    closeModalBtns.forEach(btn => {
      btn.addEventListener('click', closeChangePasswordModal);
    });
  }
  
  // Close modal when clicking outside of it
  window.addEventListener('click', function(e) {
    if (e.target === changePasswordModal) {
      closeChangePasswordModal();
    }
  });
  
  // Close modal when escape key is pressed
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && changePasswordModal && changePasswordModal.style.display === 'flex') {
      closeChangePasswordModal();
    }
  });
  
  // Password strength checker
  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', function() {
      const password = this.value;
      updatePasswordStrength(password);
    });
  }
  
  // Update password strength indicator
  function updatePasswordStrength(password) {
    // Reset strength classes
    const strengthContainer = document.querySelector('.password-strength');
    strengthContainer.classList.remove('strength-weak', 'strength-medium', 'strength-good', 'strength-strong');
    
    if (!password) {
      resetPasswordStrength();
      return;
    }
    
    // Calculate password strength
    let strength = 0;
    
    // Length check
    if (password.length >= 8) {
      strength += 1;
    }
    
    // Contains lowercase letters
    if (/[a-z]/.test(password)) {
      strength += 1;
    }
    
    // Contains uppercase letters
    if (/[A-Z]/.test(password)) {
      strength += 1;
    }
    
    // Contains numbers
    if (/[0-9]/.test(password)) {
      strength += 1;
    }
    
    // Contains special characters
    if (/[^a-zA-Z0-9]/.test(password)) {
      strength += 1;
    }
    
    // Update UI based on strength
    let strengthText = '';
    let strengthClass = '';
    
    if (password.length < 6) {
      strengthText = 'Too short';
      strengthClass = 'strength-weak';
    } else if (strength <= 2) {
      strengthText = 'Weak';
      strengthClass = 'strength-weak';
    } else if (strength === 3) {
      strengthText = 'Medium';
      strengthClass = 'strength-medium';
    } else if (strength === 4) {
      strengthText = 'Good';
      strengthClass = 'strength-good';
    } else {
      strengthText = 'Strong';
      strengthClass = 'strength-strong';
    }
    
    // Update UI
    strengthContainer.classList.add(strengthClass);
    passwordStrengthText.textContent = strengthText;
  }
  
  // Reset password strength indicator
  function resetPasswordStrength() {
    const strengthContainer = document.querySelector('.password-strength');
    strengthContainer.classList.remove('strength-weak', 'strength-medium', 'strength-good', 'strength-strong');
    passwordStrengthText.textContent = 'Password strength';
  }
  
  // Handle change password form submission
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form values
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      // Clear previous messages
      hidePasswordError();
      hidePasswordSuccess();
      
      // Validate form
      if (!currentPassword || !newPassword || !confirmPassword) {
        showPasswordError('All fields are required');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        showPasswordError('New password and confirm password do not match');
        return;
      }
      
      // Validate password strength
      if (newPassword.length < 6) {
        showPasswordError('Password must be at least 6 characters long');
        return;
      }
      
      // Get token based on user role
      let token;
      let userRole;
      
      if (window.location.href.includes('hod-dashboard')) {
        token = localStorage.getItem('hodToken');
        userRole = 'HOD';
      } else if (window.location.href.includes('tg-dashboard')) {
        token = localStorage.getItem('tgToken');
        userRole = 'TG';
      }
      
      if (!token) {
        showPasswordError('You are not logged in. Please log in again.');
        return;
      }
      
      // Send change password request to server
      changePassword(currentPassword, newPassword, token, userRole);
    });
  }
  
  // Show password error message
  function showPasswordError(message) {
    if (passwordError) {
      passwordError.textContent = message;
      passwordError.style.display = 'block';
    }
  }
  
  // Hide password error message
  function hidePasswordError() {
    if (passwordError) {
      passwordError.textContent = '';
      passwordError.style.display = 'none';
    }
  }
  
  // Show password success message
  function showPasswordSuccess(message) {
    if (passwordSuccess) {
      passwordSuccess.textContent = message;
      passwordSuccess.style.display = 'block';
    }
  }
  
  // Hide password success message
  function hidePasswordSuccess() {
    if (passwordSuccess) {
      passwordSuccess.textContent = '';
      passwordSuccess.style.display = 'none';
    }
  }
  
  // Change password API call
  function changePassword(currentPassword, newPassword, token, userRole) {
    // Show loading state
    const submitBtn = changePasswordForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Changing...';
    submitBtn.disabled = true;
    
    fetch('http://localhost:5001/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    })
    .then(response => response.json())
    .then(data => {
      // Reset button state
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      
      if (data.success) {
        // Show success message in the form
        showPasswordSuccess('Password changed successfully!');
        
        // Show success notification
        showNotification(`${userRole} password changed successfully`, 'success');
        
        // Close modal after a short delay
        setTimeout(() => {
          closeChangePasswordModal();
        }, 2000);
      } else {
        // Show error message
        showPasswordError(data.message || 'Failed to change password');
      }
    })
    .catch(error => {
      // Reset button state
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      
      // Show error message
      showPasswordError('An error occurred. Please try again.');
      console.error('Change password error:', error);
    });
  }
  
  // Show notification
  function showNotification(message, type = 'info') {
    // Check if notification container exists, if not create it
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.className = 'notification-container';
      document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add icon based on notification type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    // Set notification content
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${icon}"></i>
        <p>${message}</p>
      </div>
    `;
    
    // Add notification to container
    notificationContainer.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
});
