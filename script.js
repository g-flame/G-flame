/**
 * ┌─────────────────────────────────────────────────────┐
 * │                   CONFIGURATION                     │
 * └─────────────────────────────────────────────────────┘
 */
const CONFIG = {
  // GitHub API settings
  github: {
    username: 'g-flame-oss',
    apiEndpoint: 'https://api.github.com/users/',
    sortParams: '?sort=updated&direction=desc',
    cacheExpiry: 3600000, // Cache expiry time in milliseconds (1 hour)
  },
  
  // UI settings
  ui: {
    loadingTimeout: 1000, // Reduced from 1500ms
    defaultImagePath: './assets/placeholder.svg',
    projectsPerPage: 6, // For potential pagination
  },
  
  // Repository-specific image mapping
  repoImages: {
    'sm-a127f-Root-gsi-guide': 'https://i.postimg.cc/CLVZMjrV/sm-a12-root.png',
    'lenovok8plus-root-guide': 'https://i.postimg.cc/KjtRrzzV/lenovo-root.jpg',
    '.github': 'https://i.postimg.cc/TPHLTFFk/github.png',
    'Airlink-installer': 'https://i.postimg.cc/W3FDzSPs/airlink.png',
    'skyport': 'https://i.postimg.cc/KcTky9NN/skyport.png',
    'android_device_lenovo_marino': 'https://i.postimg.cc/85276W1M/lenovo.jpg',
  },
  
  // Programming language colors
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
  
  // Fallback project to display when API fails
  fallbackProject: [{
    name: 'Fatal errors',
    description: 'This appears when GitHub projects load failed!',
    html_url: '#',
    language: 'error',
  }]
};

/**
 * ┌─────────────────────────────────────────────────────┐
 * │                   LOGGER UTILITY                    │
 * └─────────────────────────────────────────────────────┘
 */
const Logger = {
  /**
   * Log levels
   */
  LEVELS: {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    PERFORMANCE: 'PERFORMANCE'
  },
  
  /**
   * Current logging level
   */
  currentLevel: 'INFO',
  
  /**
   * Set the current logging level
   * @param {string} level - Log level to set
   */
  setLevel(level) {
    if (this.LEVELS[level]) {
      this.currentLevel = level;
      this.info(`Log level set to ${level}`);
    }
  },
  
  /**
   * Format log message with timestamp and level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @returns {string} - Formatted log message
   */
  formatMessage(level, message) {
    return `[${new Date().toISOString()}] [${level}] ${message}`;
  },
  
  /**
   * Log a debug message
   * @param {string} message - Message to log
   * @param {Object} [data] - Optional data to log
   */
  debug(message, data) {
    const formattedMsg = this.formatMessage(this.LEVELS.DEBUG, message);
    console.log(formattedMsg, data || '');
  },
  
  /**
   * Log an info message
   * @param {string} message - Message to log
   * @param {Object} [data] - Optional data to log
   */
  info(message, data) {
    const formattedMsg = this.formatMessage(this.LEVELS.INFO, message);
    console.log(formattedMsg, data || '');
  },
  
  /**
   * Log a warning message
   * @param {string} message - Message to log
   * @param {Object} [data] - Optional data to log
   */
  warn(message, data) {
    const formattedMsg = this.formatMessage(this.LEVELS.WARN, message);
    console.warn(formattedMsg, data || '');
  },
  
  /**
   * Log an error message
   * @param {string} message - Message to log
   * @param {Error} [error] - Optional error object
   */
  error(message, error) {
    const formattedMsg = this.formatMessage(this.LEVELS.ERROR, message);
    console.error(formattedMsg, error || '');
  },
  
  /**
   * Log performance measurement
   * @param {string} label - Performance measurement label
   * @param {function} fn - Function to measure
   * @returns {*} - Result of measured function
   */
  measurePerformance(label, fn) {
    const startTime = performance.now();
    try {
      const result = fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(this.formatMessage(this.LEVELS.PERFORMANCE, 
        `${label} completed in ${duration.toFixed(2)}ms`));
      
      return result;
    } catch (error) {
      this.error(`Error in ${label}`, error);
      throw error;
    }
  },
  
  /**
   * Create a performance mark
   * @param {string} name - Mark name
   */
  mark(name) {
    performance.mark(name);
    this.debug(`Performance mark: ${name}`);
  },
  
  /**
   * Measure between performance marks
   * @param {string} name - Measurement name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   */
  measure(name, startMark, endMark) {
    try {
      performance.measure(name, startMark, endMark);
      const duration = performance.getEntriesByName(name, 'measure')[0].duration;
      console.log(this.formatMessage(this.LEVELS.PERFORMANCE, 
        `${name}: ${duration.toFixed(2)}ms`));
    } catch (error) {
      this.error(`Failed to measure ${name}`, error);
    }
  }
};

