import {Container, Table} from 'react-bootstrap';
import React, { Component } from 'react';
import Button from '@material-ui/core/Button'
import getWeb3 from "./getWeb3";
import Loan from "./contracts/Loan.json";
import web3 from "web3";

import "./App.css";

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      status: ['PENDING', 'ACTIVE', 'RESOLVED'],
      transactionObjects: [],
      web3: null,
      currentLoan: null,
      currentLoanId: 1,
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
      txReceipt: '',
      shouldShowButton: false,
      contractState: {
        lastEventBlock: 0,
        currentState: 'ACTIVE'
      }
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
      this.setState({ web3, accounts, contract: instance }, () => {
        this.checkOwner();
        this.checkEvent();
        this.handleLoanId();
      });
      
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
    const etherAmount = web3.utils.toWei(this.state.amount);
    const interestAmount = web3.utils.toWei(this.state.interest);
    console.log(etherAmount)
    let { accounts, contract, interest, borrower, depositPercentage, amount} = this.state;
    try{
      let estimate = await contract.methods.createLoan(
      interestAmount,
      borrower,
      depositPercentage
    ).estimateGas({
      from: accounts[0],
      value: etherAmount
    })

    let tx = await contract.methods.createLoan(
      interestAmount,
      borrower,
      depositPercentage
    ).send({
      from: accounts[0],
      value: etherAmount,
      gasPrice: 2000000000,
      gas: (estimate  * 2)
    })

    this.setState({ 
      transactionHash : tx.transactionHash,
      blockNumber : tx.blockNumber,
      gasUsed : tx.gasUsed
    })
    this.handleLoanId()
    }
    catch (ex) {
      console.log(ex)
    }
  }

  checkEvent() {
    let { contract, contractState } = this.state;
    contract.events.LogStopped({
    fromBlock: 0
    }, 
    (error, event) => {
      this.setState(prevState => {
      if (event.blockNumber > prevState.contractState.lastEventBlock) {
        return {
          ...prevState,
          contractState: {
            lastEventBlock: event.blockNumber,
            currentState: 'STOPPED'
          }
        }       
      } else {
        return prevState
      }
    })
  })
  
  contract.events.LogResumed({
    fromBlock: 0
    }, 
    (error, event)=> {
      this.setState(prevState => {
      if (event.blockNumber > prevState.contractState.lastEventBlock) {
        return {
          ...prevState,
          contractState: {
            lastEventBlock: event.blockNumber,
            currentState: 'ACTIVE'
          }
        }       
      } else {
        return prevState
      }
    })
  })
  contract.events.LogKilled({
    fromBlock: 0
  }, 
    (error, event)=> {
      this.setState(prevState => {
      if (event.blockNumber > prevState.contractState.lastEventBlock) {
        return {
          ...prevState,
          contractState: {
            lastEventBlock: event.blockNumber,
            currentState: 'KILLED'
          }
        }       
      } else {
        return prevState
      }
    })
  })
}

  async checkOwner() {
    let { accounts, contract } = this.state;
    console.log(accounts[0])
    console.log(contract.methods)
    try {
      let owner = await contract.methods.getOwner().call({ from: accounts[0] });
      if (owner === accounts[0]) {
      this.setState({ shouldShowButton : true });
      }
      return owner === accounts[0];
    }
    catch (ex) {
      console.log(ex)
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
  };

  payBackLoan = async () => {
    let { loanId, contract, accounts, fullAmount } = this.state;
    const payBackAmount = web3.utils.toWei(this.state.amount);
    await contract.methods
      .payBackLoan(loanId)
      .send({from: accounts[0], value: payBackAmount}); 
  };
  
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
    console.log(loanId, accounts[0])
    console.log(web3.utils.fromWei(currentLoan.fullAmount));
    this.setState({ currentLoan });
  };

  handleInput = (event) => {
    console.log(event.target.name)
    console.log(event.target.value)
    this.setState({ [event.target.name]: event.target.value });
  };

  handleStop = async () => {
    let { contract, accounts } = this.state;
    await contract.methods.stop().send({from: accounts[0]})
  }

  handleKill = async () => {
    let { contract, accounts } = this.state;
    await contract.methods.kill().send({from: accounts[0]})
  }

  handleWithdraw = async () => {
    let { contract, accounts } = this.state;
    await contract.methods.withdrawWhenKilled().send({from: accounts[0]})
  }

  handleResume = async () => {
    let { contract, accounts } = this.state;
    await contract.methods.resume().send({from: accounts[0]})
  }

  handleLoanId = async () => {
    let { contract, accounts } = this.state;
    let x = await contract.methods.loanId().call({from: accounts[0]});
    this.setState({ currentLoanId: x})
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    if (this.state.web3)  
    {
    this.state.contract.methods.getOwner()
    .call()
    .then(result => {
    })}

    return (
      <div className="App">
        <div className="Loan-app-header">
        <h1>LOANΞR</h1>
        <img className="header-img" src="https://cdn.iconscout.com/icon/free/png-256/ethereum-3-569581.png"/>
        <p class="line-1 anim-typewriter">Built on Ethereum smart contracts</p>
        <span className="account-address">Account: {this.state.accounts ? this.state.accounts : null }</span>
        </div>        
        
        <div className="owner-special-buttons">
          <h6>Owner Panel</h6>
        {this.state.shouldShowButton && this.state.contractState.currentState !== 'STOPPED' &&
         this.state.contractState.currentState !== 'KILLED' &&
          <Button 
          color="primary"
          onClick={this.handleStop}
          >
          STOP CONTRACT
          </Button>
        }
        {this.state.shouldShowButton && this.state.contractState.currentState !== 'ACTIVE' &&
         this.state.contractState.currentState !== 'KILLED' &&
          <Button 
          color="primary"
          onClick={this.handleResume}
          >
          RESUME CONTRACT
          </Button>
        }
        {this.state.shouldShowButton &&
          <Button
            color="primary"
            onClick={this.handleWithdraw}
          >
          WITHDRAW
          </Button>
        }
        {this.state.shouldShowButton && this.state.contractState.currentState !== 'KILLED' &&
          <Button 
          color="secondary"
          onClick={this.handleKill}
          >
          KILL CONTRACT
          </Button>
        }
        </div>
        
        <div>This Loan has an ID of: {this.state.loanId}</div>
        <Button 
        className="Retrieve-butt"
        onClick={this.handleRetrieveLoans}
        variant="contained"
        color="default">
        Retrieve Loan
        </Button>
        <div>
          <input
            name="loanId"
            className="form-control"
            id="loanId"
            onChange={this.handleInput}
          />
        </div>
        <p>Contract Status: {this.state.contractState.currentState}</p>
        <Table bordered responsive className="x">
          <thead>
            <tr>
              <th>Loan Details</th>
              <th>Values</th>
            </tr>
          </thead> 
          <tbody>
            <tr>
              <td>Full Loan Amount:</td>
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

        <Button 
        className="payDeposit-butt"
        onClick={this.payLoanDeposit} variant="contained" 
        color="default">
        Pay Deposit
        </Button>
        <div>
          <input
            autoComplete="off"
            name="amount"
            className="form-control"
            id="amount"
            onChange={this.handleInput}
          />
        </div>

        <Button
        className="retrieveFunds-butt" 
        onClick={this.handleRetrieveFunds} 
        variant="contained" 
        color="primary">
        Retrieve Funds
        </Button>

        <Button  onClick={this.payBackLoan} variant="contained" color="">
        Pay Off Loan
        </Button>

        <div>
          <input
            autoComplete="off"
            name="amount"
            className="form-control"
            id="payLoan"
            onChange={this.handleInput}
          />
        </div>

      <form className="create-loan-form">
        <div className="form-contents">
          <h1>Create a Loan</h1>
          <hr></hr>

          <label htmlFor="interest">Interest Amount</label>
          <input
            autoComplete="off"
            name="interest"
            className="form-control"
            id="interest"
            onChange={this.handleInput}
          />
          <label htmlFor="borrower">Borrower</label>
          <input
            autoComplete="off"
            name="borrower"
            className="form-control"
            id="borrower"
            onChange={this.handleInput}
          />
          <label htmlFor="depositPercentage">Deposit Percentage (%)</label>
          <input
            autoComplete="off"
            name="depositPercentage"
            className="form-control"
            id="depositPercentage"
            onChange={this.handleInput}
          />
          <label htmlFor="amount">Value of the Loan</label>
          <input
            autoComplete="off"
            name="amount"
            className="form-control"
            id="amount"
            onChange={this.handleInput}
          />
          <div className="LoanId-info">
            <p id="loanCounter"> Loan ID: {this.state.currentLoanId}</p>
            <p id="loanCounterInfo">Loan ID's can be used to retrieve loans assigned the that ID</p>
          </div>
        </div>
        
      </form>

      <Button onClick={this.createLoan} variant="contained" color="">
      Create
      </Button>
      
      <Container>
        <Table bordered responsive className="x">
            <thead>
              <tr>
                <th>Tx Receipt Category</th>
                <th>Values</th>
              </tr>
            </thead>
            
            <tbody>
              <tr>
                <td>Tx Hash :</td>
                <td>
                  {this.state.transactionHash}</td>
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
      </Container>
      </div>
    );
  }
}

export default App;