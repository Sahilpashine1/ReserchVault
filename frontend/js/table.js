// Publications data
let publications = [];
let allPublications = []; // Store all publications
let myPublications = []; // Store only user's publications
let currentEditId = null;
let currentTab = 'my'; // Track current tab: 'my' or 'all'
let canViewAllPublications = false; // Track if user can see all publications
let currentUserId = null; // Store current user ID

// Initialize table functionality
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('dashboard.html')) {
        // Show admin menu if user is super admin
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'super_admin') {
            document.getElementById('adminMenuItem').style.display = 'block';
        }

        loadPublications();
        initTableControls();
        initModals();
    }
});

// Load publications from API
async function loadPublications() {
    try {
        // First, load user's own publications
        const myResponse = await fetch(`${window.API_BASE_URL}/publications?own=true`, {
            headers: getAuthHeaders()
        });

        if (myResponse.ok) {
            const myData = await myResponse.json();
            myPublications = myData.publications || [];
            currentUserId = myData.currentUserId;
            canViewAllPublications = myData.createdByAdmin || myData.userRole === 'super_admin';

            // Update counts
            document.getElementById('myCount').textContent = myPublications.length;

            // If user can view all publications, fetch them
            if (canViewAllPublications) {
                const allResponse = await fetch(`${window.API_BASE_URL}/publications`, {
                    headers: getAuthHeaders()
                });

                if (allResponse.ok) {
                    const allData = await allResponse.json();
                    allPublications = allData.publications || [];
                    document.getElementById('allCount').textContent = allPublications.length;
                }

                // Show tabs
                document.querySelector('.tab-btn').parentElement.style.display = 'inline-flex';
            } else {
                // Hide tabs for self-registered users
                const tabContainer = document.querySelector('.tab-btn')?.parentElement;
                if (tabContainer) {
                    tabContainer.style.display = 'none';
                }
            }

            // Render based on current tab
            if (currentTab === 'my') {
                publications = myPublications;
            } else if (canViewAllPublications) {
                publications = allPublications;
            } else {
                publications = myPublications; // Fallback
            }

            renderPublications(publications);
        } else {
            showDashboardAlert('Error loading publications', 'error');
        }
    } catch (error) {
        console.error('Load publications error:', error);
        showDashboardAlert('Connection error. Please check if the server is running.', 'error');
    }
}

