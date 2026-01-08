// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TrafficLog {

    struct Log {
        string eventType;
        string intersection;
        address sender;
        uint timestamp;
    }

    Log[] public logs;

    event LogAdded(
        string eventType,
        string intersection,
        address sender,
        uint timestamp
    );

    function addLog(string memory _event, string memory _intersection) public {
        logs.push(Log(_event, _intersection, msg.sender, block.timestamp));
        emit LogAdded(_event, _intersection, msg.sender, block.timestamp);
    }

    function getLogsCount() public view returns (uint) {
        return logs.length;
    }

    function getLog(uint index) public view returns (
        string memory,
        string memory,
        address,
        uint
    ) {
        Log memory l = logs[index];
        return (l.eventType, l.intersection, l.sender, l.timestamp);
    }
}
