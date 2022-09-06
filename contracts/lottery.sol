//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

/**
 * @notice VRFCoordinatorV2Interface
 * VRFCoordinatorV2Interface uses function()requestRandomWords
 and it helps us to generate randowm number.
*@notice VRFConsumerBaseV2
* VRFConsumerBaseV2 use `function ()fulfillRandomWords` 
after the random number generation this function help us to excecutve the function.
*@notice KeeperCompatibleInterface.
* use two functions `checkUpkeep` and perfomupkeep`.
* `checkupkey`-- checks all the data and returna `true` if eveything is as per the code defination.
* performupkeep` -- when its recives a `true` from `cjeckupkeep` it starts to execute.
*/

//errors
error lottery__NotEnoughFUnds();
error lottery__TransferFailed();
error lottery__NotOpen();
error lottery__UpKeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);

/**
 * @title A sample Raffle or lottery contract
 * @author rob
 * @notice this acc is for creating an untemperable decentarlised way lotttery
 * @dev this implements chainlink VRFv2 and chainlinkKeepers
 */

contract lottery is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /* Type Declartion */
    enum RaffleState {
        OPEN,
        CALCULATING
    }
    /*state Variable */

    //We use `immutable` when we have to go through`constructor` to add data.
    //we use `constant` when we have data in `stateVariable` which cant be change after deployed.

    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gaslane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    /**Lottery Variable */

    address private s_recentWinner;
    RaffleState private s_raffleState;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    /* EVENTS*/
    event LotteryEnter(address indexed player);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event winnerPIcked(address indexed winner);

    /* functions */

    constructor(
        address vrfCoordinatorV2, //contract address of vrfCoordinatorV2
        uint256 entranceFee,
        bytes32 gaslane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gaslane = gaslane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    function EnterLottery() public payable {
        if (msg.value < i_entranceFee) {
            revert lottery__NotEnoughFUnds();
        }

        if (s_raffleState != RaffleState.OPEN) {
            revert lottery__NotOpen();
        }
        s_players.push(payable(msg.sender));
        emit LotteryEnter(msg.sender);
    }

    /**
     
     * --`Checkupkeep` checks mentioned below functions.
     * 1- For `checkup` to work `interval time` should have passed.
     * 2- the lottery should have atleast `1` player and have some `eth`.
     * 3-our `subscription` should be fudned with `link`.
     * 4- lottery shall be in `open-state`.
     */

    //bytes calldata /* checkData */
    //since we are passing ("")in perfromUpkeep
    //calldata does not work with `strings` so `memory` keyword

    //current block time stamp = block.timestamp
    //time of deplying time stamp = last blocktimeStamp
    //Intervel = time mentoned in the constructor for the inteval
    //(block.timestamp-lastTimeStamp)>interval

    function checkUpkeep(
        bytes memory /* checkData*/
    )
        public
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool isOpen = (RaffleState.OPEN == s_raffleState);
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasplayer = (s_players.length > 0);
        bool hasbalance = address(this).balance > 0;
        upkeepNeeded = (isOpen && timePassed && hasplayer && hasbalance);
    }

    // function requestRandomWords() external {
    //this function is switched from `requestRandowmWords` to ``PerfomKeep`
    function performUpkeep(
        bytes calldata /*performData*/
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert lottery__UpKeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_raffleState)
            );
        }

        //since we are fetching random number lottery needs to be paused/stopped
        s_raffleState = RaffleState.CALCULATING;

        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gaslane, //keyHash,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(
        uint256,
        /*requestId*/
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        //since we have a winner announced now.lottery shall be open.
        s_raffleState = RaffleState.OPEN;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;

        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert lottery__TransferFailed();
        }
        emit winnerPIcked(recentWinner);
    }

    /**view and pure */

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function GetPlayers(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumwords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    //this is `pure` because `REQUEST_CONFIRMATIONS` is constant.
    function getRequestCOnfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }
}
