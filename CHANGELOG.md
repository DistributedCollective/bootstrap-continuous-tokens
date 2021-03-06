# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.1.0](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/compare/v1.0.2...v1.1.0) (2021-11-08)


### Features

* emergency-remove-from-reserve task and documentation ([12aa1b7](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/12aa1b710f6fc691f53a61e6b6763ef74c8fb0e4))
* improved print-system-info task to show more data about the presale ([9ee2caa](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/9ee2caa268bbff3c470c20870eea6b9228561b88))
* mynt mainnet deployment addresses ([4dd449b](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/4dd449bf7e03bf282c257815e206899e7c21e254))
* mynt production deployment configs ([be35d54](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/be35d54d0c6f2f203d5d3bde5d31e4b71a4c5c54))
* setup of Mynt RSK testnet deployment ([0bfd628](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/0bfd628770c584ab6ad8693abdfc641c7773ac94))
* updated MyntToken address after deployment ([e216281](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/e216281ad26aeea90271534a0b49509dfd434543))


### Bug Fixes

* beneficiaryPercent was being rounded to 15 instead of being 15.75 ([e3222e5](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/e3222e551d667d27364c59ef137401dffebd15b0))
* fixed print-system-info task so it can work with already deployed tokens ([a09a41b](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/a09a41bcf25e41836cca97b3897b3124a34e4e1c))

### [1.0.2](https://sovryn.github.com/swamp-thing-sovryn/zero-continuous-token-presale/compare/v1.0.1...v1.0.2) (2021-11-03)

### [1.0.1](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/compare/v1.0.0...v1.0.1) (2021-11-03)


### Bug Fixes

* added some logs and made it work on some steps were it was failing ([1dc9aff](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/1dc9aff9c2bddf6de153783a540a53da78888f1c))

## [1.0.0](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/compare/v0.0.1-alpha.1...v1.0.0) (2021-11-03)


### Features

* print system info command ([b14586b](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/b14586ba42a82b79f228cd2c8c25a56372f67501))
* **tests:** add revoke buy and sell order permissions and transfer reserve funds tests ([9c8d0d7](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/9c8d0d735937b47ff371629b94cc2155104da0b3))

### [0.0.1-alpha.1](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/compare/v0.0.1-alpha.0...v0.0.1-alpha.1) (2021-10-28)


### Features

* configure ACL in a single transaction ([e39eeff](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/e39eeff2c8224f94e47ae9b84a7f146cbd2f562c))

### 0.0.1-alpha.0 (2021-10-25)


### Features

* add Agent and Vault init ([a6e1889](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/a6e1889257dcf66e8d7a62e73dfdf0f305715bee))
* add buy and sell order tasks ([e1de514](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/e1de5143a46584966398d047dbd835ed53bec050))
* add continuous token and remove token manager ([572a74a](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/572a74a1cf08fd997e2870db2a6a4b22ba41d878))
* add initialize script ([#4](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/issues/4)) ([93bcdf8](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/93bcdf89221b7dd428baae43bcf80920c022b585))
* added ACL configs - WIP ([f8c0881](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/f8c0881a73979223274df476b3a7b6275c769240))
* added dao deployment - still wip ([a4d7da0](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/a4d7da03d5e0bdcea136b9459776fca8efa64dd2))
* added waffleMatchers-deploy-fixtures ([a6225f1](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/a6225f1fb28585a5e42e73f44c569a52efad94b4))
* deploy tokens only local ([952fa28](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/952fa28277f11520b9b494f0b05eb45885ad3238))
* deploy with flags ([14a0f54](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/14a0f545aa4eb1a6a64f4ea4787c3c167e73b54a))
* deployment can be configured to just deploy a single mocked token ([eb303e3](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/eb303e3eadbe0d2c5c6044f8dc1d5ab2b2146821))
* deploys in separate files ([8b7b73f](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/8b7b73f5eaf6792cd7832cb52c13034610052df7))
* rsk deployment & helpers ([40c3603](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/40c36039c51c019ffb1cf8914673b1c5b98c4016))
* set deployment parameters in config ([7a5a25e](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/7a5a25e09b48cb77962988ef01732ec8efd0e4bc))
* set deployment parameters in hre ([509e5ae](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/509e5ae6f2937a2f4f58f965ff43dc023eeb1473))
* **test:**  init bonding curve tests ([3091119](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/3091119b7ce17d877333a5199b62090f966a1e02))
* **test:**  presale  tests ([630c949](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/630c94921419af1c34989cc1ffcc6980cf81d989))
* **test:** market maker tests ([ddccdac](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/ddccdac2bfc1a8e649c610b68d1ae17c130be441))
* **test:** more presale tests ([e69372c](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/e69372c0a9e5a0633212fb99e364454a5c56ba19))
* **test:** openBuyOrder tests ([d0703a2](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/d0703a21943adda10646ca4f3e9a021c3594feb4))
* wip introducing court-presale deployment using hardhat ([0ee86bd](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/0ee86bd3539f72d4d02c8d488f587412cb6e7556))


### Bug Fixes

* custom tasks imports were wrong ([6c361a4](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/6c361a4f21308d092470d3bae2ea12465e696731))
* don't remove console logs on localhost and hardhat environments ([209130f](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/209130f8eb01e1d4991f34b435c21afa4ff93b65))
* downgraded to node 12 as several errors are happening in 14 ([6c5d786](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/6c5d786e6f69d2db86dcb401da1847bf8a2a1eee))
* fixed mocked tokens deployment configuration ([398ddce](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/398ddcee0ae6e33f7b326e7b00c88f52cc995a28))
* fixed solhint errors ([9fa5a4f](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/9fa5a4fada9829fda2e47057378d821d417305b1))
* fixed tests. solidity version was broken ([64c1134](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/64c1134b0b02791012525c1e11072b902f5405d1))
* husky exec permissions ([e4af8ee](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/e4af8ee9f238c72fb7c95a3434d21d25943efde7))
* linting was not working as buidler:check does not return status 1 ([bf253a1](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/bf253a1044b1ebf3ef050dd66608dd4dfbc40a6c))
* remove unused dependency ([6ad7c76](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/6ad7c7650e411efede6942823d03e4a5371fc31b))
* removed some old code left after refactoring ([9e55c15](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/9e55c15c052b25a8dcd449c439e0c0fd722cb10b))
* test replace evm_mine with timeAndMine plugin ([63d9e60](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/63d9e607b841a287ad70679d37db557f1bbe6c99))
* tests fixed ([241cf5c](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/241cf5c315a30f20ed1a74c35d234eae99b236fd))
* use prev version of ethers to avoid unknown ([4c95c63](https://github.com/swamp-thing-sovryn/zero-continuous-token-presale/commit/4c95c6321f77dd208d32bf4154973178cf8c9d5b))
