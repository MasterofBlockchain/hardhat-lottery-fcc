const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery unit testing", function () {
          let lottery, vrfCoordinatorV2Mock, entranceFee, deployer, interval
          const chainId = network.config.chainId

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              lottery = await ethers.getContract("lottery", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              entranceFee = await lottery.getEntranceFee()
              interval = await lottery.getInterval()
          })

          describe("constructor", function () {
              it("intlializse the lottery corectly", async function () {
                  const raffleState = await lottery.getRaffleState()
                  const interval = await lottery.getInterval()
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(interval.toString(), networkConfig[chainId]["interval"])
              })
          })
          describe("enterLottery", function () {
              it("reverts when you dont pay enough", async function () {
                  await expect(lottery.EnterLottery()).to.be.revertedWithCustomError(
                      lottery,
                      "lottery__NotEnoughFUnds"
                  )
              })
              /**@ answer is also in `github` discussions.
              * @read We are testing `enterloterry` functions `getplayers`
              * first we will have to make a transaction so it could be recorded.
              * await lottery.EnterLottery({ value: entranceFee })
              * we eneter in `enterlottery` function and make a transaction of`entranceFee`
              * that `enterFee` is decalred in `helper-hardhat-config`
              * we first import it and then declare and then use it in function.
              * now we have entered in the `lotery function` and created a transaction 
              * whileentering in the lottery and its been recorded.
              * 
              * @read now we call the actuall function `feature` to test
              *  const playerFromContract = await lottery.GetPlayers(0)
              * since we have creted a transaction of `enterfee` above
              * its already in `getplayers` array and at the index of (0)
              * so deployer needs to be equal to players from contract
           
              */
              it("record players when they enter", async function () {
                  await lottery.EnterLottery({ value: entranceFee })
                  const playerFromContract = await lottery.GetPlayers(0)
                  assert.equal(playerFromContract, deployer)
              })
              it("emits event on Enter", async function () {
                  await expect(lottery.EnterLottery({ value: entranceFee })).to.emit(
                      lottery,
                      "LotteryEnter"
                  )
              })
              /**
               * @read when its `notOPEn` it means its calculating.
               * if we see `PerfomrUPkeep` its calcullating,but this function will only work if
               * `CheckUPKeep` returns a true.
               * `network.provider.send` comes from the below link.
               * //https://hardhat.org/hardhat-network/docs/reference
               * `network.provider.send` comes from the above link.
               * * @read `+1` explanation-->
               * Let's says if it's 24 hours(would write in seconds) rather than '30' seconds. So the function will work same way.
               *It will use '' evm_increaseTime"" to fast forward the given amount of time
               *(which is mentioned in helper-hardhat) and
               *start to count from '1'(or any no. Of time we mention here than '1') and execute the function.
               */
              it("does not allow us to enter when its calculating", async function () {
                  await lottery.EnterLottery({ value: entranceFee })

                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]) //+1 explanation is above.
                  await network.provider.send("evm_mine", []) //mine a new block

                  //await network.provider.request({method: "evm_mine", params: []})
                  await lottery.performUpkeep([])
                  //upper have filled `checkUPkeep`filled and now calling `perfomupkeep`
                  //so its in calculating state.
                  await expect(
                      lottery.EnterLottery({ value: entranceFee })
                  ).to.be.revertedWithCustomError(lottery, "lottery__NotOpen")
              })
          })
          /**
           
           *@read -----> ~`call-static`
           *we use `callStatic` for stimulation. its a function of `ethers.js`.
           *what callStatic does is ->it tells the nodes to not to chnage the state of blockchain since 
           *we are stimulating and trying to test.
           *they will return the result accordingly which does not lead to a change in state.
           *await lottery.checkupkeep([]) //this will make a transaction and change the state of transaction because its a `public` function.
           *if this function was a `public view` it would have returned the `view` only.
           * hence we are using `callStatic` while testing for stimulation.
           *@read Hey In this case, we can simplify the expression assert(!upkeepNeeded) as assert.equal(upkeepNeeded, false)
           *This is to mean that we want to assert that upkeepNeeded should be equal to false.
           * Using assert(!upkeepNeeded) is just a shorthand shortcut way of writing assert.equal(upkeepNeeded, false)
           
           */
          describe("checkUpKeeep", function () {
              it("returns false if peole have not sent any eth", async function () {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([])

                  // assert.equal(upkeepNeeded,false) //or equal to below
                  assert(!upkeepNeeded)
              })

              //    * @read about - returns false if lottery aint open
              //    * 1- we are creating a transaction
              //    * 2- we are passing the interval
              //    * 3- creating a block.
              //    * 4-calling `perfomrupKeep` for random number.
              //    * 5- checking lottery state if its in now in `calculatnig`
              //    * 6- if its calculating `upKeepNeeded` cant be true because it has 4 thingg to check.
              //    *  `is open`, `t`imepassed`, `has balance` and `has players`.
              //    * 7- since its calculating and `is open` function is not right hence it will returna false.
              //    *
              //    *

              it("returns false if lottery aint open", async function () {
                  await lottery.EnterLottery({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await lottery.performUpkeep([]) // performUp keep is requestRandomWords function
                  const lotteryState = await lottery.getRaffleState()
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([])
                  assert.equal(lotteryState.toString(), "1") //calculate
                  assert.equal(upkeepNeeded, false)
              })

              it("returns false if enough time hasn't passed", async () => {
                  await lottery.EnterLottery({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() - 5]) // use a higher number here if this test fails
                  await network.provider.request({ method: "evm_mine", params: [] }) //?
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x")
                  // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  //since `timepassed` is false because its not passed.it will return a false.
                  assert(!upkeepNeeded)
              })

              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  await lottery.EnterLottery({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x")
                  // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(upkeepNeeded)
              })
          })

          /**
           * @read `performUpkeep` is the `randomRequestnumber` function
           */
          describe("performUpkeep", function () {
              it("only run when checkup is true", async function () {
                  await lottery.EnterLottery({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const tx = await lottery.performUpkeep([])
                  assert(tx)
              })
              it("reverts when checkUp is false", async function () {
                  await expect(lottery.performUpkeep([])).to.be.revertedWithCustomError(
                      lottery,
                      "lottery__UpKeepNotNeeded"
                  )
              })

              /**
               *  @read `wait.()`
               * its `ethers.js` functions helps us to get the recipt.
               * we can put anynumber in it. number simply means how many block we want to mine
               * the more the number the more it take to mine.
               * good practice is to  maximise number @ `2.
               *
               * @read `events`
               * if we want to interact with the events from a contract we use a transaction receipt.right?
               * Well this is how we interact with an event.So here in the line.
               * `txReceipt.events[1].args.requestId` we are accessing the events from the transaction receipt.
               * we have also `events` in contract from same function and fetching it from `txReciept` should be same.
               *
               * `1` represents the index of the event (the second event) AND
               *  `args` is the arguments that are carried in the event.
               * for eaxmple in our contract we have this -  `emit RequestedRaffleWinner(requestId);`
               * it has an argument `requestId` and that is the `args`
               * You can't see here but the function .requestRandomWords that we call in this section
               * also emits an event. So this becomes the event at index 0 then the event that we emit ourselves
               * from the line emit RequestedRaffleWinner(requestId); becomes the event at index 1
               *So the event at index 0 isn't from the blockchain but also comes from our contract.
               *@link https://github.com/smartcontractkit/full-blockchain-solidity-course-js/discussions/2520
               */

              it("calls the lottery state, emits and events, calls the VRF coordinator", async function () {
                  await lottery.EnterLottery({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const txResponse = await lottery.performUpkeep([]) //`performUpkeeep` is `requestRandomwords`
                  //   console.log("First response: ", txResponse)

                  //from the receipt we are gonna get requestId
                  const txReceipt = await txResponse.wait(1)

                  //this is gonna be the `1` event rather than `0` becauase
                  //before this `actual function(original)` gonna get us event.
                  const requestId = txReceipt.events[1].args.requestId
                  const lotteryState = await lottery.getRaffleState()

                  assert(requestId.toNumber() > 0)
                  assert(lotteryState.toString() == "1")
                  //because we have entered lottery and and state is being calculated
                  // which is `0 -open`, `1-calculating`.
                  //since its calculating it would be `==1`
              })
          })

          /**
           * @read try-catch
           * try--catch block is mainly useful because it lets us handle the error and terminate the program execution
           *  gracefully. When using the normal program flow, if an error is thrown the program abruptly ends and
           * prints out the error.
           * However when we use a try...catch block it gives us control on what to do when an error occurs
           *
           * @read listener
           * listeners- wait for certain events to occur before they take next step
           * java script and node j.s comes with listeners `emitter.once()` and `emitter.on()`
           * emitter = means whatever we will emit.in this case it will have the name of the `contrcat`.
           * `emitter.once()`= response to any event one time.
           * `emitter.on()`= response to contniously listen for an event being emitter.
           * here we are saying `lottry.once` ---`winnerPIcked`
           * means we are calling it `once` with `contract name` and wait for the `winnerPicked` to hit.
           * once its `hit` we want it do some certain things which are mentioned below it.
           * also we use `tryCatch` within to find mistakes.
           *
           */
          describe("fullfill random number", function () {
              beforeEach(async function () {
                  await lottery.EnterLottery({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
              })
              /**
               * @read it(can only be called after PerformUpkeep)
               * we are using `vrfCoordinatorV2Mock` for `requestrandomWords`
               * and `fulfillRandomWords`since we are testing this function.
               *in ` vrfCoordinatorV2Mock` they also have `fulfillRandomWords` fucntion
               since this is mock. 
              
               
               @read we use `fulfillRandomWords` from `vrfCoordinatorV2Mock` since we are locally testing
               *from the help of a mock.
               *and it says for `fulfillRandomWords` we need `requestId` and `contract address`.
               * and ifincase its not there `revert this` please check function from mock.
               * btw revert fromm mock is ` revert("nonexistent request");`
               * 
               * @read If `performUpkeep` is passed and it will also generate a `requestId`
               * since we are testing `fulfillRandomWords` directly and eneterig requestId as `0`
               * hence checking if its revert the right expected revert because we callingn fullfill function
               * without performup.
               * belowe `0` and `1` and imaginationarty request I.d with `contractAddresses`
               */
              it("can only be called after PerformUpkeep", async function () {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, lottery.address)
                  ).to.be.revertedWith("nonexistent request")
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, lottery.address)
                  ).to.be.revertedWith("nonexistent request")
              })
              it("picks a winner,reset the lottery and send money to winner", async function () {
                  const addtionalEntrance = 3
                  const startingAccIndex = 1 //because deployer is at:0
                  const accounts = await ethers.getSigners()

                  for (i = startingAccIndex; i < startingAccIndex + addtionalEntrance; i++) {
                      const accountConnectLottery = lottery.connect(accounts[i])
                      await accountConnectLottery.EnterLottery({ value: entranceFee })
                  }
                  const startingTimeStamp = await lottery.getLatestTimeStamp()
                  /**
                   *@read About- Promise,listener and try and catch
                   * 1- will use `performupkeep` as a `mock chainlink keepers` and that will kick
                   *2-  `fullfillrandomwords` as a mock
                   *and will have to wait on the testnet for the `fullfillrandomwords` to be called.
                   *3- since we are on `localchain` and dont have to really wait
                   *but we will `simulate` it as we do need to wait for than event to be called.
                   *4- in order to `simulate` we need to setup a `listener`.and dont want `listener` to be finish
                   *before the test ends.so we will have to create `promise`.
                   * we are using ~`promsie`so we can wait on testnet as we do on mainnet to stimulate.
                   *we are using `lottery.once` as listener as it gets kicked and do some certain things.
                   *we are using `try and catch`to find some error if any in `listener``.
                   */
                  await new Promise(async (resolve, reject) => {
                      lottery.once("winnerPIcked", async () => {
                          console.log("Found the event!")

                          try {
                              const recentWinner = await lottery.getRecentWinner()
                              console.log(recentWinner)
                              console.log(accounts[2].address)
                              console.log(accounts[0].address)
                              console.log(accounts[1].address)
                              console.log(accounts[3].address)
                              const raffleState = await lottery.getRaffleState()
                              const endingTimeStamp = await lottery.getLatestTimeStamp()
                              const numPlayers = await lottery.getNumberOfPlayers()
                              const winerEndingBalance = await accounts[1].getBalance()
                              assert.equal(numPlayers.toString(), "0")
                              assert.equal(raffleState.toString(), "0")
                              assert(endingTimeStamp > startingTimeStamp)
                              assert.equal(
                                  winerEndingBalance.toString(),
                                  winnerstartingBalance.add(
                                      entranceFee.mul(addtionalEntrance).add(entranceFee).toString()
                                  )
                              )
                          } catch (e) {
                              reject(e)
                          }
                          resolve()
                      })
                      //outside the listener but inside the promise we will do this
                      //once it selects the `winner` then upper `lottery.once` will automaically trigger
                      // "winnerpicked " event
                      const tx = await lottery.performUpkeep([])
                      const txReceipt = await tx.wait(1)
                      const winnerstartingBalance = await accounts[1].getBalance()
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.events[1].args.requestId,
                          lottery.address //requestI.d and consumer address coming from mockVRF
                      )
                  })
              })
          })
      })
