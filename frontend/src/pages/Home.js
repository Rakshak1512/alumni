/**
 * 3D Alumni Network Orbital Grid Landing Page Component
 */
import { state } from '../state.js';

export function renderHome() {
    const isAuth = state.isAuthenticated;

    return `
    <div class="container">
        <!-- 3D Alumni Network Orbital Grid Hero Section -->
        <div class="hero-container-3d">
            <!-- Left Side: Value Proposition & High-Impact Headline -->
            <div class="hero-left">
                <div class="hero-badge">
                    <span>✨ 3D Alumni Network Ecosystem</span>
                </div>

                <h1 class="hero-title">
                    Connect. Mentor. <br>
                    <span class="highlight-text">Accelerate Careers.</span>
                </h1>

                <p class="hero-description">
                    Experience the unified academic and professional networking platform. Bridge the journey between undergraduate education and senior leadership through 1-on-1 alumni mentorship, job referrals, and career acceleration.
                </p>

                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    ${!isAuth ? `
                    <a href="#/register" class="btn btn-lg btn-primary">
                        <span>🚀 Launch Your Network</span> →
                    </a>
                    <a href="#/login" class="btn btn-lg btn-secondary">
                        <span>🔑 Member Sign In</span>
                    </a>
                    ` : `
                    <a href="#/dashboard" class="btn btn-lg btn-primary">
                        <span>📊 Go to Your 3D Dashboard</span> →
                    </a>
                    `}
                </div>
            </div>

            <!-- Right Side: 3D Alumni Network Orbital Grid Visualization -->
            <div class="hero-orbital-wrapper" id="heroOrbitalWrapper">
                <div class="orbital-canvas" id="heroOrbitalCanvas">
                    <!-- Atmospheric Radial Glow -->
                    <div class="orbital-glow"></div>

                    <!-- 3D Concentric Orbit Rings -->
                    <div class="orbital-ring ring-inner"></div>
                    <div class="orbital-ring ring-middle"></div>
                    <div class="orbital-ring ring-outer"></div>

                    <!-- Central Nucleus Core Node -->
                    <div class="orbital-core-node">
                        <span class="orbital-core-icon">🎓</span>
                        <span>ALUMNI<br>NETWORK</span>
                    </div>

                    <!-- Connected Network Nodes -->
                    <div class="orbital-node node-student">
                        <span class="node-dot"></span>
                        <span>Student</span>
                    </div>

                    <div class="orbital-node node-alumni">
                        <span class="node-dot"></span>
                        <span>Alumni</span>
                    </div>

                    <div class="orbital-node node-mentor">
                        <span class="node-dot"></span>
                        <span>Mentor</span>
                    </div>

                    <div class="orbital-node node-career">
                        <span class="node-dot"></span>
                        <span>Career</span>
                    </div>

                    <div class="orbital-node node-community">
                        <span class="node-dot"></span>
                        <span>Community</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Network Statistics Composition Bar -->
        <div class="stats-composition-bar">
            <div class="stat-composition-item">
                <span class="stat-composition-num">500+</span>
                <span class="stat-composition-label">Global Alumni</span>
            </div>
            <div class="stat-composition-item">
                <span class="stat-composition-num">98%</span>
                <span class="stat-composition-label">Placement Success</span>
            </div>
            <div class="stat-composition-item">
                <span class="stat-composition-num">120+</span>
                <span class="stat-composition-label">Tech Companies</span>
            </div>
            <div class="stat-composition-item">
                <span class="stat-composition-num">1,200+</span>
                <span class="stat-composition-label">Mentorship Hours</span>
            </div>
        </div>

        <!-- Horizontal Connected Timeline: How It Works -->
        <div class="timeline-track-wrapper">
            <div style="text-align: center; max-width: 620px; margin: 0 auto 3.5rem auto;">
                <h2 style="font-size: 2.15rem; margin-bottom: 0.5rem; color: var(--text-main);">Continuous Networking Lifecycle</h2>
                <p style="color: var(--text-muted); font-size: 1rem;">A structured path from student enrollment to alumni leadership</p>
            </div>

            <div class="timeline-line"></div>

            <div class="timeline-nodes-grid">
                <div class="timeline-step">
                    <div class="timeline-step-node">01</div>
                    <h3 class="timeline-step-title">Discover</h3>
                    <p class="timeline-step-desc">Explore verified alumni directories filtered by department, grad year, and global tech hubs.</p>
                </div>

                <div class="timeline-step">
                    <div class="timeline-step-node">02</div>
                    <h3 class="timeline-step-title">Connect</h3>
                    <p class="timeline-step-desc">Initiate conversations through encrypted messaging and request direct career referrals.</p>
                </div>

                <div class="timeline-step">
                    <div class="timeline-step-node">03</div>
                    <h3 class="timeline-step-title">Mentor</h3>
                    <p class="timeline-step-desc">Participate in 1-on-1 live video mock interviews and technical roadmap reviews.</p>
                </div>

                <div class="timeline-step">
                    <div class="timeline-step-node">04</div>
                    <h3 class="timeline-step-title">Grow</h3>
                    <p class="timeline-step-desc">Transition into senior industry roles and give back by mentoring the next incoming class.</p>
                </div>
            </div>
        </div>

        <!-- Alternating Feature Composition Sections (Less cards, more composition) -->
        <div class="feature-split-section">
            <!-- Feature 1: Visual + Text -->
            <div class="feature-split-row">
                <div class="feature-visual-panel">
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: #eef2ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">💼</div>
                            <div>
                                <strong style="font-size: 1rem; color: var(--text-main); display: block;">Exclusive Job Postings</strong>
                                <span style="font-size: 0.8rem; color: var(--text-muted);">Direct alumni referral network</span>
                            </div>
                        </div>
                        <span class="tag tag-success">Active Openings</span>
                    </div>
                    <p style="color: var(--text-muted); font-size: 0.92rem; line-height: 1.6; margin-top: 0.5rem;">
                        Browse verified engineering, product, and research opportunities posted directly by graduates at Microsoft, Google, Amazon, and innovative startups worldwide.
                    </p>
                </div>

                <div class="feature-text-content">
                    <div class="tag tag-primary" style="margin-bottom: 1rem;">Direct Opportunities</div>
                    <h3>Accelerate Placement with Internal Alumni Referrals</h3>
                    <p>Skip the resume black box. Connect directly with alumni who understand your curriculum and can provide direct internal referrals and interview insights.</p>
                    <a href="#/postings" class="btn btn-secondary">Explore Career Board →</a>
                </div>
            </div>

            <!-- Feature 2: Text + Visual (Alternating) -->
            <div class="feature-split-row reverse">
                <div class="feature-visual-panel">
                    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">📹</div>
                            <div>
                                <strong style="font-size: 1rem; color: var(--text-main); display: block;">1-on-1 Video Mentorship</strong>
                                <span style="font-size: 0.8rem; color: var(--text-muted);">Encrypted peer-to-peer rooms</span>
                            </div>
                        </div>
                        <span class="tag tag-primary">HD Audio/Video</span>
                    </div>
                    <p style="color: var(--text-muted); font-size: 0.92rem; line-height: 1.6; margin-top: 0.5rem;">
                        Book structured 1-on-1 video mentorship sessions directly from your dashboard for system design guidance, mock behavioral interviews, and resume critiques.
                    </p>
                </div>

                <div class="feature-text-content">
                    <div class="tag tag-success" style="margin-bottom: 1rem;">Real-time Connection</div>
                    <h3>Live Video Mentorship & Instant Messaging</h3>
                    <p>Schedule real-time mentorship calls with senior professionals. Gain actionable advice on compensation negotiation, graduate school applications, and industry career shifts.</p>
                    <a href="#/alumni/search" class="btn btn-secondary">Find a Mentor →</a>
                </div>
            </div>


        </div>

        <!-- Footer -->
        <footer style="padding: 3rem 0 2rem; border-top: 1px solid var(--border-light); text-align: center; color: var(--text-muted); font-size: 0.9rem;">
            <p style="margin-bottom: 0.4rem; font-weight: 700; color: var(--text-main);">🎓 Smart Alumni & Student Career Networking Portal</p>
            <p style="font-size: 0.85rem;">Connecting generations of graduates with future leaders worldwide.</p>
        </footer>
    </div>
    `;
}

export function initHome() {
    const wrapper = document.getElementById('heroOrbitalWrapper');
    const canvas = document.getElementById('heroOrbitalCanvas');

    if (wrapper && canvas && window.matchMedia('(min-width: 820px)').matches) {
        wrapper.addEventListener('mousemove', (e) => {
            const rect = wrapper.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            const rotateY = x * 18;
            const rotateX = -y * 18;

            canvas.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        wrapper.addEventListener('mouseleave', () => {
            canvas.style.transform = 'rotateX(0deg) rotateY(0deg)';
        });
    }
}
