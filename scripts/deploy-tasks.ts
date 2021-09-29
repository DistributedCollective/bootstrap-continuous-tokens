import { task, types,extendEnvironment } from "hardhat/config";


extendEnvironment((hre) => {
  hre.deployTokens = true;
  hre.mockPresale = true;
});

task("deploy-everything", "deploy everything")
.addParam("deploytokens", "Deploy collateral and bonded tokens", true, types.boolean)
.addParam("mockpresale", "Deploy with mocked presale", true, types.boolean)
.setAction(async (taskArgs, hre) => {
  const { deployments} = hre;
  hre.deployTokens = taskArgs.deploytokens as boolean;
  hre.mockPresale = taskArgs.mockpresale as boolean;
  await deployments.run(
      ["everything"]
    );  
  });