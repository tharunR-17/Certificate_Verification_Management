let web3;
let contract;
let contractConfig;

// Initialize Web3 and Contract
async function init() {
    try {
        // For students, just load the contract without MetaMask
        // Use relative URL for Web3 provider to support network access
        const host = window.location.hostname;
        // Use port 7545 for blockchain node, ensure it is accessible externally
        web3 = new Web3(`http://${host}:7545`); // Read-only connection
        try {
            const response = await fetch('/contract-config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            contractConfig = await response.json();
            console.log('Contract config loaded (student):', contractConfig);
            
            contract = new web3.eth.Contract(contractConfig.abi, contractConfig.address);
            console.log('Contract initialized (student):', contract);
        } catch (error) {
            console.error('Error loading contract config:', error);
            alert('Error loading contract configuration');
        }
    } catch (error) {
        console.error('Error in init():', error);
        alert('Error initializing the application. Please check the console for details.');
    }
}

// View certificate function
async function viewCertificate(event) {
    event.preventDefault();
    
    const studentName = document.getElementById('viewStudentName').value;
    const certificateId = document.getElementById('viewCertId').value;
    const resultDiv = document.getElementById('viewResult');
    
    try {
        const result = await contract.methods.getCertificateByStudent(studentName, certificateId).call();
        console.log('Certificate result:', result);
        
        if (result && result.isValid) {
            const date = new Date(Number(result.issueDate) * 1000);
            const formattedDate = date.toLocaleDateString();
            
            resultDiv.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h4 class="card-title mb-4">Certificate Details</h4>
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle"></i> Valid Certificate
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Student Name:</strong> ${studentName}</p>
                                <p><strong>Course Name:</strong> ${result.courseName || 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Certificate ID:</strong> ${certificateId}</p>
                                <p><strong>Issue Date:</strong> ${formattedDate}</p>
                            </div>
                        </div>
                        <img src="/api/ipfs/${result.ipfsHash || ''}" class="certificate-preview mt-3" alt="Certificate">
                        <div class="text-center mt-3">
                            <button id="downloadBtn" class="btn btn-success" onclick="downloadCertificate('${result.ipfsHash || ''}')">
                                <i class="fas fa-download me-2"></i>Download Certificate
                            </button>
                        </div>
                    </div>
                </div>`;
        } else {
            resultDiv.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-times-circle"></i> Certificate not found or invalid
                </div>`;
        }
    } catch (error) {
        console.error('Error viewing certificate:', error);
        resultDiv.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i> Certificate not found or invalid credentials.
            </div>`;
    }
}

// Download certificate function
function downloadCertificate(ipfsHash) {
    const link = document.createElement('a');
    link.href = `/api/ipfs/${ipfsHash}`;
    link.download = 'certificate.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    init();
    document.getElementById('viewCertificateForm').addEventListener('submit', viewCertificate);
});
