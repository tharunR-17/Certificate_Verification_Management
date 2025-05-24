// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateVerification {
    struct Certificate {
        string studentName;
        string courseName;
        uint256 issueDate;
        string certificateId;
        string ipfsHash;
        bool isValid;
        string imageHash;  // Hash of the original image for verification
    }
    
    mapping(string => Certificate) public certificates;
    mapping(address => bool) public authorizedIssuers;
    address public owner;
    
    event CertificateIssued(
        string certificateId,
        string studentName,
        string courseName,
        uint256 issueDate,
        string ipfsHash,
        string imageHash
    );
    
    event IssuerAuthorized(address issuer);
    event IssuerRevoked(address issuer);
    
    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Only authorized issuers can call this function");
        _;
    }
    
    function authorizeIssuer(address issuer) public onlyOwner {
        require(!authorizedIssuers[issuer], "Issuer already authorized");
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }
    
    function revokeIssuer(address issuer) public onlyOwner {
        require(issuer != owner, "Cannot revoke owner's authorization");
        require(authorizedIssuers[issuer], "Issuer not authorized");
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer);
    }
    
    function issueCertificate(
        string memory studentName,
        string memory courseName,
        string memory certificateId,
        uint256 issueDate,
        string memory ipfsHash,
        string memory imageHash
    ) public onlyAuthorizedIssuer {
        require(bytes(certificateId).length > 0, "Certificate ID cannot be empty");
        require(bytes(studentName).length > 0, "Student name cannot be empty");
        require(certificates[certificateId].issueDate == 0, "Certificate ID already exists");
        
        certificates[certificateId] = Certificate({
            studentName: studentName,
            courseName: courseName,
            issueDate: issueDate,
            certificateId: certificateId,
            ipfsHash: ipfsHash,
            isValid: true,
            imageHash: imageHash
        });
        
        emit CertificateIssued(certificateId, studentName, courseName, issueDate, ipfsHash, imageHash);
    }
    
    function verifyCertificate(string memory certificateId, string memory uploadedImageHash) 
        public 
        view 
        returns (
            string memory studentName,
            string memory courseName,
            uint256 issueDate,
            string memory ipfsHash,
            bool isValid,
            bool imageVerified
        ) 
    {
        Certificate memory cert = certificates[certificateId];
        require(cert.issueDate != 0, "Certificate does not exist");
        
        // Compare image hashes to verify authenticity
        bool imageMatches = keccak256(abi.encodePacked(cert.imageHash)) == 
                          keccak256(abi.encodePacked(uploadedImageHash));
        
        return (
            cert.studentName,
            cert.courseName,
            cert.issueDate,
            cert.ipfsHash,
            cert.isValid,
            imageMatches
        );
    }

    function getCertificateByStudent(string memory studentName, string memory certificateId) 
        public 
        view 
        returns (
            string memory courseName,
            uint256 issueDate,
            string memory ipfsHash,
            bool isValid
        ) 
    {
        Certificate memory cert = certificates[certificateId];
        require(cert.issueDate != 0, "Certificate does not exist");
        require(keccak256(abi.encodePacked(cert.studentName)) == keccak256(abi.encodePacked(studentName)), "Student name does not match");
        return (cert.courseName, cert.issueDate, cert.ipfsHash, cert.isValid);
    }
}
