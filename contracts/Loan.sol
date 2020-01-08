pragma solidity >=0.5.0 <0.6.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Stoppable.sol";

contract Loan is Stoppable {

   using SafeMath for uint256;
   
    enum Status {
        PENDING,
        ACTIVE,
        RESOLVED,
        DEFAULT
    }
    
    struct Loans {
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
        emit LogLoanCreation(msg.sender, loanId);
        
        uint256 x = msg.value.mul(_depositPercentage).div(100);
        
        loans[loanId] = Loans({
            amount: msg.value,
            interest: _interest,
            ID: loanId,
            end: now + _loanPeriod,
            lender: msg.sender,
            borrower: _borrower,
            status: Status.PENDING,
            requiredDeposit: x
        });
        
        loanId = loanId + 1;
        return true;
    }
    
    function payDeposit(uint _loanId)
    external
    payable
    whenRunning
    whenAlive
    {
        require(msg.value == loans[_loanId].requiredDeposit, "You must deposit the right amount");
        require(msg.sender == loans[_loanId].borrower, "You must be the assigned borrower for this loan");
        emit LogDeposit(msg.sender, msg.value);
        loans[_loanId].status = Status.ACTIVE;
        address lender = loans[_loanId].lender;
        (bool success, ) = lender.call.value(msg.value)("");
        require(success, "Error: Transfer failed.");
    }
    
    function retrieveLoan(uint _loanId)
    public
    payable
    paidDeposit(_loanId)
    {
        require(msg.sender == loans[_loanId].borrower, "Requires the borrower of that loan");
        require(loans[_loanId].amount != 0, "There are no funds to retrieve");
        uint256 loanAmount = loans[_loanId].amount;
        emit LogRetrieved(_loanId, msg.sender, loanAmount);
        loans[_loanId].amount = 0;
        (bool success, ) = msg.sender.call.value(loanAmount)("");
        require(success, "Error: Transfer failed.");
    }
    
    function retrieveLoans(uint _loanId)
    public
    view
    whenRunning
    whenAlive
    returns(
    uint amount,
    uint interest,
    uint loanPeriod,
    address lender,
    address borrower,
    uint status
    )
    {
        amount = loans[_loanId].amount;
        interest = loans[_loanId].interest;
        loanPeriod = loans[_loanId].end;
        lender = loans[_loanId].lender;
        borrower = loans[_loanId].borrower;
        status = uint(loans[_loanId].status);
        return (amount, interest, loanPeriod, lender, borrower, status);
    }
}


