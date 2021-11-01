pragma solidity 0.4.24;

/// All the tokens that want to be used in the bonding curve must implement this interface.
///
/// By implementing this interface, the BC will be able to mint and burn the tokens when trading.
///
/// @dev Keep in mind that both burn and mint functions should be governed by the MarketMaker and
///      the Presale contracts.
interface IContinuousToken {
    /**
     * @dev Creates `amount` new tokens for `to`.
     *
     * See {ERC20-_mint}.
     *
     * Requirements:
     *
     * - This operation should fail if it's not called by the MarketMaker or the Presale contracts
     */
    function mint(address _to, uint256 _value) external;

    /**
     * @dev Destroys `amount` tokens from `account`, deducting from the caller's
     * allowance.
     *
     * See {ERC20-_burn} and {ERC20-allowance}.
     *
     * Requirements:
     *
     * - This operation should fail if it's not called by the MarketMaker
     */
    function burn(address _who, uint256 _value) external;

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address _owner) external view returns (uint256);

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);
}
