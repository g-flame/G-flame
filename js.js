/**
 * Configuration
 * ----------------------------------------
 */

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
  fallbackProject: [{
    name: 'Default Project',
    description: 'This appears when GitHub projects cannot be loaded',
    html_url: '#',
    language: 'error',
  }]
};


/**
 * Project Handler
 * ----------------------------------------
 */

const ProjectHandler = {

  getColorForLanguage(language) {
    return CONFIG.languageColors[language] || CONFIG.languageColors.unknown;
  },

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

  getSafeProjectData(project) {
    return {
      name: project.name || 'Unnamed Repository',
      description: project.description || 'No description provided for this project',
      url: project.html_url || `https://github.com/${CONFIG.username}`,
      language: project.language || 'unknown'
    };
  },

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

    card.addEventListener('click', (event) => {
      if (!event.target.closest('.project-link')) {
        window.open(safeData.url, '_blank');
      }
    });

    return card;
  },

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

  adjustProjectsHeight(numberOfProjects) {
    const projectsSection = document.getElementById('projects-section');
    if (projectsSection && numberOfProjects > 3) {
      projectsSection.style.height = 'auto';
      projectsSection.style.padding = '100px 0';
    }
  },

  async loadProjects() {
    const projectsArea = document.getElementById('projects');
    if (!projectsArea) {
      console.error('Projects container not found on page');
      return;
    }

    const apiUrl = `${CONFIG.apiEndpoint}${CONFIG.username}/repos${CONFIG.sortParams}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`GitHub API request failed: ${response.status}`);

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
 * UI Handler
 * ----------------------------------------
 */

const UIHandler = {

  toggleMobileMenu() {
    const menuButton = document.querySelector('#mobile-menu');
    const navLinks = document.querySelector('.navbar__menu');
    if (menuButton && navLinks) {
      menuButton.classList.toggle('is-active');
      navLinks.classList.toggle('active');
    }
  },

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
        }
      });
    });
  },

  /*hideLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
      setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.addEventListener('transitionend', () => {
          overlay.style.display = 'none';
        });
      }, CONFIG.loadingTimeout);
    }
  },*/

  init() {
    const menuButton = document.querySelector('#mobile-menu');
    if (menuButton) {
      menuButton.addEventListener('click', this.toggleMobileMenu);
    }

    this.initSmoothScrolling();
    window.addEventListener('load', this.hideLoadingOverlay);
  }
};


/**
 * App Entry Point
 * ----------------------------------------
 */

document.addEventListener('DOMContentLoaded', () => {
  UIHandler.init();
  ProjectHandler.loadProjects();
});
/*
setTimeout(() => {
  const loader = document.querySelector('.loader');
  if (loader) loader.classList.add('hidden');
}, 2500);
*/