pragma solidity ^0.5.0;

import "./Ownable.sol";

contract Stoppable is Ownable {


    bool private stopped;
    bool private killed;

    event LogStopped(address _owner);
    event LogResumed(address _owner);
    event LogKilled(address _killer);

    /*
    The constructor function instantiates the value
    for the state variables stopped and killed to false.
    */
    constructor()
    internal
    {
        stopped = false;
        killed = false;
    }

    /*
    This modifier checks if the contract is killed.
    WithdrawWhenKilled() uses this modifier so that it
    can only be called in the event that the contract
    has been killed, and not before.
    */
    modifier
    whenKilled()
    {
        require (killed, "Contract is alive");
        _;
    }

    /*
    This modifier checks to see if the contract is alive,
    as long as this is the case, functions will run as
    expected.
    */
    modifier
    whenAlive()
    {
        require(!killed, "Contract is dead");
        _;
    }

    /*
    This modifier checks to see if the contract has
    been stopped or not. As long as whenRunning reamins
    true, functions will run as expected.
    */
    modifier
    whenRunning()
    {
        require(!stopped, "Contract is paused.");
        _;
    }

    /*
    This mofidier checks that the contract is paused.
    Functions using this modifier may function when the
    contracts state has been Stopped. Functions like Resume(),
    and Kill() may be called during this state.
    */
    modifier
    whenPaused()
    {
        require(stopped, "Contract is running");
        _;
    }

    function stop()
    public
    onlyOwner
    whenAlive
    whenRunning
    {
        stopped = true;
        emit LogStopped(msg.sender);
    }

    function resume()
    public
    onlyOwner
    whenAlive
    whenPaused
    {
        stopped = false;
        emit LogResumed(msg.sender);
    }

    function kill()
    public
    onlyOwner
    whenAlive
    whenPaused
    {
        killed = true;
        emit LogKilled(msg.sender);
    }

}