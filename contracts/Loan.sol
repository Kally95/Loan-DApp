pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Stoppable.sol";

contract Loan is Stoppable {

   using SafeMath for uint256;

    enum Status {
        PENDING,
        ACTIVE,
        RESOLVED
    }

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

    uint public loanCounter;
    uint public loanId;

    event LogLoanCreation(address indexed _lender, uint indexed _loanId);
    event LogDeposit(address indexed _borrower, uint indexed _depositAmount);
    event LogRetrieved(uint indexed _loanID, address indexed _borrower, uint indexed _amountRetrieved);
    event LogPaid(address indexed _borrower, uint indexed _loanID, uint indexed _paidBack);

    mapping(uint256 => Loans) public loans;

    modifier paidDeposit(uint _loanId) {
         require(loans[_loanId].status == Status.ACTIVE, "This loan is not active");
        _;
    }

    constructor() public {
        loanId = 1;
    }

    function createLoan(uint _interest, address _borrower, uint _depositPercentage)
    external
    payable
    whenRunning
    whenAlive
    returns(bool)
    {
        require(_borrower != address(0x0), "Borrower's address cannot be 0");
        require(msg.value > 0, "Loan must have an associated Value");
        emit LogLoanCreation(msg.sender, loanId);

        uint256 depositPercentage = msg.value.mul(_depositPercentage).div(100);
        uint256 fullAmount = msg.value + _interest;

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

    function retrieveLoanFunds(uint _loanId)
    public
    payable
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
}


