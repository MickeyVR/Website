/* ==========================================================================
   PART 1: PASSWORD GATE PROTECTION
   ========================================================================== */
(function() {
    const SITE_PASSWORD = "3208password"; 
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
        passwordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleUnlock(); });
        passwordInput.focus();
    });
})();

/* ==========================================================================
   PART 2: LOCAL PC STORAGE (INDEXEDDB) FOR PHOTOS
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const photoGrid = document.getElementById('photo-grid');
    const savePhotoBtn = document.getElementById('save-photo-btn');
    const photoFileInput = document.getElementById('photo-file-input');
    const photoCategoryInput = document.getElementById('photo-category-input');

    const DB_NAME = "WebsiteLocalDB";
    const STORE_NAME = "photos";
    let localDb;

    // 1. Initialize the Local Database
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
    };
    request.onsuccess = (e) => {
        localDb = e.target.result;
        if (photoGrid) loadAndDisplayPhotos(); // Load photos only on the photos page
    };
    request.onerror = (e) => console.error("Database error:", e.target.error);

    // 2. Display Photos from PC Storage
    function loadAndDisplayPhotos() {
        const transaction = localDb.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
            photoGrid.innerHTML = '';
            const photos = getAllRequest.result.reverse(); // Newest first

            photos.forEach(photo => {
                const card = document.createElement('div');
                card.style.background = "#ffffff";
                card.style.padding = "10px";
                card.style.borderRadius = "8px";
                card.style.border = "1px solid #cbd5e1";
                
                // Convert stored raw file data back into an image URL
                const objectUrl = URL.createObjectURL(photo.fileData);

                card.innerHTML = `
                    <img src="${objectUrl}" alt="Photo" style="width: 100%; height: 160px; object-fit: cover; border-radius: 4px;">
                    <p style="font-size: 13px; margin: 8px 0 4px; color: #64748b;">Category: ${photo.category}</p>
                `;
                photoGrid.appendChild(card);
            });
        };
    }

    // 3. Save New Photo to PC Storage
    if (savePhotoBtn && photoFileInput) {
        savePhotoBtn.addEventListener('click', () => {
            const file = photoFileInput.files[0];
            const category = photoCategoryInput.value.trim() || 'General';

            if (!file) return alert('Please select an image file first.');

            const transaction = localDb.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            
            store.add({
                id: Date.now().toString(),
                fileData: file, // Saves the actual file to your PC's browser storage
                category: category
            });

            transaction.oncomplete = () => {
                loadAndDisplayPhotos();
                photoFileInput.value = '';
                photoCategoryInput.value = '';
            };
        });
    }
});
