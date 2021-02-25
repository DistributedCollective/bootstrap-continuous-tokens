pragma solidity ^0.7.4;

import "hardhat/console.sol";

/// @title Greeter Smart Contract
/// @author Some Author
/// @notice You can use this contract as simple greeting system.
/// @dev This is the classic 'Hello World' for Smart Contracts.
contract Greeter {
    string public greeting;

    /// @notice Greeter constructor
    /// @dev It has no func-visibility, which is not required since 0.7
    /// @param _greeting The greeting message
    constructor(string memory _greeting) {
        console.log("Deploying a Greeter with greeting:", _greeting);
        greeting = _greeting;
    }

    /// @notice Returns a greeting message
    /// @return greeting message
    function greet() public view returns (string memory) {
        return greeting;
    }

    /// @notice Sets the greeting message
    function setGreeting(string memory _greeting) public {
        console.log("Changing greeting from '%s' to '%s'", greeting, _greeting);
        greeting = _greeting;
    }
}
