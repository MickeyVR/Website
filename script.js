/* ==========================================================================
   PASSWORD GATE PROTECTION LOGIC
   ========================================================================== */
(function() {
    const SITE_PASSWORD = "3208.password"; // <-- Change this to your desired password
    const AUTH_KEY = "website_authenticated_session";

    // Check if already authenticated in this session
    if (sessionStorage.getItem(AUTH_KEY) === "true") {
        return; // Allow page to load normally
    }

    // Hide body content initially or build overlay immediately
    document.addEventListener("DOMContentLoaded", () => {
        const overlay = document.createElement('div');
        overlay.id = 'password-gate-overlay';
        overlay.innerHTML = `
            <div class="password-box">
                <h2>Protected Website</h2>
                <p style="font-size: 13px; color: #666; margin-bottom: 10px;">Please enter the password to view this site.</p>
                <input type="password" id="gate-password-input" placeholder="Enter password...">
                <button id="gate-submit-btn">Unlock</button>
                <div class="password-error" id="gate-error-msg">Incorrect password. Please try again.</div>
            </div>
        `;
        document.body.appendChild(overlay);

        const passwordInput = document.getElementById('gate-password-input');
        const submitBtn = document.getElementById('gate-submit-btn');
        const errorMsg = document.getElementById('gate-error-msg');

        function handleUnlock() {
            if (passwordInput.value === SITE_PASSWORD) {
                sessionStorage.setItem(AUTH_KEY, "true");
                overlay.remove();
            } else {
                errorMsg.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
            }
        }

        submitBtn.addEventListener('click', handleUnlock);
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleUnlock();
            }
        });

        // Focus input automatically
        passwordInput.focus();
    });
})();

const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const closeBtn = document.getElementById('close-btn');
const overlay = document.getElementById('overlay');
const refreshBtn = document.getElementById('refresh-btn');

function openSidebar() {
    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
}

