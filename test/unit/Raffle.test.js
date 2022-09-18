const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");

const { developmentChains, networkConfig } = require("../../helper-hardhat-config.js");

!developmentChains.includes(network.name) ? describe.skip :
    describe("Raffle", async function () {
        let raffle, vrfCoordinatorV2Mock, raffleEntraceFee, deployer, raffleInterval
        const chainId = network.config.chainId

        beforeEach(async function () {
            deployer = (await getNamedAccounts()).deployer
            await deployments.fixture(["all"])

            raffle = await ethers.getContract("Raffle", deployer)
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            raffleEntraceFee = await raffle.getEntranceFee()
            raffleInterval = await raffle.getInterval()
        })

        describe("constructor", async function () {
            it("El contrato Raffle inicia correctamente", async function () {
                const raffleState = await raffle.getRaffleState()

                assert.equal(raffleState.toString(), 0)
                assert.equal(raffleInterval.toString(), networkConfig[chainId]["interval"])

            })
        })

        describe("enterRaffle", async function () {
            it("Reverts cuando no se paga lo suficiente", async function () {
                await expect(raffle.enterRaffle()).to.be.revertedWith("Raffle__NotEnoughETHEntered")
            })
            it("Almacena los jugadores cuando entran a la rifa", async function () {
                await raffle.enterRaffle({ value: raffleEntraceFee })
                const playerFromContract = await raffle.getPlayer(0)
                assert.equal(playerFromContract, deployer)
            })
            it("emite un evento al entrar un jugador", async function () {
                await expect(raffle.enterRaffle({ value: raffleEntraceFee })).to.emit(raffle, "RaffleEnter")

            })
            it("no se puede entrar a la rifa si esta esta calculando", async function () {
                await raffle.enterRaffle({ value: raffleEntraceFee })
                await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1])
                await network.provider.send("evm_mine", [])

                await raffle.performUpkeep([])
                await expect(raffle.enterRaffle({ value: raffleEntraceFee })).to.be.revertedWith("Raffle__NotOpen")
            })
        })

        describe("checkUpkeep", async function () {
            it("retorna false si nadie ha enviado dienro", async function () {
                await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1])
                await network.provider.send("evm_mine", [])
                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                assert(!upkeepNeeded)
            })
            it("retorna falso si la rifa no esta open", async function () {
                await raffle.enterRaffle({ value: raffleEntraceFee })
                await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1])
                await network.provider.send("evm_mine", [])
                await raffle.performUpkeep([])
                const raffleState = await raffle.getRaffleState()
                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                assert.equal(raffleState.toString(), "1")
                assert(!upkeepNeeded)


            })
            it("returns false if enough time hasn't passed", async () => {
                await raffle.enterRaffle({ value: raffleEntraceFee })
                await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() - 5]) // use a higher number here if this test fails
                await network.provider.request({ method: "evm_mine", params: [] })
                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                assert(!upkeepNeeded)
            })
            it("returns true if enough time has passed, has players, eth, and is open", async () => {
                await raffle.enterRaffle({ value: raffleEntraceFee })
                await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                assert(upkeepNeeded)
            })

            describe("performUpkeep", async function () {
                it("performUpkeep solo iniciara si checkUpkeep es true", async function () {
                    await raffle.enterRaffle({ value: raffleEntraceFee })
                    await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1])
                    await network.provider.send("evm_mine", [])
                    const tx = await raffle.performUpkeep([])
                    assert(tx)
                })

                it("retorna error si checkUpkeep es falso ", async function () {
                    await expect(raffle.performUpkeep([])).to.be.revertedWith("Raffle__UpkeepNotNeeded")
                })
                it("actualiza el raffle state, emite el evento y llama al vrfCoordinator", async function () {
                    await raffle.enterRaffle({ value: raffleEntraceFee })
                    await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1])
                    await network.provider.send("evm_mine", [])
                    const txResponse = await raffle.performUpkeep([])
                    const txReceipt = await txResponse.wait(1);
                    const requestId = txReceipt.events[1].args.requestId
                    const raffleState = await raffle.getRaffleState()
                    assert(requestId.toNumber() > 0)
                    assert(raffleState.toString() == "1")
                })
            })

            describe("fulfillRandomWords", function () {
                beforeEach(async function () {
                    await raffle.enterRaffle({ value: raffleEntraceFee })
                    await network.provider.send("evm_increaseTime", [raffleInterval.toNumber() + 1])
                    await network.provider.send("evm_mine", [])
                })
                it("fulfillRandomWords solo sera llamado cuando performUpkeep se haya ejecutado", async function () {
                    await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)).to.be.revertedWith("nonexistent request")
                    await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)).to.be.revertedWith("nonexistent request")
                })
                it("elige un ganador, resetea la loteria, envia el dinero al ganador", async function () {
                    const additionalEntrants = 3
                    const startingAccountIndex = 1; //por que la cuenta 0 es la que hace el deploy
                    const accounts = await ethers.getSigners()
                    for (let i = startingAccountIndex; i < startingAccountIndex + additionalEntrants; i++) {
                        const accountConnectedRaffle = raffle.connect(accounts[i])
                        await accountConnectedRaffle.enterRaffle({ value: raffleEntraceFee })
                    }

                    const startingTimeStamp = await raffle.getLatestTimeStamp()


                    await new Promise(async (resolve, reject) => {
                        raffle.once("WinnerPicked", async () => {
                            console.log("found the event")
                            try {
                                const recentWinner = await raffle.getRecentWinner()
                                console.log(recentWinner)
                                console.log(accounts[0].address)
                                console.log(accounts[1].address)
                                console.log(accounts[2].address)
                                console.log(accounts[3].address)
                                const raffleState = await raffle.getRaffleState()
                                const endingTimeStamp = await raffle.getLatestTimeStamp()
                                const numPlayers = await raffle.getNumOfPlayers()
                                const winnerEndingBalance = await accounts[1].getBalance();
                                assert.equal(numPlayers.toString(), "0")
                                assert.equal(raffleState.toString(), "0")
                                assert(endingTimeStamp > startingTimeStamp)

                                assert.equal(winnerEndingBalance.toString(), winnerStartingBalance.add(raffleEntraceFee.mul(additionalEntrants).add(raffleEntraceFee).toString()))
                            } catch (e) {
                                reject(e)
                            }
                            resolve()

                        })
                        const tx = await raffle.performUpkeep([])
                        const txReceipt = await tx.wait(1)
                        const winnerStartingBalance = await accounts[1].getBalance();
                        await vrfCoordinatorV2Mock.fulfillRandomWords(txReceipt.events[1].args.requestId, raffle.address)


                    })
                })
            })
        })
    })