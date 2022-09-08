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
          describe("checkUpKeeep", function () {
              it("returns false if peole have not sent any eth", async function () {
                  // `+1` explanation-->
                  //Let's says if it's 24 hours(would write in seconds) rather than '30' seconds. So the function will work same way.
                  //It will use '' evm_increaseTime"" to fast forward the given amount of time
                  //(which is mentioned in helper-hardhat) and
                  //start to count from '1'(or any no. Of time we mention here than '1') and execute the function.
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  //we use `callStatic` for stimulation
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([])
                  assert(!upkeepNeeded)
              })
              it("returns false if lottery aint open", async function () {
                  await lottery.EnterLottery({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.send("evm_mine", [])
                  await lottery.performUpkeep([])
                  const lotteryState = await lottery.getRaffleState()
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([])
                  assert.equal(lotteryState.toString(), "1")
                  assert.equal(upkeepNeeded, false)
              })
              //copy from github
              it("returns false if enough time hasn't passed", async () => {
                  await lottery.EnterLottery({ value: entranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() - 5]) // use a higher number here if this test fails
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(!upkeepNeeded)
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
      })
