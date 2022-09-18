const { ethers, network } = require("hardhat")
const FRONT_END_ADDRESSES_FILE = "../nextjs-smartcontract-lottery-fcc/constants/contractAddresses.json"
const FRONT_END_ABI_FILE = "../nextjs-smartcontract-lottery-fcc/constants/abi.json"
const fs = require("fs")

require("dotenv").config()
module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        updateContractAddesses()
        updateAbi()
    }
}

async function updateAbi() {
    const raffle = await ethers.getContract("Raffle")
    fs.writeFileSync(FRONT_END_ABI_FILE, raffle.interface.format(ethers.utils.FormatTypes.json))
}

async function updateContractAddesses() {
    const raffle = await ethers.getContract("Raffle")
    const chainId = network.config.chainId.toString()
    const currentAddesses = JSON.parse(fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf8"))
    if (network.config.chainId.toString() in currentAddesses) {
        if (!currentAddesses[chainId].includes(raffle.address)) {
            currentAddesses[chainId].push(raffle.address)
        }
    }
    else {
        currentAddesses[chainId] = [raffle.address]
    }
    fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(currentAddesses))
}

module.exports.tags = ["all", "frontend"]