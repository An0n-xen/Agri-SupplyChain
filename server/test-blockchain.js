// File: server/test-blockchain.js
// Run this file to test if everything is connected properly

require("dotenv").config({ path: "../.env" });
const { ethers } = require("ethers");

async function testConnection() {
  console.log("🔧 Testing Blockchain Connection...\n");

  // Step 1: Check environment variables
  console.log("1️⃣ Checking environment variables:");
  console.log(
    "   RPC URL:",
    process.env.BLOCKCHAIN_RPC_URL ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "   Admin Private Key:",
    process.env.ADMIN_PRIVATE_KEY ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "   Contract Address:",
    process.env.SUPPLY_CHAIN_TRACKING_ADDRESS ? "✅ Set" : "❌ Missing"
  );

  if (
    !process.env.BLOCKCHAIN_RPC_URL ||
    !process.env.ADMIN_PRIVATE_KEY ||
    !process.env.SUPPLY_CHAIN_TRACKING_ADDRESS
  ) {
    console.log("\n❌ Missing environment variables! Check your .env file");
    return;
  }

  try {
    // Step 2: Connect to blockchain
    console.log("\n2️⃣ Connecting to blockchain...");
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL
    );
    const network = await provider.getNetwork();
    console.log(
      "   ✅ Connected to network:",
      network.name,
      "chainId:",
      network.chainId
    );

    // Step 3: Check admin wallet
    console.log("\n3️⃣ Checking admin wallet...");
    const adminWallet = new ethers.Wallet(
      process.env.ADMIN_PRIVATE_KEY,
      provider
    );
    console.log("   Wallet address:", adminWallet.address);
    const balance = await provider.getBalance(adminWallet.address);
    console.log("   Balance:", ethers.utils.formatEther(balance), "ETH");
    console.log("   ✅ Wallet is ready");

    // Step 4: Check contract
    console.log("\n4️⃣ Checking smart contract...");
    const contractAddress = process.env.SUPPLY_CHAIN_TRACKING_ADDRESS;
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
      console.log("   ❌ No contract found at this address!");
      console.log(
        "   Make sure you deployed the contract and copied the correct address"
      );
    } else {
      console.log("   ✅ Contract found at:", contractAddress);
      console.log("   Contract size:", code.length, "bytes");
    }

    console.log("\n🎉 All checks passed! Your blockchain setup is working!");
  } catch (error) {
    console.log("\n❌ Error:", error.message);
    if (error.message.includes("connect")) {
      console.log("   Make sure Hardhat node is running: npx hardhat node");
    }
  }
}

testConnection();
