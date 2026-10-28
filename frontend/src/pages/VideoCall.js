/**
 * Video Session Component
 */
import { state } from '../state.js';

export function renderVideoCall(otherId) {
    const currentUserId = state.user ? state.user.id : 0;
    const roomName = `AlumniPortal_${currentUserId}_${otherId}`;

    return `
    <div class="page-header">
        <div class="page-header-title">
            <h1>Live 1-on-1 Video Session 📹</h1>
            <p>Encrypted peer-to-peer video room for mentorship, mock interviews, and career guidance.</p>
        </div>
        <div>
            <a href="#/messages" class="btn btn-secondary">
                ← Return to Messages
            </a>
        </div>
    </div>

    <div class="card" style="padding: 0; overflow: hidden; box-shadow: var(--shadow-xl); border: 1px solid var(--border-light); max-width: 1000px; margin: 0 auto;">
        <div style="padding: 1rem 1.5rem; background: #1e1b4b; color: white; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
                <strong style="font-size: 0.95rem;">Session Connected • Jitsi Secure Mesh</strong>
            </div>
            <span style="font-size: 0.8rem; color: #c7d2fe;">Room: ${roomName}</span>
        </div>

        <div style="position: relative; width: 100%; height: 600px; background: #0f172a;">
            <iframe
                src="https://meet.jit.si/${roomName}"
                style="height: 100%; width: 100%; border: 0;"
                allow="camera; microphone; fullscreen; display-capture; autoplay">
            </iframe>
        </div>
    </div>
    `;
}

export function initVideoCall() {}
