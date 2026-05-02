// API Base URL — reads from config.js or defaults to localhost
window.API_BASE_URL = window.API_URL || 'http://localhost:3000/api';

// ── Auth guard ──────────────────────────────────────────────────────────
function checkAuth() {
    const token = localStorage.getItem('token');
    const page = window.location.pathname;
    if (token && (page.endsWith('index.html') || page.endsWith('/'))) window.location.href = 'home.html';
    if (!token && page.endsWith('dashboard.html')) window.location.href = 'index.html';
}

// ── Alert helper ────────────────────────────────────────────────────────
function showAlert(elementId, message, type = 'error') {
    const el = document.getElementById(elementId);
    if (!el) return;
    const cls = type === 'success' ? 'alert-success' : type === 'info' ? 'alert-info' : 'alert-error';
    const icon = type === 'success' ? '✅' : type === 'info' ? 'ℹ️' : '❌';
    el.innerHTML = `<div class="alert ${cls}"><span>${icon}</span><span>${message}</span></div>`;
    setTimeout(() => { el.innerHTML = ''; }, 6000);
}

// ── DOMContentLoaded ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        initAuthPage();
    }
    if (window.location.pathname.endsWith('dashboard.html')) {
        initDashboard();
    }
});

// ── Track pending email for OTP verification ────────────────────────────
let _pendingEmail = '';

// ── Auth page init ───────────────────────────────────────────────────────
function initAuthPage() {

    // ── Tab switching ────────────────────────────────────────────────────
    document.getElementById('showRegister')?.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
        document.getElementById('otpForm')?.classList.add('hidden');
    });
    document.getElementById('showLogin')?.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('otpForm')?.classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
    });

    // ── LOGIN ────────────────────────────────────────────────────────────
    document.getElementById('loginFormElement')?.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        document.getElementById('loginButtonText').textContent = 'Signing in…';
        document.getElementById('loginSpinner').classList.remove('hidden');

        try {
            const res = await fetch(`${window.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showAlert('loginAlert', 'Login successful! Redirecting…', 'success');
                setTimeout(() => { window.location.href = 'home.html'; }, 1000);
            } else if (data.requiresVerification) {
                // Account exists but email not verified — show OTP form
                _pendingEmail = email;
                showOTPPanel(email);
                showAlert('loginAlert', data.message, 'info');
            } else {
                showAlert('loginAlert', data.message || 'Login failed.');
            }
        } catch (err) {
            showAlert('loginAlert', 'Connection error. Please make sure the server is running.');
        } finally {
            document.getElementById('loginButtonText').textContent = 'Sign In';
            document.getElementById('loginSpinner').classList.add('hidden');
        }
    });

    // ── REGISTER ─────────────────────────────────────────────────────────
    document.getElementById('registerFormElement')?.addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const department = document.getElementById('registerDepartment').value.trim();
        const password = document.getElementById('registerPassword').value;

        document.getElementById('registerButtonText').textContent = 'Creating account…';
        document.getElementById('registerSpinner').classList.remove('hidden');

        try {
            const res = await fetch(`${window.API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, department, password })
            });
            const data = await res.json();

            if (res.ok || res.status === 200) {
                if (data.requiresVerification) {
                    _pendingEmail = data.email || email;
                    showAlert('registerAlert', data.message, 'success');
                    // Show OTP verification panel
                    setTimeout(() => showOTPPanel(_pendingEmail), 800);
                } else {
                    // Should not happen with new flow, but handle gracefully
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        window.location.href = 'home.html';
                    }
                }
            } else {
                showAlert('registerAlert', data.message || 'Registration failed.');
            }
        } catch (err) {
            showAlert('registerAlert', 'Connection error. Please make sure the server is running.');
        } finally {
            document.getElementById('registerButtonText').textContent = 'Create Account';
            document.getElementById('registerSpinner').classList.add('hidden');
        }
    });

    // ── OTP VERIFY ───────────────────────────────────────────────────────
    document.getElementById('otpFormElement')?.addEventListener('submit', async e => {
        e.preventDefault();
        const otp = document.getElementById('otpInput').value.trim();
        if (!otp || otp.length !== 6) {
            showAlert('otpAlert', 'Please enter the 6-digit OTP from your email.');
            return;
        }

        document.getElementById('otpButtonText').textContent = 'Verifying…';
        document.getElementById('otpSpinner').classList.remove('hidden');

        try {
            const res = await fetch(`${window.API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: _pendingEmail, otp })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showAlert('otpAlert', '✅ Email verified! Redirecting to your dashboard…', 'success');
                setTimeout(() => { window.location.href = 'home.html'; }, 1200);
            } else {
                showAlert('otpAlert', data.message || 'Invalid OTP. Please try again.');
            }
        } catch (err) {
            showAlert('otpAlert', 'Connection error. Please try again.');
        } finally {
            document.getElementById('otpButtonText').textContent = 'Verify OTP';
            document.getElementById('otpSpinner').classList.add('hidden');
        }
    });

    // ── RESEND OTP ───────────────────────────────────────────────────────
    document.getElementById('resendOtpBtn')?.addEventListener('click', async () => {
        if (!_pendingEmail) return;
        const btn = document.getElementById('resendOtpBtn');
        btn.disabled = true;
        btn.textContent = 'Sending…';
        try {
            const res = await fetch(`${window.API_BASE_URL}/auth/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: _pendingEmail })
            });
            const data = await res.json();
            showAlert('otpAlert', data.message, res.ok ? 'success' : 'error');
        } catch (err) {
            showAlert('otpAlert', 'Connection error. Please try again.');
        } finally {
            // Re-enable after 60 seconds
            setTimeout(() => { btn.disabled = false; btn.textContent = 'Resend OTP'; }, 60000);
        }
    });
}

// ── Show/hide OTP panel ─────────────────────────────────────────────────
function showOTPPanel(email) {
    document.getElementById('loginForm')?.classList.add('hidden');
    document.getElementById('registerForm')?.classList.add('hidden');
    const otpForm = document.getElementById('otpForm');
    if (otpForm) {
        otpForm.classList.remove('hidden');
        const display = document.getElementById('otpEmailDisplay');
        if (display) display.textContent = email;
        document.getElementById('otpInput')?.focus();
    }
}

// ── Dashboard init ──────────────────────────────────────────────────────
function initDashboard() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user) {
        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setEl('userName', user.name);
        setEl('userEmail', user.email);
        const avatarEl = document.getElementById('userAvatar');
        if (avatarEl && user.name) {
            avatarEl.textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            }
        };
    }
}

// ── Auth headers utility ────────────────────────────────────────────────
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getAuthHeaders, showAlert };
}
