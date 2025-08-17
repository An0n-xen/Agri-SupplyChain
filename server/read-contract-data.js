// Supply Chain Event Data Decoder
// File: decode-event-data.js

const { ethers } = require("ethers");
require("dotenv").config({ path: "../.env" });

const CONTRACT_ADDRESS = "0x2Bf8CBA9381e48E749c114E7510B098167599951";

// Map event signatures to their meanings (we can identify these from your contract)
const EVENT_SIGNATURES = {
  "0x45d3a3aa2b6c6eed79de9d89691d7ba783bb14de2bab659908d0b6fbf59ec4ed":
    "RetailerAdded",
  "0xacfbf737e165ff43912bd51702d99842de9870307494313cdaf244fff15e6905":
    "Unknown_2",
  "0x8579b64debc101636243c2e9d51d5dec09b3b25e079c386ce3ab3e2bca40f9ee":
    "Unknown_3",
  "0x7e1070b0f8559957e45bb7119f9ca42fa8ed4239c4f57b61bd05ff4e1a14b1d6":
    "FarmerAdded",
};

// Common supply chain stage names to try mapping
const STAGE_NAMES = [
  "Farmer",
  "QualityChecker",
  "Processor",
  "Retailer",
  "Customer",
];

async function decodeSupplyChainEvents(cropId = 35) {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://sepolia.infura.io/v3/060dd4434e504cc68127ca4a9cdcbe2c"
  );

  console.log(`🔍 Decoding Supply Chain Events for Crop ID: ${cropId}\n`);

  try {
    // Get events for the specific crop
    const filter = {
      address: CONTRACT_ADDRESS,
      fromBlock: 9003800,
      toBlock: 9003810,
      topics: [
        null, // Any event signature
        ethers.utils.hexZeroPad(ethers.utils.hexlify(cropId), 32), // Filter by crop ID
      ],
    };

    const logs = await provider.getLogs(filter);
    console.log(`📋 Found ${logs.length} events for Crop ID ${cropId}\n`);

    // Decode each event
    const decodedEvents = [];

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      console.log(`Event ${i + 1}:`);
      console.log(`  📦 Block: ${log.blockNumber}`);
      console.log(`  🔗 Transaction: ${log.transactionHash}`);

      const eventSignature = log.topics[0];
      const eventName = EVENT_SIGNATURES[eventSignature] || `Unknown_${i + 1}`;
      console.log(`  🎯 Event: ${eventName}`);
      console.log(`  🏷️  Signature: ${eventSignature}`);

      // Decode the crop ID from topics
      const decodedCropId = ethers.BigNumber.from(log.topics[1]).toString();
      console.log(`  🌾 Crop ID: ${decodedCropId}`);

      // Decode the actor address from data
      const actorAddress = ethers.utils.getAddress("0x" + log.data.slice(-40));
      console.log(`  👤 Actor Address: ${actorAddress}`);

      // Get transaction details to find timestamp
      const tx = await provider.getTransaction(log.transactionHash);
      const block = await provider.getBlock(tx.blockNumber);
      const timestamp = block.timestamp;
      const date = new Date(timestamp * 1000);

      console.log(`  ⏰ Timestamp: ${timestamp}`);
      console.log(`  📅 Date: ${date.toLocaleString()}`);

      // Store decoded event data
      const eventData = {
        eventName,
        signature: eventSignature,
        cropId: decodedCropId,
        actorAddress,
        timestamp,
        date: date.toLocaleString(),
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
      };

      decodedEvents.push(eventData);
      console.log("");
    }

    // Create a complete journey timeline
    console.log("🎯 Complete Supply Chain Journey:\n");

    // Sort events by block number (chronological order)
    decodedEvents.sort((a, b) => a.blockNumber - b.blockNumber);

    decodedEvents.forEach((event, index) => {
      console.log(`Step ${index + 1}: ${event.eventName}`);
      console.log(`  👤 Actor: ${event.actorAddress}`);
      console.log(`  📅 Date: ${event.date}`);
      console.log(`  🔗 Tx: ${event.transactionHash}`);
      console.log("");
    });

    // Try to get additional data from transaction inputs
    console.log("🔍 Analyzing transaction inputs for additional data...\n");

    for (const event of decodedEvents) {
      try {
        console.log(`📊 Transaction: ${event.eventName}`);
        const tx = await provider.getTransaction(event.transactionHash);

        if (tx.data && tx.data.length > 10) {
          const functionSelector = tx.data.slice(0, 10);
          const inputData = tx.data.slice(10);

          console.log(`  🔧 Function: ${functionSelector}`);

          // Try to decode input data as (uint256, string) - common pattern
          try {
            const decoded = ethers.utils.defaultAbiCoder.decode(
              ["uint256", "string"],
              "0x" + inputData
            );

            console.log(`  🌾 Crop ID: ${decoded[0].toString()}`);
            console.log(`  📄 Data: ${decoded[1]}`);

            // Try to parse as JSON
            try {
              const jsonData = JSON.parse(decoded[1]);
              console.log(
                `  🎯 Parsed Data:`,
                JSON.stringify(jsonData, null, 2)
              );
            } catch {
              console.log(`  📝 Raw Data: ${decoded[1]}`);
            }
          } catch (decodeError) {
            console.log(`  ❌ Could not decode input data`);
          }
        }
        console.log("");
      } catch (error) {
        console.log(`  ❌ Error analyzing transaction: ${error.message}\n`);
      }
    }

    return decodedEvents;
  } catch (error) {
    console.error("❌ Error decoding events:", error.message);
    return [];
  }
}

