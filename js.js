// By g-flame https://github.com/g-flame*/
// all rights reserved
//the username for the repo to be pulled from
const username = 'g-flame-oss';

// Programming language colors for repository badges
const programmingLanguageColors = {
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
};

// Fallback project to display when GitHub API fails
const fallbackProject = [
  {
    name: 'Default Project',
    description: 'This appears when GitHub projects cannot be loaded',
    html_url: '#',
    language: 'error',
  },
];

// Get the color for a programming language badge
function getColorForLanguage(language) {
  return (
    programmingLanguageColors[language] || programmingLanguageColors.unknown
  );
}

// Create a placeholder badge when language is missing
function createLanguageBadge(project) {
  if (project.language) {
    return `<div class="language-badge">
      <span class="language-color" style="background-color: ${getColorForLanguage(
        project.language
      )}"></span>
      ${project.language}
    </div>`;
  } else {
    return `<div class="language-badge">
      <span class="language-color" style="background-color: ${getColorForLanguage(
        'other'
      )}"></span>
      other
    </div>`;
  }
}

// Get a safe project name with fallback
function getProjectName(project) {
  return project.name || 'Unnamed Repository';
}

// Get a safe project description with fallback
function getProjectDescription(project) {
  return project.description || 'No description provided for this project';
}

// Get a safe project URL with fallback
function getProjectUrl(project) {
  return project.html_url || `https://github.com/${username}`;
}

// Display project cards on the page
function displayProjects(projectList) {
  const projectsArea = document.getElementById('projects');

  projectList.forEach((project) => {
    const projectCard = document.createElement('div');
    projectCard.className = 'projects__card';

    projectCard.innerHTML = `
      ${createLanguageBadge(project)}
      <h2>${getProjectName(project)}</h2>
      <img id="project__img" src="./assets/placeholder.svg">
      <p>${getProjectDescription(project)}</p>
      <a href="${getProjectUrl(project)}" target="_blank">
        <button>View Project</button>
      </a>
    `;

    // Make card clickable to open project
    projectCard.addEventListener('click', (event) => {
      if (!event.target.matches('button') && !event.target.closest('button')) {
        event.preventDefault();
        window.open(getProjectUrl(project), '_blank');
      }
    });

    projectsArea.appendChild(projectCard);
  });
}

// Toggle mobile navigation menu
function toggleMobileMenu() {
  const menuButton = document.querySelector('#mobile-menu');
  const navLinks = document.querySelector('.navbar__menu');
  menuButton.classList.toggle('is-active');
  navLinks.classList.toggle('active');
}

// Adjust projects section height based on number of projects
function adjustProjectsHeight(numberOfProjects) {
  const projectsSection = document.getElementById('projects-section');
  if (projectsSection && numberOfProjects > 3) {
    projectsSection.style.height = 'auto';
    projectsSection.style.paddingTop = '100px';
    projectsSection.style.paddingBottom = '100px';
  }
}

// When DOM is ready, set up page functionality
document.addEventListener('DOMContentLoaded', () => {
  // Setup mobile menu
  const menuButton = document.querySelector('#mobile-menu');
  if (menuButton) {
    menuButton.addEventListener('click', toggleMobileMenu);
  }

  // Load GitHub projects
  const githubApiUrl = `https://api.github.com/users/${username}/repos?sort=updated&direction=desc`;
  const projectsArea = document.getElementById('projects');

  if (!projectsArea) {
    console.error('Projects container not found on page');
    return;
  }

  // Fetch projects from GitHub
  fetch(githubApiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error('GitHub API request failed');
      }
      return response.json();
    })
    .then((projectData) => {
      projectsArea.innerHTML = ''; // Clear loading message

      if (projectData.length === 0) {
        projectsArea.innerHTML = '<div class="error">No projects found</div>';
        return;
      }

      displayProjects(projectData);
      adjustProjectsHeight(projectData.length);
    })
    .catch((error) => {
      console.error('Could not load GitHub projects:', error);
      displayProjects(fallbackProject);
    });
});

// Hide loading screen after page loads
window.addEventListener('load', function () {
  setTimeout(function () {
    document.querySelector('.loading-overlay').style.display = 'none';
  }, 1500);
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    // smooth scroll
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);

    window.scrollTo({
      top: targetElement.offsetTop,
      behavior: 'smooth',
    });
  });
});
