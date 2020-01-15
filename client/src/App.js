import {Table, Container, Button, Form } from 'react-bootstrap';
import React, { Component } from 'react';
import getWeb3 from "./getWeb3";
import Loan from "./contracts/Loan.json";
import web3 from "web3";
// import { makeStyles } from '@material-ui/core/styles';
// import AppBar from '@material-ui/core/AppBar';
// import Toolbar from '@material-ui/core/Toolbar';
// import Typography from '@material-ui/core/Typography';


import "./App.css";

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      status: ['PENDING', 'ACTIVE', 'RESOLVED'],
      transactionObjects: [],
      web3: null,
      currentLoan: null,
      accounts: null,
      contract: null,
      interest: null,
      loanPeriod: null,
      borrower: null,
      lender: null,
      depositPercentage : null,
      loanId: null,
      fullAmount: null,
      amount: null,
      requiredDeposit: null,
      blockNumber:'',
      transactionHash:'',
      gasUsed:'',
      txReceipt: ''
    };
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      //console.log(networkId)
      const deployedNetwork = Loan.networks[networkId];
      //console.log(deployedNetwork)
      const instance = new web3.eth.Contract(
        Loan.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

//Function to get the chain details of loan upon submitting the Loan. 
  getLoanTxDetails = async () => {
    try{
      this.setState({blockNumber:"waiting.."});
      this.setState({gasUsed:"waiting..."});
      await web3.eth.getTransactionReceipt(this.state.currentLoan, (err, txReceipt)=>{
      console.log(err,txReceipt);
      this.setState({txReceipt});
    }); //await for getTransactionReceipt
      await this.setState({blockNumber: this.state.txReceipt.blockNumber});
      await this.setState({gasUsed: this.state.txReceipt.gasUsed});    
    } 
      catch(error){
      console.log(error);
    } 
  } 

  createLoan = async () => {
    let tx;
    const etherAmount = web3.utils.toWei(this.state.amount);
    const interestAmount = web3.utils.toWei(this.state.interest);
    console.log(etherAmount)
    let { accounts, contract, interest, borrower, depositPercentage, amount} = this.state;
    try{
      console.log(borrower)
      tx = await contract.methods.createLoan(
      interestAmount,
      borrower,
      depositPercentage
    ).send({
      from: accounts[0],
      value: etherAmount
    })
    // let transactionObjects = [...this.state.transactionObjects];
    // transactionObjects.push(tx);
    // this.setState({transactionObjects})
    this.setState({ 
      transactionHash : tx.transactionHash,
      blockNumber : tx.blockNumber,
      gasUsed : tx.gasUsed
    })
    console.log(tx);
    }
    catch (ex) {
    
    }
  }

  payLoanDeposit = async () => {
    let { accounts, contract, requiredDeposit, loanId } = this.state;
    const depositAmount = web3.utils.toWei(this.state.amount);
    console.log(this.state)
    console.log("this is loandID" + loanId)
    try {
    await contract.methods
    .payLoanDeposit(loanId)
    .send({
      from: accounts[0],
      value: depositAmount
    }) } catch (err) {
      console.log(err)
    }
    // Get requiredDeposit from Struct in Loan contract
  };

  payBackLoan = async () => {
    let { loanId, contract, accounts, fullAmount } = this.state;
    const payBackAmount = web3.utils.toWei(this.state.amount);
    // const fullLoanAmount = web3.utils.toBN(fullAmount);
    await contract.methods
      .payBackLoan(loanId)
      .send({from: accounts[0], value: payBackAmount}); 
  };
  
  // Retrieve funds is for the BORROWER to call
  // in order to retrieve the funds deposited by
  // the lender
  handleRetrieveFunds = async () => {
    let { loanId, contract, accounts } = this.state;
    await contract.methods
    .retrieveLoanFunds(loanId)
    .send({from: accounts[0]})
  };

  handleRetrieveLoans = async () => {
    let { loanId, contract, accounts } = this.state;
    let currentLoan = await contract.methods.retrieveLoans(loanId).call({from: accounts[0]});
    console.log(currentLoan)
    console.log(web3.utils.fromWei(currentLoan.fullAmount));
    this.setState({ currentLoan });

  };

  handleInput = (event) => {
    console.log(event.target.name)
    console.log(event.target.value)
    this.setState({ [event.target.name]: event.target.value });
  };
  //0x41fafFaa11a9b57858ceeF3d371A55dde9ef764f
  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    console.log(this.state.transactionObjects)
    return (
      <div className="App">
        <h2>Smart Contract Example</h2>
        <span>Account: {this.state.accounts ? this.state.accounts : null }</span>
        <br></br>
        <br></br>
        <br></br>
        <br></br>
        <br></br>
        <div>This Loan has an ID of: {this.state.loanId}</div>
        <br></br>
        <div><button onClick={this.handleRetrieveLoans}>Retrieve Loan</button></div>
        <br></br>
        <div>
          <input
            name="loanId"
            className="form-control"
            id="loanId"
            onChange={this.handleInput}
          />
        </div>
      
        <Table bordered responsive className="retrieveLoan-table">
                <thead>
                  <tr>
                    <th>Loan Details:</th>
                    <th>Values</th>
                  </tr>
                </thead>
               
                <tbody>
                  <tr>
                    <td>Full Loan Amount :</td>
                    <td>{this.state.currentLoan ? web3.utils.fromWei(this.state.currentLoan.fullAmount) : null}</td>
                  </tr>
                  <tr>
                    <td>Interest :</td>
                    <td>{this.state.currentLoan ? web3.utils.fromWei(this.state.currentLoan.interest) : null}</td>
                  </tr>
                  <tr>
                    <td>Borrower :</td>
                    <td>{this.state.currentLoan ? this.state.currentLoan.borrower : null}</td>
                  </tr>
                  <tr>
                    <td>Lender :</td>
                    <td>{this.state.currentLoan ? this.state.currentLoan.lender : null}</td>
                  </tr>
                  <tr>
                    <td>Deposit Required :</td>
                    <td>{this.state.currentLoan ? web3.utils.fromWei(this.state.currentLoan.requiredDeposit) : null}</td>
                  </tr>
                  <tr>
                    <td>Loan Status :</td>
                    <td>{this.state.currentLoan ? this.state.status[this.state.currentLoan.status] : null}</td>
                  </tr>
                </tbody>
        </Table>
        <br></br>
        <div><button onClick={this.payLoanDeposit}>Pay Deposit</button></div>
        <div>
        <br></br>
          <input
            name="amount"
            className="form-control"
            id="amount"
            onChange={this.handleInput}
          />
        </div>
        <br></br>
        <div><button onClick={this.handleRetrieveFunds}>Retrieve Funds</button></div>
        <br></br>
        <div><button onClick={this.payBackLoan}>Pay Off Loan</button></div>
        <br></br>
        <div>
          <input
            name="amount"
            className="form-control"
            id="amount"
            onChange={this.handleInput}
          />
        </div>
      <form>
        <div className="form-group">
          <h1>Create a Loan</h1>
          <label htmlFor="interest">Interest Amount</label>
          <br></br>
          <input
            autoComplete="off"
            name="interest"
            className="form-control"
            id="interest"
            onChange={this.handleInput}
          />
           <br></br>
        </div>

        {/* <div className="form-group">
          <label htmlFor="loanPeriod">Loan Period</label>
          <br></br>
          <input
            autoComplete="off"
            name="loanPeriod"
            className="form-control"
            id="loanPeriod"
            onChange={this.handleInput}
          />
           <br></br>
        </div> */}
        <br></br>
        <div className="form-group">
          <label htmlFor="borrower">Borrower</label>
          <br></br>
          <input
            autoComplete="off"
            name="borrower"
            className="form-control"
            id="borrower"
            onChange={this.handleInput}
          />
           <br></br>
        </div>
        <br></br>
        <div className="form-group">
          <label htmlFor="depositPercentage">Deposit Percentage (%)</label>
          <br></br>
          <input
            autoComplete="off"
            name="depositPercentage"
            className="form-control"
            id="depositPercentage"
            onChange={this.handleInput}
          />
           <br></br>
        </div>
        <br></br>
        <div className="form-group">
          <label htmlFor="amount">Value of the Loan</label>
          <br></br>
          <input
            autoComplete="off"
            name="amount"
            className="form-control"
            id="amount"
            onChange={this.handleInput}
          />
           <br></br>
        </div>
      
        <br></br>
        {/* <button onClick={this.handleCreate}>Create</button> */}
      </form>
        <button 
          onClick={this.createLoan}
          // type="submit" 
          // name="createLoan"
          className="btn btn-primary"
          >
          Create
          </button>
          <br></br>
          <br></br>
          <br></br>
      <Container>
        <Table bordered responsive className="txReceipt-table">
                <thead>
                  <tr>
                    <th>Tx Receipt Category</th>
                    <th>Values</th>
                  </tr>
                </thead>
               
                <tbody>
                  <tr>
                    <td>Tx Hash :</td>
                    <td>{this.state.transactionHash}</td>
                  </tr>
                  <tr>
                    <td>Block Number :</td>
                    <td>{this.state.blockNumber}</td>
                  </tr>
                  <tr>
                    <td>Gas Used :</td>
                    <td>{this.state.gasUsed}</td>
                  </tr>

                </tbody>
        </Table>
        <br></br>
        <br></br>
      <Button onClick = {this.getLoanTxDetails}> Get Transaction Receipt </Button>
      <br></br>
      <br></br>
      </Container>
      </div>
    );
  }
}

export default App;