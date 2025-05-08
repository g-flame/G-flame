/**
 * Configuration
 * -----------------------------------------
 * Core settings for GitHub API integration and UI presentation
 */
const CONFIG = {
  // GitHub API settings
  username: 'g-flame-oss',
  apiEndpoint: 'https://api.github.com/users/',
  repoEndpoint: 'https://api.github.com/repos/',
  sortParams: '?sort=updated&direction=desc',
  
  // GitHub authentication settings
  githubAuth: {
    enabled: false,
    token: '',  
    tokenName: 'GitHub Portfolio', 
    permissions: ['public_repo']
  },
  
  // UI settings
  loadingTimeout: 1500,
  repoShowLimit: 16,
  
  // Image settings
  imageExtensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'],
  priorityImageNames: ['banner', 'cover', 'preview', 'header'],
  fallbackImage: './assets/placeholder.svg',
  maxImageRetries: 3,
  
  // Cache settings
  useLocalCache: true,
  cacheExpiration: 3600000, // 1 hour in milliseconds
  
  // Language colors for badges
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
    name: 'Rate limited',
    description: 'This appears when GitHub projects as the rate limitwas excedeed!!',
    html_url: '#',
    language: 'error',
  }]
};

/**
 * Cache Handler
 * -----------------------------------------
 * Manages local storage caching for GitHub API responses
 */
const CacheHandler = {
  /**
   * Retrieve data from cache if valid
   * @param {string} key - Cache key
   * @returns {object|null} - Retrieved data or null
   */
  getCache(key) {
    if (!CONFIG.useLocalCache) return null;
    
    try {
      const cached = localStorage.getItem(`gh_cache_${key}`);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const now = new Date().getTime();
      
      // Check if cache is expired
      if (now - timestamp > CONFIG.cacheExpiration) {
        localStorage.removeItem(`gh_cache_${key}`);
        return null;
      }
      
      return data;
    } catch (e) {
      console.warn('Cache retrieval error:', e);
      return null;
    }
  },
  
  /**
   * Store data in cache
   * @param {string} key - Cache key
   * @param {object} data - Data to cache
   */
  setCache(key, data) {
    if (!CONFIG.useLocalCache) return;
    
    try {
      const cacheObject = {
        data,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(`gh_cache_${key}`, JSON.stringify(cacheObject));
    } catch (e) {
      console.warn('Cache storage error:', e);
    }
  },
  
  /**
   * Clear specific cache entry
   * @param {string} key - Cache key to clear
   */
  clearCache(key) {
    if (!CONFIG.useLocalCache) return;
    
    try {
      localStorage.removeItem(`gh_cache_${key}`);
    } catch (e) {
      console.warn('Cache deletion error:', e);
    }
  },
  
  /**
   * Clear all portfolio cache entries
   */
  clearAllCache() {
    if (!CONFIG.useLocalCache) return;
    
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('gh_cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Cache clearing error:', e);
    }
  }
};

/**
 * Project Handler
 * -----------------------------------------
 * Manages GitHub project data retrieval, processing and display
 */
