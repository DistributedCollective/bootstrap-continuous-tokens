pragma solidity 0.4.24;

import "@aragon/os/contracts/acl/ACL.sol";
import "./BalanceRedirectPresale.sol";
import "./Reserve.sol";
import "./MarketMaker.sol";
import "./Controller.sol";

contract ACLConfigurator {
    bool alreadySetup = false;

    modifier notAlreadySetup() {
        if (!alreadySetup) {
            _;
        }
    }

    function setupFundraisingPermissions(
        ACL _acl,
        address _owner,
        Reserve reserve,
        BalanceRedirectPresale presale,
        MarketMaker marketMaker,
        Controller controller
    ) external notAlreadySetup {
        address ANY_ENTITY = _acl.ANY_ENTITY();
        _acl.createPermission(_owner, reserve, reserve.SAFE_EXECUTE_ROLE(), _owner);
        _acl.createPermission(controller, reserve, reserve.ADD_PROTECTED_TOKEN_ROLE(), _owner);
        _acl.createPermission(marketMaker, reserve, reserve.TRANSFER_ROLE(), _owner);
        // presale
        _acl.createPermission(controller, presale, presale.OPEN_ROLE(), _owner);
        _acl.createPermission(_owner, presale, presale.REDUCE_BENEFICIARY_PCT_ROLE(), _owner);
        _acl.createPermission(ANY_ENTITY, presale, presale.CONTRIBUTE_ROLE(), _owner);
        // market maker
        _acl.createPermission(controller, marketMaker, marketMaker.OPEN_ROLE(), _owner);
        _acl.createPermission(controller, marketMaker, marketMaker.UPDATE_BENEFICIARY_ROLE(), _owner);
        _acl.createPermission(controller, marketMaker, marketMaker.UPDATE_FEES_ROLE(), _owner);
        _acl.createPermission(controller, marketMaker, marketMaker.ADD_COLLATERAL_TOKEN_ROLE(), _owner);
        _acl.createPermission(controller, marketMaker, marketMaker.REMOVE_COLLATERAL_TOKEN_ROLE(), _owner);
        _acl.createPermission(controller, marketMaker, marketMaker.UPDATE_COLLATERAL_TOKEN_ROLE(), _owner);
        _acl.createPermission(controller, marketMaker, marketMaker.OPEN_BUY_ORDER_ROLE(), _owner);
        _acl.createPermission(controller, marketMaker, marketMaker.OPEN_SELL_ORDER_ROLE(), _owner);
        // controller
        _acl.createPermission(_owner, controller, controller.UPDATE_BENEFICIARY_ROLE(), _owner);
        _acl.createPermission(_owner, controller, controller.UPDATE_FEES_ROLE(), _owner);
        // ADD_COLLATERAL_TOKEN_ROLE is handled later [after collaterals have been added]
        // _acl.createPermission(_owner, controller, controller.ADD_COLLATERAL_TOKEN_ROLE(), _owner);
        _acl.createPermission(_owner, controller, controller.REMOVE_COLLATERAL_TOKEN_ROLE(), _owner);
        _acl.createPermission(_owner, controller, controller.UPDATE_COLLATERAL_TOKEN_ROLE(), _owner);
        _acl.createPermission(_owner, controller, controller.OPEN_PRESALE_ROLE(), _owner);
        _acl.createPermission(presale, controller, controller.OPEN_TRADING_ROLE(), _owner);
        _acl.createPermission(ANY_ENTITY, controller, controller.CONTRIBUTE_ROLE(), _owner);
        _acl.createPermission(ANY_ENTITY, controller, controller.OPEN_BUY_ORDER_ROLE(), _owner);
        _acl.createPermission(ANY_ENTITY, controller, controller.OPEN_SELL_ORDER_ROLE(), _owner);
    }
}
