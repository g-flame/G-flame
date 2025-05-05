/**
 * By g-flame https://github.com/g-flame
 */

// Configuration options
const CONFIG = {
  username: 'g-flame-oss',
  apiEndpoint: 'https://api.github.com/users/',
  sortParams: '?sort=updated&direction=desc',
  loadingTimeout: 1500,
  languageColors: {
    JavaScript: '#f1e05a',
    Python: '#3572A5',
    HTML: '#e34c26',
    CSS: '#563d7c',
    TypeScript: '#2b7489',
    Java: '#b07219',
    'C#': '#178600',
    PHP: '#4F5D95',
    'C++': '#f34b7d',
    Ruby: '#701516',
    Go: '#00ADD8',
    Swift: '#ffac45',
    Kotlin: '#F18E33',
    Rust: '#dea584',
    Dart: '#00B4AB',
    error: '#f77062',
    unknown: '#858585',
  },
  // Fallback project when GitHub API fails
  fallbackProject: [{
    name: 'Default Project',
    description: 'This appears when GitHub projects cannot be loaded',
    html_url: '#',
    language: 'error',
  }]
};

/**
 * Project handler module - manages project display and data handling
 */
const ProjectHandler = {
  /**
   * Get the color for a programming language badge
   * @param {string} language - Programming language name
   * @return {string} Color hex value
   */
  getColorForLanguage(language) {
    return CONFIG.languageColors[language] || CONFIG.languageColors.unknown;
  },

  /**
   * Create a language badge HTML for a project
   * @param {Object} project - Project data object
   * @return {string} HTML for language badge
   */
  createLanguageBadge(project) {
    const language = project.language || 'other';
    const color = this.getColorForLanguage(language);
    
    return `
      <div class="language-badge">
        <span class="language-color" style="background-color: ${color}"></span>
        ${language}
      </div>
    `;
  },

  /**
   * Get project data with fallbacks for missing properties
   * @param {Object} project - Project data object
   * @return {Object} Safe project data with defaults
   */
  getSafeProjectData(project) {
    return {
      name: project.name || 'Unnamed Repository',
      description: project.description || 'No description provided for this project',
      url: project.html_url || `https://github.com/${CONFIG.username}`,
      language: project.language || 'unknown'
    };
  },

  /**
   * Create a project card element
   * @param {Object} project - Project data object
   * @return {HTMLElement} Project card element
   */
  createProjectCard(project) {
    const safeData = this.getSafeProjectData(project);
    const card = document.createElement('div');
    card.className = 'projects__card';
    
    card.innerHTML = `
      ${this.createLanguageBadge(project)}
      <h2>${safeData.name}</h2>
      <img id="project__img" src="./assets/placeholder.svg" alt="${safeData.name}">
      <p>${safeData.description}</p>
      <a href="${safeData.url}" target="_blank" class="project-link">
        <button>View Project</button>
      </a>
    `;

    // Make card clickable but don't trigger on button click
    card.addEventListener('click', (event) => {
      // Don't trigger if clicking on button or its descendant
      if (!event.target.closest('.project-link')) {
        window.open(safeData.url, '_blank');
      }
    });

    return card;
  },

  /**
   * Display projects in the projects container
   * @param {Array} projects - Array of project data objects
   */
  displayProjects(projects) {
    const projectsArea = document.getElementById('projects');
    if (!projectsArea) return;

    // Clear any existing content
    projectsArea.innerHTML = '';
    
    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    projects.forEach(project => {
      fragment.appendChild(this.createProjectCard(project));
    });
    
    projectsArea.appendChild(fragment);
    
    // Adjust section height based on project count
    this.adjustProjectsHeight(projects.length);
  },

  /**
   * Adjust projects section height based on number of projects
   * @param {number} numberOfProjects - Number of projects to display
   */
  adjustProjectsHeight(numberOfProjects) {
    const projectsSection = document.getElementById('projects-section');
    if (projectsSection && numberOfProjects > 3) {
      projectsSection.style.height = 'auto';
      projectsSection.style.padding = '100px 0';
    }
  },

  /**
   * Load projects from GitHub API
   */
  async loadProjects() {
    const projectsArea = document.getElementById('projects');
    if (!projectsArea) {
      console.error('Projects container not found on page');
      return;
    }

    const apiUrl = `${CONFIG.apiEndpoint}${CONFIG.username}/repos${CONFIG.sortParams}`;
    
    try {
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`GitHub API request failed: ${response.status}`);
      }
      
      const projectData = await response.json();
      
      if (projectData.length === 0) {
        projectsArea.innerHTML = '<div class="error">No projects found</div>';
        return;
      }
      
      this.displayProjects(projectData);
      
    } catch (error) {
      console.error('Could not load GitHub projects:', error);
      this.displayProjects(CONFIG.fallbackProject);
    }
  }
};

