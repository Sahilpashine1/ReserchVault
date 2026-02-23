/**
 * Admin Panel JavaScript
 * User Management Interface for Super Admin
 */

// API URL
window.API_URL = 'http://localhost:3000/api';
let currentUsers = [];
let currentUserId = null;
let isEditMode = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndRole();
    setupEventListeners();
    loadUsers();
    loadStats();
});

/**
 * Check authentication and admin role
 */
function checkAuthAndRole() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Check if user has admin access
    if (user.role !== 'super_admin') {
        showAlert('Access Denied. Super Admin privileges required.', 'error');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        return;
    }

    // Update UI with user info
    document.getElementById('userName').textContent = user.name || 'Admin';
    document.getElementById('userEmail').textContent = user.email || '';
    document.getElementById('userRole').textContent = getRoleDisplayName(user.role);

    if (user.name) {
        document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
    }


}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    // Create user
    const createUserBtn = document.getElementById('createUserBtn');
    if (createUserBtn) {
        createUserBtn.addEventListener('click', openCreateUserModal);
    }

    // User modal
    document.getElementById('closeUserModal').addEventListener('click', closeUserModal);
    document.getElementById('cancelUserBtn').addEventListener('click', closeUserModal);
    document.getElementById('saveUserBtn').addEventListener('click', saveUser);

    // Role modal
    document.getElementById('closeRoleModal').addEventListener('click', closeRoleModal);
    document.getElementById('cancelRoleBtn').addEventListener('click', closeRoleModal);
    document.getElementById('confirmRoleBtn').addEventListener('click', confirmRoleChange);

    // Filters
    document.getElementById('userSearchInput').addEventListener('input', filterUsers);
    document.getElementById('roleFilter').addEventListener('change', filterUsers);
    document.getElementById('statusFilter').addEventListener('change', filterUsers);

    // Role select change (show permissions)
    document.getElementById('newRoleSelect').addEventListener('change', updateRolePermissions);
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load data for the tab if needed
    if (tabName === 'logs') {
        loadActivityLogs();
    } else if (tabName === 'stats') {
        loadDetailedStats();
    }
}

/**
 * Load all users
 */
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load users');
        }

        const data = await response.json();
        currentUsers = data.data || [];
        renderUsers(currentUsers);
        updateUserStats(currentUsers);

    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('Failed to load users', 'error');
    }
}

/**
 * Render users table
 */
