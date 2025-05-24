const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  // Get the contract factory
  const CertificateVerification = await hre.ethers.getContractFactory("CertificateVerification");

  // Deploy the contract
  const certificateVerification = await CertificateVerification.deploy();
  await certificateVerification.deployed();

  console.log("CertificateVerification deployed to:", certificateVerification.address);

  // Get the contract ABI
  const artifact = await hre.artifacts.readArtifact("CertificateVerification");

  // Create the config object
  const config = {
    address: certificateVerification.address,
    abi: artifact.abi
  };

  // Write the contract config to a file in the public directory
  const configPath = path.join(__dirname, '..', 'public', 'contract-config.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify(config, null, 2)
  );

  console.log("Contract config written to:", configPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
