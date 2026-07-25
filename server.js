// server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Define where files will be stored on your PC or USB drive
// (Example: Change this path to your USB drive letter like 'E:/my-website-uploads')
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer to save uploaded files directly to your local folder/USB
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Serve static frontend files (HTML, CSS, JS)
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOAD_DIR));

// API endpoint to handle photo uploads directly to your PC/USB storage
app.post('/api/upload', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
        success: true,
        id: Date.now().toString(),
        url: fileUrl,
        category: req.body.category || 'Adult'
    });
});

app.listen(PORT, () => {
    console.log(`Local server running at http://localhost:${PORT}`);
    console.log(`Saving files directly to: ${UPLOAD_DIR}`);
});