const ProjectHandler = {
  /**
   * UI Helpers
   * -----------------------------------------
   */
  
  /**
   * Get color for a programming language
   * @param {string} language - Programming language name
   * @returns {string} - Hex color code
   */
  getColorForLanguage(language) {
    return CONFIG.languageColors[language] || CONFIG.languageColors.unknown;
  },

  /**
   * Create a language badge element
   * @param {object} project - Project data
   * @returns {string} - HTML for language badge
   */
  createLanguageBadge(project) {
    const language = project.language || 'Other';
    const color = this.getColorForLanguage(language);
    return `
      <div class="language-badge">
        <span class="language-color" style="background-color: ${color}"></span>
        ${language}
      </div>
    `;
  },

  /**
   * Ensure project data has all required fields
   * @param {object} project - Project data from API
   * @returns {object} - Sanitized project data
   */
  getSafeProjectData(project) {
    return {
      name: project.name || 'Unnamed Repository',
      description: project.description || 'No description provided for this project',
      url: project.html_url || `https://github.com/${CONFIG.username}`,
      language: project.language || 'Unknown',
      repoImage: project.repoImage || CONFIG.fallbackImage
    };
  },

  /**
   * Create a project card DOM element
   * @param {object} project - Project data
   * @returns {HTMLElement} - Project card element
   */
  createProjectCard(project) {
    const safeData = this.getSafeProjectData(project);
    const card = document.createElement('div');
    card.className = 'projects__card';
    
    // Set background image if one exists
    if (safeData.repoImage) {
      card.style.backgroundImage = `
        linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.7) 70%),
        url('${safeData.repoImage}')
      `;
    }
    
    card.innerHTML = `
      ${this.createLanguageBadge(project)}
      <h2>${safeData.name}</h2>
      <p>${safeData.description}</p>
      <a href="${safeData.url}" target="_blank" class="project-link">
        <button>View Project</button>
      </a>
    `;

    // Make the entire card clickable, except for the button
    card.addEventListener('click', (event) => {
      if (!event.target.closest('.project-link')) {
        window.open(safeData.url, '_blank');
      }
    });

    return card;
  },

  /**
   * Display projects in the DOM
   * @param {Array} projects - Array of project data
   */
  displayProjects(projects) {
    const projectsArea = document.getElementById('projects');
    if (!projectsArea) return;

    projectsArea.innerHTML = '';
    const fragment = document.createDocumentFragment();

    projects.forEach(project => {
      fragment.appendChild(this.createProjectCard(project));
    });

    projectsArea.appendChild(fragment);
    this.adjustProjectsHeight(projects.length);
  },

  /**
   * Adjust projects section height based on number of projects
   * @param {number} numberOfProjects - Count of projects
   */
  adjustProjectsHeight(numberOfProjects) {
    const projectsSection = document.getElementById('projects-section');
    if (projectsSection && numberOfProjects > 3) {
      projectsSection.style.height = 'auto';
      projectsSection.style.padding = '100px 0';
    }
  },

  /**
   * Image Processing
   * -----------------------------------------
   */
  
  /**
   * Check if a file is an image based on extension
   * @param {string} filename - Filename to check
   * @returns {boolean} - True if file is an image
   */
  isImageFile(filename) {
    if (!filename) return false;
    const extension = filename.split('.').pop().toLowerCase();
    return CONFIG.imageExtensions.includes(extension);
  },

  /**
   * Calculate image priority score (lower is better)
   * @param {string} filename - Image filename
   * @returns {number} - Priority score
   */
  getImagePriorityScore(filename) {
    if (!filename) return 999;
    
    const lowerName = filename.toLowerCase();
    
    // Check for priority name matches
    for (let i = 0; i < CONFIG.priorityImageNames.length; i++) {
      if (lowerName.includes(CONFIG.priorityImageNames[i])) {
        return i; // Return the index as the score (lower is better)
      }
    }
    
    // If no priority match found, return high score
    return 100;
  },

  /**
   * Find the best image in repository contents
   * @param {Array} contents - Repository contents
   * @returns {string|null} - URL of best image or null
   */
  findBestImage(contents) {
    if (!Array.isArray(contents)) return null;
    
    // Filter for image files
    const imageFiles = contents.filter(item => 
      item.type === 'file' && this.isImageFile(item.name)
    );
    
    if (imageFiles.length === 0) return null;
    
    // Sort images by priority score
    imageFiles.sort((a, b) => {
      return this.getImagePriorityScore(a.name) - this.getImagePriorityScore(b.name);
    });
    
    // Return the best match
    return imageFiles[0].download_url;
  },

  /**
   * API Interaction
   * -----------------------------------------
   */
  
  /**
   * Get authorization headers for GitHub API requests
   * @returns {object} - Headers object
   */
  getAuthHeaders() {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': CONFIG.githubAuth.tokenName || 'GitHub-Portfolio-App'
    };
    
    if (CONFIG.githubAuth.enabled && CONFIG.githubAuth.token) {
      headers.Authorization = `token ${CONFIG.githubAuth.token}`;
    }
    
    return headers;
  },
  
  /**
   * Log API rate limit information from response
   * @param {Response} response - Fetch API response
   */
  logRateLimitInfo(response) {
    const rateLimit = response.headers.get('X-RateLimit-Remaining');
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');
    
    if (rateLimit) {
      console.log(`GitHub API requests remaining: ${rateLimit}`);
      
      // If we're using a token and rate limit is low, show a warning
      if (CONFIG.githubAuth.enabled && parseInt(rateLimit) < 20) {
        const resetDate = new Date(rateLimitReset * 1000);
        console.warn(`GitHub rate limit low! Resets at: ${resetDate.toLocaleTimeString()}`);
      }
    }
  },
  
  /**
   * Fetch repository contents with caching and retry logic
   * @param {string} repoName - Repository name
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<string>} - Image URL
   */
  async fetchRepoContents(repoName, retryCount = 0) {
    // Check cache first
    const cacheKey = `contents_${repoName}`;
    const cachedData = CacheHandler.getCache(cacheKey);
    if (cachedData) {
      console.log(`Using cached data for ${repoName}`);
      return cachedData;
    }
    
    // Check if we've reached maximum retry attempts
    if (retryCount >= CONFIG.maxImageRetries) {
      console.warn(`Max retries reached for ${repoName}, using fallback image`);
      return CONFIG.fallbackImage;
    }
    
    try {
      const headers = this.getAuthHeaders();
      const response = await fetch(`${CONFIG.repoEndpoint}${CONFIG.username}/${repoName}/contents`, { headers });
      
      this.logRateLimitInfo(response);
      
      if (!response.ok) {
        console.warn(`Failed to fetch repo contents: ${response.status}`);
        if (response.status === 403 || response.status === 429) {
          // Rate limiting or permission issue, try again after delay with exponential backoff
          const delay = 1000 * Math.pow(2, retryCount);
          console.log(`Rate limited. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.fetchRepoContents(repoName, retryCount + 1);
        }
        return CONFIG.fallbackImage;
      }
      
      const contents = await response.json();
      const bestImage = this.findBestImage(contents);
      
      // Cache the result if we found an image
      if (bestImage) {
        CacheHandler.setCache(cacheKey, bestImage);
      }
      
      return bestImage || CONFIG.fallbackImage;
    } catch (error) {
      console.warn(`Could not load contents for ${repoName}:`, error);
      
      // Implement exponential backoff for retries
      if (retryCount < CONFIG.maxImageRetries - 1) {
        const delay = 1000 * Math.pow(2, retryCount);
        console.log(`Error encountered. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchRepoContents(repoName, retryCount + 1);
      }
      
      return CONFIG.fallbackImage;
    }
  },

  /**
   * Add repository image to project data
   * @param {object} project - Project data
   * @returns {Promise<object>} - Enhanced project data
   */
  async enhanceProjectWithImage(project) {
    try {
      if (!project.repoImage) {  // Only fetch if we don't already have an image
        const imageUrl = await this.fetchRepoContents(project.name);
        project.repoImage = imageUrl || CONFIG.fallbackImage;
      }
    } catch (error) {
      console.warn(`Error enhancing project ${project.name} with image:`, error);
      project.repoImage = CONFIG.fallbackImage;
    }
    return project;
  },

  /**
   * Project Loading
   * -----------------------------------------
   */
  
  /**
   * Validate GitHub token permissions
   * @returns {boolean} - True if token is valid and enabled
   */
  validateGitHubToken() {
    if (!CONFIG.githubAuth.enabled || !CONFIG.githubAuth.token) {
      console.log('GitHub authentication disabled or no token provided');
      return false;
    }
    
    return true;
  },

  /**
   * Load projects from GitHub API or cache
   */
  async loadProjects() {
    const projectsArea = document.getElementById('projects');
    if (!projectsArea) {
      console.error('Projects container not found on page');
      return;
    }
    
    // Validate token if authentication is enabled
    if (CONFIG.githubAuth.enabled) {
      this.validateGitHubToken();
    }

    // Show loading state
    projectsArea.innerHTML = '<div class="loading-text">Loading projects...</div>';
    
    // Check cache for projects
    const cacheKey = `projects_${CONFIG.username}`;
    const cachedProjects = CacheHandler.getCache(cacheKey);
    
    if (cachedProjects) {
      console.log('Using cached projects data');
      this.displayProjects(cachedProjects);
      return;
    }
    
    const apiUrl = `${CONFIG.apiEndpoint}${CONFIG.username}/repos${CONFIG.sortParams}`;
    
    try {
      const headers = this.getAuthHeaders();
      const response = await fetch(apiUrl, { headers });
      
      this.logRateLimitInfo(response);
      
      if (!response.ok) {
        if (response.status === 403 || response.status === 429) {
          console.warn('Rate limit exceeded');
          // Check if we have outdated cached data we can use
          const outdatedCache = localStorage.getItem(`gh_cache_${cacheKey}`);
          if (outdatedCache) {
            const { data } = JSON.parse(outdatedCache);
            console.log('Using outdated cached data due to rate limit');
            this.displayProjects(data);
            return;
          }
        }
        throw new Error(`GitHub API request failed: ${response.status}`);
      }

      const projectData = await response.json();
      if (!Array.isArray(projectData) || projectData.length === 0) {
        projectsArea.innerHTML = '<div class="error">No projects found</div>';
        return;
      }

      // Use the configurable limit from CONFIG
      const topProjects = projectData.slice(0, CONFIG.repoShowLimit);
      
      // Create a smaller batch of projects for processing to avoid excessive API calls
      const batchSize = Math.min(CONFIG.repoShowLimit, 3); // Process max 3 at a time
      let enhancedProjects = [];
      
      for (let i = 0; i < topProjects.length; i += batchSize) {
        const batch = topProjects.slice(i, i + batchSize);
        const enhancedBatch = await Promise.all(
          batch.map(project => this.enhanceProjectWithImage(project))
        );
        enhancedProjects = [...enhancedProjects, ...enhancedBatch];
        
        // Display projects as they're loaded for better user experience
        this.displayProjects(enhancedProjects);
      }
      
      // Cache the final results
      CacheHandler.setCache(cacheKey, enhancedProjects);

    } catch (error) {
      console.error('Could not load GitHub projects:', error);
      this.displayProjects(CONFIG.fallbackProject);
    }
  }
};

/**
 * UI Handler
 * -----------------------------------------
 * Manages UI interactions and page elements
 */
const UIHandler = {
  /**
   * Toggle mobile menu visibility
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
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop,
            behavior: 'smooth'
          });
          
          // Close mobile menu if open
          const navLinks = document.querySelector('.navbar__menu');
          const menuButton = document.querySelector('#mobile-menu');
          if (navLinks && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            if (menuButton) menuButton.classList.remove('is-active');
          }
        }
      });
    });
  },

  /**
   * Hide the loading overlay with animation
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
   * Initialize all UI elements and event listeners
   */
  init() {
    const menuButton = document.querySelector('#mobile-menu');
    if (menuButton) {
      menuButton.addEventListener('click', this.toggleMobileMenu);
    }

    this.initSmoothScrolling();
    
    // Hide loader when page is loaded
    window.addEventListener('load', this.hideLoadingOverlay);
    
    // Hide loader after timeout as fallback
    setTimeout(() => {
      const loader = document.querySelector('.loader');
      if (loader) loader.classList.add('hidden');
    }, 2500);
  }
};

/**
 * GitHub Token Helper
 * -----------------------------------------
 * Utilities for working with GitHub fine-grained tokens
 */
const GitHubTokenHelper = {
  /**
   * Check if a token looks valid (basic format validation)
   * @param {string} token - GitHub token to validate
   * @returns {boolean} - True if token format is valid
   */
  validateTokenFormat(token) {
    // Fine-grained tokens start with "github_pat_" and are longer than 30 chars
    // Personal access tokens start with "ghp_"
    return typeof token === 'string' && 
           (token.startsWith('github_pat_') || token.startsWith('ghp_')) && 
           token.length > 30;
  },
  
  /**
   * Set up token from UI or local storage
   * @param {string} token - GitHub token
   * @returns {boolean} - True if token setup was successful
   */
  setupToken(token) {
    if (this.validateTokenFormat(token)) {
      CONFIG.githubAuth.token = token;
      CONFIG.githubAuth.enabled = true;
      
      // Save to session storage (less persistent than localStorage for security)
      if (CONFIG.useLocalCache) {
        try {
          sessionStorage.setItem('gh_token', token);
        } catch (e) {
          console.warn('Could not save token to session storage');
        }
      }
      
      return true;
    }
    return false;
  },
  
  /**
   * Load token from session storage if available
   * @returns {boolean} - True if token was loaded successfully
   */
  loadSavedToken() {
    if (CONFIG.useLocalCache) {
      try {
        const savedToken = sessionStorage.getItem('gh_token');
        if (savedToken && this.validateTokenFormat(savedToken)) {
          console.log('Loaded GitHub token from session storage');
          this.setupToken(savedToken);
          return true;
        }
      } catch (e) {
        console.warn('Could not load token from session storage');
      }
    }
    return false;
  },
  
  /**
   * Remove token and disable auth
   */
  clearToken() {
    CONFIG.githubAuth.token = '';
    CONFIG.githubAuth.enabled = false;
    
    if (CONFIG.useLocalCache) {
      try {
        sessionStorage.removeItem('gh_token');
      } catch (e) {
        console.warn('Could not clear token from session storage');
      }
    }
  },
  
  /**
   * Update UI based on token status
   */
  updateTokenUI() {
    const tokenInput = document.getElementById('github-token');
    const setTokenBtn = document.getElementById('set-token');
    const clearTokenBtn = document.getElementById('clear-token');
    
    if (tokenInput && setTokenBtn && clearTokenBtn) {
      if (CONFIG.githubAuth.enabled) {
        tokenInput.value = '••••••••••••••••••••••';
        setTokenBtn.style.display = 'none';
        clearTokenBtn.style.display = 'inline-block';
      } else {
        tokenInput.value = '';
        setTokenBtn.style.display = 'inline-block';
        clearTokenBtn.style.display = 'none';
      }
    }
  },
  
  /**
   * Add token input UI to the page
   */
  addTokenUI() {
    const tokenSection = document.createElement('div');
    tokenSection.className = 'github-token-section';
    tokenSection.innerHTML = `
      <div class="token-container">
        <input type="password" id="github-token" placeholder="Enter GitHub fine-grained token (optional)">
        <button id="set-token">Set Token</button>
        <button id="clear-token" style="display:none">Clear Token</button>
      </div>
      <div class="token-info">
        <small>Using a token increases API limits. 
        <a href="https://github.com/settings/tokens?type=beta" target="_blank">Create a token</a> 
        with "public_repo" access only.</small>
      </div>
    `;
    
    // Find where to insert the token UI
    const projectsSection = document.getElementById('projects-section');
    if (projectsSection) {
      const projectsContainer = projectsSection.querySelector('.container');
      if (projectsContainer) {
        projectsContainer.insertBefore(tokenSection, projectsContainer.firstChild);
        
        // Update UI based on token status
        this.updateTokenUI();
        
        // Set up event handlers
        const tokenInput = document.getElementById('github-token');
        const setTokenBtn = document.getElementById('set-token');
        const clearTokenBtn = document.getElementById('clear-token');
        
        if (setTokenBtn && clearTokenBtn && tokenInput) {
          // Set token button
          setTokenBtn.addEventListener('click', () => {
            const token = tokenInput.value.trim();
            if (this.setupToken(token)) {
              this.updateTokenUI();
              ProjectHandler.loadProjects(); // Reload with new token
            } else {
              alert('Invalid token format. GitHub tokens start with "github_pat_" or "ghp_"');
            }
          });
          
          // Clear token button
          clearTokenBtn.addEventListener('click', () => {
            this.clearToken();
            this.updateTokenUI();
            
            // Clear project cache to force reload without token
            CacheHandler.clearCache(`projects_${CONFIG.username}`);
            ProjectHandler.loadProjects();
          });
        }
      }
    }
  }
};

/**
 * App Entry Point
 * -----------------------------------------
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // Fix CONFIG property name inconsistency
  if (CONFIG.reposhowlimit !== undefined && CONFIG.repoShowLimit === undefined) {
    CONFIG.repoShowLimit = CONFIG.reposhowlimit;
  }
  
  // Ensure token is not set in the configuration (security best practice)
  if (CONFIG.githubAuth && CONFIG.githubAuth.token) {
    CONFIG.githubAuth.token = '';
    CONFIG.githubAuth.enabled = false;
    console.warn('Token should not be hardcoded in the configuration. Please use the token UI instead.');
  }
  
  // Initialize UI
  UIHandler.init();
  
  // Load saved token if available
  GitHubTokenHelper.loadSavedToken();
  
  // Add GitHub token UI if enabled in config
  if (CONFIG.useLocalCache) {
    GitHubTokenHelper.addTokenUI();
  }
  
  // Load projects
  ProjectHandler.loadProjects();
});