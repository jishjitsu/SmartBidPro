// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TenderNotary {
    error ZeroHashNotAllowed();
    error HashAlreadyAnchored();
    error HashNotAnchored();

    mapping(bytes32 => uint256) private _anchorTimes;

    event HashAnchored(bytes32 indexed dataHash, uint256 timestamp);

    function anchorHash(bytes32 dataHash) external {
        if (dataHash == bytes32(0)) {
            revert ZeroHashNotAllowed();
        }

        if (_anchorTimes[dataHash] != 0) {
            revert HashAlreadyAnchored();
        }

        uint256 timestamp = block.timestamp;
        _anchorTimes[dataHash] = timestamp;

        emit HashAnchored(dataHash, timestamp);
    }

    function getAnchorTime(bytes32 _hash) external view returns (uint256) {
        uint256 anchorTime = _anchorTimes[_hash];
        if (anchorTime == 0) {
            revert HashNotAnchored();
        }

        return anchorTime;
    }
}
