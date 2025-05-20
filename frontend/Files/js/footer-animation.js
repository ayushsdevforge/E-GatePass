/**
 * Footer Animation Script
 * Adds modern interactive animations to the footer elements
 */

document.addEventListener('DOMContentLoaded', function() {
  initializeFooterAnimations();
});

/**
 * Initialize all footer animations
 */
function initializeFooterAnimations() {
  // Heart animation enhancements
  animateHeart();
  
  // Author name animation
  animateAuthorName();
  
  // Made with love section animation
  animateMadeWithLove();
  
  // Social icons animation
  animateSocialIcons();
  
  // Copyright animation
  animateCopyright();
}

/**
 * Enhanced heart animation
 */
function animateHeart() {
  const heart = document.querySelector('.heart');
  if (!heart) return;
  
  // Add click effect
  heart.addEventListener('click', function() {
    // Create and append multiple heart particles
    for (let i = 0; i < 5; i++) {
      createHeartParticle(this);
    }
    
    // Temporarily pause the animation and apply a pop effect
    this.style.animation = 'none';
    this.style.transform = 'scale(1.5)';
    this.style.color = '#ff3b5c';
    
    // Reset after the effect
    setTimeout(() => {
      this.style.transform = 'scale(1)';
      this.style.animation = 'heartbeat 2s infinite';
      this.style.color = '#ff4757';
    }, 300);
  });
  
  // Enhanced hover effect
  heart.addEventListener('mouseenter', function() {
    this.style.filter = 'drop-shadow(0 0 5px rgba(255, 71, 87, 0.8))';
  });
  
  heart.addEventListener('mouseleave', function() {
    this.style.filter = 'drop-shadow(0 0 2px rgba(255, 71, 87, 0.5))';
  });
}

/**
 * Create a heart particle effect
 * @param {HTMLElement} heartElement - The heart element
 */
