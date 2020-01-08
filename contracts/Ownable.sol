pragma solidity ^0.5.0;

contract Ownable {

    address private owner;

    event OwnershipTransferred(address newOwner);

    constructor() public
    {
        owner = msg.sender;
    }

    modifier onlyOwner()
    {
        require(msg.sender == owner, "Error: msg.sender must be owner");
        _;
    }

    function getOwner()
    public
    view
    returns (address _owner) {
        return owner;
    }

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