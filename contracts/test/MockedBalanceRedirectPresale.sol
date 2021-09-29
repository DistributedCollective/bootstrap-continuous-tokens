/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

import "../BalanceRedirectPresale.sol";

contract MockedBalancedRedirectPresale is BalanceRedirectPresale {
    uint64 public timestamp;

    function setTimestamp(uint64 _timestamp) public {
        timestamp = _timestamp;
    }

    function getTimestamp64() internal view returns (uint64) {
        return timestamp == 0 ? super.getTimestamp64() : timestamp;
    }
}
