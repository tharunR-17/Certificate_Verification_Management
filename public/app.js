let web3;
let contract;
let userAccount;
let contractConfig;

// Initialize Web3 and Contract
async function init() {
    try {
        if (typeof window.ethereum !== 'undefined') {
            web3 = new Web3(window.ethereum);
            
            try {
                // Load contract config
                const response = await fetch('/contract-config.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                contractConfig = await response.json();
                console.log('Contract config loaded:', contractConfig);
                
                contract = new web3.eth.Contract(contractConfig.abi, contractConfig.address);
                console.log('Contract initialized:', contract);
                
                // Check if already connected
                const accounts = await web3.eth.getAccounts();
                if (accounts.length > 0) {
                    userAccount = accounts[0];
                    updateUI(true);
                }
            } catch (error) {
                console.error('Error loading contract config:', error);
                alert('Error loading contract configuration. Please make sure you are connected to Ganache and refresh the page.');
            }
        } else {
            alert('Please install MetaMask to use certificate issuing and verification features');
        }
    } catch (error) {
        console.error('Error in init():', error);
        alert('Error initializing the application. Please check the console for details.');
    }
}

// Connect Wallet
async function connectWallet() {
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAccount = accounts[0];
        updateUI(true);
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet');
    }
}

// Update UI based on connection status
function updateUI(connected) {
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const walletInfo = document.getElementById('walletInfo');
    const instituteFunctions = document.querySelectorAll('.institute-function');

    if (connected) {
        connectWalletBtn.style.display = 'none';
        walletInfo.textContent = `Connected: ${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`;
        instituteFunctions.forEach(el => el.style.display = 'block');
    } else {
        connectWalletBtn.style.display = 'block';
        walletInfo.textContent = '';
        instituteFunctions.forEach(el => el.style.display = 'none');
    }
}

// Calculate image hash
async function calculateImageHash(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const buffer = e.target.result;
                if (!buffer || buffer.byteLength === 0) {
                    throw new Error('File buffer is empty or invalid');
                }
                const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                resolve(hashHex);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Verify Certificate
async function verifyCertificate(event) {
    event.preventDefault();
    
    const form = event.target;
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    try {
        const certificateId = document.getElementById('verifyCertId').value;
        const verifyImage = document.getElementById('verifyImage').files[0];

        if (!verifyImage) {
            alert('Please upload the certificate image for verification');
            return;
        }

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.innerHTML = 'Verifying...';
        submitButton.disabled = true;

        // Calculate hash of uploaded image
        const uploadedImageHash = await calculateImageHash(verifyImage);
        
        const result = await contract.methods.verifyCertificate(certificateId, uploadedImageHash).call();
        
        const verificationResult = document.getElementById('verificationResult');
        
        if (result && result.isValid) {
            if (!result.imageVerified) {
                // Certificate is tampered
                verificationResult.innerHTML = `
                    <div class="alert alert-danger">
                        <h4><i class="fas fa-exclamation-triangle"></i> Tampered Certificate Detected!</h4>
                        <p>This certificate has been modified from its original state. It is not valid.</p>
                    </div>
                `;
            } else {
                // Certificate is valid
                const date = new Date(result.issueDate * 1000);
                verificationResult.innerHTML = `
                    <div class="alert alert-success">
                        <h4><i class="fas fa-check-circle"></i> Valid Certificate</h4>
                        <p><strong>Student Name:</strong> ${result.studentName}</p>
                        <p><strong>Course:</strong> ${result.courseName}</p>
                        <p><strong>Certificate ID:</strong> ${certificateId}</p>
                        <p><strong>Issue Date:</strong> ${date.toLocaleDateString()}</p>
                    </div>
                    <div class="mt-3">
                        <h5>Certificate Image:</h5>
                        <img src="/api/ipfs/${result.ipfsHash || ''}" class="img-fluid certificate-preview" alt="Certificate">
                    </div>
                `;
            }
        } else {
            verificationResult.innerHTML = '<div class="alert alert-danger">Invalid Certificate</div>';
        }
    } catch (error) {
        console.error('Error verifying certificate:', error);
        document.getElementById('verificationResult').innerHTML = 
            `<div class="alert alert-danger">Error: ${error.message}</div>`;
    } finally {
        // Reset button state
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.innerHTML = 'Verify Certificate';
        submitButton.disabled = false;
    }
}

// Upload file to IPFS through our server
async function uploadToIPFS(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to upload to IPFS');
        }

        return result.ipfsHash;
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw new Error('Failed to upload image to IPFS: ' + error.message);
    }
}

