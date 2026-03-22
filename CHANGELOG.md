## [1.0.3](https://github.com/ExaDev/SysProM/compare/v1.0.2...v1.0.3) (2026-03-22)

### Bug Fixes

* **ci:** set NODE_AUTH_TOKEN to empty for OIDC publishing ([c66bd8f](https://github.com/ExaDev/SysProM/commit/c66bd8fda2b63ad4a22f46e991dd3024ad6ed38f)), closes [semantic-release/npm#1069](https://github.com/semantic-release/npm/issues/1069)

## [1.0.2](https://github.com/ExaDev/SysProM/compare/v1.0.1...v1.0.2) (2026-03-22)

### Bug Fixes

* **ci:** remove registry-url to fix OIDC npm publishing ([8821cc9](https://github.com/ExaDev/SysProM/commit/8821cc96919042bc90a67b49ae8a5b6142d3deff))

## [1.0.1](https://github.com/ExaDev/SysProM/compare/v1.0.0...v1.0.1) (2026-03-22)

### Code Refactoring

* **api:** split task done/undone into separate operations ([ef2a682](https://github.com/ExaDev/SysProM/commit/ef2a6820b6015d0807ff71c6d519e8cda2958145))

## 1.0.0 (2026-03-22)

### Features

* **api:** add conversion and speckit operations, complete unification ([dd73a0d](https://github.com/ExaDev/SysProM/commit/dd73a0d653d9e55dd0d60d3eedf2af81836130ee))
* **api:** add operations for init, task-list, and plan commands ([ab886f3](https://github.com/ExaDev/SysProM/commit/ab886f3b67e18d8286a1f35befab5adf7625674a))
* **cli:** add --option and --selected flags to add command ([02f0cf5](https://github.com/ExaDev/SysProM/commit/02f0cf581bfcbd8f5fb777aa8618a739ab7d9da6))
* **cli:** add command-line tools and schema generator ([f274010](https://github.com/ExaDev/SysProM/commit/f2740102f715405d6f530904a337d675b1215153))
* **cli:** add init, search, check, graph, and rename commands ([e4f77f6](https://github.com/ExaDev/SysProM/commit/e4f77f610f12b6379a32faac975bd1d8c28a19ca))
* **cli:** add plan command for gate checking ([efbd8ef](https://github.com/ExaDev/SysProM/commit/efbd8ef0a58ea85fd3bc48c52e18674ed01fe8d8))
* **cli:** add speckit and task CLI commands ([d62f892](https://github.com/ExaDev/SysProM/commit/d62f8929bba2b30b4e47d812221e418181e5553a))
* **cli:** add timeline and state-at query commands ([6294a02](https://github.com/ExaDev/SysProM/commit/6294a024d53229792c1c73136296faba78117a62))
* **cli:** add unified sysprom bin entry point for npx usage ([d5fa9ec](https://github.com/ExaDev/SysProM/commit/d5fa9ec1b22fc1ad2334eaf6035b2c383affe3a8))
* **cli:** add UX improvements across all commands ([b0d60fd](https://github.com/ExaDev/SysProM/commit/b0d60fdb53691430206dcaa493c0f3350530ff93))
* **cli:** auto-generate node IDs when --id is omitted ([1fd24e8](https://github.com/ExaDev/SysProM/commit/1fd24e89080b705d16e565728a08737876b6b12f))
* **cli:** register speckit and task commands in CLI ([99169aa](https://github.com/ExaDev/SysProM/commit/99169aaeae916bc704c0c63b77b92822e16efa98))
* **cli:** run directly from TypeScript via tsx, add spm alias ([1fa5d3b](https://github.com/ExaDev/SysProM/commit/1fa5d3b05d15c35887f8adf91a849639e02056be))
* **convert:** add JSON ↔ Markdown bidirectional conversion ([3f86a61](https://github.com/ExaDev/SysProM/commit/3f86a6190c404b559176c1d317baa8880da7b5eb))
* **core:** add type definitions and core utilities ([1bca9f5](https://github.com/ExaDev/SysProM/commit/1bca9f5967a16c0c03d38fe6b1dbfd95d8765faf))
* **lib:** add barrel export for programmatic API ([184b09c](https://github.com/ExaDev/SysProM/commit/184b09c3148146386d2c69d2aa3bb7d6dc230dc0))
* **lib:** add I/O utilities module ([9a38ce1](https://github.com/ExaDev/SysProM/commit/9a38ce19767f365a535af5aa7d1ee2f78e5e9655))
* **lib:** add mutation library module ([9b6ac1f](https://github.com/ExaDev/SysProM/commit/9b6ac1fadac327d7bb248b89fb00e79fce0b5866))
* **lib:** add query library module ([5419cc9](https://github.com/ExaDev/SysProM/commit/5419cc939ee42942d1eeafa209f3853c098d6386))
* **lib:** add stats library module ([4ec8f32](https://github.com/ExaDev/SysProM/commit/4ec8f322be594bd5046843d9374a5e6117a57fff))
* **lib:** add validation library module ([6297439](https://github.com/ExaDev/SysProM/commit/6297439a283656f2f02ca52d3c09e878dabef5da))
* **lib:** export plan module from public API ([d4ac72e](https://github.com/ExaDev/SysProM/commit/d4ac72e36d2388bfa8c9172976379e7289200d37))
* **lib:** export speckit module from public API ([e53cf79](https://github.com/ExaDev/SysProM/commit/e53cf796342986a6479752ccaa6f5f0893f4982e))
* **mutate:** add plan task operations for change nodes ([a5a5e07](https://github.com/ExaDev/SysProM/commit/a5a5e075e8ba6e6a4aa2bc52c83b7f6f59188fc3))
* **operations:** add defineOperation infrastructure ([c548574](https://github.com/ExaDev/SysProM/commit/c548574a7da6ae93053d3a36df7ee04ce3a5503d))
* **operations:** define all domain operations with Zod schemas ([dc85dfb](https://github.com/ExaDev/SysProM/commit/dc85dfbc88cdccddbf8194a9d872eb48aef7115b))
* **schema:** add JSON Schema for SysProM document validation ([a32ae96](https://github.com/ExaDev/SysProM/commit/a32ae965f9b7ee80636de86b5dcffc3287ceb01b))
* **schema:** extend lifecycle values to accept ISO date strings ([0a6cdfd](https://github.com/ExaDev/SysProM/commit/0a6cdfd5cbca0fa0617a2dc4c3f57836c757afbc))
* **spec:** add D31 bidirectional sync and CH29 implementation plan ([86f849b](https://github.com/ExaDev/SysProM/commit/86f849b2c336484c0cb399e7bd79e1744ebd074d))
* **spec:** add self-describing SysProM specification ([96a80a4](https://github.com/ExaDev/SysProM/commit/96a80a4033339fd7e06a677284d7fe6e8c16e7ed))
* **speckit:** add bidirectional Spec-Kit file interoperability ([b4f6fd3](https://github.com/ExaDev/SysProM/commit/b4f6fd395b7ea23cee93467db3ac4455bb3a2bf5))
* **speckit:** add plan management module ([9ce47dc](https://github.com/ExaDev/SysProM/commit/9ce47dc6620649e8653c92adc1577337418d3e08))
* **temporal:** add temporal query module ([2e5680c](https://github.com/ExaDev/SysProM/commit/2e5680c3c54026a7a99dc22e33167e9889275f95))

### Bug Fixes

* **ci:** use npx turbo in CI workflow ([d8666cf](https://github.com/ExaDev/SysProM/commit/d8666cff716bb6fc1ebbe5ff868a18f41a2c0526))
* **hooks:** only fail typecheck for errors in staged files ([7862f83](https://github.com/ExaDev/SysProM/commit/7862f838abc806b63c33424636ac4f82e728b70a))
* **json-to-md:** render lifecycle checkboxes correctly for dates and ordering ([4c418be](https://github.com/ExaDev/SysProM/commit/4c418be4bc04a602719e5efcc4f0d5dda337c710))
* **schema:** resolve circular type inference for recursive schemas ([84b71fb](https://github.com/ExaDev/SysProM/commit/84b71fbcb2f1d736516c496219dd4620b125a422))
* **spec:** correct placeholder dates on D1–D3 and regenerate markdown ([06da4d9](https://github.com/ExaDev/SysProM/commit/06da4d97bbb19d0e85f372a94b13781ac03b2eab))
* **speckit:** handle truthy lifecycle values correctly ([c91a7fc](https://github.com/ExaDev/SysProM/commit/c91a7fc8dff859fb444e3edc450939ccb0859ef9))

### Code Refactoring

* **api:** delete original library files, operations are sole impl ([9002a79](https://github.com/ExaDev/SysProM/commit/9002a7976b84f724f224898b521b5e0f3ee7d7b2))
* **cli:** add Zod-driven command definition infrastructure ([2965f20](https://github.com/ExaDev/SysProM/commit/2965f208fd5138d783ed3bcbf685f54a57f3a292))
* **cli:** derive command descriptions from operations ([b9a5597](https://github.com/ExaDev/SysProM/commit/b9a5597393b5743f199a63a25b06dda1bf617e04))
* **cli:** extract shared schemas and helpers ([af2ce8a](https://github.com/ExaDev/SysProM/commit/af2ce8ab794abd7b225a483b1b6e36b74e232425))
* **cli:** make commands thin adapters over operations ([cdb060b](https://github.com/ExaDev/SysProM/commit/cdb060bfd01368c73d5a09917f6546426742aa14))
* **cli:** migrate commands to defineCommand pattern ([1f63b86](https://github.com/ExaDev/SysProM/commit/1f63b8662940937e2e0eae1a3947b12b3899bf75))
* **cli:** migrate to Commander.js ([34951af](https://github.com/ExaDev/SysProM/commit/34951afe90cafe37d78023f01aaa232db1ee2511))
* **cli:** remove type assertions from CLI code ([ca1828d](https://github.com/ExaDev/SysProM/commit/ca1828dc27efd077abfc40eb662d19534924cb0f))
* **cli:** use extractDocs for doc generation instead of reading Commander internals ([4a2b45b](https://github.com/ExaDev/SysProM/commit/4a2b45b8fd5b153454a131627a9758861e41fb26))
* **cli:** use library functions in CLI commands ([56bf7a6](https://github.com/ExaDev/SysProM/commit/56bf7a60fd7e57724d4c2db7c4f0be6be944bdf5))
* **cli:** use shared schemas across all commands ([c6fa662](https://github.com/ExaDev/SysProM/commit/c6fa66215dc0ecee4278d9c2088e25fd0e387a70))
* **lib:** remove type assertions from library code ([85e18a2](https://github.com/ExaDev/SysProM/commit/85e18a2d2cedeb9b514231f78315b367cfa01b50))
* **schema:** replace z.infer type aliases with explicit interfaces ([749d7aa](https://github.com/ExaDev/SysProM/commit/749d7aa422c0d2b16a657bdf30941c7f20f77d89))
* **schema:** revert to z.infer types with typedoc-plugin-zod ([47c048e](https://github.com/ExaDev/SysProM/commit/47c048ed912f3dbf6da27f80828bb1c609f0107c))
* **schema:** unify const and type names to PascalCase ([4f463e8](https://github.com/ExaDev/SysProM/commit/4f463e816e25c73b30b5606406266fdb758ce923))
* **speckit:** implement recursive change model ([9f3ac96](https://github.com/ExaDev/SysProM/commit/9f3ac966cd858062054904fb20b49aac4f64c063))
* **speckit:** use subsystem for tasks generation ([0db4861](https://github.com/ExaDev/SysProM/commit/0db4861fada16e81bf203eb9baf2e2b8b41d4277))
* **speckit:** use subsystem for tasks parsing ([c94baec](https://github.com/ExaDev/SysProM/commit/c94baecb6133521abcf28adc7f04808515724f61))

### Documentation

* add project README with overview and usage ([4085e0a](https://github.com/ExaDev/SysProM/commit/4085e0af9833cee7948eea02b3b2d6a81741c8df))
* add pronunciation to README ([e4ec3dd](https://github.com/ExaDev/SysProM/commit/e4ec3dd1212d207eb0a52893d7274fd2def2f148))
* **api:** add [@param](https://github.com/param) and [@returns](https://github.com/returns) JSDoc tags to all public functions ([10a5342](https://github.com/ExaDev/SysProM/commit/10a53425af26e5a6f9c806378a9d2b8b890d8462))
* **cli:** auto-generate CLI reference from Commander metadata ([685f010](https://github.com/ExaDev/SysProM/commit/685f01072d10f74d604c351ee22bf6c7d9ef3552))
* **readme:** add reminder to keep sysprom.spm.json and SysProM/ in sync ([7ac75e3](https://github.com/ExaDev/SysProM/commit/7ac75e30c5f9a28b5f90560a8f232382696c4c0e))
* **readme:** add Tracking column to comparison table ([9e64606](https://github.com/ExaDev/SysProM/commit/9e64606d157389d9cefcfae13fd37bb7a98ee0c4))
* **readme:** expand comparison table with five additional dimensions ([f7527ab](https://github.com/ExaDev/SysProM/commit/f7527abc015e0f266a3162fd602d69904279405b))
* **readme:** expand self-description section with sync instructions ([f994328](https://github.com/ExaDev/SysProM/commit/f994328c51433879e506ea58e20bbef316d8b32a))
* **readme:** update CLI examples and development scripts ([abaccab](https://github.com/ExaDev/SysProM/commit/abaccab8d4691506c8e9d8a8c9cd1414ee5ae3d9))
* **readme:** update development section with current build commands ([667c017](https://github.com/ExaDev/SysProM/commit/667c017bc7ca1b84cc38bf848c52185ca475204f))
* remove bold formatting from comparison table ([e7533a8](https://github.com/ExaDev/SysProM/commit/e7533a87daf512a5f502be082c60f7ea7403e41b))
* **spec:** add D19 decision and CH17 change for temporal support ([69ec694](https://github.com/ExaDev/SysProM/commit/69ec6949bec6113af5c65631cd1b99def4c13836))
* **spec:** add D20 decision and CH18 change for Commander migration ([6874710](https://github.com/ExaDev/SysProM/commit/6874710310cf20eb9bbfc855a25755968ef87c3e))
* **spec:** add D21/CH19 and D22/CH20 for TypeDoc and Turbo adoption ([faca10a](https://github.com/ExaDev/SysProM/commit/faca10a4f5fbca8d70de227d78d1202459f0eb53))
* **spec:** add D23-D25 and CH21-CH23 for CI, type safety, and dist ([a3c9ba2](https://github.com/ExaDev/SysProM/commit/a3c9ba2bcc0c576df13553c33f926519de4c790f))
* **spec:** add D26/CH24 for auto-ID generation ([921eb33](https://github.com/ExaDev/SysProM/commit/921eb33cb08a5e56fa5eef0e228b599db81e4623))
* **spec:** add D27/CH25 for CLI UX improvements ([1bc2ba5](https://github.com/ExaDev/SysProM/commit/1bc2ba5614aadb0e8b1d52d061f62f5bd8ed9331))
* **spec:** add D29/CH27 for defineOperation unification ([f55db23](https://github.com/ExaDev/SysProM/commit/f55db23fe52ff7215dcc5a0a6712a5e132b382e4))
* **spec:** add remaining unification tasks to CH27 ([686b74e](https://github.com/ExaDev/SysProM/commit/686b74eee449fbc417ce1c56ff7ff67b5f381c88))
* **spec:** mark CH25 complete and regenerate SysProM/ ([a2a2dc1](https://github.com/ExaDev/SysProM/commit/a2a2dc130cfce0418842529b00baaa36a1b0c311))
* **spec:** mark CH27 complete with all 10 tasks done ([92b1d60](https://github.com/ExaDev/SysProM/commit/92b1d60e0b295452e8f2dde672651d4cf421a04d))
* **spec:** record D16 decision and CH14 change for Spec-Kit support ([97a934b](https://github.com/ExaDev/SysProM/commit/97a934b3d3ba0c14fab20f8e428ab4a4032c28cb))
* **spec:** record D28/CH26 for CLI command definition unification ([eff93d4](https://github.com/ExaDev/SysProM/commit/eff93d416720d3e8a1b0277a71b869dd1298c491))
* **spec:** record D30/CH28 for Claude Code plugin ([39dcd69](https://github.com/ExaDev/SysProM/commit/39dcd69420d7270e64c4b7eba88b00e17b703f2e))
* **spec:** record D32/CH30 for MCP server ([2111f45](https://github.com/ExaDev/SysProM/commit/2111f45a401d8b1ad36dd02c8f212fbbdaaad354))
* **spec:** record D33/CH31 for keyed provider registry ([0edb0f9](https://github.com/ExaDev/SysProM/commit/0edb0f93f6a72d0cfbdaea21f30f4ecf2f4acc70))
* **spec:** update self-describing document with new decisions ([e8dee88](https://github.com/ExaDev/SysProM/commit/e8dee8891998069b708c5ace2c64e533c2872a2c))

### Styles

* **lint:** fix all eslint errors in source code ([e490c0a](https://github.com/ExaDev/SysProM/commit/e490c0ad8bcebbd479f8e0ac60770f8d89f0be26))
* **lint:** update test imports and exclude tests from pre-commit lint ([adfa143](https://github.com/ExaDev/SysProM/commit/adfa143f6ce1cd146fce2fbb879ce8691208dc57))

### Tests

* add comprehensive test suite for SysProM ([aad7862](https://github.com/ExaDev/SysProM/commit/aad78625cdc4c01386c0d9c4557da5c850f54f1d))
* **cli:** add task command unit tests ([822b362](https://github.com/ExaDev/SysProM/commit/822b3621599fb858f43c3e1f544019c122bd093b))
* **lib:** add unit tests for library modules ([334e903](https://github.com/ExaDev/SysProM/commit/334e90377d57f95b5700dc8343336b70817f14f1))
* **roundtrip:** add lifecycle date value round-trip test ([6b8b1c3](https://github.com/ExaDev/SysProM/commit/6b8b1c30984eb64c8d5aecc139b841fc52c8f34e))
* **speckit:** add parser and generator unit tests ([2f12562](https://github.com/ExaDev/SysProM/commit/2f12562fe48bba02fea8d37d8d498957346b7dbb))
* **speckit:** add plan module unit tests ([04915b6](https://github.com/ExaDev/SysProM/commit/04915b6f2a502824937e985255caee3b7209532a))
* **speckit:** update generator tests for subsystem ([6c51c20](https://github.com/ExaDev/SysProM/commit/6c51c200520471b9b92318fbb091aa426ae3267c))
* **speckit:** update parser tests for subsystem ([b578873](https://github.com/ExaDev/SysProM/commit/b578873459c7fd31aeac36be968a776e640b9eeb))
* **speckit:** update tests for recursive change model ([4996d3c](https://github.com/ExaDev/SysProM/commit/4996d3c65e959f93ecb5391e155497c3f6fdd618))
* **speckit:** update tests for truthy lifecycle handling ([20b8a92](https://github.com/ExaDev/SysProM/commit/20b8a92fbe3d6dfb49f244e2a39a6c20f621dcaa))
* **temporal:** add full ISO timestamp test coverage ([6eb69b4](https://github.com/ExaDev/SysProM/commit/6eb69b457c05147f85a109749a34ad45b2d97bbc))

### Build System

* **ci:** add commitlint, semantic-release, and husky hooks ([443fdb0](https://github.com/ExaDev/SysProM/commit/443fdb025782b07afc5a0cd7aeaabf6a77f2b550))
* **deps:** add picocolors for CLI output formatting ([a912dea](https://github.com/ExaDev/SysProM/commit/a912deadeae371bac1a77f1afe234d67d2eb6f32))
* **gitignore:** add docs/ to gitignore ([1f33785](https://github.com/ExaDev/SysProM/commit/1f33785435b5305a61835433d34c96b94929550b))
* **lint:** add eslint --fix to pre-commit hook ([ce87717](https://github.com/ExaDev/SysProM/commit/ce87717389340734c12caf807a10f638b71f10aa))
* **lint:** add ESLint with strict type-aware checks ([08a2397](https://github.com/ExaDev/SysProM/commit/08a2397010b9e7e07296c23a2ea6d7424f0d83d7))
* **lint:** add eslint-plugin-prettier with tabs and double quotes ([7bf1f4a](https://github.com/ExaDev/SysProM/commit/7bf1f4a890d410625dd3f6f46a195afd7a5f5e9e))
* **lint:** add turbo task for linting ([bf2455b](https://github.com/ExaDev/SysProM/commit/bf2455b571d37a6f4936262cc361b5db57c28be8))
* **pkg:** use compiled dist for bin and exports ([b88de88](https://github.com/ExaDev/SysProM/commit/b88de8849ee4619291f53a0abba34bfe20aabb48))
* **scripts:** add turbo wrappers for all tasks ([49f455d](https://github.com/ExaDev/SysProM/commit/49f455d9d546b36344ab01ac1e7327661376530d))
* **turbo:** add task orchestration and caching ([8c70cd8](https://github.com/ExaDev/SysProM/commit/8c70cd845cd7c7191d415ba068c38d20cb41eff5))
* **typedoc:** add API documentation generation ([8d02854](https://github.com/ExaDev/SysProM/commit/8d028542fe96188c704c0bba3f1e46cdb30618b9))

### Continuous Integration

* **dependabot:** configure automated dependency updates ([102f078](https://github.com/ExaDev/SysProM/commit/102f078b42db1ee052ba47a94226aba8f92f38c9))
* **github:** add CI workflow with turbo caching and GitHub Pages ([fcbbc7e](https://github.com/ExaDev/SysProM/commit/fcbbc7e18a999254878da27765e12cfa2b2f2e18))
* **release:** publish to npm with provenance and GitHub Packages ([10e55bd](https://github.com/ExaDev/SysProM/commit/10e55bdcf0958d16f1889251a392d7cb59874fa4))

### Miscellaneous Chores

* add .eslintcache to .gitignore ([3b074b9](https://github.com/ExaDev/SysProM/commit/3b074b9f4bdf09dece868a9a685dab13bd9260ed))
* add Claude Code configuration and project rules ([c3be913](https://github.com/ExaDev/SysProM/commit/c3be9131c254b9086c714bb9ced22fbf33ae8aa1))
* initialise project scaffolding ([0a4bcf6](https://github.com/ExaDev/SysProM/commit/0a4bcf6a66da20dd02541c0d1002f400dbff5ac5))
* **pkg:** configure for library publishing ([394c789](https://github.com/ExaDev/SysProM/commit/394c7896e9c63b25e2e38fff400721ed2ec0fada))
* **spec:** update self-describing document with external references ([45a21dd](https://github.com/ExaDev/SysProM/commit/45a21ddee48ccbfff6fb1a14e2e92bb9e29a4aa3))
* **tooling:** add Husky for pre-commit type checking ([6cb857a](https://github.com/ExaDev/SysProM/commit/6cb857ad7bed4315d14fa1800d79dfd181b46efa))
