import {Table, Container, Button, Form } from 'react-bootstrap';
import React, { Component } from 'react';
import getWeb3 from "./getWeb3";
import Loan from "./contracts/Loan.json";

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
      web3: null,
      accounts: null,
      contract: null,
      interest: 0,
      loanPeriod: 0,
      borrower: 0,
      depositPercentage : 0,
      loanId: 0,
      fullAmount: 0,
      amount: 0,
      requiredDeposit: 0,
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

// Function to get the chain details of loan upon submitting the Loan. 
  // getLoanChainDetails = async () => {
  //   try{
  //     this.setState({blockNumber:"waiting.."});
  //     this.setState({gasUsed:"waiting..."});
  //     await web3.eth.getTransactionReceipt(this.state.transactionHash, (err, txReceipt)=>{
  //     console.log(err,txReceipt);
  //     this.setState({txReceipt});
  //   }); //await for getTransactionReceipt
  //     await this.setState({blockNumber: this.state.txReceipt.blockNumber});
  //     await this.setState({gasUsed: this.state.txReceipt.gasUsed});    
  //   } 
  //     catch(error){
  //     console.log(error);
  //   } 
  // } 

  createLoan = async () => {
    console.log("CREATE")
    let tx;
    let { accounts, contract,  interest, loanPeriod, borrower, depositPercentage, amount} = this.state;
    try{
      tx = await contract.methods.createLoan(
      interest,
      loanPeriod,
      borrower,
      depositPercentage
    ).send({
      from: accounts[0],
      value: amount,
      gas: 650000
    })
    }
    catch (ex) {
      console.log(tx);

    }
  }

  payLoanDeposit = async () => {
    let { accounts, contract, requiredDeposit, loanId } = this.state;
    await contract.methods
    .payLoanDeposit(loanId)
    .send({from: accounts[0], value: requiredDeposit})
    // Get requiredDeposit from Struct in Loan contract
  };

  payBackLoan = async () => {
    let { loanId, contract, accounts, fullAmount } = this.state;
    // const fullLoanAmount = web3.utils.toBN(fullAmount);
    await contract.methods
      .payBackLoan(loanId)
      .send({from: accounts[0], value: fullAmount}); 
  };
  
  // Retrieve funds is for the BORROWER to call
  // in order to retrieve the funds deposited by
  // the lender
  retrieveFunds = async () => {
    let { loanId, contract, accounts } = this.state;
    await contract.methods
    .retrieveFunds(loanId)
    .call({from: accounts[0]})
  };

  findLoan = async () => {
    let { loanId, contract, accounts } = this.state;
    let loan = await contract.methods.retrieveLoans(loanId).call({from: accounts[0]});
    console.log(loan);
    this.setState({ loan });
  };

  handleInput = (event) => {
    console.log(event.target.name)
    console.log(event.target.value)
    this.setState({ [event.target.name]: event.target.value });
  };

  handleInterest = () => {
    const { accounts, contract } = this.state;
    const { interest } = this.state
    console.log(this.state.interest);
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
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
        <div><button onClick={this.findLoan}>Retrieve Loan</button></div>
        <br></br>
        <div>
          <input
            name="loanId"
            className="form-control"
            id="loanId"
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
        <br></br>
        <div className="form-group">
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
        </div>
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
          <label htmlFor="depositPercentage">Deposit Percentage</label>
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
      <Container>
        <Table bordered responsive className="txReceipt-table">
                <thead>
                  <tr>
                    <th>Tx Receipt Category</th>
                    <th>Values</th>
                  </tr>
                </thead>
               
                <tbody>
                  {/* <tr>
                    <td>IPFS Hash # stored on Eth Contract</td>
                    <td>{this.state.ipfsHash}</td>
                  </tr> */}
                  <tr>
                    <td>Ethereum Contract Address</td>
                    <td>{this.state.ethAddress}</td>
                  </tr>
                  <tr>
                    <td>Tx Hash # </td>
                    <td>{this.state.transactionHash}</td>
                  </tr>
                  <tr>
                    <td>Block Number # </td>
                    <td>{this.state.blockNumber}</td>
                  </tr>
                  <tr>
                    <td>Gas Used</td>
                    <td>{this.state.gasUsed}</td>
                  </tr>

                </tbody>
        </Table>
      </Container>
        {/* <p>Full Amount: {this.state.fullAmount}</p>
        <p>Deposit Paid: {this.state.depositPercentage}</p>
        <p>Borrower: {this.state.borrower}</p>
        <p>Lender: {this.state.accounts[0]}</p>
        <p>Amount: {this.state.amount}</p>
        <p>Interest: {this.state.interest} </p>
        <p>Duration: {this.state.loanPeriod} </p>
        {this.state > 0 ? (
        <p>End: {(new Date(parseInt(this.end) * 1000)).toLocaleString()}</p>
        ) : null} */}
      </div>
    );
  }
}

export default App;