// Issue Certificate
async function issueCertificate(event) {
    event.preventDefault();
    
    // Get form values with validation
    const studentName = document.getElementById('studentName').value.trim();
    const courseName = document.getElementById('courseName').value.trim();
    const certificateId = document.getElementById('certificateId').value.trim();
    const issueDateInput = document.getElementById('issueDate').value;
    
    // Validate inputs
    if (!studentName || !courseName || !certificateId || !issueDateInput) {
        alert('Please fill all required fields');
        return;
    }
    
    const issueDate = Math.floor(new Date(issueDateInput).getTime() / 1000);
    if (isNaN(issueDate)) {
        alert('Invalid date format');
        return;
    }
    
    try {
        // Show loading state
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.innerHTML = 'Processing...';
        submitButton.disabled = true;

        // First, generate the certificate
        const generateResponse = await fetch('/api/generate-certificate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                studentName,
                courseName,
                certificateId,
                issueDate
            })
        });

        const generateResult = await generateResponse.json();
        if (!generateResult?.success) {
            throw new Error(generateResult?.error || 'Failed to generate certificate');
        }
        if (!generateResult.filePath || !generateResult.fileName) {
            throw new Error('Invalid certificate data from server');
        }

        // Only show preview if wallet is connected
        if (!window.ethereum || !window.ethereum.selectedAddress) {
            throw new Error('Please connect your MetaMask wallet first');
        }

        // Get the image data for IPFS (don't show preview yet)
        const imageResponse = await fetch(generateResult.filePath);
        if (!imageResponse.ok) {
            throw new Error('Failed to fetch generated certificate image');
        }
        const imageBlob = await imageResponse.blob();
        if (!imageBlob || !imageBlob.size) {
            throw new Error('Invalid certificate image data');
        }
        const formData = new FormData();
        formData.append('file', imageBlob, generateResult.fileName);

        // Upload to IPFS with retry logic
        let ipfsResult;
        let retries = 3;
        
        while (retries > 0) {
            try {
                const ipfsResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (!ipfsResponse.ok) {
                    throw new Error(`IPFS service responded with status ${ipfsResponse.status}`);
                }
                
                ipfsResult = await ipfsResponse.json();
                
                if (!ipfsResult?.success) {
                    throw new Error(ipfsResult?.error || 'IPFS upload failed');
                }
                
                if (!ipfsResult.hash || !ipfsResult.hash.startsWith('Qm')) {
                    throw new Error('Invalid IPFS hash format');
                }
                
                break; // Success - exit retry loop
            } catch (error) {
                retries--;
                if (retries === 0) {
                    throw new Error(`IPFS upload failed after 3 attempts: ${error.message}`);
                }
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
        }

        // Calculate image hash for verification
        const imageArrayBuffer = await imageBlob.arrayBuffer();
        if (!imageArrayBuffer.byteLength) {
            throw new Error('Invalid image data for hashing');
        }
        const hashBuffer = await crypto.subtle.digest('SHA-256', imageArrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const imageHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        if (!imageHash?.length) {
            throw new Error('Failed to generate image hash');
        }

        // Issue the certificate on blockchain
        const result = await contract.methods.issueCertificate(
            studentName,
            courseName,
            certificateId,
            issueDate,
            ipfsResult.hash,
            imageHash
        ).send({ from: userAccount });

        // Only show preview after successful blockchain transaction
        const previewDiv = document.getElementById('certificatePreview');
        const previewImage = document.getElementById('previewImage');
        const downloadButton = document.getElementById('downloadCertificate');
        
        if (!previewDiv || !previewImage || !downloadButton) {
            throw new Error('Missing preview elements');
        }
        
        previewImage.src = generateResult.filePath;
        downloadButton.href = generateResult.filePath;
        downloadButton.download = generateResult.fileName;
        previewDiv.style.display = 'block';

        document.getElementById('issueStatus').innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i> Certificate issued successfully!
            </div>`;

    } catch (error) {
        console.error('Error:', error);
        const issueStatus = document.getElementById('issueStatus');
        if (issueStatus) {
            issueStatus.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-times-circle"></i> Error issuing certificate: ${error.message}
                </div>`;
        }
    } finally {
        // Reset button state
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.innerHTML = 'Generate & Issue Certificate';
            submitButton.disabled = false;
        }
    }
}

// View Certificate (No MetaMask required)
async function viewCertificate(event) {
    event.preventDefault();
    
    const form = event.target;
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    try {
        const studentName = document.getElementById('viewStudentName').value;
        const certificateId = document.getElementById('viewCertId').value;
        
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.innerHTML = 'Loading...';
        submitButton.disabled = true;

        const result = await contract.methods.verifyCertificate(certificateId, '').call();
        const viewResult = document.getElementById('viewResult');
        
        if (result.isValid && result.studentName.toLowerCase() === studentName.toLowerCase()) {
            const date = new Date(result.issueDate * 1000);
            viewResult.innerHTML = `
                <div class="alert alert-info">
                    <h4>Certificate Details</h4>
                    <p><strong>Student Name:</strong> ${result.studentName}</p>
                    <p><strong>Course:</strong> ${result.courseName}</p>
                    <p><strong>Certificate ID:</strong> ${certificateId}</p>
                    <p><strong>Issue Date:</strong> ${date.toLocaleDateString()}</p>
                </div>
                <div class="mt-3">
                    <h5>Certificate Image:</h5>
                    <img src="/api/ipfs/${result.ipfsHash}" class="img-fluid certificate-preview" alt="Certificate">
                </div>
            `;
        } else {
            viewResult.innerHTML = '<div class="alert alert-danger">Certificate not found or student name does not match</div>';
        }
    } catch (error) {
        console.error('Error viewing certificate:', error);
        document.getElementById('viewResult').innerHTML = 
            `<div class="alert alert-danger">Error: ${error.message}</div>`;
    } finally {
        // Reset button state
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.innerHTML = 'View Certificate';
        submitButton.disabled = false;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    document.getElementById('connectWalletBtn').addEventListener('click', connectWallet);
    document.getElementById('issueCertificateForm').addEventListener('submit', issueCertificate);
    document.getElementById('verifyCertificateForm').addEventListener('submit', verifyCertificate);
    document.getElementById('viewCertificateForm').addEventListener('submit', viewCertificate);

    // Handle MetaMask account changes
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', function (accounts) {
            if (accounts.length > 0) {
                userAccount = accounts[0];
                updateUI(true);
            } else {
                userAccount = null;
                updateUI(false);
            }
        });
    }
});
