// API Base URL - loaded from config.js (automatically switches between local and production)
const API_BASE_URL = `${window.API_BASE_URL || 'http://localhost:5000'}/api`;

// Check if user is already logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname;

    if (token && (currentPage.endsWith('index.html') || currentPage.endsWith('/'))) {
        window.location.href = 'home.html';
    } else if (!token && currentPage.endsWith('dashboard.html')) {
        window.location.href = 'index.html';
    }
}

// Show alert message
function showAlert(elementId, message, type = 'error') {
    const alertElement = document.getElementById(elementId);
    const alertClass = type === 'success' ? 'alert-success' : type === 'info' ? 'alert-info' : 'alert-error';
    const icon = type === 'success' ? '✅' : type === 'info' ? 'ℹ️' : '❌';

    alertElement.innerHTML = `
    <div class="alert ${alertClass}">
      <span>${icon}</span>
      <span>${message}</span>
    </div>
  `;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        alertElement.innerHTML = '';
    }, 5000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Login/Register page
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        initAuthPage();
    }

    // Dashboard page
    if (window.location.pathname.endsWith('dashboard.html')) {
        initDashboard();
    }
});

// Initialize authentication page
function initAuthPage() {
    const loginForm = document.getElementById('loginFormElement');
    const registerForm = document.getElementById('registerFormElement');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');

    // Toggle between login and register
    showRegisterLink?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
    });

    showLoginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
    });

    // Login form submission
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Show loading
        document.getElementById('loginButtonText').textContent = 'Signing in...';
        document.getElementById('loginSpinner').classList.remove('hidden');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save token and user info
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                showAlert('loginAlert', 'Login successful! Redirecting...', 'success');

                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1000);
            } else {
                showAlert('loginAlert', data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('loginAlert', 'Connection error. Please make sure the server is running.');
        } finally {
            document.getElementById('loginButtonText').textContent = 'Sign In';
            document.getElementById('loginSpinner').classList.add('hidden');
        }
    });

    // Register form submission
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const department = document.getElementById('registerDepartment').value;
        const password = document.getElementById('registerPassword').value;

        // Show loading
        document.getElementById('registerButtonText').textContent = 'Creating account...';
        document.getElementById('registerSpinner').classList.remove('hidden');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, department, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save token and user info
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                showAlert('registerAlert', 'Account created successfully! Redirecting...', 'success');

                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1000);
            } else {
                showAlert('registerAlert', data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showAlert('registerAlert', 'Connection error. Please make sure the server is running.');
        } finally {
            document.getElementById('registerButtonText').textContent = 'Create Account';
            document.getElementById('registerSpinner').classList.add('hidden');
        }
    });
}

// Initialize dashboard
function initDashboard() {
    const user = JSON.parse(localStorage.getItem('user'));

    if (user) {
        // Display user info
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userEmail').textContent = user.email;

        // Set avatar initial
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        document.getElementById('userAvatar').textContent = initials;
    }

    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        }
    });
}

// Get auth headers for API requests
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_BASE_URL, getAuthHeaders, showAlert };
}
