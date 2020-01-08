var SimpleStorage = artifacts.require("./SimpleStorage.sol");
var LoanContract = artifacts.require("./Loan");

module.exports = function(deployer) {
  deployer.deploy(SimpleStorage);
  deployer.deploy(LoanContract);
};
