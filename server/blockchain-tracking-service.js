// blockchain-tracking-service.js
const { ethers } = require("ethers");

// Your contract ABI (you'll need to compile the contract to get this)
const TRACKING_CONTRACT_ABI = [
  // Add your contract ABI here after compilation
  "function registerParticipant(address _participantAddress, string memory _name, string memory _role, string memory _contactNumber, string memory _physicalAddress) public",
  "function addTrackingEvent(uint256 _lotId, string memory _eventType, string memory _additionalData) public",
  "function updateStatus(uint256 _lotId) public",
  "function getStatus(uint256 _lotId) public view returns (uint256)",
  "function getTrackingEvents(uint256 _lotId) public view returns (tuple(uint256 timestamp, address participantAddress, string eventType, string additionalData)[])",
  "function getParticipant(address _participantAddress) public view returns (tuple(string name, string role, string contactNumber, string physicalAddress, address walletAddress, bool isActive))",
  "function getTrackingEventCount(uint256 _lotId) public view returns (uint256)",
];

const TRACKING_CONTRACT_ADDRESS =
  process.env.TRACKING_CONTRACT_ADDRESS || "0x..."; // Deploy and add your contract address

class BlockchainTrackingService {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(
      process.env.BLOCKCHAIN_RPC_URL || "http://localhost:8545"
    );

    // Admin wallet for contract operations
    this.adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    this.adminWallet = new ethers.Wallet(this.adminPrivateKey, this.provider);

    this.contract = new ethers.Contract(
      TRACKING_CONTRACT_ADDRESS,
      TRACKING_CONTRACT_ABI,
      this.adminWallet
    );
  }

  // Register a participant on the blockchain
  async registerParticipant(participantData) {
    try {
      const { walletAddress, name, role, contactNumber, physicalAddress } =
        participantData;

      const tx = await this.contract.registerParticipant(
        walletAddress,
        name,
        role,
        contactNumber,
        physicalAddress
      );

      const receipt = await tx.wait();
      console.log(
        "Participant registered on blockchain:",
        receipt.transactionHash
      );
      return receipt;
    } catch (error) {
      console.error("Error registering participant:", error);
      throw error;
    }
  }

  // Add tracking event to blockchain
  async addTrackingEvent(
    lotId,
    eventType,
    participantAddress,
    additionalData = {}
  ) {
    try {
      // Get participant's wallet to sign the transaction
      const participantWallet = await this.getUserWallet(participantAddress);
      const contract = this.contract.connect(participantWallet);

      const tx = await contract.addTrackingEvent(
        lotId,
        eventType,
        JSON.stringify(additionalData)
      );

      const receipt = await tx.wait();
      console.log("Tracking event added:", receipt.transactionHash);
      return receipt;
    } catch (error) {
      console.error("Error adding tracking event:", error);
      throw error;
    }
  }

  // Get tracking events from blockchain
  async getTrackingEvents(lotId) {
    try {
      const events = await this.contract.getTrackingEvents(lotId);

      // Format the events
      const formattedEvents = events.map((event) => ({
        timestamp: new Date(event.timestamp.toNumber() * 1000),
        participantAddress: event.participantAddress,
        eventType: event.eventType,
        additionalData: JSON.parse(event.additionalData || "{}"),
      }));

      return formattedEvents;
    } catch (error) {
      console.error("Error getting tracking events:", error);
      throw error;
    }
  }

  // Get participant information from blockchain
  async getParticipant(address) {
    try {
      const participant = await this.contract.getParticipant(address);
      return {
        name: participant.name,
        role: participant.role,
        contactNumber: participant.contactNumber,
        physicalAddress: participant.physicalAddress,
        walletAddress: participant.walletAddress,
        isActive: participant.isActive,
      };
    } catch (error) {
      console.error("Error getting participant:", error);
      throw error;
    }
  }

  // Helper method to get user wallet (you'll need to implement this based on your existing getUserWallet function)
  async getUserWallet(address) {
    // This should use your existing getUserWallet function
    // For now, returning a placeholder
    return new ethers.Wallet(process.env.DEFAULT_PRIVATE_KEY, this.provider);
  }

  // Update status on blockchain
  async updateStatus(lotId, participantAddress) {
    try {
      const participantWallet = await this.getUserWallet(participantAddress);
      const contract = this.contract.connect(participantWallet);

      const tx = await contract.updateStatus(lotId);
      const receipt = await tx.wait();

      console.log("Status updated on blockchain:", receipt.transactionHash);
      return receipt;
    } catch (error) {
      console.error("Error updating status:", error);
      throw error;
    }
  }

  // Get status from blockchain
  async getStatus(lotId) {
    try {
      const status = await this.contract.getStatus(lotId);
      return status.toNumber();
    } catch (error) {
      console.error("Error getting status:", error);
      throw error;
    }
  }
}

module.exports = BlockchainTrackingService;
