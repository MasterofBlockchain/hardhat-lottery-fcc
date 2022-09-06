const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery unit testing", async function () {
          let lottery, vrfCoordinatorV2Mock, entranceFee, deployer
          const chainId = network.config.chainId

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              lottery = await ethers.getContract("lottery", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              entranceFee = await lottery.getEntranceFee()
          })

          describe("constructor", async function () {
              it("intlializse the lottery corectly", async function () {
                  const raffleState = await lottery.getRaffleState()
                  const interval = await lottery.getInterval()
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(interval.toString(), networkConfig[chainId]["interval"])
              })
          })
          describe("enterLottery", async function () {
              it("reverts when you dont pay enough", async function () {
                  await expect(lottery.EnterLottery()).to.be.revertedWithCustomError(
                      lottery,
                      "lottery__NotEnoughFUnds"
                  )
              })
              it("record players when they enter", async function () {
                  await lottery.EnterLottery({ value: entranceFee })
                  const playerFromContract = await lottery.GetPlayers(0)
                  assert.equal(playerFromContract, deployer)
              })
              it.only("emits event on Enter", async function () {
                  await expect(lottery.EnterLottery({ value: entranceFee })).to.emit(
                      lottery,
                      "LotteryEnter"
                  )
              })
              it("doest allow us to enter when its calculating", async function () {
                  await lottery.EnterLottery({ value: entranceFee })
              })
          })
      })
