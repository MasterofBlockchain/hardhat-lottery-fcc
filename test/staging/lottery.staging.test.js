const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery unit testing", function () {
          let lottery, entranceFee, deployer

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              lottery = await ethers.getContract("lottery", deployer)
              entranceFee = await lottery.getEntranceFee()
          })
          describe("fullfillrandomNumber", function () {
              it("works with live chainlink Keeprs and VRF and we get a random winner", async function () {
                  //enter the lottery
                  console.log("settingup the test")
                  const startingTimeStamp = await lottery.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()

                  //setting a listener
                  console.log("setting up listener")
                  await new Promise(async (resolve, reject) => {
                      raffle.once("winnerPIcked", async () => {
                          console.log("winnerPIcked event fired")

                          try {
                              //add out asserts here
                              const recentWinner = await lottery.getRecentWinner()
                              const rafflestate = await lottery.getRaffleState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await lottery.getLatestTimeStamp()

                              await expect(lottery.getNumberOfPlayers(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(rafflestate, 0) //0 @ open , 1 @ calculating
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(getEntranceFee).toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(e)
                          }
                      })
                      //then entering into lottery
                      console.log("entering lottery")
                      const tx = await lottery.EnterLottery({ value: entranceFee })
                      await tx.wait(1)
                      console.log("Ok, time to wait...")
                      const winnerStartingBalance = await accounts[0].getBalance()

                      //this code complete until listener has finished listening
                  })
              })
          })
      })
