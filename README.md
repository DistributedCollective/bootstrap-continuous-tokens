# Zero Continuos Token deployment repository

This project is based on [Aragon One Court presale project](https://github.com/aragonone/court-presale) and provides a similar fashion presale and bonding curve based AMM to link two tokens.

## Importante changes and future work

- This contracts were decoupled from Aragon's ENS integration. This means, some contracts are manually deployed and initialized (requiring the system contracts to extend from `UnsafeAragonApp` instead).

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

What things you need to install the software and how to install them

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
# Install proper node version
nvm use
```

Create `.env` file (you can base on [`.env.example`](./.env.example))

### Installing

A step by step series of examples that tell you how to get a development env running

Say what the step will be

```bash
# Install the dependencies
yarn
```

### Generate Types

In order to get contract types you can generate those typings when compiling

```bash
yarn compile
```

## Running the tests

```bash
yarn test
```

### Testing with Waffle

Tests using Waffle are written with Mocha alongside with Chai. 

Is recommended to use Gherkin as a language to describe the test cases

```
describe("Feature: Greeter", () => {
  describe("Scenario: Should return the new greeting once it's changed", () => {
    let greeter: Greeter;
    it("GIVEN a deployed Greeter contract", async () => {
      const factory = await ethers.getContractFactory("Greeter");
      greeter = <Greeter>await factory.deploy("Hello, world!");
      expect(await greeter.greet()).to.equal("Hello, world!");
    });
    it("WHEN greeting message changed", async () => {
      await greeter.setGreeting("Hola, mundo!");
    });
    it("THEN greet returns new greeting message", async () => {
      expect(await greeter.greet()).to.equal("Hola, mundo!");
    });
  });
});
```

We are requiring Chai which is an assertions library. These asserting functions are called "matchers", and the ones we're using here actually come from Waffle.

For more information we suggest reading waffle testing documentation [here](https://hardhat.org/guides/waffle-testing.html#testing).

### Ethereum Security Toolbox

To check the code statically you can use the Ethereum Security Toolbox made by Trail of Bits.

##### Default option

You could just run the default checking executing

`yarn security-default`

##### Flexibile option

Or if you want more flexibility, first execute the command 

`yarn security`

and once inside the docker container run 

```
solc-select 0.4.24
cd project
```

so that you can use the tools there installed.

## Tasks & Deployment

### Custom tasks

There were added some custom `hardhat` tasks to help with the token manipulation and deployment mostly for testing purposes.

```bash
npx hardhat help

initialize                                    initialize bonding curve contracts and set permissions
close-presale                                	closes the presale and let's people to start trading
contribute                                   	buys (during the presale period) some bonded tokens and sends them to the recipient
get-state                                    	returns presale current state
mint-collateral                              	mints some collateral tokens (SOV) and sends them to the recipient address
open-presale                                 	starts the presale
update-presale-date                          	Testing command that updates the mocked presale date to a specific value so state can be changed
open-buy-order                                open a buy order of bonded tokens after presale period
claim-buy-order                               claim a buy order of bonded tokens
open-sell-order                               open a sell order of bonded tokens after presale period
claim-sell-order                              claim a sell order of bonded tokens
```

For example, if the `MockedBalanceRedirect` presale was deployed, the following commands can be executed in order to open, contribute and then close it:

```bash
# Initialize bonding curve contracts and set permissions
npx hardhat initialize --network rskTestnetMocked
# Move forward in time to make the sale open
npx hardhat update-presale-date --span "2 days" --network rskTestnetMocked
# Mint some SOV (collateral)
npx hardhat mint-collateral --network rskTestnetMocked --recipient "0x4D1A9fD1E1e67E83Ffe72Bdd769088d689993E4B" --amount "10000000000000000000000"
# Buy some Zero (bonded)
npx hardhat contribute --network rskTestnetMocked --recipient "0x4D1A9fD1E1e67E83Ffe72Bdd769088d689993E4B" --amount "10000000000000000000000"
# Close the presale
npx hardhat update-presale-date --span "6 weeks" --network rskTestnetMocked
npx hardhat close-presale --network rskTestnetMocked
# Open buy order (buy bonded tokens sending collateral tokens) 
npx hardhat open-buy-order --network rskTestnetMocked --amount "1000"
# Claim buy order (use buy order's batch id)
npx hardhat claim-buy-order --network rskTestnetMocked --batch "229110"
# Open sell order (buy collateral tokens sending bonded tokens) 
npx hardhat open-sell-order --network rskTestnetMocked --amount "1000"
# Claim sell order (use sell order's batch id)
npx hardhat claim-sell-order --network rskTestnetMocked --batch "229120"
```

### Deployment

Use `hardhat.config.ts` to set deployment parameters for each network. Parameters description can be found in such file.

```bash
yarn deploy:dev         # launches a `buidlervm` instance and deploys the contracts    
yarn deploy:dev:fixture      # generates some tokens and assigns them to some hardcoded accounts for testing purposes
yarn deploy:rskdev      # deploys the contracts to a local RSK node
yarn devchain:start     # launches an RSK regtest node. Requires Docker to be installed.
yarn deploy:rskTestnetMocked # deploys to RSK tesnet with mocked Presale Contract so the state can be tweaked
yarn initialize:rskTestnetMocked  #initialize deployed contracts and set permissions
```

## Built With

* [Aragon One Court presale project](https://github.com/aragonone/court-presale)
* [Atix Labs](https://atixlabs.com) template
* [Hardhat](https://hardhat.org/) - Task runner

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## Versioning

We use [SemVer](http://semver.org/) and [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) for versioning. For the versions available, see the [tags on this repository](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/tags).

To create a new release execute the script

`yarn release`

## License

This project is licensed under the MIT License - see the [LICENSE.md](https://github.com/IQAndreas/markdown-licenses) file for details
