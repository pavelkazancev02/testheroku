pragma solidity ^0.4.24;

import "./library.sol";
import "./EduCoin.sol";

contract WorkshopTokenDistribution is Ownable, CanReclaimToken, Contactable {
    EduCoin public educationToken;
    
    uint256 public coinsForProject = 0.05 ether;
    uint256 public tokensForProject = 1000 * 1 ether;
    
    uint256 public coinsForVoting = 0.01 ether;
    uint256 public tokensForVoting = 300 * 1 ether;
    
    bytes32 public activeWorkshopId;
    address public activeWorkshopAdmin;
    
    uint256 numOfNextWorkshop;
    
    mapping (uint256 => bytes32) public workshops;
    mapping (bytes32 => string) public nameOfworkshop;
    mapping (bytes32 => uint256) public numOfNextParticipant;
    mapping (bytes32 => address) participants;
    mapping (address => string) public nameOf;
    mapping (bytes32 => uint256) public numOfNextProject;
    mapping (bytes32 => address) projects;
    mapping (address => string) public projectOf;
    
    event EduTokenRegistered(address _token);
    event FundsArrived(address _from, uint256 _value);
    event WorkshopCreated(bytes32 _workshopId, address _workshopAdmin);
    event WorkshopClosed(bytes32 _workshopId, address _actor);
    event ParticipantAdded(bytes32 _workshopId, address _participant);
    event ProjectAdded(bytes32 _workshopId, address _author);
    event ProjectInvested(address _author, uint256 tokens);
    event ParticipantFilled(address _participant, uint256 tokens);

    event CoinsForProjectUpdated(uint256 _value);
    event TokensForProjectUpdated(uint256 _value);
    event CoinsForVotingUpdated(uint256 _value);
    event TokensForVotingUpdated(uint256 _value);
    
    modifier onlyOwnerOrAdmin() {
        require((msg.sender == activeWorkshopAdmin) || (msg.sender == owner));
        _;
    }
    
    modifier WorkshopActive() {
        require(activeWorkshopId != bytes32(0));
        _;
    }
    
    constructor(EduCoin _token) public {
        _setEduToken(_token);
    }

    function setEduToken(EduCoin _token) external onlyOwner {
        _setEduToken(_token);
    }
    
    function _setEduToken(EduCoin _token) internal {
        require(_token != address(0));
        educationToken = _token;
        emit EduTokenRegistered(_token);
    }

    function createWorkshop(string _name, address _admin) external payable onlyOwner {
        require(_admin != address(0));
        
        string memory n = _name;
        bytes32 wId = keccak256(abi.encodePacked(n, numOfNextWorkshop));
        
        require(activeWorkshopId == bytes32(0));
        
        activeWorkshopId = wId;
        activeWorkshopAdmin = _admin;
        workshops[numOfNextWorkshop] = wId;
        nameOfworkshop[activeWorkshopId] = n;
        numOfNextWorkshop = numOfNextWorkshop + 1;
        
        emit WorkshopCreated(wId, _admin);
        
        if (msg.value != 0) {
            emit FundsArrived(msg.sender, msg.value);
        }
    }
    
    function closeWorkshop() external onlyOwnerOrAdmin WorkshopActive {
        bytes32 wId = activeWorkshopId;
        activeWorkshopId = bytes32(0);
        activeWorkshopAdmin = address(0);
        
        emit WorkshopClosed(wId, msg.sender);
    }
    
    function registerParticipant(address _participant, string _name) external onlyOwnerOrAdmin WorkshopActive {
        uint256 n = numOfNextParticipant[activeWorkshopId];

        bytes32 id = keccak256(abi.encodePacked(activeWorkshopId, n));
        participants[id] = _participant;
        nameOf[_participant] = _name;
        
        n = n + 1;
        numOfNextParticipant[activeWorkshopId] = n;
        
        emit ParticipantAdded(activeWorkshopId, _participant);
    }
    
    function getParticipantOfWorkshopByIndex(bytes32 _workshopId, uint256 _i) external view returns(address) {
        return participants[keccak256(abi.encodePacked(_workshopId, _i))];
    }

    function registerProject(address _author, string _prjname) external onlyOwnerOrAdmin WorkshopActive {
        uint256 n = numOfNextProject[activeWorkshopId];
        
        bytes32 id = keccak256(abi.encodePacked(activeWorkshopId, n));
        projects[id] = _author;
        projectOf[_author] = _prjname;
        
        n = n + 1;
        numOfNextProject[activeWorkshopId] = n;
        
        emit ProjectAdded(activeWorkshopId, _author);
    }

    function getProjectOfWorkshopByIndex(bytes32 _workshopId, uint256 _i) external view returns(address) {
        return projects[keccak256(abi.encodePacked(_workshopId, _i))];
    }

    function investToProjects(uint256 _value) external onlyOwnerOrAdmin WorkshopActive {
        require(_value > 0);
        uint256 n = numOfNextProject[activeWorkshopId];
        require(n > 0);
        require(address(this).balance >= n*coinsForProject);
        require(educationToken.balanceOf(address(this)) >= n*_value);
        
        if (tokensForProject != _value) { 
            tokensForProject = _value;
            emit TokensForProjectUpdated(_value);
        }
        
        for(uint256 i = 0; i < n; i++) {
            bytes32 id = keccak256(abi.encodePacked(activeWorkshopId, i));
            address author = projects[id];
            assert(author != address(0));
            educationToken.transfer(author, _value);
            author.transfer(coinsForProject);
            emit ProjectInvested(author, _value);
        }
    }

    function shareForVoting(uint256 _value) external onlyOwnerOrAdmin WorkshopActive {
        require(_value > 0);
        uint256 n = numOfNextParticipant[activeWorkshopId];
        require(n > 0, "0");
        require(address(this).balance >= n*coinsForVoting, "1");
        require(educationToken.balanceOf(address(this)) >= n*_value, "2");
        
        if (tokensForVoting != _value) { 
            tokensForVoting = _value;
            emit TokensForVotingUpdated(_value);
        }

        for(uint256 i = 0; i < n; i++) {
            bytes32 id = keccak256(abi.encodePacked(activeWorkshopId, i));
            address participant = participants[id];
            if (participant == address(0)) revert("3");
            educationToken.transfer(participant, _value);
            participant.transfer(coinsForVoting);
            emit ParticipantFilled(participant, _value);
        }
    }
    
    function setCoinsForProject(uint256 _value) external onlyOwner {
        require(_value != 0);
        coinsForProject = _value;
        emit CoinsForProjectUpdated(_value);
    }

    function setCoinsForVoting(uint256 _value) external onlyOwner {
        require(_value != 0);
        coinsForVoting = _value;
        emit CoinsForVotingUpdated(_value);
    }

    function () public payable {
        emit FundsArrived(msg.sender, msg.value);
    }

    function reclaimEther() external onlyOwner {
        owner.transfer(address(this).balance);
    }

    function reclaimTokens() external onlyOwner {
        educationToken.transfer(owner, educationToken.balanceOf(address(this)));
    }

    function kill() external onlyOwner {
        educationToken.transfer(owner, educationToken.balanceOf(address(this)));
        selfdestruct(owner);
    }
}
