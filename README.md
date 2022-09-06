------------------JAVASCRIPT CONSOLE.LOG()--------------------------------------------

# this is how you write `javascript console.log`
# java script console helps you to interact direct with the contract
# example----> npx hardhat console --network localhost
# rest of these two needs to be typed in `terminal` only.
# const contract = await ethers.getContract("lottery")
#  console.log(contract.address)
# BELOW is the eample of terminal.

PS D:\hardhat-lottery-fcc> npx hardhat console --network localhost
Welcome to Node.js v16.6.2.
Type ".help" for more information.
> const contract = await ethers.getContract("lottery")
undefined
> console.log(contract.address)
0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
undefined
>

--------------------------------- SOLIDITY CONSOLE.LOG()----------------------------------
# solidity `console.log` interact within the contract
# it helps us to debug `contarcts` and `tests`.



----------------------------HARDHAT AND LOCAL HOST-------------------------------------

# Wther we deploy on `hardhat`(npx hardhat deploy) on `localhost`(npx hardhat deploy --network local host) we get the same acoounts in both.

# while deployin on ` hardhat` it end the blockchain when its done and has to be restarted.

# on `localhost` it works on `nodes` and if we close `node` it will be stopped and has to restart again while running the `node` again.

# the difference would be is in general we use `hardhat` and for `localhost` we use when we have a couplf of accounts to `test` since its gives us `20` accounts.



-----------------------------00-mocks and 01-deploy-------------------------------

# whenever we run `01-deploy` hardhat will automatically run `00-mock` first. it works in order like `00` and `01` ..

# `01-deploy` use `getContract` to fetch `00-mocks` into `01-deploy` so whenevr we `deploy` it always use `01` wthere its for `local or testnet or mainchain`.


------------------------------------solhint---------------------------------
# helps us to find the error
# helps us to fix the erros



