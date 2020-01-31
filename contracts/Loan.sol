pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Stoppable.sol";

   /*
   Inheritance map:
   Loan -> Stoppable -> Ownable
   ownership and circuit-breaker contracts
   segregated from main code
   */

contract Loan is Stoppable {

   /*
   The Loan contract is responsible for allowing
   people to create peer-to-peer lending agreements.
   */

   /*
   Safe guarding my contract from integer
   overflow and underflow vulnerabilities.
   */
   using SafeMath for uint256;

   /*
   User-defined type to represent the state
   of a loan at a particular stage in the life-cycle
   of the loan.
   */
    enum Status {
        PENDING,
        ACTIVE,
        RESOLVED
    }

    /* New type in the form of a struct to define
    the characteristics of a loan. Limiting customisability
    minimises potential vulnerabilities.
    */
    struct Loans {
        uint fullAmount;
        uint amount;
        uint interest;
        uint ID;
        address lender;
        address borrower;
        Status status;
        uint requiredDeposit;
    }

    /*
    Instantiated in the constructor and incremented
    after each loan creation to prevent a loan
    having a ID collision.
    */
    uint public loanId;

    /*
    Allows the view side to monitor &
    react to certain functions
    that get fired as well as log argument passed.
    */
    event LogLoanCreation(address indexed _lender, uint indexed _loanId);
    event LogDeposit(address indexed _borrower, uint indexed _depositAmount);
    event LogRetrieved(uint indexed _loanID, address indexed _borrower, uint indexed _amountRetrieved);
    event LogPaid(address indexed _borrower, uint indexed _loanID, uint indexed _paidBack);
    event LogKilledWithdraw(address indexed owner, uint indexed contractAmount);

    mapping(uint256 => Loans) public loans;

    /*
    Checks if the deposit of the loan, with
    the specified loan ID, has been paid.
    */
    modifier paidDeposit(uint _loanId) {
         require(loans[_loanId].status == Status.ACTIVE, "This loan is not active");
        _;
    }

    /*
    Constructor, which is a function
    that executes once (on deployment)
    sets loanId to 1 which will be the ID
    of the first loan created.
    */
    constructor() public {
        loanId = 1;
    }

    /*
    This function takes 3 arguments
    in which the Lender (msg.sender)
    defines the Loan parameters. Allowing
    the creation of a loan. This function
    is available as long as it hasn't been killed
    or stopped (see stoppable & ownable).
    */
    function createLoan(uint _interest, address _borrower, uint _depositPercentage)
    external
    payable
    whenRunning
    whenAlive
    returns(bool)
    {   
        require(_depositPercentage <= 100, "Deposit Percentage cannot exceed 100");
        require(_borrower != address(0x0), "Borrower's address cannot be 0");
        require(msg.value > 0, "Loan must have an associated Value");
        emit LogLoanCreation(msg.sender, loanId);

        uint256 depositPercentage = msg.value.mul(_depositPercentage).div(100);
        uint256 fullAmount = msg.value.add(_interest);

        loans[loanId] = Loans({
            fullAmount: fullAmount,
            amount: msg.value,
            interest: _interest,
            ID: loanId,
            lender: msg.sender,
            borrower: _borrower,
            status: Status.PENDING,
            requiredDeposit: depositPercentage
        });

        loanId = loanId + 1;
        return true;
    }

    /*
    This function allows the borrower to pay
    the required deposit specified by the Lender.
    The borrower specified by the lender must equal
    the address of the person trying to pay the deposit.
    As long as it hasn't been killed or stopped
    (see stoppable & ownable).
    */
    function payLoanDeposit(uint _loanId)
    external
    payable
    whenRunning
    whenAlive
    {   require(loans[_loanId].status == Status.PENDING, "Loan status must be PENDING");
        require(msg.value == loans[_loanId].requiredDeposit, "You must deposit the right amount");
        require(msg.sender == loans[_loanId].borrower, "You must be the assigned borrower for this loan");
        loans[_loanId].status = Status.ACTIVE;
        loans[_loanId].fullAmount = loans[_loanId].fullAmount.sub(loans[_loanId].requiredDeposit);
        (bool success, ) = loans[_loanId].lender.call.value(msg.value)("");
        require(success, "Error: Transfer failed.");
        emit LogDeposit(msg.sender, msg.value);
    }

    /*
    This function allows the borrower to reimburse
    the lender the full amount of the loan, given the
    borrower's address matches the address specified
    by the Lender. As long as it hasn't been killed or stopped
    (see stoppable & ownable).
    */
    function payBackLoan(uint _loanId)
    public
    payable
    whenRunning
    whenAlive
    {
        require(msg.sender == loans[_loanId].borrower, "You must be the assigned borrower for this loan");
        require(msg.value == (loans[_loanId].fullAmount), "You must pay the full loan amount includinginterest");
        require(loans[_loanId].status == Status.ACTIVE, "Loan status must be ACTIVE");

        loans[_loanId].status = Status.RESOLVED;
        (bool success, ) = loans[_loanId].lender.call.value(msg.value)("");
        require(success, "Error: Transfer failed.");

        emit LogPaid(msg.sender, _loanId, msg.value);
    }

    /*
    This function allows the borrower to retrieve
    the funds from the loan, at a given ID, assuming
    the address calling the function is equal to the
    borrowers address specified by the Lender.
    As long as it hasn't been killed or stopped
    (see stoppable & ownable).
    */
    function retrieveLoanFunds(uint _loanId)
    public
    payable
    whenRunning
    whenAlive
    paidDeposit(_loanId)
    {
        require(msg.sender == loans[_loanId].borrower, "Requires the borrower of that loan");
        require(loans[_loanId].amount != 0, "There are no funds to retrieve");
        uint256 loanAmount = loans[_loanId].amount;

        loans[_loanId].amount = 0;
        (bool success, ) = msg.sender.call.value(loanAmount)("");
        require(success, "Error: Transfer failed.");

        emit LogRetrieved(_loanId, msg.sender, loanAmount);
    }

    /*
    A read only function that retrieves the
    loan at a given ID, returning all the parameters
    of that loan. As long as it hasn't been killed or stopped
    (see stoppable & ownable).
    */
    function retrieveLoans(uint _loanId)
    public
    view
    whenRunning
    whenAlive
    returns(
    uint fullAmount,
    uint amount,
    uint interest,
    address lender,
    address borrower,
    uint status,
    uint requiredDeposit
    )
    {
        fullAmount = loans[_loanId].fullAmount;
        amount = loans[_loanId].amount;
        interest = loans[_loanId].interest;
        lender = loans[_loanId].lender;
        borrower = loans[_loanId].borrower;
        status = uint(loans[_loanId].status);
        requiredDeposit = loans[_loanId].requiredDeposit;
        return (fullAmount, amount, interest, lender, borrower, status, requiredDeposit);
    }

    /*
    This function allows the owner to withdraw
    all remaining funds from the contract in the unlikely
    event that the contract must be killed. This will only
    execute if the kill function has been called.
    */
    function withdrawWhenKilled()
    public
    whenKilled
    onlyOwner
    {
        require(address(this).balance > 0, "Error: The contract is empty");
        (bool success, ) = msg.sender.call.value(address(this).balance)("");
        require(success, "Error: Transfer failed.");
        emit LogKilledWithdraw(msg.sender, address(this).balance);
    }
}