// Render publications table
function renderPublications(pubs) {
    const tbody = document.getElementById('publicationsTableBody');
    const pubCount = document.getElementById('pubCount');

    pubCount.textContent = pubs.length;

    if (pubs.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted" style="padding: 3rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📚</div>
          <p>No publications yet. Add your first publication or upload an Excel/CSV file.</p>
        </td>
      </tr>
    `;
        return;
    }

    tbody.innerHTML = pubs.map(pub => `
    <tr>
      <td style="max-width: 300px;">
        <strong>${escapeHtml(pub.title)}</strong>
      </td>
      <td>${escapeHtml(pub.authors)}</td>
      <td><strong>${pub.year}</strong></td>
      <td>${escapeHtml(pub.journalConference)}</td>
      <td>
        <div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${escapeHtml(pub.keywords)}
        </div>
      </td>
      <td>
        ${pub.publicationLink ?
            `<a href="${escapeHtml(pub.publicationLink)}" target="_blank" style="color: var(--primary-blue); text-decoration: none;">🔗 View</a>` :
            '<span class="text-muted">No link</span>'}
      </td>
      <td>
        <div class="table-actions">
          <button class="icon-btn" onclick="viewPublication('${pub._id}')" title="View Details">
            👁️
          </button>
          ${canEditPublication(pub) ? `
          <button class="icon-btn" onclick="editPublication('${pub._id}')" title="Edit">
            ✏️
          </button>
          <button class="icon-btn delete" onclick="deletePublication('${pub._id}')" title="Delete">
            🗑️
          </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

// Initialize table controls (search, sort, filter)
function initTableControls() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = publications.filter(pub =>
            pub.title.toLowerCase().includes(query) ||
            pub.authors.toLowerCase().includes(query) ||
            pub.keywords.toLowerCase().includes(query) ||
            pub.journalConference.toLowerCase().includes(query)
        );
        renderPublications(filtered);
    });

    // Sort functionality
    const sortSelect = document.getElementById('sortSelect');
    sortSelect?.addEventListener('change', (e) => {
        const sortType = e.target.value;
        let sorted = [...publications];

        switch (sortType) {
            case 'newest':
                sorted.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
                break;
            case 'oldest':
                sorted.sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));
                break;
            case 'year-desc':
                sorted.sort((a, b) => b.year - a.year);
                break;
            case 'year-asc':
                sorted.sort((a, b) => a.year - b.year);
                break;
            case 'title':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }

        renderPublications(sorted);
    });
}

// Initialize modals
function initModals() {
    const publicationModal = document.getElementById('publicationModal');
    const uploadModal = document.getElementById('uploadModal');

    // Add publication button
    document.getElementById('addPublicationBtn')?.addEventListener('click', () => {
        currentEditId = null;
        document.getElementById('modalTitle').textContent = 'Add New Publication';
        document.getElementById('publicationForm').reset();
        publicationModal.classList.add('active');
    });

    // Upload button
    document.getElementById('uploadBtn')?.addEventListener('click', () => {
        uploadModal.classList.add('active');
    });

    // Close modals
    document.getElementById('closeModal')?.addEventListener('click', () => {
        publicationModal.classList.remove('active');
    });

    document.getElementById('cancelBtn')?.addEventListener('click', () => {
        publicationModal.classList.remove('active');
    });

    document.getElementById('closeUploadModal')?.addEventListener('click', () => {
        uploadModal.classList.remove('active');
    });

    document.getElementById('cancelUploadBtn')?.addEventListener('click', () => {
        uploadModal.classList.remove('active');
    });

    // View modal close buttons
    const viewModal = document.getElementById('viewPublicationModal');
    document.getElementById('closeViewModal')?.addEventListener('click', () => {
        viewModal.classList.remove('active');
    });

    document.getElementById('closeViewBtn')?.addEventListener('click', () => {
        viewModal.classList.remove('active');
    });

    // Edit from view button
    document.getElementById('editFromViewBtn')?.addEventListener('click', () => {
        if (currentEditId) {
            viewModal.classList.remove('active');
            editPublication(currentEditId);
        }
    });

    // Save publication
    document.getElementById('savePublicationBtn')?.addEventListener('click', savePublication);

    // Upload file handling
    initFileUpload();
}

// Save publication (create or update)
async function savePublication() {
    const id = currentEditId;
    const title = document.getElementById('pubTitle').value;
    const authors = document.getElementById('pubAuthors').value;
    const year = document.getElementById('pubYear').value;
    const journalConference = document.getElementById('pubJournal').value;
    const keywords = document.getElementById('pubKeywords').value;
    const abstract = document.getElementById('pubAbstract').value;
    const publicationLink = document.getElementById('pubLink').value;

    if (!title || !authors || !year || !journalConference || !keywords) {
        showDashboardAlert('Please fill in all required fields', 'error');
        return;
    }

    // Show loading
    document.getElementById('saveButtonText').textContent = id ? 'Updating...' : 'Saving...';
    document.getElementById('saveSpinner').classList.remove('hidden');

    const publicationData = {
        title,
        authors,
        year: parseInt(year),
        journalConference,
        keywords,
        abstract,
        publicationLink
    };

    try {
        const url = id ? `${window.API_BASE_URL}/publications/${id}` : `${window.API_BASE_URL}/publications`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(publicationData)
        });

        const data = await response.json();

        if (response.ok) {
            showDashboardAlert(data.message, 'success');
            document.getElementById('publicationModal').classList.remove('active');
            loadPublications(); // Reload the table
        } else {
            showDashboardAlert(data.message || 'Error saving publication', 'error');
        }
    } catch (error) {
        console.error('Save publication error:', error);
        showDashboardAlert('Connection error', 'error');
    } finally {
        document.getElementById('saveButtonText').textContent = 'Save Publication';
        document.getElementById('saveSpinner').classList.add('hidden');
    }
}

// View publication details
function viewPublication(id) {
    const pub = publications.find(p => p._id === id);
    if (!pub) return;

    currentEditId = id;

    const viewContent = document.getElementById('viewPublicationContent');
    viewContent.innerHTML = `
        <div style="padding: 1rem;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 15px; margin-bottom: 2rem;">
                <h2 style="color: white; font-size: 1.8rem; margin-bottom: 1rem; line-height: 1.4;">${escapeHtml(pub.title)}</h2>
                <div style="display: flex; gap: 2rem; flex-wrap: wrap; font-size: 0.95rem;">
                    <div><strong>📅 Year:</strong> ${pub.year}</div>
                    <div><strong>📚 Type:</strong> Publication</div>
                </div>
            </div>

            <div style="display: grid; gap: 1.5rem;">
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--primary-blue);">
                    <div style="font-weight: 700; color: var(--primary-navy); margin-bottom: 0.75rem; font-size: 1.1rem;">
                        ✍️ Authors
                    </div>
                    <div style="color: var(--text-primary); line-height: 1.6;">
                        ${escapeHtml(pub.authors)}
                    </div>
                </div>

                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; border-left: 4px solid #14b8a6;">
                    <div style="font-weight: 700; color: var(--primary-navy); margin-bottom: 0.75rem; font-size: 1.1rem;">
                        📖 Journal/Conference
                    </div>
                    <div style="color: var(--text-primary);">
                        ${escapeHtml(pub.journalConference)}
                    </div>
                </div>

                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; border-left: 4px solid #f59e0b;">
                    <div style="font-weight: 700; color: var(--primary-navy); margin-bottom: 0.75rem; font-size: 1.1rem;">
                        🔍 Keywords
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${pub.keywords.split(',').map(keyword =>
        `<span style="background: white; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.85rem; border: 1px solid var(--border-light);">
                                ${escapeHtml(keyword.trim())}
                            </span>`
    ).join('')}
                    </div>
                </div>

                ${pub.abstract ? `
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; border-left: 4px solid #8b5cf6;">
                    <div style="font-weight: 700; color: var(--primary-navy); margin-bottom: 0.75rem; font-size: 1.1rem;">
                        📝 Abstract
                    </div>
                    <div style="color: var(--text-primary); line-height: 1.7; text-align: justify;">
                        ${escapeHtml(pub.abstract)}
                    </div>
                </div>
                ` : ''}

                ${pub.publicationLink ? `
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 12px; border-left: 4px solid #ec4899;">
                    <div style="font-weight: 700; color: var(--primary-navy); margin-bottom: 0.75rem; font-size: 1.1rem;">
                        🔗 Publication Link
                    </div>
                    <a href="${escapeHtml(pub.publicationLink)}" target="_blank" 
                       style="color: var(--primary-blue); text-decoration: none; font-weight: 500; display: inline-flex; align-items: center; gap: 0.5rem;">
                        ${escapeHtml(pub.publicationLink)}
                        <span style="font-size: 0.9rem;">🔗</span>
                    </a>
                </div>
                ` : ''}

                <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: var(--text-muted);">
                    <div>
                        <strong>Created:</strong> ${new Date(pub.createdDate).toLocaleDateString()}
                    </div>
                    ${pub.lastModifiedDate ? `
                    <div>
                        <strong>Modified:</strong> ${new Date(pub.lastModifiedDate).toLocaleDateString()}
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    // Show/hide edit button based on permissions
    const editButton = document.getElementById('editFromViewBtn');
    if (canEditPublication(pub)) {
        editButton.style.display = 'inline-block';
    } else {
        editButton.style.display = 'none';
    }

    document.getElementById('viewPublicationModal').classList.add('active');
}

// Edit publication
function editPublication(id) {
    const pub = publications.find(p => p._id === id);
    if (!pub) return;

    currentEditId = id;
    document.getElementById('modalTitle').textContent = 'Edit Publication';

    document.getElementById('pubTitle').value = pub.title;
    document.getElementById('pubAuthors').value = pub.authors;
    document.getElementById('pubYear').value = pub.year;
    document.getElementById('pubJournal').value = pub.journalConference;
    document.getElementById('pubKeywords').value = pub.keywords;
    document.getElementById('pubAbstract').value = pub.abstract || '';
    document.getElementById('pubLink').value = pub.publicationLink || '';

    document.getElementById('publicationModal').classList.add('active');
}

// Delete publication
async function deletePublication(id) {
    if (!confirm('Are you sure you want to delete this publication?')) {
        return;
    }

    try {
        const response = await fetch(`${window.API_BASE_URL}/publications/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (response.ok) {
            showDashboardAlert(data.message, 'success');
            loadPublications();
        } else {
            showDashboardAlert(data.message || 'Error deleting publication', 'error');
        }
    } catch (error) {
        console.error('Delete publication error:', error);
        showDashboardAlert('Connection error', 'error');
    }
}

// Initialize file upload
function initFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    // Click to browse
    uploadArea?.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop
    uploadArea?.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea?.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea?.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    // File input change
    fileInput?.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
}

