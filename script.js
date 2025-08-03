const USERNAME = 'g-flame-oss';
const API_BASE = 'https://api.github.com';
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes
const BATCH_SIZE = 3;
const BATCH_DELAY = 1000;

let rateLimitInterval;

class GitHubPortfolio {
    constructor() {
        this.grid = document.getElementById('projects-grid');
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => this.loadProjects());
    }

    // Simple in-memory cache since localStorage isn't available
    getCache() {
        if (!window.repoCache) return null;
        if (Date.now() - window.repoCache.timestamp > CACHE_TIME) {
            window.repoCache = null;
            return null;
        }
        return window.repoCache.data;
    }

    setCache(data) {
        window.repoCache = {
            data,
            timestamp: Date.now()
        };
    }

    async fetchWithRetry(url, delay = 100) {
        await this.sleep(delay);
        const response = await fetch(url);
        
        if (response.status === 403) {
            const resetTime = response.headers.get('X-RateLimit-Reset');
            const remaining = response.headers.get('X-RateLimit-Remaining');
            console.log("Some info on the Rate limiting for your info i guess??")
            console.log({resetTime, remaining, status: response.status });
            
            if (remaining === '0' && resetTime) {
                const waitTime = (resetTime * 1000) - Date.now();
                this.showRateLimit(waitTime);
                throw new Error('Rate limited');
            } else {
                this.showRateLimit(300000); 
                throw new Error('Rate limited');
            }
        }
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }


    async loadProjects() {
        try {
            // Check cache first
            const cached = this.getCache();
            if (cached) {
                this.renderProjects(cached);
                return;
            }

            this.showLoading();
            
            // Fetch repositories
            const repos = await this.fetchWithRetry(`${API_BASE}/users/${USERNAME}/repos?per_page=100`)
                .then(data => data
                    .filter(repo => !repo.fork && repo.description)
                    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                    .slice(0, 12)
                );

            // Show repos immediately
            this.renderProjects(repos);
            
            // Fetch commits in background
            const reposWithCommits = await this.fetchCommitsInBatches(repos);
            this.setCache(reposWithCommits);
            this.renderProjects(reposWithCommits);
            
        } catch (error) {
            console.error('Failed to load projects:', error);
            this.showError(error.message);
        }
    }

    async fetchCommitsInBatches(repos) {
        const results = [...repos];
        
        for (let i = 0; i < repos.length; i += BATCH_SIZE) {
            const batch = repos.slice(i, i + BATCH_SIZE);
            
            await Promise.allSettled(
                batch.map(async (repo, idx) => {
                    try {
                        const commits = await this.fetchWithRetry(
                            `${API_BASE}/repos/${USERNAME}/${repo.name}/commits?per_page=1`,
                            (i + idx) * 200
                        );
                        
                        if (commits[0]) {
                            const actualIndex = i + idx;
                            results[actualIndex].lastCommit = {
                                message: commits[0].commit.message.split('\n')[0],
                                date: commits[0].commit.author.date,
                                hash: commits[0].sha.slice(0, 7)
                            };
                        }
                    } catch (error) {
                        console.warn(`Failed to fetch commits for ${repo.name}:`, error.message);
                    }
                })
            );
            
            // Wait between batches to avoid rate limiting
            if (i + BATCH_SIZE < repos.length) {
                await this.sleep(BATCH_DELAY);
            }
        }
        
        return results;
    }

    showLoading() {
        this.grid.innerHTML = `
            <div class="loading">
                <div class="loader"></div>
                <p>Loading projects...</p>
            </div>
        `;
    }

    showError(message) {
        this.grid.innerHTML = `
            <div class="error">
                <p>Aww Shucks! You just got RATE LIMITED Unfortunately i don't know how to fix it. Since i am Dumb!!<p>

                <a href="https://github.com/${USERNAME}" target="_blank">View My Github</a>
                <p>(OR)</p>
                <button onclick="portfolio.loadProjects()" class="retry-btn">RELOAD</button>
            </div>
        `;
    }

    renderProjects(repos) {
        this.grid.innerHTML = repos.map((repo, i) => `
            <div class="project-card" style="animation-delay: ${i * 100}ms">
                <h3>${this.formatName(repo.name)}</h3>
                <p class="description">${this.truncate(repo.description, 85)}</p>
                
                ${repo.lastCommit ? `
                    <div class="commit">
                        <div class="message">"${this.truncate(repo.lastCommit.message, 40)}"</div>
                        <div class="details">
                            <span>${repo.lastCommit.hash}</span>
                            <span>${this.timeAgo(repo.lastCommit.date)}</span>
                        </div>
                    </div>
                ` : '<div class="commit-placeholder">Loading latest commit...</div>'}
                
                <div class="tags">
                    ${repo.language ? `<span>${repo.language}</span>` : ''}
                    ${repo.topics?.slice(0, 3).map(tag => `<span>${tag}</span>`).join('') || ''}
                </div>
                
                <div class="links">
                    <a href="${repo.html_url}" target="_blank">Code</a>
                    ${repo.homepage ? `<a href="${repo.homepage}" target="_blank">Demo</a>` : ''}
                </div>
            </div>
        `).join('');
    }

    // Utility functions
    timeAgo(date) {
        const ms = Date.now() - new Date(date);
        const mins = Math.floor(ms / 60000);
        const hours = Math.floor(ms / 3600000);
        const days = Math.floor(ms / 86400000);
        
        if (days > 30) return `${Math.floor(days/30)}mo`;
        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        if (mins > 0) return `${mins}m`;
        return 'now';
    }

    truncate(text, max) {
        return text.length > max ? text.slice(0, max) + '...' : text;
    }

    formatName(name) {
        return name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const portfolio = new GitHubPortfolio();