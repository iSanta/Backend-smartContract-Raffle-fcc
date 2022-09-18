
const { ethers } = require("hardhat")

const networkConfig = {
    5: {
        name: "goerli",
        ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e", //esto es de chainlink https://docs.chain.link/docs/ethereum-addresses/
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D", // https://docs.chain.link/docs/vrf/v2/supported-networks/
        entraceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // https://docs.chain.link/docs/vrf/v2/supported-networks/
        subscriptionId: "1701",
        callbackGasLimit: "5000000",
        interval: "30"
    },
    31337: {
        name: "hardhat",
        entraceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit: "5000000",
        interval: "30"



    }
}

const developmentChains = ["hardhat", "localhost", "ganache"]
const DECIMALES = 8
const INITIAL_ANSWER = 200000000000
module.exports = {
    networkConfig,
    developmentChains,
    DECIMALES,
    INITIAL_ANSWER,
}