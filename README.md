# Certificate-Verification_Management
A decentralized application for issuing and verifying digital certificates using blockchain and IPFS. Designed for educational institutions to securely issue certificates while allowing students and third parties to verify their authenticity online.

---

## Features

- Issue digital certificates with student and course details
- Store certificate images on IPFS for decentralized storage
- Store certificate metadata on Ethereum blockchain for immutable verification
- Verify certificates using unique certificate IDs
- View certificate details and images during verification
- Role-based access for Institutes and Students
- Responsive web UI with MetaMask integration

---

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript, Bootstrap
- **Backend:** Node.js, Express.js
- **Blockchain:** Ethereum (Ganache for local development)
- **Smart Contract Development:** Solidity, Hardhat
- **Storage:** IPFS (InterPlanetary File System)
- **Web3 Integration:** Web3.js, MetaMask
- **Package Management:** npm

---

## Prerequisites

- Node.js (v14 or higher)
- IPFS Desktop
- Ganache
- MetaMask browser extension
- Git

---

## Installation

1. **Clone the repository:**
    ```bash
    git clone https://github.com/tharunR-17/Certificate_Verification_Management.git
    cd Certificate_Verification_Management
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Start IPFS Desktop** and ensure it's running on port 5001.

4. **Start Ganache** and ensure it's running on port 7545.

5. **Deploy the smart contract:**
    ```bash
    npx hardhat compile
    npx hardhat run scripts/deploy.js --network ganache
    ```

6. **Start the server:**
    ```bash
    node server.js
    ```
    The application will be available at http://localhost:2444

---

## Configuration

### MetaMask Setup

- Connect MetaMask to Ganache (Custom RPC):
  - Network Name: Ganache
  - RPC URL: http://127.0.0.1:7545
  - Chain ID: 1337
  - Import an account from Ganache using its private key

### IPFS Configuration

- IPFS should be running locally on port 5001
- The application automatically connects to the local IPFS node

---

## Usage

### Issuing a Certificate (Institute)

1. Navigate to the "Institute" dashboard.
2. Fill in the certificate details:
    - Student Name
    - Course Name
    - Certificate ID (unique identifier)
    - Issue Date
    - Upload certificate image
3. Click "Issue Certificate"
4. Confirm the transaction in MetaMask

### Verifying a Certificate (Student/Verifier)

1. Navigate to the "Student" dashboard.
2. Enter the Certificate ID and Student Name
3. Click "Verify/View Certificate"
4. View the certificate details and image

---

## Project Structure

```
Certificate_Verification_Management/
├── contracts/
│   └── CertificateVerification.sol      # Smart contract
├── scripts/
│   └── deploy.js                       # Deployment script
├── public/
│   ├── index.html                      # Main UI
│   ├── app.js                          # Institute-side logic
│   ├── student.js                      # Student-side logic
│   ├── style.css                       # Styling
│   └── contract-config.json            # Contract ABI and address
├── server.js                           # Express server
├── hardhat.config.js                   # Hardhat configuration
└── package.json                        # Project dependencies
```

---

## Smart Contract Functions

### `issueCertificate`
```solidity
function issueCertificate(
    string memory studentName,
    string memory courseName,
    string memory certificateId,
    uint256 issueDate,
    string memory ipfsHash,
    string memory imageHash
) public onlyOwner
```

### `verifyCertificate`
```solidity
function verifyCertificate(string memory certificateId, string memory imageHash)
    public
    view
    returns (
        string memory studentName,
        string memory courseName,
        uint256 issueDate,
        string memory ipfsHash,
        bool isValid
    )
```

---

## Security Features

- Only the contract owner (institute) can issue certificates
- Certificate data is immutably stored on the blockchain
- Certificate images are stored on IPFS ensuring integrity
- Each certificate has a unique identifier
- MetaMask ensures secure transaction signing

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is for academic and research use only. Contact the maintainer for usage rights beyond personal study.

---

## Acknowledgments

- OpenZeppelin for smart contract security patterns
- IPFS team for decentralized storage
- Hardhat team for development environment
- Ethereum community for blockchain infrastructure

## Contact

Feel free to reach out for questions, suggestions, or collaborations!

**Maintainer:** Tharun R

**Email:** [tharunravi71@gmail.com](mailto:tharunravi71@gmail.com)

**LinkedIn:** https://www.linkedin.com/in/tharun-r-a7bba7271
