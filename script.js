/* ==========================================================================
   1. SIDEBAR & NAVIGATION TOGGLE LOGIC
   ========================================================================== */
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const closeBtn = document.getElementById('close-btn');
const overlay = document.getElementById('overlay');
const refreshBtn = document.getElementById('refresh-btn');

function openSidebar() {
    if (sidebar && overlay) {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    }
}

function closeSidebar() {
    if (sidebar && overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
}

function refreshPage() {
    window.location.reload();
}

if (menuToggle) menuToggle.addEventListener('click', openSidebar);
if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
if (overlay) overlay.addEventListener('click', closeSidebar);
if (refreshBtn) refreshBtn.addEventListener('click', refreshPage);

/* ==========================================================================
   2. CLOUDINARY DIRECT PHOTO UPLOAD LOGIC
   ========================================================================== */
// YOUR CLOUDINARY CONFIGURATION (REPLACE WITH YOUR KEYS)
const CLOUDINARY_CLOUD_NAME = 'testey';
const CLOUDINARY_UPLOAD_PRESET = 'your_unsigned_preset_here';

const photoGrid = document.getElementById('photo-grid');
const photoInput = document.getElementById('photo-input');
const photoCategorySelect = document.getElementById('photo-category-select');
const uploadBtn = document.getElementById('upload-btn');
const categoryPills = document.querySelectorAll('.category-pill');

const PHOTO_STORAGE_KEY = 'my_website_photos';

const defaultPhotos = [
    { id: '1', src: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80', category: 'friends' },
    { id: '2', src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80', category: 'family' }
];

let photos = JSON.parse(localStorage.getItem(PHOTO_STORAGE_KEY)) || defaultPhotos;

function savePhotosToStorage() {
    localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(photos));
}

function renderPhotos(activeCategory = 'all') {
    if (!photoGrid) return;

    photoGrid.innerHTML = '';

    const filteredPhotos = photos.filter(p => activeCategory === 'all' || p.category === activeCategory);

    filteredPhotos.forEach(p => {
        const card = document.createElement('div');
        card.classList.add('photo-card');
        card.setAttribute('data-category', p.category);
        card.innerHTML = `
            <img src="${p.src}" alt="${p.category} photo">
            <div class="photo-tag">${p.category}</div>
            <button class="delete-photo-btn" title="Delete Photo">&times;</button>
        `;

        card.querySelector('.delete-photo-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            photos = photos.filter(item => item.id !== p.id);
            savePhotosToStorage();
            renderPhotos(getCurrentActiveCategory());
        });

        photoGrid.appendChild(card);
    });
}

function getCurrentActiveCategory() {
    const activePill = document.querySelector('.category-pill.active');
    return activePill ? activePill.getAttribute('data-category') : 'all';
}

categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
        categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        renderPhotos(pill.getAttribute('data-category'));
    });
});

// Cloudinary Direct HTTP API Upload Handler
if (uploadBtn && photoInput) {
    uploadBtn.addEventListener('click', async () => {
        const file = photoInput.files[0];
        const category = photoCategorySelect.value;

        if (!file) {
            alert('Please select an image file first.');
            return;
        }

        if (CLOUDINARY_CLOUD_NAME === 'your_cloud_name_here') {
            alert('Please enter your Cloudinary Cloud Name inside script.js first!');
            return;
        }

        uploadBtn.textContent = 'Uploading to Cloud...';
        uploadBtn.disabled = true;

        // Build FormData for Cloudinary API request
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        try {
            // Send direct HTTP POST to Cloudinary API endpoint
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.secure_url) {
                const newPhoto = {
                    id: Date.now().toString(),
                    src: data.secure_url, // Web URL provided by Cloudinary
                    category: category
                };
                photos.unshift(newPhoto);
                savePhotosToStorage();
                renderPhotos(getCurrentActiveCategory());
                photoInput.value = '';
                alert('Success! Image uploaded to cloud.');
            } else {
                alert('Upload failed: Check your Cloud Name and Preset settings.');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred during upload.');
        } finally {
            uploadBtn.textContent = '+ Upload to Cloud';
            uploadBtn.disabled = false;
        }
    });
}

renderPhotos();

