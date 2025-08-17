// File: reset-dev-blockchain.js
// Use this to quickly reset your development environment

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

async function resetBlockchain() {
  console.log("🔄 Resetting blockchain development environment...\n");

  // Step 1: Kill existing Hardhat process
  console.log("1️⃣ Stopping Hardhat node...");
  try {
    // For Windows
    if (process.platform === "win32") {
      spawn("taskkill", ["/F", "/IM", "node.exe"]);
    } else {
      // For Mac/Linux
      spawn("pkill", ["-f", "hardhat node"]);
    }
  } catch (e) {
    console.log("   No existing Hardhat process found");
  }

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Step 2: Start new Hardhat node
  console.log("\n2️⃣ Starting fresh Hardhat node...");
  const hardhat = spawn("npx", ["hardhat", "node"], {
    cwd: path.join(__dirname, "../SupplyChain-Frontend"),
    detached: true,
    stdio: "ignore",
  });
  hardhat.unref();

  // Wait for Hardhat to start
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Step 3: Deploy new contract
  console.log("\n3️⃣ Deploying fresh contract...");
  const deploy = spawn(
    "npx",
    [
      "hardhat",
      "run",
      "scripts/deploy-supply-chain-tracking.js",
      "--network",
      "localhost",
    ],
    {
      cwd: path.join(__dirname, "../SupplyChain-Frontend"),
      stdio: "inherit",
    }
  );

  deploy.on("close", (code) => {
    if (code === 0) {
      console.log("\n✅ Blockchain reset complete!");
      console.log("📝 Remember to:");
      console.log("   1. Update SUPPLY_CHAIN_TRACKING_ADDRESS in your .env");
      console.log("   2. Restart your server");
    } else {
      console.log("\n❌ Deployment failed");
    }
  });
}

resetBlockchain();
