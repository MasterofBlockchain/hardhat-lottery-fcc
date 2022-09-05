/**
 
 * @notice `deploy folder` we will have `00-mock` and `01-deploy`
 *@notice we have written script for `mock` in `00-mock` and we are fetching `00-mock`
 while mentioning `getcontract` in `01-deploy` so `01-deploy` could fetch
  the data of `00-mock`.now `01-deploy` is merged with `00-mock`.
  @read and now when we run ` npx hardhat deploy` data will be fetched from `01-deploy`.    
  * @read if we run `npx hardhat deploy` mock and lottery both accounts get deployed locally.because 
   * fetching data from `01-deploy` .
   * @read if we run `npx hardhat deploy --network goerli` it just deployed `goerli` because it use
   * `if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY)`
   * this above statemtnt to udnerstand if it is locally or testnet.


   *@read there are two types of accounts in ethereum.`contract addresses`which are automatically generated and does not have public and private key.
   * second type of accounts are `user accounts` or `EOA`- (extrenally owner accounts).
   * which are regular accounts and comes with private and public key.
   * @read when we run `npx hardhat node` we are given `EOA` accounts.
   * @read when we run `npx hardhat deploy` we are given `contract accounts.
   * 
   * 
   * @notice about 00-mock and 01-deploy 
   * See, first of all there is an order precedence : 00 and 01.
   * Consequently, our "00 deploy mocks" script is used first by 
   * Hardhat--which essentially deploys our Mock contract.
   * 0nly then is our "01 deploy" is used.
   * 
   * * @notice `VRFCoordinatorV2Mock` is the mock account of "VRFCoordinatorV2Interface".
 * which helps us to get `random number`
 * its script for `deployment` is `00-deploy-mocks.js` in `deploy` folder.
 * when we `deploy` on develempent chain(locally)
 * then `VRFCoordinatorV2Mock` is the contract and script of it for deployment is `00-deploy-mocks.js`
 * @notice `lottery is the contract and script of it for deployment is in `deploy` folder which is
 * ` 01-deploy-lottery.js`




   

 */

const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("2")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2Address, subscriptionId

    if (developmentChains.includes(network.name)) {
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transacctionReceipt = await transactionResponse.wait(1)
        subscriptionId = transacctionReceipt.events[0].args.subId
        //fund the subscription
        //usyally,you would need the real link token a real network.
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }
    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]

    //args filled up
    const args = [
        vrfCoordinatorV2Address,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]
    const lottery = await deploy("lottery", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("verifyiing......")
        await verify(lottery.address, args)
    }
    log("--------------------------------------")
}
module.exports.tags = ["all", "lottery"]
