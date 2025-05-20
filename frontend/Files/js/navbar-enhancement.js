// Navbar Enhancement JavaScript
document.addEventListener('DOMContentLoaded', function() {
    enhanceNavbar();
    handleNavbarOnScroll();
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

function enhanceNavbar() {
    // Add a modern glass effect to the navbar
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        // Add classes for styling
        navbar.classList.add('modern-navbar');
        
        // Create and add the background blur effect element
        const blurEffect = document.createElement('div');
        blurEffect.className = 'navbar-blur-effect';
        navbar.appendChild(blurEffect);
        
        // Add glow effect behind the logo
        const logo = document.querySelector('.logo');
        if (logo) {
            const logoGlow = document.createElement('div');
            logoGlow.className = 'logo-glow';
            logo.appendChild(logoGlow);
            
            // Position the glow behind the logo content
            logo.style.position = 'relative';
            logo.querySelector('a').style.position = 'relative';
            logo.querySelector('a').style.zIndex = '2';
            logoGlow.style.zIndex = '1';
        }
    }
    
    // Add hover effects to menu items
    const menuItems = document.querySelectorAll('.main-menu ul li a:not(.btn)');
    menuItems.forEach(item => {
        item.classList.add('menu-item-hover');
        
        // Create and add the hover indicator
        const hoverIndicator = document.createElement('span');
        hoverIndicator.className = 'hover-indicator';
        item.appendChild(hoverIndicator);
    });
    
    // Add button animations
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
        btn.classList.add('animated-btn');
    });
}
