# Design Patterns
## Circuit Breakers (Stoppable)
Given the possibility of unforeseen bugs in my contracts, I opted to add the possibility for the contract to enter a "paused" state. Entering such a state restricts various functionality of the contract, for example, further creation of loans, withdrawals and retrievals. This allows you to assess the contract further for what may be critical bugs that can jeopardise the contract and those that use it, allowing the developer to think about potential fixes. For this reason I have enabled the possibility of a Stop/Resume safety measure. 

## Total Destruction
Sometimes the only way to remedy you contract is to  destroy you contract via the `selfdestruct` key word solidity provides for .
>The only possibility that code is removed from the blockchain is when a contract at that address performs the `selfdestruct` operation. The remaining Ether stored at that address is sent to a designated target and then the storage and code is removed from the state.

That being said, when a contract is self-destructed, it no longer has any code, and acts as an EOA. But as there is no private key associated to it, essentially it becomes a void and any funds sent to it is unrecoverable. This should be considered carefully, for the reason above I have chosen to design my own `Kill()` function that essentially puts the contract into a **permanent** *paused* state that is irreversible, even for the **owner**.

## 0 Value Prevention
Due to the nature of the EVM, no data is reflected as **0 or false**, depending on the value type. Meaning if someone engaging with your contract doesn't enter non-zero parameters, they'll appear as 0. For this reason I explicitly check for 0 values to prevent the poorly formed transactions. This could be ideal in some situations, but for this particular DApp, it is not.

## Exposed Functions
It is easy to accidentally expose a contract function which was meant to be internal, or to omit protection on a function which was meant to be called only by privileged accounts (e.g. by the creator). Explicitly specifying and double checking that every function has the correct visibility identifier for it's intended purpose with sufficient protection.
