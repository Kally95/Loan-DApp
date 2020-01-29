# Avoiding Common Attacks
Within this file I explain further as to how I prevent my contracts from known attacks and vulnerabilities.


# Preventing Reentrancy Attacks
> **The problem:**  A *reentrancy* attack can occur when you create a function that makes an external call to another untrusted contract before it resolves any effects. If the attacker can control the untrusted contract, they can make a recursive call back to the original function, repeating interactions that would have otherwise not run after the effects were resolved.

I voluntarily used  `.call.value()()` as a means of transferring Ether, which forwards all available gas and additionally I made sure to check the return value with a `require`. I chose this method of transferring Ether over  `transfer` which  only sends 2300 gas to the called contract, allowing only simple logic to be executed. This made sense under the assumption that gas costs wouldn’t change. Last year, the Constantinople fork was delayed because lowering gas costs cause code that was previously safe from reentrancy, to become vulnerable. 

I also made use of the `Checks-Effects-Interactions Patters` which you can learn about more elaborately  [here]([https://fravoll.github.io/solidity-patterns/checks_effects_interactions.html](https://fravoll.github.io/solidity-patterns/checks_effects_interactions.html)). Briefly put, the idea of the checks-effects-interactions pattern is to make sure we have our **requires** in place, checking **inputs**, **contract state variables** and **return values** from calls to external contracts. Secondly **effects**, ensuring that specified effects are applied and the state variables are updated. Only after the internal state is fully up to date, we can proceed to **interactions**.


## Preventing Integer Overflow & Underflow
>**The problem:** Overflow vulnerabilities happen when a computed value is too large for the type attached to the value. EVM operations that can cause overflow are "add", "multiplication", and "exponentiation" instructions. All of these operations currently use modulo arithmetic, and are oblivious to overflow. 
>
To safe guard our contracts from the possibility of overflowing, I strictly use [Openzeppelin's SafeMath Library]([https://docs.openzeppelin.com/contracts/2.x/api/math](https://docs.openzeppelin.com/contracts/2.x/api/math)). `SafeMath` restores this intuition by reverting the transaction when an operation overflows.

## Explicitly Declare Visibility of Functions
Starting with  `pragma 0.5.0`, function visibility **must** be explicitly marked. In previous versions the visibility modifier in Solidity defaults to  `public`  for functions and  `internal`  for variables. Public access to functions intended for internal use only can be open our contract to attacks, this can especially be the case when dealing with older compilers.

##  Security Tools
> Having thoroughly tested my contract manually through interaction, and having done extensive testing to cover all corners of possible attacks and vulnerabilities. I concluded with confidence using the following tools:

* **[Mythril]([https://github.com/ConsenSys/mythril](https://github.com/ConsenSys/mythril))**
*  **[Slither]([https://github.com/crytic/slither](https://github.com/crytic/slither))**
* **[Solidity Visual Auditor]([https://marketplace.visualstudio.com/items?itemName=tintinweb.solidity-visual-auditor](https://marketplace.visualstudio.com/items?itemName=tintinweb.solidity-visual-auditor))**

Having these tools in my arsenal allows me to eradicate critical vulnerabilities and make corrections accordingly.
