require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()


const RPC_URL_RINKEBY_INFURA = process.env.RPC_URL_RINKEBY_INFURA
const PRIVATE_KEY_META = process.env.PRIVATE_KEY_META
const RPC_URL_GOERLI_INFURA = process.env.RPC_URL_GOERLI_INFURA

const RPC_URL_RINKEBY_GANACHE = process.env.RPC_URL_RINKEBY_GANACHE
const PRIVATE_KEY_GANACHE = process.env.PRIVATE_KEY_GANACHE
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      chainId: 31337,
    },
    hardhat: {
      chainId: 31337,
      blockConfirmatios: 1
    },
    rinkeby: {
      chainId: 4,
      blockConfirmatios: 6,
      url: RPC_URL_RINKEBY_INFURA,
      accounts: [PRIVATE_KEY_META]
    },
    goerli: {
      chainId: 5,
      blockConfirmatios: 6,
      url: RPC_URL_GOERLI_INFURA,
      accounts: [PRIVATE_KEY_META]
    },
  },
  gasReporter: {
    enabled: false,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    //coinmarketcap: asdasdasd
  },
  solidity: "0.8.7",
  namedAccounts: {
    deployer: {
      default: 0
    },
    player: {
      default: 1
    }
  },
  mocha: {
    timeout: 500000
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};