function createHeartParticle(heartElement) {
  const particle = document.createElement('span');
  particle.innerHTML = '❤️';
  particle.className = 'heart-particle';
  particle.style.position = 'absolute';
  particle.style.fontSize = '0.6em';
  particle.style.opacity = '0.8';
  particle.style.pointerEvents = 'none';
  particle.style.zIndex = '1000';
  
  // Get heart position
  const rect = heartElement.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  
  // Random position around the heart
  const angle = Math.random() * Math.PI * 2;
  const distance = 5 + Math.random() * 20;
  const startX = x + Math.cos(angle) * distance;
  const startY = y + Math.sin(angle) * distance;
  
  // Set initial position
  particle.style.left = `${startX}px`;
  particle.style.top = `${startY}px`;
  
  // Add to body
  document.body.appendChild(particle);
  
  // Animate the particle
  const duration = 500 + Math.random() * 1000;
  const endX = startX + (Math.random() - 0.5) * 100;
  const endY = startY - 50 - Math.random() * 50;
  
  particle.animate([
    { transform: `translate(0, 0) scale(1) rotate(0deg)`, opacity: 0.8 },
    { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0) rotate(${Math.random() * 360}deg)`, opacity: 0 }
  ], {
    duration: duration,
    easing: 'cubic-bezier(0.1, 0.7, 1.0, 0.1)'
  });
  
  // Remove particle after animation
  setTimeout(() => {
    document.body.removeChild(particle);
  }, duration);
}

/**
 * Animate the author name
 */
function animateAuthorName() {
  const authorName = document.querySelector('.author-name');
  if (!authorName) return;
  
  // Store original text for hover effect
  const originalText = authorName.textContent;
  
  authorName.addEventListener('mouseenter', function() {
    // Add a subtle glow effect
    this.style.textShadow = '0 0 8px rgba(255, 215, 0, 0.5)';
    
    // Trigger a text scramble effect on hover
    textScramble(this, originalText);
  });
  
  authorName.addEventListener('mouseleave', function() {
    this.style.textShadow = 'none';
  });
}

/**
 * Text scramble effect
 * @param {HTMLElement} element - Element to apply effect to
 * @param {string} finalText - Final text to display
 */
function textScramble(element, finalText) {
  const chars = '!<>-_\/[]{}—=+*^?#_____';
  let iteration = 0;
  
  clearInterval(element.timer);
  
  element.timer = setInterval(() => {
    element.textContent = finalText
      .split('')
      .map((letter, index) => {
        if (index < iteration) {
          return finalText[index];
        }
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join('');
    
    if (iteration >= finalText.length) {
      clearInterval(element.timer);
    }
    
    iteration += 1 / 3;
  }, 30);
}

/**
 * Animate the made with love section
 */
function animateMadeWithLove() {
  const madeWithLove = document.querySelector('.made-with-love');
  if (!madeWithLove) return;
  
  // Add a subtle floating animation
  let position = 0;
  let direction = 1;
  const amplitude = 2;
  const speed = 0.03;
  
  function floatAnimation() {
    position += speed * direction;
    
    if (position >= amplitude) {
      direction = -1;
    } else if (position <= -amplitude) {
      direction = 1;
    }
    
    madeWithLove.style.transform = `translateY(${position}px)`;
    requestAnimationFrame(floatAnimation);
  }
  
  floatAnimation();
  
  // Add hover effect
  madeWithLove.addEventListener('mouseenter', function() {
    this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
  });
  
  madeWithLove.addEventListener('mouseleave', function() {
    this.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
  });
}

/**
 * Animate social icons
 */
function animateSocialIcons() {
  const socialIcons = document.querySelectorAll('.social-icon');
  socialIcons.forEach(icon => {
    icon.addEventListener('mouseenter', function() {
      // Show the radial gradient background
      this.querySelector('i').style.transform = 'scale(1.2)';
      this.style.color = '#FFD700';
      
      // Show the before pseudo-element
      this.style.setProperty('--before-opacity', '1');
      this.style.setProperty('--before-transform', 'scale(1)');
    });
    
    icon.addEventListener('mouseleave', function() {
      this.querySelector('i').style.transform = 'scale(1)';
      this.style.color = '';
      
      // Hide the before pseudo-element
      this.style.setProperty('--before-opacity', '0');
      this.style.setProperty('--before-transform', 'scale(0.5)');
    });
  });
}

/**
 * Animate copyright section
 */
function animateCopyright() {
  const copyright = document.querySelector('.copyright');
  if (!copyright) return;
  
  // Add hover effect
  copyright.addEventListener('mouseenter', function() {
    this.style.background = 'rgba(255, 255, 255, 0.1)';
    this.style.transform = 'translateX(-5px)';
  });
  
  copyright.addEventListener('mouseleave', function() {
    this.style.background = 'rgba(255, 255, 255, 0.05)';
    this.style.transform = 'translateX(0)';
  });
}
// Modern Dynamic Background Effect
document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.hero');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '0';
  hero.appendChild(canvas);

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const particles = [];
  const particleCount = 100; // Increased particle count
  const maxDistance = 180; // Increased connection distance

  // Create particles with improved properties
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2.5 + 1.5, // Increased particle size
      color: `rgba(255, 215, 0, ${Math.random() * 0.5 + 0.3})`, // Increased opacity
      speedX: Math.random() * 0.5 - 0.25,
      speedY: Math.random() * 0.5 - 0.25,
      originalX: Math.random() * canvas.width,
      originalY: Math.random() * canvas.height,
      amplitude: Math.random() * 60 + 30, // Increased amplitude
      frequency: Math.random() * 0.02 + 0.01,
      phase: Math.random() * Math.PI * 2
    });
  }

  // Function to draw connecting lines
  const drawConnections = () => {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          const opacity = 1 - (distance / maxDistance);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 215, 0, ${opacity * 0.4})`; // Increased line opacity
          ctx.lineWidth = 1; // Increased line width
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  };

  // Function to draw particles with enhanced glow effect
  const drawParticle = (particle) => {
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    
    // Enhanced glow effect
    const gradient = ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, particle.radius * 3 // Increased glow radius
    );
    gradient.addColorStop(0, particle.color);
    gradient.addColorStop(0.5, `rgba(255, 215, 0, ${parseFloat(particle.color.split(',')[3]) * 0.5})`);
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fill();

    // Add a bright center
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
  };

  // Update particle positions with wave-like motion
  const updateParticles = () => {
    const time = Date.now() * 0.001;
    particles.forEach(particle => {
      particle.x = particle.originalX + Math.sin(time * particle.frequency + particle.phase) * particle.amplitude;
      particle.y = particle.originalY + Math.cos(time * particle.frequency + particle.phase) * particle.amplitude;
    });
  };

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    updateParticles();
    particles.forEach(drawParticle);
    
    // Draw connections
    drawConnections();
    
    requestAnimationFrame(animate);
  };

  animate();
});
