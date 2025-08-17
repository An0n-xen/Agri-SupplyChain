// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

contract SupplyChainTracking {
    // Struct to store participant information at each stage
    struct Participant {
        address publicKey;
        string name;
        string role;
        string contactNumber;
        string physicalAddress;
        uint256 timestamp;
    }
    
    // Struct to store complete supply chain journey
    struct SupplyChainJourney {
        uint256 cropId;
        Participant farmer;
        Participant qualityChecker;
        Participant processor;
        Participant retailer;
        Participant[] customers; // Multiple customers possible
        bool exists;
    }
    
    // Mapping from crop ID to its supply chain journey
    mapping(uint256 => SupplyChainJourney) public supplyChainData;
    
    // Events
    event FarmerAdded(uint256 indexed cropId, address farmer);
    event QualityCheckerAdded(uint256 indexed cropId, address qualityChecker);
    event ProcessorAdded(uint256 indexed cropId, address processor);
    event RetailerAdded(uint256 indexed cropId, address retailer);
    event CustomerAdded(uint256 indexed cropId, address customer);
    event JourneyCompleted(uint256 indexed cropId);
    
    // Owner of the contract
    address public owner;
    
    // Modifier to restrict access
    modifier onlyAuthorized() {
        require(msg.sender == owner, "Not authorized");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    // Initialize supply chain journey with farmer data
    function addFarmer(
        uint256 _cropId,
        address _publicKey,
        string memory _name,
        string memory _role,
        string memory _contactNumber,
        string memory _physicalAddress
    ) public onlyAuthorized {
        require(!supplyChainData[_cropId].exists, "Journey already exists");
        
        Participant memory farmer = Participant({
            publicKey: _publicKey,
            name: _name,
            role: _role,
            contactNumber: _contactNumber,
            physicalAddress: _physicalAddress,
            timestamp: block.timestamp
        });
        
        supplyChainData[_cropId].cropId = _cropId;
        supplyChainData[_cropId].farmer = farmer;
        supplyChainData[_cropId].exists = true;
        
        emit FarmerAdded(_cropId, _publicKey);
    }
    
    // Add quality checker data
    function addQualityChecker(
        uint256 _cropId,
        address _publicKey,
        string memory _name,
        string memory _role,
        string memory _contactNumber,
        string memory _physicalAddress
    ) public onlyAuthorized {
        require(supplyChainData[_cropId].exists, "Journey does not exist");
        require(supplyChainData[_cropId].qualityChecker.publicKey == address(0), "Quality checker already added");
        
        Participant memory qualityChecker = Participant({
            publicKey: _publicKey,
            name: _name,
            role: _role,
            contactNumber: _contactNumber,
            physicalAddress: _physicalAddress,
            timestamp: block.timestamp
        });
        
        supplyChainData[_cropId].qualityChecker = qualityChecker;
        
        emit QualityCheckerAdded(_cropId, _publicKey);
    }
    
    // Add processor data
    function addProcessor(
        uint256 _cropId,
        address _publicKey,
        string memory _name,
        string memory _role,
        string memory _contactNumber,
        string memory _physicalAddress
    ) public onlyAuthorized {
        require(supplyChainData[_cropId].exists, "Journey does not exist");
        require(supplyChainData[_cropId].processor.publicKey == address(0), "Processor already added");
        
        Participant memory processor = Participant({
            publicKey: _publicKey,
            name: _name,
            role: _role,
            contactNumber: _contactNumber,
            physicalAddress: _physicalAddress,
            timestamp: block.timestamp
        });
        
        supplyChainData[_cropId].processor = processor;
        
        emit ProcessorAdded(_cropId, _publicKey);
    }
    
    // Add retailer data
    function addRetailer(
        uint256 _cropId,
        address _publicKey,
        string memory _name,
        string memory _role,
        string memory _contactNumber,
        string memory _physicalAddress
    ) public onlyAuthorized {
        require(supplyChainData[_cropId].exists, "Journey does not exist");
        require(supplyChainData[_cropId].retailer.publicKey == address(0), "Retailer already added");
        
        Participant memory retailer = Participant({
            publicKey: _publicKey,
            name: _name,
            role: _role,
            contactNumber: _contactNumber,
            physicalAddress: _physicalAddress,
            timestamp: block.timestamp
        });
        
        supplyChainData[_cropId].retailer = retailer;
        
        emit RetailerAdded(_cropId, _publicKey);
    }
    
    // Add customer data (can have multiple customers)
    function addCustomer(
        uint256 _cropId,
        address _publicKey,
        string memory _name,
        string memory _role,
        string memory _contactNumber,
        string memory _physicalAddress
    ) public onlyAuthorized {
        require(supplyChainData[_cropId].exists, "Journey does not exist");
        
        Participant memory customer = Participant({
            publicKey: _publicKey,
            name: _name,
            role: _role,
            contactNumber: _contactNumber,
            physicalAddress: _physicalAddress,
            timestamp: block.timestamp
        });
        
        supplyChainData[_cropId].customers.push(customer);
        
        emit CustomerAdded(_cropId, _publicKey);
    }
    
    // Get complete supply chain journey
    function getSupplyChainJourney(uint256 _cropId) public view returns (
        Participant memory farmer,
        Participant memory qualityChecker,
        Participant memory processor,
        Participant memory retailer,
        Participant[] memory customers
    ) {
        require(supplyChainData[_cropId].exists, "Journey does not exist");
        
        SupplyChainJourney memory journey = supplyChainData[_cropId];
        return (
            journey.farmer,
            journey.qualityChecker,
            journey.processor,
            journey.retailer,
            journey.customers
        );
    }
    
    // Get participant at specific stage
    function getParticipantAtStage(uint256 _cropId, string memory _stage) public view returns (Participant memory) {
        require(supplyChainData[_cropId].exists, "Journey does not exist");
        
        if (keccak256(bytes(_stage)) == keccak256(bytes("farmer"))) {
            return supplyChainData[_cropId].farmer;
        } else if (keccak256(bytes(_stage)) == keccak256(bytes("qualityChecker"))) {
            return supplyChainData[_cropId].qualityChecker;
        } else if (keccak256(bytes(_stage)) == keccak256(bytes("processor"))) {
            return supplyChainData[_cropId].processor;
        } else if (keccak256(bytes(_stage)) == keccak256(bytes("retailer"))) {
            return supplyChainData[_cropId].retailer;
        } else {
            revert("Invalid stage");
        }
    }
    
    // Get number of customers for a crop
    function getCustomerCount(uint256 _cropId) public view returns (uint256) {
        require(supplyChainData[_cropId].exists, "Journey does not exist");
        return supplyChainData[_cropId].customers.length;
    }
    
    // Get specific customer by index
    function getCustomerByIndex(uint256 _cropId, uint256 _index) public view returns (Participant memory) {
        require(supplyChainData[_cropId].exists, "Journey does not exist");
        require(_index < supplyChainData[_cropId].customers.length, "Invalid customer index");
        
        return supplyChainData[_cropId].customers[_index];
    }
    
    // Check if journey exists
    function journeyExists(uint256 _cropId) public view returns (bool) {
        return supplyChainData[_cropId].exists;
    }
    
    // Update owner (for emergency purposes)
    function transferOwnership(address _newOwner) public onlyAuthorized {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}