/**
 * ┌─────────────────────────────────────────────────────┐
 * │                   CACHE HANDLER                     │
 * └─────────────────────────────────────────────────────┘
 */
const CacheHandler = {
  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {*|null} - Cached data or null if not found/expired
   */
  get(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const { value, expiry } = JSON.parse(item);
      if (Date.now() > expiry) {
        this.remove(key);
        return null;
      }
      
      Logger.debug(`Cache hit for ${key}`);
      return value;
    } catch (error) {
      Logger.error(`Failed to get cache for ${key}`, error);
      return null;
    }
  },
  
  /**
   * Set cache data
   * @param {string} key - Cache key
   * @param {*} value - Data to cache
   * @param {number} [ttl=CONFIG.github.cacheExpiry] - Time to live in milliseconds
   */
  set(key, value, ttl = CONFIG.github.cacheExpiry) {
    try {
      const item = {
        value,
        expiry: Date.now() + ttl
      };
      
      localStorage.setItem(key, JSON.stringify(item));
      Logger.debug(`Cache set for ${key}`);
    } catch (error) {
      Logger.error(`Failed to set cache for ${key}`, error);
    }
  },
  
  /**
   * Remove cached data
   * @param {string} key - Cache key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      Logger.debug(`Cache removed for ${key}`);
    } catch (error) {
      Logger.error(`Failed to remove cache for ${key}`, error);
    }
  }
};

/**
 * ┌─────────────────────────────────────────────────────┐
 * │                   PROJECT HANDLER                   │
 * └─────────────────────────────────────────────────────┘
 */
