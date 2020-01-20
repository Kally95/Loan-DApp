const Loan = artifacts.require("Loan");
const BN = require('bignumber.js');
const utils = require("./helpers/utils");

contract("Loan", (accounts) => {

  const amount = new BN(100);
  const [owner, recipient1, recipient2, recipient3] = accounts;
  const zeroAdd = 0x0000000000000000000000000000000000000000;
  const interest = new BN(5000000000000000000);
  const borrower = accounts[1];
  const depositPercentage = 25;
  let contractInstance;

  const { toWei } = web3.utils;

  beforeEach("Create new contract instance", async () => {
    contractInstance = await Loan.new({ from: owner});
  });

  describe("Testing contract owner", function() {

    it("The deployer should be owner", async () => {
      const contractOwner = await contractInstance.getOwner({from: owner});

      assert.strictEqual(
        contractOwner,
        owner,
        "Msg.sender is not Owner");
    });
  });

  describe("Testing createLoan()", () => {

    it("Should successfully create a Loan", async () => {

      const CreateLoanResult = await contractInstance.createLoan(
        interest,
        borrower,
        depositPercentage,
        {from: owner, value: amount});

      assert.isTrue(
        CreateLoanResult.receipt.status,
        "Status is false"
      );

      assert.strictEqual(
        CreateLoanResult.receipt.logs[0].event,
        "LogLoanCreation",
        "Event was not emitted correctly"
      );

      assert.strictEqual(
        CreateLoanResult.receipt.logs[0].args.__length__,
        2,
        "Should expect 2 events to be emitted"
      );

      assert.strictEqual(
        CreateLoanResult.receipt.logs[0].args._loanId.toString(10),
        "1",
        "loanId counter did not increment"
      )

      assert.strictEqual(
        CreateLoanResult.receipt.logs[0].args._lender,
        owner,
        "Lender should be owner"
      )

    });
  });

  describe("Testing createLoan failures", () => {
    
    it("Should throw if borrower is a 0 address", async () => { 
      await utils.shouldThrow(
        contractInstance
        .createLoan(
        interest,
        zeroAdd,
        depositPercentage,
        {from: owner, value: amount})
        );
    });

    it("Should throw if msg.value is less than 0", async () => {
      await utils.shouldThrow(
        contractInstance
        .createLoan(
        interest,
        borrower,
        depositPercentage,
        {from: owner, value: 0 })
        );
    });

    it("Should throw if msg.value is less than 0", async () => {
      await utils.shouldThrow(
        contractInstance
        .createLoan(
        interest,
        borrower,
        depositPercentage,
        {from: owner, value: 0 })
      );
    });
    
    it("Should throw when contract is paused", async () => {

      const paused = await contractInstance.stop({from: owner});

      assert.strictEqual(
        paused.receipt.logs[0].event,
        "LogStopped",
        "Event was not emitted correctly"
      );

      await utils.shouldThrow(
        contractInstance
        .createLoan(
        interest,
        borrower,
        depositPercentage,
        {from: owner, value: amount})
      );
    });

    it("Should throw when contract is killed", async () => {
      
      const paused = await contractInstance.stop({from: owner});
      assert.strictEqual(paused.receipt.logs[0].event, "LogStopped", "Event was not emitted correctly");

      const killed = await contractInstance.kill({from: owner});
      assert.strictEqual(killed.receipt.logs[0].event, "LogKilled", "Event was not emitted correctly");

      await utils.shouldThrow(contractInstance.createLoan(
        interest,
        borrower,
        depositPercentage,
        {from: owner, value: amount})
      );
    
    });

  });

  describe("Testing payLoanDeposit()", () => {

    it("Should pay a loan deposit and retrieve funds", async () => {

      const CreateLoanResult = await contractInstance.createLoan(
        interest,
        borrower,
        depositPercentage,
        {from: owner, value: toWei("10", "ether")});
      
      assert.isTrue(
        CreateLoanResult.receipt.status,
        "Status is false"
      );

      const retrievedLoan = await contractInstance.retrieveLoans(1, {from: owner});

      assert.strictEqual(
        retrievedLoan.status.toString(10),
        "0",
        "Loan status is not PENDING"
      );

      assert.strictEqual(
          retrievedLoan.requiredDeposit.toString(10),
          "2500000000000000000",
          "Did not calculate 25% of 20 correctly"
      );

      assert.strictEqual(
        retrievedLoan.fullAmount.toString(10),
        "15000000000000000000",
        "Full amount of loan is incorrect"
      );

      assert.strictEqual(
        CreateLoanResult.receipt.logs[0].args._loanId.toString(10),
        "1",
        "loanId counter did not increment"
      );
        
      const paidDeposit = await contractInstance
      .payLoanDeposit(
        1, 
        {from: borrower, value: toWei("2.5", "ether")}
      );

      assert.strictEqual(
        paidDeposit.receipt.status,
        true,
        "Status is false"
      );

      assert.strictEqual(
        paidDeposit.receipt.logs[0].event,
        "LogDeposit",
        "Event was not emitted correctly"
      );
      
      assert.strictEqual(
        paidDeposit.receipt.logs[0].args.__length__.toString(10),
        "2",
        "Should expect 2 events to be emitted"
      );

      const retrieveTx = await contractInstance
      .retrieveLoanFunds(
        1, 
        {from: borrower}
      )

      assert.strictEqual(
        retrieveTx.receipt.status,
        true,
        "withdraw event was not true"
      );

      assert.strictEqual(
        retrieveTx.receipt.logs[0].event,
        "LogRetrieved",
        "Event was not emitted correctly" 
      );

      const confirmState = await contractInstance.retrieveLoans(1, {from: owner});

      assert.strictEqual(
        confirmState.status.toString(10),
        "1",
        "Loan status is not ACTIVE"
      );

    });

  });

  describe("Testing retrieveLoanFunds() failures", () => {

    it("Should throw if retrieveLoanFunds() called prematurely", async () => {
      
      // Create a Loan
      const CreateLoanResult = await contractInstance.createLoan(
        interest,
        borrower,
        depositPercentage,
        {from: owner, value: toWei("20", "ether")});
      
      assert.isTrue(
        CreateLoanResult.receipt.status,
        "Status is false"
      );

      const retrievedLoan = await contractInstance.retrieveLoans(1, {from: owner});

      await utils.shouldThrow(
        contractInstance
        .retrieveLoanFunds
        (1, {from: borrower})
      );
    });

    it("Should throw if retrieveFunds() is called by non-borrower address", async () => {

      const retrievedLoan = await contractInstance.retrieveLoans(1, {from: owner});
      
      await utils
      .shouldThrow(
        contractInstance
        .retrieveLoanFunds(1, {from: recipient2 })
      )

    });

  });   

  describe("Testing payBackLoan()", () => {

    it("Should successfully pay back a loan", async () => {

      const CreateLoanResult = await contractInstance.createLoan(
        interest,
        borrower,
        depositPercentage,
        {from: owner, value: toWei("10", "ether")}
      );
      
      assert.isTrue(
        CreateLoanResult.receipt.status,
        "Status is false"
        );
        
      await contractInstance.retrieveLoans(
          1,
          {from: owner}
          );
          
          //console.log(CreateLoanResult)
      // console.log(new BN(x.fullAmount))
      await contractInstance.payLoanDeposit(
        1, 
        {from: borrower, value: toWei("2.5", "ether")}
      );

      await contractInstance.retrieveLoanFunds(
        1,
        {from: borrower}
      );
      
      await contractInstance.retrieveLoans(
        1,
        {from: owner}
      );
        
      const txReceipt = await contractInstance.payBackLoan(
          1,
        {from: borrower, value: toWei("12.5", "ether")}
      );
      
        assert.isTrue(
          txReceipt.receipt.status,
          true,
          "Satus is false"
        )
        assert.strictEqual(
          txReceipt.receipt.logs[0].event,
          "LogPaid",
          "Event was not emitted correctly"
        )
        assert.strictEqual(
          txReceipt.receipt.logs[0].args._paidBack.toString(10),
          "12500000000000000000",
          "Loan was not paid back"
        )
        assert.strictEqual(
          txReceipt.receipt.logs[0].args.__length__,
          3,
          "Should expect 3 events to be emitted"
        )
        const statusCheck = await contractInstance.retrieveLoans(
          1,
          {from: owner}
        )
        assert.strictEqual(
          statusCheck.status.toString(10),
          "2",
          "Loan status is not RESOLVED"
        );
        
    });

  });

  describe("Testing retrieveLoans()", () => {

    it("Should successfully retrieve all loan values", async () => {

      const CreateLoanResult = await contractInstance.createLoan(
        interest,
        borrower,
        depositPercentage,
        {from: owner, value: toWei("10", "ether")}
      );

      const loanResult = await contractInstance.retrieveLoans(
        1,
        {from: owner}
      );

      assert.strictEqual(
        loanResult.fullAmount.toString(10),
        "15000000000000000000",
        "Full amount of loan did not return"
      );

      assert.strictEqual(
        loanResult.amount.toString(10),
        "10000000000000000000",
        "Amount did not return"
      );

      assert.strictEqual(
        loanResult.interest.toString(10),
        "5000000000000000000",
        "Interest did not return"
      );

      assert.strictEqual(
        loanResult.lender,
        owner,
        "Lender address did not return"
      );

      assert.strictEqual(
        loanResult.borrower,
        borrower,
        "Borrower address did not return"
      );
      
      assert.strictEqual(
        loanResult.status.toString(10),
        "0",
        "Loan status did not return"
      );

      assert.strictEqual(
        loanResult.requiredDeposit.toString(10),
        "2500000000000000000",
        "Required deposit did not return"
      );

    });

  });

});