function closeSidebar() {
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

function refreshPage() {
    window.location.reload();
}

if (menuToggle) menuToggle.addEventListener('click', openSidebar);
if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
if (overlay) overlay.addEventListener('click', closeSidebar);
if (refreshBtn) refreshBtn.addEventListener('click', refreshPage);

const notesGrid = document.getElementById('notes-grid');
const noteSearch = document.getElementById('note-search');
const addNoteBtn = document.getElementById('add-note-btn');

const noteModal = document.getElementById('note-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const saveNoteBtn = document.getElementById('save-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');

const noteIdInput = document.getElementById('note-id');
const noteTitleInput = document.getElementById('note-title-input');
const noteBodyEditor = document.getElementById('note-body-editor');
const docStatus = document.getElementById('doc-status');

const STORAGE_KEY = 'my_website_notes';
let notes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function renderNotes(filterText = '') {
    if (!notesGrid) return;
    notesGrid.innerHTML = '';
    const filteredNotes = notes.filter(note => 
        note.title.toLowerCase().includes(filterText.toLowerCase()) ||
        stripTags(note.body).toLowerCase().includes(filterText.toLowerCase())
    );

    if (filteredNotes.length === 0) {
        notesGrid.innerHTML = `<p style="grid-column: 1/-1; color: #777;">No documents found.</p>`;
        return;
    }

    filteredNotes.forEach(note => {
        const card = document.createElement('div');
        card.classList.add('note-card');
        card.innerHTML = `
            <h4 class="note-card-title">${escapeHtml(note.title)}</h4>
            <p class="note-card-body">${stripTags(note.body)}</p>
            <span class="note-card-date">${note.date}</span>
        `;
        card.addEventListener('click', () => openEditDoc(note));
        notesGrid.appendChild(card);
    });
}

function stripTags(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function openNewDoc() {
    noteIdInput.value = '';
    noteTitleInput.value = '';
    noteBodyEditor.innerHTML = '';
    deleteNoteBtn.style.display = 'none';
    if (docStatus) docStatus.textContent = 'Unsaved document';
    noteModal.classList.add('active');
}

function openEditDoc(note) {
    noteIdInput.value = note.id;
    noteTitleInput.value = note.title;
    noteBodyEditor.innerHTML = note.body;
    deleteNoteBtn.style.display = 'inline-block';
    if (docStatus) docStatus.textContent = '✓ Saved to browser';
    noteModal.classList.add('active');
}

function closeDoc() {
    noteModal.classList.remove('active');
}

function handleSaveDoc() {
    const title = noteTitleInput.value.trim() || 'Untitled document';
    const body = noteBodyEditor.innerHTML.trim();
    const id = noteIdInput.value;
    const currentDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    if (id) {
        notes = notes.map(n => n.id === id ? { ...n, title, body, date: currentDate } : n);
    } else {
        const newNote = {
            id: Date.now().toString(),
            title,
            body,
            date: currentDate
        };
        notes.unshift(newNote);
    }

    saveToStorage();
    renderNotes(noteSearch ? noteSearch.value : '');
    if (docStatus) docStatus.textContent = '✓ Saved to browser';
    closeDoc();
}

function handleDeleteDoc() {
    const id = noteIdInput.value;
    if (id && confirm('Are you sure you want to delete this document?')) {
        notes = notes.filter(n => n.id !== id);
        saveToStorage();
        renderNotes(noteSearch ? noteSearch.value : '');
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

if (addNoteBtn) addNoteBtn.addEventListener('click', openNewDoc);
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeDoc);
if (saveNoteBtn) saveNoteBtn.addEventListener('click', handleSaveDoc);
if (deleteNoteBtn) deleteNoteBtn.addEventListener('click', handleDeleteDoc);

if (noteSearch) {
    noteSearch.addEventListener('input', (e) => {
        renderNotes(e.target.value);
    });
}

renderNotes();

const recipesGrid = document.getElementById('recipes-grid');
const recipeSearch = document.getElementById('recipe-search');
const addRecipeBtn = document.getElementById('add-recipe-btn');
const recipeCategoryFilters = document.getElementById('recipe-category-filters');

const recipeModal = document.getElementById('recipe-modal');
const recipeModalCloseBtn = document.getElementById('recipe-modal-close-btn');
const saveRecipeBtn = document.getElementById('save-recipe-btn');
const deleteRecipeBtn = document.getElementById('delete-recipe-btn');

const recipeIdInput = document.getElementById('recipe-id');
const recipeTitleInput = document.getElementById('recipe-title-input');
const recipeCategoryInput = document.getElementById('recipe-category-input');
const recipeBodyEditor = document.getElementById('recipe-body-editor');
const recipeDocStatus = document.getElementById('recipe-doc-status');

const RECIPE_STORAGE_KEY = 'my_website_recipes';
let recipes = JSON.parse(localStorage.getItem(RECIPE_STORAGE_KEY)) || [];
let currentRecipeCategoryFilter = 'All';

function saveRecipesToStorage() {
    localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(recipes));
}

function renderRecipeCategories() {
    if (!recipeCategoryFilters) return;
    const uniqueCategories = ['All', ...new Set(recipes.map(r => r.category || 'Uncategorized'))];
    recipeCategoryFilters.innerHTML = '';

    uniqueCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.classList.add('category-pill');
        if (cat === currentRecipeCategoryFilter) {
            btn.classList.add('active');
        }
        btn.textContent = cat;
        btn.addEventListener('click', () => {
            currentRecipeCategoryFilter = cat;
            renderRecipeCategories();
            renderRecipes(recipeSearch ? recipeSearch.value : '');
        });
        recipeCategoryFilters.appendChild(btn);
    });
}

function renderRecipes(filterText = '') {
    if (!recipesGrid) return;
    recipesGrid.innerHTML = '';

    const filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = recipe.title.toLowerCase().includes(filterText.toLowerCase()) ||
                              stripTags(recipe.body).toLowerCase().includes(filterText.toLowerCase());
        const recipeCategory = recipe.category || 'Uncategorized';
        const matchesCategory = currentRecipeCategoryFilter === 'All' || recipeCategory === currentRecipeCategoryFilter;
        return matchesSearch && matchesCategory;
    });

    if (filteredRecipes.length === 0) {
        recipesGrid.innerHTML = `<p style="grid-column: 1/-1; color: #777;">No recipes found in this category.</p>`;
        return;
    }

    filteredRecipes.forEach(recipe => {
        const card = document.createElement('div');
        card.classList.add('recipe-card'); 
        card.innerHTML = `
            <h4 class="recipe-card-title">${escapeHtml(recipe.title)}</h4>
            <span style="display: inline-block; font-size: 11px; background: var(--bg-color); padding: 3px 8px; border-radius: 12px; margin-bottom: 8px; width: fit-content;">${escapeHtml(recipe.category || 'Uncategorized')}</span>
            <p class="recipe-card-body">${stripTags(recipe.body)}</p>
            <span class="note-card-date">${recipe.date}</span>
        `;
        card.addEventListener('click', () => openEditRecipe(recipe));
        recipesGrid.appendChild(card);
    });
}

function openNewRecipe() {
    recipeIdInput.value = '';
    recipeTitleInput.value = '';
    recipeCategoryInput.value = '';
    recipeBodyEditor.innerHTML = '';
    deleteRecipeBtn.style.display = 'none';
    if (recipeDocStatus) recipeDocStatus.textContent = 'Unsaved recipe';
    recipeModal.classList.add('active');
}

function openEditRecipe(recipe) {
    recipeIdInput.value = recipe.id;
    recipeTitleInput.value = recipe.title;
    recipeCategoryInput.value = recipe.category || '';
    recipeBodyEditor.innerHTML = recipe.body;
    deleteRecipeBtn.style.display = 'inline-block';
    if (recipeDocStatus) recipeDocStatus.textContent = '✓ Saved to browser';
    recipeModal.classList.add('active');
}

function closeRecipeDoc() {
    recipeModal.classList.remove('active');
}