const ProjectHandler = {
  /**
   * Get color for programming language from configuration
   * @param {string} language - Programming language name
   * @returns {string} - Hex color code
   */
  getColorForLanguage(language) {
    return CONFIG.languageColors[language] || CONFIG.languageColors.unknown;
  },

  /**
   * Create language badge HTML for project card
   * @param {Object} project - Project data from GitHub API
   * @returns {string} - HTML for language badge
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
   * Get image URL for a specific repository
   * @param {string} repoName - Repository name
   * @returns {string} - Image URL
   */
  getImageForRepo(repoName) {
    return CONFIG.repoImages[repoName] || CONFIG.ui.defaultImagePath;
  },

  /**
   * Safely extract project data, providing defaults for missing properties
   * @param {Object} project - Project data from GitHub API
   * @returns {Object} - Sanitized project data
   */
  getSafeProjectData(project) {
    return {
      name: project.name || 'Unnamed Repository',
      description: project.description || 'No description provided for this project',
      url: project.html_url || `https://github.com/${CONFIG.github.username}`,
      language: project.language || 'unknown',
      imageUrl: this.getImageForRepo(project.name)
    };
  },

  /**
   * Create HTML card element for a project
   * @param {Object} project - Project data from GitHub API
   * @returns {HTMLElement} - Project card DOM element
   */
  createProjectCard(project) {
    Logger.mark(`card-start-${project.name}`);
    const safeData = this.getSafeProjectData(project);
    const card = document.createElement('div');
    card.className = 'projects__card';
    
    // Create the card structure
    card.innerHTML = `
      <img src="${safeData.imageUrl}" alt="${safeData.name}" class="project-image" loading="lazy">
      ${this.createLanguageBadge(project)}
      <h2>${safeData.name}</h2>
      <p>${safeData.description}</p>
      <a href="${safeData.url}" target="_blank" class="project-link">
        <button>View Project</button>
      </a>
    `;

    // Add event delegation instead of separate event listeners
    card.addEventListener('click', (event) => {
      if (!event.target.closest('.project-link')) {
        window.open(safeData.url, '_blank');
      }
    });

    Logger.mark(`card-end-${project.name}`);
    Logger.measure(`create-card-${project.name}`, `card-start-${project.name}`, `card-end-${project.name}`);
    return card;
  },

  /**
   * Display projects in the DOM efficiently using document fragment
   * @param {Array} projects - Array of project objects
   */
  displayProjects(projects) {
    Logger.mark('display-projects-start');
    const projectsArea = document.getElementById('projects');
    if (!projectsArea) {
      Logger.error('Projects container not found');
      return;
    }

    // Clear current content
    while (projectsArea.firstChild) {
      projectsArea.removeChild(projectsArea.firstChild);
    }
    
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();

    projects.forEach(project => {
      fragment.appendChild(this.createProjectCard(project));
    });

    projectsArea.appendChild(fragment);
    this.adjustProjectsHeight(projects.length);
    
    Logger.mark('display-projects-end');
    Logger.measure('display-projects', 'display-projects-start', 'display-projects-end');
    Logger.info(`Displayed ${projects.length} projects`);
  },

  /**
   * Adjust the projects section height based on number of projects
   * @param {number} numberOfProjects - Count of projects
   */
  adjustProjectsHeight(numberOfProjects) {
    const projectsSection = document.getElementById('projects-section');
    if (!projectsSection) return;
    
    if (numberOfProjects > 3) {
      projectsSection.style.height = 'auto';
      projectsSection.style.padding = '100px 0';
      Logger.debug(`Adjusted projects section height for ${numberOfProjects} projects`);
    }
  },

  /**
   * Fetch GitHub projects with caching
   * @returns {Promise<Array>} - Array of project objects
   */
  async fetchProjects() {
    Logger.mark('fetch-projects-start');
    const cacheKey = `github-projects-${CONFIG.github.username}`;
    const cachedProjects = CacheHandler.get(cacheKey);
    
    if (cachedProjects) {
      Logger.info('Using cached projects data');
      Logger.mark('fetch-projects-end');
      Logger.measure('fetch-projects-cached', 'fetch-projects-start', 'fetch-projects-end');
      return cachedProjects;
    }

    const { username, apiEndpoint } = CONFIG.github;
    const apiUrl = `${apiEndpoint}${username}/repos${CONFIG.github.sortParams}`;
    
    try {
      Logger.info(`Fetching projects from ${apiUrl}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(apiUrl, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
      }

      const projectData = await response.json();
      
      // Cache successful response
      CacheHandler.set(cacheKey, projectData);
      
      Logger.mark('fetch-projects-end');
      Logger.measure('fetch-projects-api', 'fetch-projects-start', 'fetch-projects-end');
      Logger.info(`Fetched ${projectData.length} projects`);
      
      return projectData;
    } catch (error) {
      Logger.error('Error fetching GitHub projects', error);
      if (error.name === 'AbortError') {
        Logger.warn('GitHub API request timed out');
      }
      throw error;
    }
  },

  /**
   * Load and display projects with error handling
   * @returns {Promise<void>}
   */
  async loadProjects() {
    Logger.mark('load-projects-start');
    const projectsArea = document.getElementById('projects');
    if (!projectsArea) {
      Logger.error('Projects container not found on page');
      return;
    }

    // Show loading state
    projectsArea.innerHTML = '<div class="loading-text">Loading projects...</div>';

    try {
      const projectData = await this.fetchProjects();
      
      if (!projectData || projectData.length === 0) {
        projectsArea.innerHTML = '<div class="error">No projects found</div>';
        Logger.warn('No projects data returned from API');
        return;
      }

      this.displayProjects(projectData);
    } catch (error) {
      Logger.error('Failed to load projects', error);
      this.displayProjects(CONFIG.fallbackProject);
    } finally {
      Logger.mark('load-projects-end');
      Logger.measure('load-projects-total', 'load-projects-start', 'load-projects-end');
    }
  }
};

/**
 * ┌─────────────────────────────────────────────────────┐
 * │                     UI HANDLER                      │
 * └─────────────────────────────────────────────────────┘
 */
const UIHandler = {
  /**
   * Toggle mobile navigation menu with animation frame for performance
   */
  toggleMobileMenu() {
    Logger.debug('Toggling mobile menu');
    const menuButton = document.querySelector('#mobile-menu');
    const navLinks = document.querySelector('.navbar__menu');
    
    if (!menuButton || !navLinks) return;
    
    requestAnimationFrame(() => {
      menuButton.classList.toggle('is-active');
      navLinks.classList.toggle('active');
    });
  },

  /**
   * Initialize smooth scrolling for anchor links using event delegation
   */
  initSmoothScrolling() {
    Logger.debug('Initializing smooth scrolling');
    
    // Use event delegation for better performance
    document.body.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      
      e.preventDefault();
      const targetId = anchor.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        const navLinks = document.querySelector('.navbar__menu');
        const menuButton = document.querySelector('#mobile-menu');
        
        // Scroll to target
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Close mobile menu if open
        if (navLinks && navLinks.classList.contains('active')) {
          requestAnimationFrame(() => {
            navLinks.classList.remove('active');
            menuButton?.classList.remove('is-active');
          });
        }
      }
    });
  },

  /**
   * Hide loading overlay with improved animation handling
   */
  hideLoadingOverlay() {
    Logger.debug('Hiding loading overlay');
    const overlay = document.querySelector('.loading-overlay');
    if (!overlay) return;
    
    requestAnimationFrame(() => {
      overlay.style.opacity = '0';
      overlay.addEventListener('transitionend', () => {
        overlay.style.display = 'none';
        Logger.info('Loading overlay hidden');
      }, { once: true });
    });
  },

  /**
   * Hide the loading spinner
   */
  hideLoadingSpinner() {
    Logger.debug('Hiding loading spinner');
    const loader = document.querySelector('.loader');
    if (!loader) return;
    
    requestAnimationFrame(() => {
      loader.classList.add('hidden');
      Logger.info('Loading spinner hidden');
    });
  },

  /**
   * Initialize UI components and event listeners
   */
  init() {
    Logger.mark('ui-init-start');
    
    // Setup mobile menu toggle with event delegation
    const menuButton = document.querySelector('#mobile-menu');
    if (menuButton) {
      menuButton.addEventListener('click', this.toggleMobileMenu);
    }

    // Setup smooth scrolling
    this.initSmoothScrolling();
    
    // Setup loading animations with improved performance
    if (document.readyState === 'complete') {
      this.hideLoadingOverlay();
    } else {
      window.addEventListener('load', this.hideLoadingOverlay);
    }
    
    setTimeout(this.hideLoadingSpinner, 2000); // Reduced from 2500ms
    
    Logger.mark('ui-init-end');
    Logger.measure('ui-initialization', 'ui-init-start', 'ui-init-end');
    Logger.info('UI initialization complete');
  }
};

/**
 * ┌─────────────────────────────────────────────────────┐
 * │                  APPLICATION INIT                   │
 * └─────────────────────────────────────────────────────┘
 */
document.addEventListener('DOMContentLoaded', () => {
  Logger.mark('app-init');
  Logger.info('Application initializing');
  
  // Initialize UI components
  UIHandler.init();
  
  // Load and display GitHub projects
  ProjectHandler.loadProjects().then(() => {
    Logger.mark('app-ready');
    Logger.measure('total-initialization', 'app-init', 'app-ready');
    Logger.info('Application fully initialized');
  });
});

// Export objects for potential testing and debugging
window.AppDebug = {
  CONFIG,
  Logger,
  CacheHandler,
  ProjectHandler,
  UIHandler
};
Logger.info("© G-FLAME 2025. All rights reserved")
Logger.info("This Site is still under development! everything is subject to change!")
Logger.info("Site initialization started");
