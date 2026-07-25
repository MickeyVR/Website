// server.js (with IP restriction)
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// ==========================================
// CONFIGURATION: Set your allowed IP address
// ==========================================
// Note: If accessing locally from your own machine, requests often show as "127.0.0.1" or "::1".
// If accessing from other devices on your local Wi-Fi, it will show your local router IP (e.g., "192.168.1.5").
const ALLOWED_IPS = ['127.0.0.1', '::1', '192.168.1.5']; // REPLACE with your allowed IP(s)

function ipRestrictionMiddleware(req, res, next) {
    // Extract client IP address from request headers
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Clean up IPv6-mapped IPv4 addresses if necessary
    if (clientIp && clientIp.includes('::ffff:')) {
        clientIp = clientIp.split('::ffff:')[1];
    }

    // Check if the client's IP is in your allowed list
    if (ALLOWED_IPS.includes(clientIp)) {
        return next(); // Allow request to proceed
    }

    // Block anyone else
    console.log(`Blocked unauthorized access attempt from IP: ${clientIp}`);
    res.status(403).send('Access Forbidden: Your IP address is not authorized to view this site.');
}

// Apply IP restriction globally to all routes
app.use(ipRestrictionMiddleware);

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

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

app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOAD_DIR));

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
    console.log(`Private local server running at http://localhost:${PORT}`);
});// server.js
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
