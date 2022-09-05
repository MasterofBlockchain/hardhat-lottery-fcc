const { developmentChains } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25") //"0.25"link is the premimum. its the fees in link token.
//it takes the fee to get us Random Number.

const GAS_PRICE_LINK = 1e9 // link per gas
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentChains.includes(network.name)) {
        log("local network detected@ deplyin mocks.....")
        //deploy a mock with name of vrfcoordinatior..
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        log("MOcks Deployed")
        log("------------------------------------------------------------------")
    }
}
module.exports.tags = ["all", "mocks"]
