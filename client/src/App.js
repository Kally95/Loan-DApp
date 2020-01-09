import React, { Component } from "react";
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
      states: ['PENDING', 'ACTIVE', 'RESOLVED'],
      web3: null,
      accounts: null,
      contract: null,
      interest: 0,
      loanPeriod: 0,
      borrower: 0,
      depositPercentage : 0,
      loanId: 0,
      fullAmount: 0,
      value: 0
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

  // runExample = async () => {
  //   const { accounts, contract } = this.state;

  //   // Stores a given value, 5 by default.
  //   //await contract.methods.set(5).send({ from: accounts[0] });

  //   // Get the value from the contract to prove it worked.
  //   //const response = await contract.methods.get().call();

  //   // Update state with the result.
  //   //this.setState({ storageValue: response });
  // };

  createLoan = async () => {
    let { accounts, contract,  interest, loanPeriod, borrower, depositPercentage, value} = this.state;
    let createLoan = await contract.methods.createLoan(
      interest,
      loanPeriod,
      borrower,
      depositPercentage
    ).send({from: accounts[0], value});
    console.log(createLoan)
  }

  getLoan = async () => {
    let { loanId, contract, accounts } = this.state;
    let loan = await contract.methods.retrieveLoans(loanId).call({from: accounts[0]});
    console.log(loan);
    this.setState({ loan });
  }

  handleInput = (event) => {
    console.log(event.target.name)
    console.log(event.target.value)
    this.setState({ [event.target.name]: event.target.value });
  }

  handleInterest = () => {
    const { accounts, contract } = this.state;
    const { interest } = this.state
    console.log(this.state.interest);
  }

  // handleGetLoan = () => {
  //   const { accounts, contract } = this.state;
  //   const { loanId } = this.state
  //   console.log(this.state.loanId)
  // }

  render() {
    //console.log(this.state);
    let { totalSupply: supply } = this.state;
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Good To Loan!</h1>
        <h2>Smart Contract Example</h2>
        <span>Account: {this.state.accounts[0]}</span>
        <br></br>
        <br></br>

        <div>This Loan has an ID of: {this.state.loanId}</div>
        <br></br>
        <div><button onClick={this.getLoan}>Retrieve Loan</button></div>
        <br></br>
        <div><input
            name="loanId"
            className="form-control"
            id="loanId"
            onChange={this.handleInput}
          /></div>

        <br></br>
      {/* <form>
        <div className="form-group">
          <label htmlFor="interest">Interest Amount</label>
          <br></br>
          <input
            name="interest"
            className="form-control"
            id="interest"
            onChange={this.handleInput}
          />
           <br></br>
          <small id="emailHelp" className="form-text text-muted">Interest amount</small>
        </div>
      </form> */}
      {/* <br></br>
      <button onClick={this.handleInterest} >Interest</button> */}

      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>

      <form>
        <div className="form-group">

          <h1>Create a Loan</h1>
          <label htmlFor="interest">Interest Amount</label>
          <br></br>
          <input
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
            name="depositPercentage"
            className="form-control"
            id="depositPercentage"
            onChange={this.handleInput}
          />
           <br></br>
        </div>
        <br></br>
        <div className="form-group">
          <label htmlFor="value">Value of the Loan</label>
          <br></br>
          <input
            name="value"
            className="form-control"
            id="value"
            onChange={this.handleInput}
          />
           <br></br>
        </div>
      
        <br></br>
        <button onClick={this.handleCreate}>Create</button>
      </form>
      </div>
    );
  }
}

export default App;