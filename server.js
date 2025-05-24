const express = require('express');
const path = require('path');
const multer = require('multer');
const cors = require('cors');
const { create } = require('ipfs-http-client');
const fs = require('fs');
const { createCanvas, loadImage, registerFont } = require('canvas');

const app = express();
const port = 2444;

// CORS configuration
app.use(cors());

// Serve static files from the public directory
app.use(express.static('public'));
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Certificate generation endpoint
app.post('/api/generate-certificate', async (req, res) => {
    try {
        const { studentName, courseName, certificateId, issueDate } = req.body;

        // Create canvas
        const width = 1000;
        const height = 700;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Add borders
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 20;
        ctx.strokeRect(10, 10, width - 20, height - 20);

        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 30, width - 60, height - 60);

        // Add title and content
        ctx.font = 'bold 50px Arial';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText('Certificate of Completion', width / 2, 150);

        ctx.font = 'bold 30px Arial';
        ctx.fillText('This is to certify that', width / 2, 250);

        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#000066';
        ctx.fillText(studentName, width / 2, 320);

        ctx.font = 'bold 30px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText('has successfully completed the course', width / 2, 390);

        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#000066';
        ctx.fillText(courseName, width / 2, 460);

        const formattedDate = new Date(parseInt(issueDate) * 1000).toLocaleDateString();
        ctx.font = '25px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText(`Date: ${formattedDate}`, width / 2, 540);

        ctx.font = '20px Arial';
        ctx.fillText(`Certificate ID: ${certificateId}`, width / 2, 580);

        // Save image temporarily
        const fileName = `certificate-${certificateId}.png`;
        const filePath = path.join(__dirname, 'uploads', fileName);
        const out = fs.createWriteStream(filePath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);

        out.on('finish', async () => {
            try {
                // Upload image to IPFS
                const fileBuffer = fs.readFileSync(filePath);
                const result = await ipfs.add(fileBuffer);

                const ipfsUrl = `https://ipfs.io/ipfs/${result.path}`;

                // Generate QR code for IPFS URL
                const QRCode = require('qrcode');
                const qrBuffer = await QRCode.toBuffer(ipfsUrl);
                const qrImage = await loadImage(qrBuffer);

                // Draw QR code onto canvas (bottom-right corner)
                ctx.drawImage(qrImage, width - 180, height - 180, 150, 150);

                // Save final version with QR
                const finalOut = fs.createWriteStream(filePath);
                const finalStream = canvas.createPNGStream();
                finalStream.pipe(finalOut);

                finalOut.on('finish', () => {
                    res.json({
                        success: true,
                        fileName,
                        filePath: `/api/certificates/${fileName}`,
                        ipfsHash: result.path,
                        ipfsUrl
                    });
                });

            } catch (err) {
                console.error('IPFS/QR error:', err);
                res.status(500).json({ success: false, error: 'Certificate saved, but IPFS/QR failed.' });
            }
        });

    } catch (error) {
        console.error('Certificate generation error:', error);
        res.status(500).json({ success: false, error: 'Error generating certificate.' });
    }
});


// Serve generated certificates
app.get('/api/certificates/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    res.sendFile(filePath);
});

// Explicit route for contract config
app.get('/contract-config.json', (req, res) => {
    const configPath = path.join(__dirname, 'public', 'contract-config.json');
    
    try {
        if (fs.existsSync(configPath)) {
            res.sendFile(configPath);
        } else {
            console.error('Contract config file not found at:', configPath);
            res.status(404).json({ error: 'Contract configuration file not found' });
        }
    } catch (error) {
        console.error('Error serving contract config:', error);
        res.status(500).json({ error: 'Error serving contract configuration' });
    }
});

// Configure multer for file uploads
const storageIpfs = multer.memoryStorage();
const uploadIpfs = multer({ storage: storageIpfs });

// Create IPFS client
const ipfs = create({ host: 'localhost', port: '5001', protocol: 'http' });

// Handle IPFS upload
app.post('/api/upload', uploadIpfs.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload file to IPFS
        const fileBuffer = req.file.buffer;
        const result = await ipfs.add(fileBuffer);

        if (!result.path || !result.path.startsWith('Qm')) {
            throw new Error('Invalid IPFS hash received from node');
        }
        
        res.json({
            success: true,
            hash: result.path  // Changed from ipfsHash to hash to match frontend expectation
        });
    } catch (error) {
        console.error('IPFS upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload to IPFS'
        });
    }
});

// Serve IPFS images
app.get('/api/ipfs/:hash', async (req, res) => {
    try {
        const hash = req.params.hash;
        const chunks = [];
        
        // Get file from IPFS
        for await (const chunk of ipfs.cat(hash)) {
            chunks.push(chunk);
        }
        
        // Combine chunks into a buffer
        const fileBuffer = Buffer.concat(chunks);
        
        // Set content type for images
        res.setHeader('Content-Type', 'image/jpeg');
        res.send(fileBuffer);
    } catch (error) {
        console.error('Error serving IPFS image:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve image from IPFS'
        });
    }
});

// Serve the index page as default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});
