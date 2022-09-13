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



-----------------------Javascript objects and variables----------------------------

let's say Car is a `object` and its `proprties` are 

`car.name = Fiat, car.model = 500, car.weight = 850kg, car.color = white,`

and its `methods` are -

`car.start(), car.drive(), car.brake(), car.stop()`

2- let `car` = `fiat` 
// `car` is a variable name and `fiat` is its value

3- const car = `{type:"Fiat", model:"500", color:"white"};`
//Objects are variables too. But objects can contain many values.
// `car` is a here a `object` and  has contaning lot of values.
// The name:values pairs in JavaScript objects are called properties:



--------------------------wait.(1)-------------------------------
# its ethers.js functions helps us to get the recipt.
# we can get anynumber of it. number simply means how many block we wnt to mine
# the more the number the more it take to mine.
# good ppractice is to out maxium `2` number.


-----------------------------how contract is gonna work-----------------------------

# we enter lottery
# its gonna hit `keepers` .. they gonna be in `checkup` keep and it will hit `performupkeep`.

# now `performupkeep` will call `vrf`






--------------------DEPLOYED----------------------------------
https://goerli.etherscan.io/address/0x67d000Ab100Cee0224CbF9F71abafD6F45f3E804