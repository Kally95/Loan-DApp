pragma solidity ^0.5.0;

import "./Ownable.sol";

contract Stoppable is Ownable {


    bool private stopped;
    bool private killed;

    event LogStopped(address _owner);
    event LogResumed(address _owner);
    event LogKilled(address _killer);

    constructor()
    internal
    {
        stopped = false;
        killed = false;
    }

    modifier
    whenKilled()
    {
        require (killed, "Contract is alive");
        _;
    }

    modifier
    whenAlive()
    {
        require(!killed, "Contract is dead");
        _;
    }

    modifier
    whenRunning()
    {
        require(!stopped, "Contract is paused.");
        _;
    }

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