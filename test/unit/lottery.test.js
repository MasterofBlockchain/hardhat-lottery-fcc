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
              it("record players when they enter", async function () {
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
              it("does not allow us to enter when its calculating", async function () {
                  /**
                   * @read when its `notOPEn` it means its calculating.
                   * if we see `PerfomrUPkeep` its calcullating,but this function will only work if
                   * `CheckUPKeep` returns a true.
                   */
                  await lottery.EnterLottery({ value: entranceFee })
                  //https://hardhat.org/hardhat-network/docs/reference
                  // below `network.provider.send` comes from the above link.
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]) //+1 explanation is below.
                  await network.provider.send("evm_mine", []) //mine a new block// line 23
                  //or we could write
                  //await network.provider.request({method: "evm_mine", params: []})//line 23
                  await lottery.performUpkeep([]) //upper have filled `checkUPkeep`filled and now calling `perfomupkeep`
                  //so its in calculating state.
                  await expect(
                      lottery.EnterLottery({ value: entranceFee })
                  ).to.be.revertedWithCustomError(lottery, "lottery__NotOpen")
              })
          })
          /**
           * @read `+1` explanation-->
           * Let's says if it's 24 hours(would write in seconds) rather than '30' seconds. So the function will work same way.
           *It will use '' evm_increaseTime"" to fast forward the given amount of time
           *(which is mentioned in helper-hardhat) and
           *start to count from '1'(or any no. Of time we mention here than '1') and execute the function.
           *@read we use `callStatic` for stimulation. its a function of `ethers.js`
           *what callStatic does is it tells us the nodes to "pretend" that the call is not state-changing. Consequently,
           *they will return the result accordingly which does not lead to a change in state.
           *await lottery.checkupkeep([]) //this will make a transaction and change the state of transaction because its a `public` function.
           *if this function was a `public view` it would have returned the `view` only.
           *
           */
          describe("checkUpKeeep", function () {
              it("returns false if peole have not sent any eth", async function () {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([])
                  assert(!upkeepNeeded) //?
              })
              it("returns false if lottery aint open", async function () {
                  await lottery.EnterLottery({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await lottery.performUpkeep([])
                  const lotteryState = await lottery.getRaffleState()
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([])
                  assert.equal(lotteryState.toString(), "1") //?
                  assert.equal(upkeepNeeded, false) //?
              })
              //copy from github
              it("returns false if enough time hasn't passed", async () => {
                  await lottery.EnterLottery({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() - 5]) // use a higher number here if this test fails
                  await network.provider.request({ method: "evm_mine", params: [] }) //?
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(!upkeepNeeded) //?
              })
              //copied from github
              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  await lottery.EnterLottery({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(upkeepNeeded)
              })
          })
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
              it("calls the lottery state, emits and events, calls the VRF coordinator", async function () {
                  await lottery.EnterLottery({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  const txResponse = await lottery.performUpkeep([])
                  //from the receipt we are gonna get requestId
                  const txReceipt = await txResponse.wait(1)

                  //this is gonna be the `1` event rather than `0` becauase
                  //before this actual functiona gonna get us event.
                  const requestId = txReceipt.events[1].args.requestId
                  const lotteryState = await lottery.getRaffleState()
                  assert(requestId.toNumber() > 0) //?
                  assert(lotteryState.toString() == "1") //?
              })
          })

          /**
           * @read try-catch
           * 
           * @read listener
           * listeners- wait for certain events to occur before they take next step
           * java script and node j.s comes with listeners `emitter.once()` and `emitter.on()`
           * emitter = means whatever we will emit.
           * `emitter.once()`= response to ane vent one time
           *  `emitter.on()`= response to contniously listen for an event being emitter.
           * here we are saying `lottry.once` ---`winnerPIcked`
           * means we are calling it `once` with `contract name` and wait for the `winnerPicked` to hit.
           * once its `hit` we want it do some certain things which are mentioned below it.
           * also we use try and cathc within to find mistakes. 
           * 
         
           * 
           * 
           */
          describe("fullfill random number", function () {
              beforeEach(async function () {
                  await lottery.EnterLottery({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
              })
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
                  //1- will use performupkeep as a mock
                  //2- use fullfillrandomwords as a mock
                  //and will have to wait on the testnet for the `fullfillrandomwords` to be called.
                  //3- since we are on `localchain` and dont have to really wait
                  //but we will `simulate` it as we do need to wait for than event to be called.
                  //4- in order to `simulate` we need to setup a `listener`.and dont want `listener` to be finish
                  //before the test ends.so we will have to create `promise`.
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
