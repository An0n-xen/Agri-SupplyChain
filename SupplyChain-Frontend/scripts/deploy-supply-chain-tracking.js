// scripts/deploy-supply-chain-tracking.js
// Run this script using: npx hardhat run scripts/deploy-supply-chain-tracking.js --network localhost

const { ethers } = require("hardhat");

async function main() {
  // Get the contract factory
  const SupplyChainTracking = await ethers.getContractFactory(
    "SupplyChainTracking"
  );

  console.log("Deploying SupplyChainTracking contract...");

  // Deploy the contract
  const supplyChainTracking = await SupplyChainTracking.deploy();

  // Wait for the deployment to be mined
  await supplyChainTracking.deployed();

  console.log("SupplyChainTracking deployed to:", supplyChainTracking.address);
  console.log(
    "Save this address in your .env file as SUPPLY_CHAIN_TRACKING_ADDRESS"
  );

  // Verify the deployment
  const owner = await supplyChainTracking.owner();
  console.log("Contract owner:", owner);

  // Optional: Add some test data
  if (process.env.ADD_TEST_DATA === "true") {
    console.log("\nAdding test data...");

    // Add a test farmer
    const tx1 = await supplyChainTracking.addFarmer(
      1, // cropId
      "0x123456789", // publicKey (replace with actual address)
      "John Farmer",
      "farmer",
      "1234567890",
      "123 Farm St"
    );
    await tx1.wait();
    console.log("Test farmer added");

    // Add a test quality checker
    const tx2 = await supplyChainTracking.addQualityChecker(
      1, // cropId
      "0x987654321", // publicKey (replace with actual address)
      "Alice Checker",
      "qualitychecker",
      "0987654321",
      "456 Quality Ave"
    );
    await tx2.wait();
    console.log("Test quality checker added");

    // Verify the data
    const journey = await supplyChainTracking.getSupplyChainJourney(1);
    console.log("\nTest journey data:");
    console.log("Farmer:", journey.farmer.name);
    console.log("Quality Checker:", journey.qualityChecker.name);
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
