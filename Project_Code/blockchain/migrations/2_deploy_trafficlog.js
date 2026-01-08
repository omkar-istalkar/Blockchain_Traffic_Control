const TrafficLog = artifacts.require("TrafficLog");

module.exports = function (deployer) {
  deployer.deploy(TrafficLog);
};