function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = currentUser.role === 'super_admin';

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
                    <p>No users found</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => {
        const isCurrentUser = user._id === currentUser.id;
        const createdDate = new Date(user.createdAt).toLocaleDateString();

        return `
            <tr>
                <td><strong>${user.name}</strong></td>
                <td>${user.email}</td>
                <td>${user.department || '-'}</td>
                <td>
                    <span class="role-badge ${user.role}">${getRoleDisplayName(user.role)}</span>
                </td>
                <td>
                    <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">
                        ${user.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${user.publicationCount || 0}</td>
                <td>${createdDate}</td>
                <td>
                    ${isSuperAdmin && !isCurrentUser ? `
                        <button class="action-btn edit" onclick="editUser('${user._id}')">✏️ Edit</button>
                        <button class="action-btn role" onclick="openRoleModal('${user._id}')">🔄 Role</button>
                        <button class="action-btn delete" onclick="deleteUser('${user._id}', '${user.name}')">🗑️</button>
                    ` : '<span style="color: var(--text-muted);">-</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Update user statistics
 */
function updateUserStats(users) {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const adminUsers = users.filter(u => u.role === 'super_admin').length;

    document.getElementById('totalUsersCount').textContent = totalUsers;
    document.getElementById('activeUsersCount').textContent = activeUsers;
    document.getElementById('adminUsersCount').textContent = adminUsers;
}

/**
 * Filter users
 */
function filterUsers() {
    const searchTerm = document.getElementById('userSearchInput').value.toLowerCase();
    const roleFilter = document.getElementById('roleFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    let filtered = [...currentUsers];

    // Search filter
    if (searchTerm) {
        filtered = filtered.filter(user =>
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            (user.department && user.department.toLowerCase().includes(searchTerm))
        );
    }

    // Role filter
    if (roleFilter) {
        filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter) {
        const isActive = statusFilter === 'true';
        filtered = filtered.filter(user => user.isActive === isActive);
    }

    renderUsers(filtered);
}

/**
 * Open create user modal
 */
function openCreateUserModal() {
    isEditMode = false;
    currentUserId = null;
    document.getElementById('userModalTitle').textContent = 'Create New User';
    document.getElementById('saveUserButtonText').textContent = 'Create User';
    document.getElementById('userForm').reset();
    document.getElementById('passwordGroup').querySelector('p').style.display = 'none';
    document.getElementById('userPasswordInput').required = true;
    document.getElementById('userModal').classList.add('active');
}

/**
 * Edit user
 */
async function editUser(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/admin/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load user');

        const result = await response.json();
        const user = result.data;

        isEditMode = true;
        currentUserId = userId;

        document.getElementById('userModalTitle').textContent = 'Edit User';
        document.getElementById('saveUserButtonText').textContent = 'Update User';
        document.getElementById('userId').value = user._id;
        document.getElementById('userNameInput').value = user.name;
        document.getElementById('userEmailInput').value = user.email;
        document.getElementById('userDepartmentInput').value = user.department || '';
        document.getElementById('userRoleInput').value = user.role;
        document.getElementById('userPasswordInput').value = '';
        document.getElementById('userPasswordInput').required = false;
        document.getElementById('passwordGroup').querySelector('p').style.display = 'block';

        document.getElementById('userModal').classList.add('active');

    } catch (error) {
        console.error('Error loading user:', error);
        showAlert('Failed to load user details', 'error');
    }
}

/**
 * Close user modal
 */
function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
    document.getElementById('userForm').reset();
}

/**
 * Save user (create or update)
 */
async function saveUser() {
    const name = document.getElementById('userNameInput').value.trim();
    const email = document.getElementById('userEmailInput').value.trim();
    const department = document.getElementById('userDepartmentInput').value.trim();
    const role = document.getElementById('userRoleInput').value;
    const password = document.getElementById('userPasswordInput').value;

    if (!name || !email) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    if (!isEditMode && !password) {
        showAlert('Password is required for new users', 'error');
        return;
    }

    const userData = { name, email, department, role };
    if (password) {
        userData.password = password;
    }

    try {
        const token = localStorage.getItem('token');
        const url = isEditMode
            ? `${window.API_URL}/admin/users/${currentUserId}`
            : `${window.API_URL}/admin/users`;

        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to save user');
        }

        showAlert(result.message || `User ${isEditMode ? 'updated' : 'created'} successfully`, 'success');
        closeUserModal();
        loadUsers();

    } catch (error) {
        console.error('Error saving user:', error);
        showAlert(error.message || 'Failed to save user', 'error');
    }
}

/**
 * Open role change modal
 */
function openRoleModal(userId) {
    const user = currentUsers.find(u => u._id === userId);
    if (!user) return;

    currentUserId = userId;
    document.getElementById('roleChangeUserName').textContent = user.name;
    document.getElementById('roleChangeUserEmail').textContent = user.email;
    document.getElementById('newRoleSelect').value = user.role;
    updateRolePermissions();
    document.getElementById('roleModal').classList.add('active');
}

/**
 * Close role modal
 */
function closeRoleModal() {
    document.getElementById('roleModal').classList.remove('active');
}

/**
 * Update role permissions description
 */
function updateRolePermissions() {
    const role = document.getElementById('newRoleSelect').value;
    const permissionsList = document.getElementById('rolePermissionsList');

    const permissions = {
        'user': [
            '✅ View all publications (if created by admin)',
            '✅ Add, edit, delete own publications',
            '✅ Upload Excel/CSV files',
            '✅ Use chatbot',
            '✅ Change own password',
            '❌ Cannot edit others\' publications'
        ],
        'super_admin': [
            '✅ Full CRUD on all publications',
            '✅ Create, edit, delete users',
            '✅ Change user roles',
            '✅ View activity/audit logs',
            '✅ Export logs',
            '✅ System management'
        ]
    };

    permissionsList.innerHTML = permissions[role].map(p => `<li>${p}</li>`).join('');
}

/**
 * Confirm role change
 */
async function confirmRoleChange() {
    const newRole = document.getElementById('newRoleSelect').value;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/admin/users/${currentUserId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to change role');
        }

        showAlert(result.message || 'Role changed successfully', 'success');
        closeRoleModal();
        loadUsers();

    } catch (error) {
        console.error('Error changing role:', error);
        showAlert(error.message || 'Failed to change role', 'error');
    }
}

/**
 * Delete user
 */
async function deleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to delete user "${userName}"?\n\nThis will also delete all their publications. This action cannot be undone.`)) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to delete user');
        }

        showAlert(result.message || 'User deleted successfully', 'success');
        loadUsers();

    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert(error.message || 'Failed to delete user', 'error');
    }
}

