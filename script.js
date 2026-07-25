/* ==========================================================================
   PART 1: SITE ENTRY PASSWORD GATE
   ========================================================================== */
(function() {
    const SITE_PASSWORD = "YourSecretPassword123"; // Password to enter the website
    const AUTH_KEY = "website_authenticated_session";

    if (sessionStorage.getItem(AUTH_KEY) === "true") return;

    document.addEventListener("DOMContentLoaded", () => {
        const overlay = document.createElement('div');
        overlay.id = 'password-gate-overlay';
        overlay.innerHTML = `
            <div class="password-box">
                <h2 style="margin-top:0;">Protected Access</h2>
                <input type="password" id="gate-password-input" placeholder="Enter password...">
                <button id="gate-submit-btn">Unlock</button>
                <div class="password-error" id="gate-error-msg">Incorrect password.</div>
            </div>
        `;
        document.body.appendChild(overlay);

        const passwordInput = document.getElementById('gate-password-input');
        
        function handleUnlock() {
            if (passwordInput.value === SITE_PASSWORD) {
                sessionStorage.setItem(AUTH_KEY, "true");
                overlay.remove();
            } else {
                document.getElementById('gate-error-msg').style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
            }
        }

        document.getElementById('gate-submit-btn').addEventListener('click', handleUnlock);
        passwordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleUnlock(); });
        passwordInput.focus();
    });
})();

/* ==========================================================================
   PART 2: CLOUD SYNC CONFIGURATION
   ========================================================================== */

// Replace these placeholders with the values from your Supabase API page:
const supabaseUrl = https://wofstapemfzpbgphuiiz.supabase.co/rest/v1/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZnN0YXBlbWZ6cGJncGh1aWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NDI5MjAsImV4cCI6MjEwMDUxODkyMH0.8YhV5z6A5Kf6R4wWXNkgF7wR3LAx_F6h9JDoRvqyYA0'; // Paste your long anon key here

const cloud = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;

// Secure Deletion Helper Function
function requestDeletePermission() {
    const enteredPassword = prompt("Please enter the deletion password to confirm:");
    if (enteredPassword === "Delete3208") {
        return true;
    } else {
        alert("Incorrect password. Deletion cancelled.");
        return false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (!cloud) return; 

    /* ==========================================================================
       PART 3: PHOTOS LOGIC
       ========================================================================== */
    const photoGrid = document.getElementById('photo-grid');
    const savePhotoBtn = document.getElementById('save-photo-btn');
    const photoFileInput = document.getElementById('photo-file-input');

    async function loadCloudPhotos() {
        if (!photoGrid) return;
        
        const { data, error } = await cloud.storage.from('photos').list();
        if (error) return console.error("Error loading photos:", error);

        photoGrid.innerHTML = '';
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).forEach(file => {
            if (file.name === '.emptyFolderPlaceholder') return;

            const { data: publicUrlData } = cloud.storage.from('photos').getPublicUrl(file.name);
            
            const card = document.createElement('div');
            card.className = "text-card"; 
            card.innerHTML = `
                <img src="${publicUrlData.publicUrl}" alt="Cloud Photo" style="width: 100%; height: 160px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">
                <button class="delete-btn" style="width: 100%; background: #ef4444; color: white; border: none; padding: 5px; border-radius: 4px; cursor: pointer;">Delete Photo</button>
            `;

            // Handle Deletion
            card.querySelector('.delete-btn').addEventListener('click', async () => {
                if (requestDeletePermission()) {
                    await cloud.storage.from('photos').remove([file.name]);
                    loadCloudPhotos(); // Reload gallery
                }
            });

            photoGrid.appendChild(card);
        });
    }

    if (savePhotoBtn && photoFileInput) {
        savePhotoBtn.addEventListener('click', async () => {
            const file = photoFileInput.files[0];
            if (!file) return alert('Please select an image file first.');

            const uniqueFileName = `${Date.now()}-${file.name}`;
            savePhotoBtn.textContent = "Uploading..."; 

            const { error } = await cloud.storage.from('photos').upload(uniqueFileName, file);
            if (!error) {
                photoFileInput.value = ''; 
                loadCloudPhotos();
            } else {
                alert("Upload failed.");
            }
            savePhotoBtn.textContent = "Upload to Cloud";
        });
    }

    if (photoGrid) loadCloudPhotos();

    /* ==========================================================================
       PART 4: NOTES & RECIPES LOGIC
       ========================================================================== */
    async function loadTextData(tableName, gridId, searchQuery = "") {
        const grid = document.getElementById(gridId);
        if (!grid) return;

        // Fetch data from the cloud table
        const { data, error } = await cloud.from(tableName).select('*').order('created_at', { ascending: false });
        if (error) return console.error(`Error loading ${tableName}:`, error);

        grid.innerHTML = '';
        
        // Filter by search query if one exists
        const filteredData = data.filter(item => {
            const lowerTitle = item.title.toLowerCase();
            const lowerContent = item.content.toLowerCase();
            const lowerQuery = searchQuery.toLowerCase();
            return lowerTitle.includes(lowerQuery) || lowerContent.includes(lowerQuery);
        });

        filteredData.forEach(item => {
            const card = document.createElement('div');
            card.className = "text-card";
            card.innerHTML = `
                <h3>${item.title}</h3>
                <p style="margin-bottom: 15px;">${item.content}</p>
                <button class="delete-btn" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">Delete</button>
            `;

            // Handle Deletion
            card.querySelector('.delete-btn').addEventListener('click', async () => {
                if (requestDeletePermission()) {
                    await cloud.from(tableName).delete().eq('id', item.id);
                    loadTextData(tableName, gridId, document.getElementById(`search-${tableName}`).value);
                }
            });

            grid.appendChild(card);
        });
    }

    async function handleTextUpload(tableName, titleId, contentId, gridId) {
        const title = document.getElementById(titleId).value.trim();
        const content = document.getElementById(contentId).value.trim();
        
        if (!title || !content) return alert("Please fill in both fields.");

        // Insert new record into the cloud database
        const { error } = await cloud.from(tableName).insert([{ title: title, content: content }]);
        
        if (!error) {
            document.getElementById(titleId).value = '';
            document.getElementById(contentId).value = '';
            loadTextData(tableName, gridId);
        } else {
            alert("Failed to save to cloud.");
        }
    }

    // Initialize Notes
    const notesGrid = document.getElementById('notes-grid');
    if (notesGrid) {
        loadTextData('notes', 'notes-grid');
        document.getElementById('save-note-btn').addEventListener('click', () => handleTextUpload('notes', 'note-title', 'note-content', 'notes-grid'));
        document.getElementById('search-notes').addEventListener('input', (e) => loadTextData('notes', 'notes-grid', e.target.value));
    }

    // Initialize Recipes
    const recipesGrid = document.getElementById('recipes-grid');
    if (recipesGrid) {
        loadTextData('recipes', 'recipes-grid');
        document.getElementById('save-recipe-btn').addEventListener('click', () => handleTextUpload('recipes', 'recipe-title', 'recipe-content', 'recipes-grid'));
        document.getElementById('search-recipes').addEventListener('input', (e) => loadTextData('recipes', 'recipes-grid', e.target.value));
    }
});