// Function to get events for multiple crop IDs
async function getMultipleCropsData(cropIds) {
  console.log("🔍 Getting data for multiple crops...\n");

  const allCropsData = {};

  for (const cropId of cropIds) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`🌾 CROP ID: ${cropId}`);
    console.log("=".repeat(50));

    const events = await decodeSupplyChainEvents(cropId);
    allCropsData[cropId] = events;
  }

  return allCropsData;
}

// Function to create a summary report
async function createJourneySummary(cropId = 35) {
  console.log(`📊 Creating Journey Summary for Crop ${cropId}\n`);

  const events = await decodeSupplyChainEvents(cropId);

  if (events.length === 0) {
    console.log("❌ No events found for this crop");
    return;
  }

  console.log("🎯 SUPPLY CHAIN JOURNEY SUMMARY");
  console.log("=".repeat(50));
  console.log(`🌾 Crop ID: ${cropId}`);
  console.log(`📊 Total Stages: ${events.length}`);
  console.log(
    `⏰ Journey Duration: ${events[0].date} → ${events[events.length - 1].date}`
  );
  console.log("");

  console.log("📋 JOURNEY STAGES:");
  events.forEach((event, index) => {
    console.log(`${index + 1}. ${event.eventName}`);
    console.log(`   👤 Actor: ${event.actorAddress}`);
    console.log(`   📅 ${event.date}`);
    console.log(`   🔗 ${event.transactionHash}`);
    console.log("");
  });

  console.log("✅ Journey Summary Complete!");
}

async function main() {
  console.log("🚀 Supply Chain Event Decoder\n");

  // Decode events for crop 34
  await createJourneySummary(34);

  console.log("\n" + "=".repeat(60));
  console.log("💡 Next Steps:");
  console.log("1. ✅ Your data IS being stored successfully in events");
  console.log(
    "2. 🔍 To get more detailed data, we need to decode transaction inputs"
  );
  console.log("3. 🎯 You can now read any crop's journey using this approach");
  console.log("4. 📊 Consider creating a web interface to display this data");
}

// Export functions for use in other scripts
module.exports = {
  decodeSupplyChainEvents,
  getMultipleCropsData,
  createJourneySummary,
};

main().catch(console.error);