function handleSaveRecipe() {
    const title = recipeTitleInput.value.trim() || 'Untitled Recipe';
    const category = recipeCategoryInput.value.trim() || 'Uncategorized';
    const body = recipeBodyEditor.innerHTML.trim();
    const id = recipeIdInput.value;
    const currentDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    if (id) {
        recipes = recipes.map(r => r.id === id ? { ...r, title, category, body, date: currentDate } : r);
    } else {
        const newRecipe = {
            id: Date.now().toString(),
            title,
            category,
            body,
            date: currentDate
        };
        recipes.unshift(newRecipe);
    }

    saveRecipesToStorage();
    renderRecipeCategories();
    renderRecipes(recipeSearch ? recipeSearch.value : '');
    if (recipeDocStatus) recipeDocStatus.textContent = '✓ Saved to browser';
    closeRecipeDoc();
}

function handleDeleteRecipe() {
    const id = recipeIdInput.value;
    if (id && confirm('Are you sure you want to delete this recipe?')) {
        recipes = recipes.filter(r => r.id !== id);
        saveRecipesToStorage();
        renderRecipeCategories();
        renderRecipes(recipeSearch ? recipeSearch.value : '');
        closeRecipeDoc();
    }
}

if (addRecipeBtn) addRecipeBtn.addEventListener('click', openNewRecipe);
if (recipeModalCloseBtn) recipeModalCloseBtn.addEventListener('click', closeRecipeDoc);
if (saveRecipeBtn) saveRecipeBtn.addEventListener('click', handleSaveRecipe);
if (deleteRecipeBtn) deleteRecipeBtn.addEventListener('click', handleDeleteRecipe);

if (recipeSearch) {
    recipeSearch.addEventListener('input', (e) => {
        renderRecipes(e.target.value);
    });
}

renderRecipeCategories();
renderRecipes();

const photoGrid = document.getElementById('photo-grid');
const photoCategoryFilters = document.getElementById('photo-category-filters');
const addPhotoBtn = document.getElementById('add-photo-btn');
const photoModal = document.getElementById('photo-modal');
const photoModalCloseBtn = document.getElementById('photo-modal-close-btn');
const savePhotoBtn = document.getElementById('save-photo-btn');
const photoFileInput = document.getElementById('photo-file-input');
const photoCategoryInput = document.getElementById('photo-category-input');

const PHOTO_STORAGE_KEY = 'my_website_uploaded_photos';
let uploadedPhotos = JSON.parse(localStorage.getItem(PHOTO_STORAGE_KEY)) || [];
let currentPhotoCategory = 'all';

function renderPhotoFilters() {
    if (!photoCategoryFilters) return;
    const defaultCategories = ['all', 'adult', 'panties', 'toy', 'messy', 'friends', 'family', 'food', 'memorys', 'etc'];
    const customCategories = uploadedPhotos.map(p => p.category.toLowerCase());
    const allCategories = [...new Set([...defaultCategories, ...customCategories])];

    photoCategoryFilters.innerHTML = '';

    allCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.classList.add('category-pill');
        if (cat === currentPhotoCategory) btn.classList.add('active');
        btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        btn.setAttribute('data-category', cat);

        btn.addEventListener('click', () => {
            currentPhotoCategory = cat;
            renderPhotoFilters();
            renderPhotos();
        });

        photoCategoryFilters.appendChild(btn);
    });
}

function renderPhotos() {
    if (!photoGrid) return;
    const existingDynamic = photoGrid.querySelectorAll('.dynamic-photo-card');
    existingDynamic.forEach(el => el.remove());

    uploadedPhotos.forEach(photo => {
        if (currentPhotoCategory !== 'all' && photo.category.toLowerCase() !== currentPhotoCategory) {
            return;
        }

        const card = document.createElement('div');
        card.classList.add('photo-card', 'dynamic-photo-card');
        card.setAttribute('data-category', photo.category.toLowerCase());
        card.innerHTML = `<img src="${photo.objectUrl}" alt="${photo.category} photo">`;
        photoGrid.appendChild(card);
    });

    const allCards = photoGrid.querySelectorAll('.photo-card');
    allCards.forEach(card => {
        const cardCat = card.getAttribute('data-category');
        if (currentPhotoCategory === 'all' || cardCat === currentPhotoCategory) {
            card.classList.remove('hide');
        } else {
            card.classList.add('hide');
        }
    });
}

if (addPhotoBtn) {
    addPhotoBtn.addEventListener('click', () => {
        if (photoFileInput) photoFileInput.value = '';
        if (photoCategoryInput) photoCategoryInput.value = '';
        if (photoModal) photoModal.classList.add('active');
    });
}

if (photoModalCloseBtn) {
    photoModalCloseBtn.addEventListener('click', () => {
        if (photoModal) photoModal.classList.remove('active');
    });
}

if (savePhotoBtn) {
    savePhotoBtn.addEventListener('click', () => {
        const file = photoFileInput.files[0];
        const category = photoCategoryInput.value.trim() || 'Adult';

        if (!file) {
            alert('Please select an image file first.');
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        const newPhoto = {
            id: Date.now().toString(),
            objectUrl: objectUrl,
            category: category,
            fileName: file.name
        };

        uploadedPhotos.unshift(newPhoto);
        renderPhotoFilters();
        renderPhotos();

        if (photoModal) photoModal.classList.remove('active');
    });
}

renderPhotoFilters();
renderPhotos();
