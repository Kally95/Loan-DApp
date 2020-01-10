pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Stoppable.sol";

contract Loan is Stoppable {

   using SafeMath for uint256;
   
    enum Status {
        PENDING,
        ACTIVE,
        RESOLVED
        //DEFAULT
    }
    
    struct Loans {
        uint fullAmount;
        uint amount;
        uint interest;
        uint ID;
        uint end;
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
    
    function createLoan(uint _interest, uint _loanPeriod, address _borrower, uint _depositPercentage) 
    external 
    payable
    whenRunning
    whenAlive
    returns(bool)
    {
        require(msg.value > 0, "Loan must have an associated Value");
        emit LogLoanCreation(msg.sender, loanId);
        
        uint256 depositPercentage = msg.value.mul(_depositPercentage).div(100);
        uint256 fullAmount = msg.value + _interest;
        
        loans[loanId] = Loans({
            fullAmount: fullAmount,
            amount: msg.value,
            interest: _interest,
            ID: loanId,
            end: now + _loanPeriod,
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
    {   require(loans[_loanId].status == Status.PENDING);
        require(msg.value == loans[_loanId].requiredDeposit, "You must deposit the right amount");
        require(msg.sender == loans[_loanId].borrower, "You must be the assigned borrower for this loan");
        loans[_loanId].status = Status.ACTIVE;
        loans[_loanId].fullAmount -= loans[_loanId].requiredDeposit;
        (bool success, ) = loans[_loanId].lender.call.value(msg.value)("");
        require(success, "Error: Transfer failed.");
        emit LogDeposit(msg.sender, msg.value);
    }
    
    // function isFinished() {
    // const now = new Date().getTime();
    // const loanEnd =  (new Date(parseInt(loan.end) * 1000)).getTime();
    // return (loanEnd > now) ? false : true;
    //}

    function payBackLoan(uint _loanId) 
    public 
    payable
    whenRunning
    whenAlive
    {   require(loans[_loanId].status == Status.ACTIVE);
        require(msg.sender == loans[_loanId].borrower, "You must be the assigned borrower for this loan");
        require(msg.value == (loans[_loanId].fullAmount), "You must pay the full loan amount includinginterest");
        require(loans[_loanId].status == Status.ACTIVE);
        // if (now <= loans[_loanId].end) {
        //     loans[_loanId].status = Status.DEFAULT;
        // }
        
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
    uint loanPeriod,
    address lender,
    address borrower,
    uint status
    )
    {
        fullAmount = loans[_loanId].fullAmount;
        amount = loans[_loanId].amount;
        interest = loans[_loanId].interest;
        loanPeriod = loans[_loanId].end;
        lender = loans[_loanId].lender;
        borrower = loans[_loanId].borrower;
        status = uint(loans[_loanId].status);
        return (fullAmount, amount, interest, loanPeriod, lender, borrower, status);
    }
}


