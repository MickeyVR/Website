/* ==========================================================================
   CORE WEBSITE SCRIPT
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    console.log("Website initialized and loaded successfully.");

    // Photo Gallery Elements (if present on the page)
    const savePhotoBtn = document.getElementById('save-photo-btn');
    const photoFileInput = document.getElementById('photo-file-input');
    const photoCategoryInput = document.getElementById('photo-category-input');
    const photoGrid = document.getElementById('photo-grid');

    const PHOTO_STORAGE_KEY = "user_uploaded_photos";
    let uploadedPhotos = JSON.parse(localStorage.getItem(PHOTO_STORAGE_KEY)) || [];

    function renderPhotos() {
        if (!photoGrid) return;
        photoGrid.innerHTML = '';

        uploadedPhotos.forEach(photo => {
            const card = document.createElement('div');
            card.style.background = "#ffffff";
            card.style.padding = "10px";
            card.style.borderRadius = "8px";
            card.style.border = "1px solid #cbd5e1";

            card.innerHTML = `
                <img src="${photo.objectUrl}" alt="Photo" style="width: 100%; height: 160px; object-fit: cover; border-radius: 4px;">
                <p style="font-size: 13px; margin: 8px 0 4px; color: #64748b;">Category: ${photo.category}</p>
            `;
            photoGrid.appendChild(card);
        });
    }

    if (savePhotoBtn && photoFileInput) {
        savePhotoBtn.addEventListener('click', () => {
            const file = photoFileInput.files[0];
            const category = photoCategoryInput.value.trim() || 'General';

            if (!file) {
                alert('Please select an image file first.');
                return;
            }

            const objectUrl = URL.createObjectURL(file);
            uploadedPhotos.unshift({
                id: Date.now().toString(),
                objectUrl: objectUrl,
                category: category
            });

            localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(uploadedPhotos));
            renderPhotos();
            photoFileInput.value = '';
            photoCategoryInput.value = '';
        });
    }

    renderPhotos();
});