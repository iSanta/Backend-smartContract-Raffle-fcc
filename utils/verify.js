const { run } = require("hardhat")

async function verify(contractAddress, args) {
    console.log("Verificando contrato...");
    //run (hardhat) para ejecutar tareas, en este caso una directa del plugin de etherscan
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args
        });
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Contrato ya verificado")
        }
        else {
            console.log(e);
        }
    }

}

module.exports = { verify }
