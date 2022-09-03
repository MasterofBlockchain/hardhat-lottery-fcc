//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

/*VRFCoordinatorV2Interface uses function()requestRandomWords*/
// and it helps us to generate randowm number.

/** VRFConsumerBaseV2 uses function ()fulfillRandomWords */
//after the random number generation this function help us to excecutve

//errors
error lottery__NotEnoughFUnds();
error lottery__TransferFailed();
error lottery__NotOpeen();
error lottery__UpKeepNotNeeded(address(this).balance,s_players.length,uint256(s_raffleState));
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

    /**modifiers */

    /* functions */

    constructor(
        address vrfCoordinator,
        uint256 entranceFee,
        bytes32 gaslane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval;
    ) VRFConsumerBaseV2(vrfCoordinator) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_gaslane = gaslane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.open;
        s_lastTimeStamp = block.timestamp;
        i_interval= interval;
    }

    function EnterLottery() public payable {
        if (msg.value < i_entranceFee) {
            revert lottery__NotEnoughFUnds();
        }

        if (s_raffleState != RaffleState.OPEN) {
            revert Raffle__NotOpeen();
        }
        s_players.push(payable(msg.sender));
        emit LotteryEnter(msg.sender);
    }

    /**
     * --We'll have `checkupkeep` and `performupkeep` functions from keepers
     * -- `checkup` functions helps us to check if all things are in place and returns a `true` value.
     * -- If `checkup` returns `true` then `PerformUpKeep` execute the functions based on
     * `timeValue` or `customelogic`.
     * --Check these in `checkupkeepers` function.
     * 1- For `checkup` to work `interval time` should have passed.
     * 2- the lottery should have atleast `1` player and have some `eth`.
     * 3-our `subscription` should be fudned with `link`.
     * 4- lottery shall be in `open-state`.
     */

    
    function checkUpkeep(
        //bytes calldata /* checkData */
        //since we are passing ("")in perfromUpkeep 
        //calldata does not work with `strings` so `memory` keyword 
        bytes memory /* checkData*/
    ) public override returns(bool upkeepNeeded,bytes memory /* performData */) {
        bool isOpen = (RaffleState.open == s_raffleState);
        bool timePassed = ((block.timestamp-s_lastTimeStamp)>i_interval);
        bool hasplayer = (s_players.length >0);
        bool hasbalance = address(this).balance >0;
         upKeepNeeded = (isOpen && timePassed && hasplayer && hasbalance );
        //current block time stamp = block.timestamp
        //time of deplying time stamp = last blocktimeStamp
        //Intervel = time mentoned in the constructor for the inteval
        //(block.timestamp-lastTimeStamp)>interval
    }
    
// function requestRandomWords() external {
    //this function is switched from `requestRandowmWords` to ``PerfomKeep` 
    function performupkeep(bytes calldata /*performData*/)external override{
        (bool upKeepNeeded,)= checkUpkeep("");
        if(!upKeepNeeded){
            revert lottery__UpKeepNotNeeded(address(this).balance,s_players.length,uint256(s_raffleState));
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
        s_lastTimeStamp= block.timeStamp;

        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert lottery__TransferFailed();
        }
        emit winnerPIcked(recentWinner);
    }

    /**view and pure */

    function entranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function GetPlayers(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }
    function getRaffleState()public view returns(RaffleState){
        return s_raffleState;
    }
    function getNumwords()public pure returns(uint256){
        return NUM_WORDS;

    }
    function getNumberOfPlayers()public view returns(uint256){
        return s_players.length;
    }
    function getLatestTimeStamp()public view returns(uint256){
        return s_lastTimeStamp;
    }
    //this is `pure` because `REQUEST_CONFIRMATIONS` is constant.
    function getRequestCOnfirmations()public pure returns(uint256){
        return REQUEST_CONFIRMATIONS;
    }
}
