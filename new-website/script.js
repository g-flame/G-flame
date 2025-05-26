// ===== CONFIG & STATE =====
const GITHUB_USERNAME = 'g-flame-oss';
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos`;
// i used claude for this i suck at js bro why is it so hard ! my old code looked and worked like shit this is just perfect!
let projects = [];
let isLoading = false;
const projectsGrid = document.getElementById('projects-grid');
document.addEventListener('DOMContentLoaded', () => {
    loadGitHubProjects();
});

// ===== GITHUB API INTEGRATION =====
async function loadGitHubProjects() {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const response = await fetch(GITHUB_API_URL, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const repos = await response.json();
        
        projects = repos
            .filter(repo => !repo.fork && repo.description)
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 12);
        
        renderProjects(projects);
        
    } catch (error) {
        console.error('Error loading GitHub projects:', error);
        showProjectsError();
    } finally {
        isLoading = false;
    }
}

function showProjectsError() {
    projectsGrid.innerHTML = `
        <div class="projects-error">
            <p>Unable to load projects from GitHub at the moment.</p>
            <p>Please check back later or visit my <a href="https://github.com/${GITHUB_USERNAME}" target="_blank">GitHub profile</a> directly.</p>
        </div>
    `;
}

// ===== PROJECT RENDERING =====
function renderProjects(projectsToRender) {
    const projectsHTML = projectsToRender.map((project, index) => `
        <div class="project-card" style="animation-delay: ${index * 0.1}s">
            <div class="project-header">
                <div>
                    <h3 class="project-title">${formatProjectName(project.name)}</h3>
                    <p class="project-description">${project.description || 'No description available'}</p>
                </div>
            </div>
            <div class="project-tech">
                ${project.language ? `<span class="tech-tag">${project.language}</span>` : ''}
                ${project.topics ? project.topics.slice(0, 3).map(topic => 
                    `<span class="tech-tag">${topic}</span>`
                ).join('') : ''}
            </div>
            <div class="project-links">
                <a href="${project.html_url}" class="project-link primary" target="_blank">
                    View Code
                </a>
                ${project.homepage ? `
                    <a href="${project.homepage}" class="project-link secondary" target="_blank">
                        Live Demo
                    </a>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    projectsGrid.innerHTML = projectsHTML;
    observeProjectCards();
}

function formatProjectName(name) {
    return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function observeProjectCards() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.project-card').forEach(card => observer.observe(card));
}
