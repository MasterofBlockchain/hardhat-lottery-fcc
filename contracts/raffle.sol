//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

error Raffle__NotEnoughEth();

contract Raffle {
    /*State Variable*/
    uint256 private immutable i_entranceFee;
    address payable[] private s_players
    /* events */
    //events name could be reversed name of the function
    event RaffleEnter(address indexed player);

    constructor(uint256 entranceFee) {
        i_entranceFee = entranceFee;
    }

    function enterRaffle() public payable {
        // > bigger
        // require(msg.value> i_entranceFee, "not enough funds")
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughEth();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    // function Pickrndom winner(){}

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayers(uint256 index) public view returns (address) {
        return s_players[index];
    }
}
