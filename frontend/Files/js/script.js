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
