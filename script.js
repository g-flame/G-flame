class GFlameWebsite {
  constructor() {
    this.navCards = document.querySelectorAll('.nav-card');
    this.progressBars = document.querySelectorAll('.progress-fill');
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupIntersectionObserver();
    this.initializeProgressBars();
    this.setupCardHoverEffects();
  }

  setupEventListeners() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', this.smoothScroll);
    });

    document.querySelectorAll('a[href^="http"]').forEach(link => {
      link.addEventListener('click', this.handleExternalLink);
    });

    document.addEventListener('keydown', this.handleKeyboard);
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          
          if (entry.target.classList.contains('progress-section')) {
            this.animateProgressBars();
          }
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('section, .status-card').forEach(section => {
      observer.observe(section);
    });
  }

  initializeProgressBars() {
    this.progressBars.forEach(bar => {
      bar.style.transform = 'scaleX(0)';
    });
  }

  animateProgressBars() {
    this.progressBars.forEach((bar, index) => {
      setTimeout(() => {
        bar.style.transform = 'scaleX(1)';
        bar.style.transition = 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
      }, index * 200);
    });
  }

  setupCardHoverEffects() {
    this.navCards.forEach(card => {
      card.addEventListener('mouseenter', this.handleCardHover);
      card.addEventListener('mouseleave', this.handleCardLeave);
      card.addEventListener('click', this.handleCardClick);
    });
  }

  handleCardHover = (e) => {
    const card = e.currentTarget;
    card.style.transform = 'translateY(-8px) scale(1.02)';
    card.style.boxShadow = '0 8px 40px rgba(0, 255, 136, 0.15)';
    
    const arrow = card.querySelector('.card-arrow');
    if (arrow) {
      arrow.style.transform = 'translateX(5px)';
    }
  }

  handleCardLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = 'translateY(0) scale(1)';
    card.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    
    const arrow = card.querySelector('.card-arrow');
    if (arrow) {
      arrow.style.transform = 'translateX(0)';
    }
  }

  handleCardClick = (e) => {
    const card = e.currentTarget;
    const href = card.getAttribute('href');
    
    if (href && href.startsWith('http')) {
      card.style.opacity = '0.7';
      card.style.pointerEvents = 'none';
      
      const loadingDot = document.createElement('div');
      loadingDot.className = 'loading-dot';
      loadingDot.innerHTML = '⚡';
      loadingDot.style.cssText = `
        position: absolute;
        top: 50%;
        right: 1rem;
        transform: translateY(-50%);
        animation: pulse 1s ease-in-out infinite;
      `;
      
      card.appendChild(loadingDot);
      
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
        if (loadingDot.parentNode) {
          loadingDot.remove();
        }
      }, 3000);
    }
  }

  handleExternalLink = (e) => {
    const link = e.currentTarget;
    link.style.transform = 'scale(0.95)';
    setTimeout(() => {
      link.style.transform = 'scale(1)';
    }, 150);
  }

  smoothScroll = (e) => {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  handleKeyboard = (e) => {
    if (e.key === 'Escape') {
      this.resetAllStates();
    }
    
    if (e.key === 'Enter' && document.activeElement.classList.contains('nav-card')) {
      document.activeElement.click();
    }
  }

  resetAllStates() {
    this.navCards.forEach(card => {
      card.style.transform = 'translateY(0) scale(1)';
      card.style.opacity = '1';
      card.style.pointerEvents = 'auto';
      
      const loadingDot = card.querySelector('.loading-dot');
      if (loadingDot) {
        loadingDot.remove();
      }
    });
  }
}

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};





document.addEventListener('DOMContentLoaded', () => {
  new GFlameWebsite();
  console.log('Website loaded');
});

window.addEventListener('error', (e) => {
  console.error('Error:', e.error);
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GFlameWebsite };
}