/**
 * UI handler module - manages UI interactions
 */
const UIHandler = {
  /**
   * Toggle mobile navigation menu
   */
  toggleMobileMenu() {
    const menuButton = document.querySelector('#mobile-menu');
    const navLinks = document.querySelector('.navbar__menu');
    
    if (menuButton && navLinks) {
      menuButton.classList.toggle('is-active');
      navLinks.classList.toggle('active');
    }
  },

  /**
   * Initialize smooth scrolling for anchor links
   */
  initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });
  },

  /**
   * Hide loading overlay after timeout
   */
  hideLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
      setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.addEventListener('transitionend', () => {
          overlay.style.display = 'none';
        });
      }, CONFIG.loadingTimeout);
    }
  },

  /**
   * Initialize UI event listeners
   */
  init() {
    // Setup mobile menu
    const menuButton = document.querySelector('#mobile-menu');
    if (menuButton) {
      menuButton.addEventListener('click', this.toggleMobileMenu);
    }
    
    // Setup smooth scrolling
    this.initSmoothScrolling();
    
    // Hide loading overlay after page loads
    window.addEventListener('load', this.hideLoadingOverlay);
  }
};

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI components
  UIHandler.init();
  
  // Load GitHub projects
  ProjectHandler.loadProjects();
});

// loader timeout 
setTimeout(() => {
  document.querySelector('.loader').classList.add('hidden');
}, 2500); 

// Background Image and text rotation handler
const ProfileBackgroundRotator = {
  // Define the images for each text state
  imageMap: {
    "Open-source dev": "./assets/github.png",
    "Learner": "./assets/learn.png",
    "Linux lover": "./assets/linux.png",
    "Ado Fan": "./assets/ado.png"
  },

  // Update the background image based on the current text
  updateBackground(text) {
    const bgElement = document.getElementById('profile-bg');
    if (bgElement && this.imageMap[text]) {
      // Add fade-out class
      bgElement.classList.add('fade-out');
      
      // After fade out completes, change the background image and fade in
      setTimeout(() => {
        bgElement.style.backgroundImage = `url('${this.imageMap[text]}')`;
        bgElement.classList.remove('fade-out');
        bgElement.classList.add('fade-in');
        
        // Remove the fade-in class after animation completes
        setTimeout(() => {
          bgElement.classList.remove('fade-in');
        }, 500);
      }, 300);
    }
  }
};

// Modified text rotation with background image changes
const textAndBackgroundRotation = () => {
  const text = document.querySelector(".sec-text");
  if (!text) return;
  
  const rotationStates = [
    { text: "Open-source dev", delay: 0 },
    { text: "Learner", delay: 4000 },
    { text: "Linux lover", delay: 8000 },
    { text: "Ado Fan", delay: 12000 }
  ];
  
  rotationStates.forEach(state => {
    setTimeout(() => {
      text.textContent = state.text;
      ProfileBackgroundRotator.updateBackground(state.text);
    }, state.delay);
  });
};

// Run the text and background rotation on page load
document.addEventListener('DOMContentLoaded', () => {
  textAndBackgroundRotation();
  // Repeat the rotation every 16 seconds
  setInterval(textAndBackgroundRotation, 16000);
});