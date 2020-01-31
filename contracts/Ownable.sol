pragma solidity ^0.5.0;

contract Ownable {

    address private owner;

    event OwnershipTransferred(address newOwner);
    
    /*
    This constructor function sets the initial deployer
    to the owner, constructors executes once on deployment
    */
    constructor() public
    {
        owner = msg.sender;
    }

    /*
    Checks to see if the msg.sender is the owner,
    this mofidier is used on functions like kill(),
    withdrawWhenKilled(), Stop() and Resume().
    Authoritative functions should be limited to the owner,
    and no publicly.
    */
    modifier onlyOwner()
    {
        require(msg.sender == owner, "Error: msg.sender must be owner");
        _;
    }

    /*
    This read only function simply retrieves the owners address.
    */
    function getOwner()
    public
    view
    returns (address _owner) {
        return owner;
    }

    /*
    Allows for the current owner to set a new owner.
    */
    function
    setOwner(address newOwner)
    public
    onlyOwner
    returns(bool success)
    {
        require(newOwner != address(0x0), "Error: Address cannot be 0");
        emit OwnershipTransferred(newOwner);
        owner = newOwner;
        return true;
    }

}