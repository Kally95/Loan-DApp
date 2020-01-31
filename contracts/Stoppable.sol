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
    Functions using this modifier may continue to function
    when the contracts state has been Stopped.
    Functions like Resume() and Kill() may be
    called during this state.
    */
    modifier
    whenPaused()
    {
        require(stopped, "Contract is running");
        _;
    }

    /*
    This function allows the owner to freeze
    the use of functions labelled with the whenRunning
    modifier. In the case of an emergency where the use
    of the DApp must be limited, this can be called by the
    owner to limit damage and usage until the issue is resolved.
    */
    function stop()
    public
    onlyOwner
    whenAlive
    whenRunning
    {
        stopped = true;
        emit LogStopped(msg.sender);
    }

    /*
    This function allows the owner to resume
    the use of functions that have been previously
    stopped. In the case that things were resolved
    in the time that the contract was stopped, we
    can then resume the contract and have it run again.
    */
    function resume()
    public
    onlyOwner
    whenAlive
    whenPaused
    {
        stopped = false;
        emit LogResumed(msg.sender);
    }

    /*
    This function is a two step process to prevent
    an irreversible mistake. This kill function
    essentially puts the contract into an un-resumable
    state, that when called, cannot be undone. For this
    to successfully execute, the contract must be paused first.
    The only function that can be utilised in the event of the
    contract being killed is the withdrawWhenKilled function that
    is only accessible to the owner.
    */
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