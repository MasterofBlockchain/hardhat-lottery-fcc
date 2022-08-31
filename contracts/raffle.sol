//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

error Raffle__NotEnoughEth();

contract Raffle is VRFConsumerBaseV2 {
    /*State Variable*/
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    /* events */
    //events name could be reversed name of the function
    event RaffleEnter(address indexed player);

    constructor(address vrfCoordinatorV2, uint256 entranceFee) VRFConsumerBaseV2(vrfCoordinatorV2) {
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

    function requestRandomWinner() external {
        //get random number
        //do something with it
        //this is 2 transaction process so no one can manipulate
    }

    function fulfillRandomWords() internal override {}

    /* view and pure */

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayers(uint256 index) public view returns (address) {
        return s_players[index];
    }
}
