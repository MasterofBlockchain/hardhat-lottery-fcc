require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()
require("hardhat-deploy")
require("@nomiclabs/hardhat-ethers")

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "https://eth-goerli/example"
const PRIVATE_KEY =
    process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "key"
const LOCAL_HOST_API = process.env.LOCAL_HOST_API || "key"
const COIN_MARKET_CAP_API = process.env.COIN_MARKET_CAP_API || "key"
const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL || "key"
const RINKEBY_PRIVATE_KEY =
    process.env.RINKEBY_PRIVATE_KEY ||
    "0x0000000000000000000000000000000000000000000000000000000000000000"
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || "key"

const POLYGON_PRIVATE_KEY =
    process.env.POLYGON_PRIVATE_KEY ||
    "0x0000000000000000000000000000000000000000000000000000000000000000"
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        goerli: {
            chainId: 5,
            blockConfirmations: 6,
            url: GOERLI_RPC_URL,
            accounts: [PRIVATE_KEY],
        },
    },
    solidity: "0.8.7",
    namedAccounts: {
        deployer: {
            default: 0,
        },
        user: {
            default: 1,
        },
    },
}