/**
 * Load system statistics
 */
async function loadStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) return;

        const result = await response.json();
        // Stats are displayed in the Users tab cards

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Load detailed statistics for stats tab
 */
async function loadDetailedStats() {
    const statsContent = document.getElementById('statsContent');
    statsContent.innerHTML = '<p>Loading statistics...</p>';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load statistics');

        const result = await response.json();
        const stats = result.data;

        statsContent.innerHTML = `
            <div style="text-align: left;">
                <h3>User Statistics</h3>
                <p>Total Users: <strong>${stats.users.total}</strong></p>
                <p>Active Users: <strong>${stats.users.active}</strong></p>
                
                <h3 style="margin-top: 2rem;">Publications</h3>
                <p>Total Publications: <strong>${stats.publications.total}</strong></p>
                
                <h3 style="margin-top: 2rem;">Publications by Year</h3>
                <ul>
                    ${stats.publications.byYear.map(item =>
            `<li>${item._id}: ${item.count} publications</li>`
        ).join('')}
                </ul>

                ${stats.activity ? `
                    <h3 style="margin-top: 2rem;">Activity (Last 24 Hours)</h3>
                    <p>Total Actions: <strong>${stats.activity.last24Hours}</strong></p>
                ` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Error loading detailed stats:', error);
        statsContent.innerHTML = '<p>Failed to load statistics</p>';
    }
}

/**
 * Load activity logs
 */
async function loadActivityLogs() {
    const logsContent = document.getElementById('logsContent');
    logsContent.innerHTML = '<p>Loading activity logs...</p>';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_URL}/admin/activity-logs?limit=50`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load logs');

        const result = await response.json();
        const logs = result.data || [];

        if (logs.length === 0) {
            logsContent.innerHTML = '<p>No activity logs found</p>';
            return;
        }

        logsContent.innerHTML = `
            <table class="users-table">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Role</th>
                        <th>Action</th>
                        <th>Entity</th>
                        <th>IP Address</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.map(log => `
                        <tr>
                            <td>${new Date(log.timestamp).toLocaleString()}</td>
                            <td>${log.userEmail}</td>
                            <td><span class="role-badge ${log.userRole}">${getRoleDisplayName(log.userRole)}</span></td>
                            <td>${log.action}</td>
                            <td>${log.entityType}${log.entityId ? ` (${log.entityId.substring(0, 8)}...)` : ''}</td>
                            <td>${log.ipAddress || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

    } catch (error) {
        console.error('Error loading activity logs:', error);
        logsContent.innerHTML = '<p>Failed to load activity logs. Super Admin access required.</p>';
    }
}

/**
 * Get role display name
 */
function getRoleDisplayName(role) {
    const roleNames = {
        'user': 'Faculty User',
        'super_admin': 'Super Admin'
    };
    return roleNames[role] || role;
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    const alertArea = document.getElementById('alertArea');
    const alertClass = type === 'success' ? 'alert-success' :
        type === 'error' ? 'alert-error' : 'alert-info';

    const alert = document.createElement('div');
    alert.className = `alert ${alertClass}`;
    alert.textContent = message;

    alertArea.appendChild(alert);

    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, 4000);
}

/**
 * Logout
 */
async function logout() {
    try {
        const token = localStorage.getItem('token');
        await fetch(`${window.API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Make functions globally available
window.editUser = editUser;
window.openRoleModal = openRoleModal;
window.deleteUser = deleteUser;

