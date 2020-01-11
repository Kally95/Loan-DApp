var LoanContract = artifacts.require("./Loan");

module.exports = function(deployer) {
  deployer.deploy(LoanContract);
};