// Handle file upload
async function handleFileUpload(file) {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(fileExt)) {
        showDashboardAlert('Please upload a valid Excel (.xlsx, .xls) or CSV file', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showDashboardAlert('File size must be less than 5MB', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const uploadResult = document.getElementById('uploadResult');
    uploadResult.innerHTML = `
    <div class="alert alert-info">
      <span class="spinner"></span>
      <span>Uploading and processing file...</span>
    </div>
  `;
    uploadResult.classList.remove('hidden');

    try {
        const response = await fetch(`${window.API_BASE_URL}/publications/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            uploadResult.innerHTML = `
        <div class="alert alert-success">
          <span>✅</span>
          <div>
            <strong>${data.message}</strong>
            <p style="margin-top: 0.5rem; font-size: 0.9rem;">
              Total: ${data.stats.total} | 
              Valid: ${data.stats.valid} | 
              Invalid: ${data.stats.invalid}
            </p>
          </div>
        </div>
      `;

            if (data.errors && data.errors.length > 0) {
                uploadResult.innerHTML += `
          <div class="alert alert-error" style="margin-top: 1rem;">
            <span>⚠️</span>
            <div>
              <strong>Some rows had errors:</strong>
              <ul style="margin-top: 0.5rem; padding-left: 1.5rem; font-size: 0.85rem;">
                ${data.errors.slice(0, 5).map(err =>
                    `<li>Row ${err.row}: ${err.errors.join(', ')}</li>`
                ).join('')}
                ${data.errors.length > 5 ? '<li>... and more</li>' : ''}
              </ul>
            </div>
          </div>
        `;
            }

            // Reload publications
            loadPublications();

            // Reset file input
            document.getElementById('fileInput').value = '';
        } else {
            uploadResult.innerHTML = `
        <div class="alert alert-error">
          <span>❌</span>
          <span>${data.message || 'Upload failed'}</span>
        </div>
      `;
        }
    } catch (error) {
        console.error('Upload error:', error);
        uploadResult.innerHTML = `
      <div class="alert alert-error">
        <span>❌</span>
        <span>Connection error. Please try again.</span>
      </div>
    `;
    }
}

// Show alert on dashboard
function showDashboardAlert(message, type = 'info') {
    const alertArea = document.getElementById('alertArea');
    const alertClass = type === 'success' ? 'alert-success' : type === 'info' ? 'alert-info' : 'alert-error';
    const icon = type === 'success' ? '✅' : type === 'info' ? 'ℹ️' : '❌';

    alertArea.innerHTML = `
    <div class="alert ${alertClass}">
      <span>${icon}</span>
      <span>${message}</span>
    </div>
  `;

    setTimeout(() => {
        alertArea.innerHTML = '';
    }, 5000);
}

// Check if user can edit/delete a publication
function canEditPublication(pub) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // Super admin can edit any publication
    if (user.role === 'super_admin') {
        return true;
    }
    // Regular users can only edit their own publications
    return pub.userId === currentUserId || pub.userId?._id === currentUserId;
}

// Switch between tabs
function switchTab(tab) {
    if (!canViewAllPublications && tab === 'all') {
        showDashboardAlert('You do not have permission to view all publications', 'error');
        return;
    }

    currentTab = tab;

    // Update tab buttons
    document.getElementById('myPublicationsTab').classList.toggle('active', tab === 'my');
    document.getElementById('allPublicationsTab').classList.toggle('active', tab === 'all');

    // Update publications array
    if (tab === 'my') {
        publications = myPublications;
    } else {
        publications = allPublications;
    }

    // Re-render table
    renderPublications(publications);

    // Update chatbot context if available
    if (typeof FloatingChatbot !== 'undefined' && FloatingChatbot.updateContext) {
        FloatingChatbot.updateContext();
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