/* ==========================================================================
   3. SHARED GOOGLE DOCS EDITOR (NOTES & RECIPES)
   ========================================================================== */
const docGrid = document.getElementById('doc-grid');
const docSearch = document.getElementById('doc-search');
const addDocBtn = document.getElementById('add-doc-btn');

const docModal = document.getElementById('doc-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const saveDocBtn = document.getElementById('save-doc-btn');
const deleteDocBtn = document.getElementById('delete-doc-btn');

const docIdInput = document.getElementById('doc-id');
const docTitleInput = document.getElementById('doc-title-input');
const docBodyEditor = document.getElementById('doc-body-editor');
const docStatus = document.getElementById('doc-status');

const pageType = document.body.getAttribute('data-page') || 'notes';
const STORAGE_KEY = pageType === 'recipes' ? 'my_website_recipes' : 'my_website_notes';

let docs = [];
try {
    docs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if (!Array.isArray(docs)) docs = [];
} catch (error) {
    docs = [];
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

function stripTags(html) {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderDocs(filterText = '') {
    if (!docGrid) return;

    docGrid.innerHTML = '';

    const filteredDocs = docs.filter(d => {
        const title = (d.title || '').toLowerCase();
        const body = stripTags(d.body).toLowerCase();
        const search = filterText.toLowerCase();
        return title.includes(search) || body.includes(search);
    });

    if (filteredDocs.length === 0) {
        docGrid.innerHTML = `<p style="grid-column: 1/-1; color: #777;">No documents found.</p>`;
        return;
    }

    filteredDocs.forEach(d => {
        const card = document.createElement('div');
        card.classList.add('doc-card');
        card.innerHTML = `
            <h4 class="doc-card-title">${escapeHtml(d.title || 'Untitled')}</h4>
            <p class="doc-card-body">${escapeHtml(stripTags(d.body))}</p>
            <span class="doc-card-date">${d.date || ''}</span>
        `;
        card.addEventListener('click', () => openEditDoc(d));
        docGrid.appendChild(card);
    });
}

function openNewDoc() {
    docIdInput.value = '';
    docTitleInput.value = '';
    docBodyEditor.innerHTML = '';
    deleteDocBtn.style.display = 'none';
    if (docStatus) docStatus.textContent = 'Unsaved document';
    docModal.classList.add('active');
}

function openEditDoc(doc) {
    docIdInput.value = doc.id;
    docTitleInput.value = doc.title || '';
    docBodyEditor.innerHTML = doc.body || '';
    deleteDocBtn.style.display = 'inline-block';
    if (docStatus) docStatus.textContent = '✓ Saved to browser';
    docModal.classList.add('active');
}

function closeDoc() {
    docModal.classList.remove('active');
}

function handleSaveDoc() {
    const title = docTitleInput.value.trim();
    const body = docBodyEditor.innerHTML.trim();
    const id = docIdInput.value;

    const currentDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    if (id) {
        docs = docs.map(d => d.id === id ? { ...d, title, body, date: currentDate } : d);
    } else {
        const newDoc = {
            id: Date.now().toString(),
            title: title || 'Untitled',
            body: body,
            date: currentDate
        };
        docs.unshift(newDoc);
    }

    saveToStorage();
    renderDocs(docSearch ? docSearch.value : '');
    if (docStatus) docStatus.textContent = '✓ Saved to browser';
    closeDoc();
}

function handleDeleteDoc() {
    const id = docIdInput.value;
    if (id && confirm('Are you sure you want to delete this document?')) {
        docs = docs.filter(d => d.id !== id);
        saveToStorage();
        renderDocs(docSearch ? docSearch.value : '');
        closeDoc();
    }
}

document.querySelectorAll('.toolbar-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const command = button.getAttribute('data-command');
        document.execCommand(command, false, null);
    });
});

if (addDocBtn) addDocBtn.addEventListener('click', openNewDoc);
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeDoc);
if (saveDocBtn) saveDocBtn.addEventListener('click', handleSaveDoc);
if (deleteDocBtn) deleteDocBtn.addEventListener('click', handleDeleteDoc);

if (docSearch) {
    docSearch.addEventListener('input', (e) => {
        renderDocs(e.target.value);
    });
}

renderDocs();