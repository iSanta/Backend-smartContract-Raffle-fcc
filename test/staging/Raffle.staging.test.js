const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");

const { developmentChains, networkConfig } = require("../../helper-hardhat-config.js");

developmentChains.includes(network.name) ? describe.skip :
    describe("Raffle", async function () {
        let raffle, raffleEntraceFee, deployer

        beforeEach(async function () {
            deployer = (await getNamedAccounts()).deployer
            raffle = await ethers.getContract("Raffle", deployer)
            raffleEntraceFee = await raffle.getEntranceFee()
        })

        describe("enterRaffle", function () {
            it("emite un evento al entrar un jugador", async function () {
                await expect(raffle.enterRaffle({ value: raffleEntraceFee })).to.emit(raffle, "RaffleEnter")
            })
        })

        describe("fulfillRandomWords", function () {
            it("funciona con Chainlink keepers y vrf y obtenemos a un ganador", async function () {
                const startingTimeStamp = await raffle.getLatestTimeStamp()
                const accounts = await ethers.getSigners()

                await new Promise(async (resolve, reject) => {
                    raffle.once("WinnerPicked", async () => {
                        console.log("El Evento WinnerPicked ha iniciado ")
                        try {
                            const recentWinner = await raffle.getRecentWinner()
                            const raffleState = await raffle.getRaffleState()
                            const winnerEndingBalance = await accounts[0].getBalance()
                            const endingTimeStamp = await raffle.getLatestTimeStamp()

                            //si el array esta vacio deberia hacer reverted
                            await expect(raffle.getPlayer(0)).to.be.reverted
                            assert.equal(recentWinner.toString(), accounts[0].address)
                            assert.equal(raffleState, 0)
                            assert.equal(winnerEndingBalance.toString(), winnerStartingBalance.add(raffleEntraceFee).toString())
                            assert(endingTimeStamp > startingTimeStamp)
                            resolve()

                        } catch (e) {
                            console.log(e)
                            reject(e)
                        }

                    })
                    console.log("antes de hacer el enterRafle ")
                    const tx = await raffle.enterRaffle({ value: raffleEntraceFee })
                    console.log("despues de hacer el enterRafle")
                    await tx.wait(1)
                    console.log("luego del bloque de confirmacion ")
                    const winnerStartingBalance = await accounts[0].getBalance()
                    console.log("luego de obtener el balance del usuario ganador")

                })
            })
        })
    })