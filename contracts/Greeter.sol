pragma solidity ^0.7.4;

import "hardhat/console.sol";

/// @title Greeter Smart Contract
/// @author Some Author
/// @notice You can use this contract as simple greeting system.
/// @dev This is the classic 'Hello World' for Smart Contracts.

contract Greeter {
    string public greeting;
    address public contractOwner;
    uint256 internal amount;

    event GreetingChanged(string oldGreet, string newGreet);

    modifier onlyCreator() {
        require(msg.sender == contractOwner, "Sender must be the owner");
        _;
    }

    /// @notice Greeter constructor
    /// @dev It has no func-visibility, which is not required since 0.7
    /// @param _greeting The greeting message
    constructor(string memory _greeting) {
        console.log("Deploying a Greeter with greeting:", _greeting);
        greeting = _greeting;
        contractOwner = msg.sender;
    }

    /// @notice Returns a greeting message
    /// @return greeting message
    function greet() public view returns (string memory) {
        return greeting;
    }

    /// @notice Sets the greeting message
    function setGreeting(string memory _greeting) public onlyCreator {
        console.log("Changing greeting from '%s' to '%s'", greeting, _greeting);
        string memory oldGreeting = greeting;
        greeting = _greeting;
        emit GreetingChanged(oldGreeting, greeting);
    }

    function getAmount() public returns (uint256) {
        return amount;
    }

    function payToContract() public payable {
        require(msg.value >= 1 ether, "Cannot send less than 1 ether");
        amount = msg.value;
    }
}
