## [1.22.1](https://github.com/ExaDev/SysProM/compare/v1.22.0...v1.22.1) (2026-04-01)

### Documentation

* **sysprom:** record graph-native task lifecycle migration ([3e72d6a](https://github.com/ExaDev/SysProM/commit/3e72d6a59105cd7cfdc33d0d4b6de588260f7bd4))

## [1.22.0](https://github.com/ExaDev/SysProM/compare/v1.21.2...v1.22.0) (2026-04-01)

### Features

* **core:** remove plan-array task model and legacy task command ([d7dee8d](https://github.com/ExaDev/SysProM/commit/d7dee8dbdb59fd000751e49778780959c12fb664))
* **plan:** add lifecycle task transitions and derived blockage status ([006b009](https://github.com/ExaDev/SysProM/commit/006b009937820aa8fbe19de460f756da63d2cd3d))
* **speckit:** model parsed and generated tasks as lifecycle change nodes ([908a297](https://github.com/ExaDev/SysProM/commit/908a29786e13484a37f2d6b39cb1b8008240e9d3))

### Tests

* align fixtures with lifecycle-based task model ([9b66f56](https://github.com/ExaDev/SysProM/commit/9b66f567e9e819118ec8a4e286c085d257287120))

## [1.21.2](https://github.com/ExaDev/SysProM/compare/v1.21.1...v1.21.2) (2026-04-01)

### Build System

* **deps-dev:** bump typescript-eslint from 8.57.1 to 8.57.2 ([8798ecf](https://github.com/ExaDev/SysProM/commit/8798ecf4fbdea0d5066e192c6f2007c3451716ee))
* **deps:** bump @modelcontextprotocol/sdk from 1.27.1 to 1.28.0 ([4f530f0](https://github.com/ExaDev/SysProM/commit/4f530f01770fd8c4aea356a30c52dfd72ba69da8))

### Continuous Integration

* **actions:** bump actions/cache from 4 to 5 ([8a22574](https://github.com/ExaDev/SysProM/commit/8a22574746dd658d2c9548d5391a00b40e232058))
* **actions:** bump actions/checkout from 4 to 6 ([a5e7912](https://github.com/ExaDev/SysProM/commit/a5e7912a8cf70ffe946b0727d3e78b717c2191a8))
* **actions:** bump actions/deploy-pages from 4 to 5 ([611be87](https://github.com/ExaDev/SysProM/commit/611be87f977d4a5e98252fb300e450e05555c21d))
* **actions:** bump actions/upload-pages-artifact from 3 to 4 ([9980620](https://github.com/ExaDev/SysProM/commit/9980620046107f9f83ea29efe9e490f559617d62))
* **actions:** bump pnpm/action-setup from 4 to 5 ([f5f8339](https://github.com/ExaDev/SysProM/commit/f5f83395b656e2e8d4fad1ef0ebafa22743647a5))

## [1.21.1](https://github.com/ExaDev/SysProM/compare/v1.21.0...v1.21.1) (2026-04-01)

### Build System

* **deps-dev:** bump eslint-plugin-jsdoc from 62.8.0 to 62.8.1 ([8049f5d](https://github.com/ExaDev/SysProM/commit/8049f5d803dd6ea1b97f13f10cba27b1f6371c0e))

## [1.21.0](https://github.com/ExaDev/SysProM/compare/v1.20.0...v1.21.0) (2026-04-01)

### Features

* **schema:** support view read-model depends_on links ([7f5d48c](https://github.com/ExaDev/SysProM/commit/7f5d48cf3398c0d97fccdb2406077cabca1bdf26))

### Code Refactoring

* **lifecycle:** infer state exclusively from lifecycle data ([c938b6c](https://github.com/ExaDev/SysProM/commit/c938b6c902c2a59e794664556153f6a494ddd802))
* **schema:** prune unused relationship types from core model ([9b1146b](https://github.com/ExaDev/SysProM/commit/9b1146bce143320de438f373024f20ebece3a621))
* **schema:** remove artefact_flow node type ([ec52247](https://github.com/ExaDev/SysProM/commit/ec52247c61ed05f2ca517abfe04f626d7af0791d))
* **schema:** remove legacy artefact flow input/output fields ([82acf86](https://github.com/ExaDev/SysProM/commit/82acf86a0f793bd803fb2a070f473d4d9e054b67))
* **schema:** remove node status in favour of lifecycle states ([69aec39](https://github.com/ExaDev/SysProM/commit/69aec39b987d4c33109bc175088cbfc3549173a9))
* **schema:** remove version node type and selects relationship ([864d2f4](https://github.com/ExaDev/SysProM/commit/864d2f4ec096176a51e1878be1f08758926d9d36))

### Miscellaneous Chores

* **lint:** fix infer lifecycle test formatting ([ff49f6a](https://github.com/ExaDev/SysProM/commit/ff49f6af61c085262766a269ad90932ea65aae8e))
* **lint:** run eslint --fix on staged json and markdown ([13676aa](https://github.com/ExaDev/SysProM/commit/13676aaa4b3e0cd93d440918b31b51475968fdac))
* **tooling:** run eslint --fix via lint-staged on staged files ([7e745e3](https://github.com/ExaDev/SysProM/commit/7e745e3844c6a0483af22ebdd0e6be59fb52e45a))

## [1.20.0](https://github.com/ExaDev/SysProM/compare/v1.19.0...v1.20.0) (2026-04-01)

### Features

* add orchestrates relationship type ([09079f1](https://github.com/ExaDev/SysProM/commit/09079f1f078f15d082f3467db29fd08c00152090))

### Tests

* format orchestrates invalid endpoints ([5f90c83](https://github.com/ExaDev/SysProM/commit/5f90c83c2b5c65cd05cc1244f7c7cd733a30377b))

## [1.19.0](https://github.com/ExaDev/SysProM/compare/v1.18.0...v1.19.0) (2026-03-31)

### Features

* **core:** broaden provenance endpoint validation ([2119ea2](https://github.com/ExaDev/SysProM/commit/2119ea22fb1ee78b7ca77f3cac5382dc469b8944))

### Documentation

* **readme:** add system provenance profile guidance ([e56dc57](https://github.com/ExaDev/SysProM/commit/e56dc570f510dc9b540c673e6f05ce75b9635d06))
* remove hardcoded README values ([ddbc787](https://github.com/ExaDev/SysProM/commit/ddbc7871322a77822df449a97ab9365dd653df5e))

### Tests

* format validate unit test ([12c0552](https://github.com/ExaDev/SysProM/commit/12c055263076e5cc463dc4fd7280a9624fcd60c9))

## [1.18.0](https://github.com/ExaDev/SysProM/compare/v1.17.0...v1.18.0) (2026-03-31)

### Features

* add justifies relationship type ([766b222](https://github.com/ExaDev/SysProM/commit/766b222f0080514850736a4a7e06729e8f4554f4))
* expand applies_to to target invariants ([b95ffef](https://github.com/ExaDev/SysProM/commit/b95ffef04f5e4987b117a7f271ad15fd115116b2))
* expand consumes to accept role sources ([d2325db](https://github.com/ExaDev/SysProM/commit/d2325db46b4c6386b26563d9cf9a1bdacbc6f7fc))
* expand governed_by to accept artefact sources ([6d1b594](https://github.com/ExaDev/SysProM/commit/6d1b594650f3453d061a6cab058c32c3031815d0))
* expand performs to target stages ([badd3e8](https://github.com/ExaDev/SysProM/commit/badd3e8bda514ce16273756669133d30812c36b6))
* expand produces for concept-to-concept causation ([dc4c72b](https://github.com/ExaDev/SysProM/commit/dc4c72b3a0f67d43e46913fbdb76e0017f624cf2))
* expand realises endpoint types ([8483047](https://github.com/ExaDev/SysProM/commit/8483047b228a52436548860430b5de764a253c1a))
* **graph:** add graph rendering and diagram export ([f9cc575](https://github.com/ExaDev/SysProM/commit/f9cc575aa2c53a46b739f3ab4d7dd6ffe3eb3a20))

### Bug Fixes

* add justifies and influence to schema test coverage, correct comment ([79b6e9f](https://github.com/ExaDev/SysProM/commit/79b6e9f919163f3d060efb4d08e4d922c1ffeec5))
* **cli/graph:** pass all required options to graphOp ([3650328](https://github.com/ExaDev/SysProM/commit/3650328e90c20c632b27b7312d89a402f494b228))

### Code Refactoring

* **cli:** simplify command schema definitions ([1ad0f2a](https://github.com/ExaDev/SysProM/commit/1ad0f2a7c0f0f72ec57d15384468fdf30331d6e9))
* **schema:** extract reusable schema guard helper ([204465f](https://github.com/ExaDev/SysProM/commit/204465f366b873eae0a5c9a13460c2d0d7ab5f8e))

### Documentation

* record endpoint expansion decision in self-describing document ([f92dc10](https://github.com/ExaDev/SysProM/commit/f92dc104e9593b361286d289a808e4645a1931e8))
* **sysprom:** sync generated documentation and workspace ([de866ec](https://github.com/ExaDev/SysProM/commit/de866ecd3a5af247f15b8871d58ff887435e5395))

### Miscellaneous Chores

* add pre-push hook to validate with turbo ([e8a3981](https://github.com/ExaDev/SysProM/commit/e8a3981f5b899a5df6ce21f0027e7250e28b025d))
* **lint:** update tooling and resolve eslint failures ([137684a](https://github.com/ExaDev/SysProM/commit/137684a427de9ce5840d448c65268a5a31759265))
* **plugin:** refresh Claude integration assets ([7590639](https://github.com/ExaDev/SysProM/commit/7590639306a548ae975d7130505f9f7bc0f432db))

## [1.17.0](https://github.com/ExaDev/SysProM/compare/v1.16.1...v1.17.0) (2026-03-31)

### Features

- **io:** add error handling with validation and extraction ([db6f730](https://github.com/ExaDev/SysProM/commit/db6f730c0cda882639623df4563525cfeaa07668))
- **linting:** integrate SonarJS ESLint plugin ([628a65b](https://github.com/ExaDev/SysProM/commit/628a65be02d243342a75a5acdc54de77621ddbef))
- **mcp:** add error handling with causes to all tools ([72eb312](https://github.com/ExaDev/SysProM/commit/72eb312f3fc3dfc5c7288d88f37918c7fb54fc04))

### Bug Fixes

- **cli/add:** resolve type safety with narrowing instead of assertions ([d278e7a](https://github.com/ExaDev/SysProM/commit/d278e7a469def73882a7dbc6433214628096b26d))
- **hooks:** fail pre-commit on unfixable eslint errors ([abc9386](https://github.com/ExaDev/SysProM/commit/abc9386bb97f3e0c8c9b0a57a27b17638216a012))

### Code Refactoring

- **cli/add:** extract buildNodeFromOpts helper ([d4eec7d](https://github.com/ExaDev/SysProM/commit/d4eec7da8bd110f29308d3ed469bcb28a8aa95f8))
- **cli/infer:** extract helpers and remove nested templates ([b753c37](https://github.com/ExaDev/SysProM/commit/b753c37e43ace5f96c41c5d0c753b3957e3338cf))
- **cli/query:** split printNode into separate functions ([aca38f7](https://github.com/ExaDev/SysProM/commit/aca38f7174ba838765a5161d17f95346aa67c1de))
- **cli/speckit:** extract validation and display helpers ([36d17d7](https://github.com/ExaDev/SysProM/commit/36d17d7e45599d285c41e0693daad495335ab822))
- **cli/stats:** add explicit sort comparators ([eed16d3](https://github.com/ExaDev/SysProM/commit/eed16d394482e65cc3b51ac49bc9d6394e23d99f))
- **cli/update:** extract parseLifecycleFields helper ([25819ef](https://github.com/ExaDev/SysProM/commit/25819efb2d0f5cb0b88a57de3eda143739552c99))

### Documentation

- add npm and GitHub badges to README header ([b7a996f](https://github.com/ExaDev/SysProM/commit/b7a996fb41d6260c960aaf3f25e4dbbe212b5811))

## [1.16.1](https://github.com/ExaDev/SysProM/compare/v1.16.0...v1.16.1) (2026-03-24)

### Documentation

- remove CLI docs from TypeDoc projectDocuments ([42e974b](https://github.com/ExaDev/SysProM/commit/42e974bf15fcf7f76e4d3ec817c935a02b88f872))

## [1.16.0](https://github.com/ExaDev/SysProM/compare/v1.15.0...v1.16.0) (2026-03-23)

### Features

- **api,tests:** export CHG40 operations and add bidirectional impact tests ([734a7af](https://github.com/ExaDev/SysProM/commit/734a7afda254c20f05b14f45dff59d4a9202236e))
- **ops:** implement bidirectional impact analysis and hotspot detection (CHG40) ([dc23e3d](https://github.com/ExaDev/SysProM/commit/dc23e3d31b9269f594e997ec9eff71e41a1e2252))
- **schema:** add ImpactPolarity enum and polarity/strength/influence for CHG40 ([b63bb32](https://github.com/ExaDev/SysProM/commit/b63bb32e117da3d23a483a3b89d243472c72450e))

### Code Refactoring

- **CHG40:** add CLI flags and MCP support for bidirectional impact analysis ([7788d3e](https://github.com/ExaDev/SysProM/commit/7788d3e035dbece39aa0b2a83b0a84749fc6b405))

### Documentation

- resolve TypeDoc warnings with module-qualified link references ([ce8ca98](https://github.com/ExaDev/SysProM/commit/ce8ca98fa5db2360cfb2a78edd14bef4a75d82ff))
- **spm:** assign lifecycle status to changes CHG1-CHG15, CHG35-CHG38 ([f8e52f8](https://github.com/ExaDev/SysProM/commit/f8e52f8749bbbaf8582e727fcb15ef8c955e01a6))
- **spm:** rename .spm to .SysProM, add DEC42 and CHG40 for enhanced impact analysis ([0439e39](https://github.com/ExaDev/SysProM/commit/0439e394ca0407cf25582eb0db4592e579b56013))

### Tests

- fix json-to-md tests to reference .SysProM.json instead of .spm.json ([6bbc561](https://github.com/ExaDev/SysProM/commit/6bbc561203de3e9f47316ee995e6a31ff4f97af9))

## [1.15.0](https://github.com/ExaDev/SysProM/compare/v1.14.0...v1.15.0) (2026-03-23)

### Features

- **cli:** add infer command with subcommands ([e402944](https://github.com/ExaDev/SysProM/commit/e402944920ed1e8ac4b0790d761b7b2da9e5568d))
- **mcp:** add inference tools to MCP server ([93ab7c0](https://github.com/ExaDev/SysProM/commit/93ab7c09d97e49cfb56e60816784c6ede9f9cf5a))
- **ops:** add deterministic graph inference operations ([96ae4c7](https://github.com/ExaDev/SysProM/commit/96ae4c78d69661d80e3a09766feac5f3ccad15a2))

### Documentation

- **spm:** add DEC41 and CHG39 for deterministic graph inference ([e6e13f5](https://github.com/ExaDev/SysProM/commit/e6e13f5effd34613a155b63e2f2d695cec86bdc2))
- **spm:** add DEC41 and CHG39 for deterministic graph inference ([7a8a5c6](https://github.com/ExaDev/SysProM/commit/7a8a5c6e9f77827a9b85189bc4fe992dcb23258c))
- **spm:** add inference operations to README and public API ([3a1fa42](https://github.com/ExaDev/SysProM/commit/3a1fa421292b245458db764d33f837cb17db7ac6))

## [1.14.0](https://github.com/ExaDev/SysProM/compare/v1.13.2...v1.14.0) (2026-03-23)

### Features

- **cli:** case-insensitive file resolution with two-phase matching ([dd28e63](https://github.com/ExaDev/SysProM/commit/dd28e63c06867a8a1347a7ff8933f0fb6c724dd4))
- **md:** hyperlink node IDs in markdown output ([54dde87](https://github.com/ExaDev/SysProM/commit/54dde87ad3f568392a6cf128c70593cb64320ea4))

### Bug Fixes

- **cli:** detect case-variant collisions in Phase 1 of file resolution ([c8bca3b](https://github.com/ExaDev/SysProM/commit/c8bca3ba55587f265f7451c916a0e51d3a5e378f))
- **cli:** prevent path suffix doubling in init command ([3ba18fa](https://github.com/ExaDev/SysProM/commit/3ba18fa7bc9b12d44da771bc251298549a58bbfc))
- **mcp:** persist changes to disk in write operations ([b1f400c](https://github.com/ExaDev/SysProM/commit/b1f400c938c37122becaff5423d9aa1e56895048))
- **test:** replace hardcoded project root with import.meta.dirname ([a9e4ff7](https://github.com/ExaDev/SysProM/commit/a9e4ff7577ecfb273daa8b81d468e387a7f10372))

### Code Refactoring

- **docs:** update command examples to prefer sysprom over spm ([65598b5](https://github.com/ExaDev/SysProM/commit/65598b5f3bdbc24de5e5de8a156659eed536755e))
- update default file/folder naming to .SysProM._ with .spm._ fallback ([db7b843](https://github.com/ExaDev/SysProM/commit/db7b843d82c690a0a61c7a3c8e4f745a84681a59))

### Documentation

- add MCP server section to README ([f0b257a](https://github.com/ExaDev/SysProM/commit/f0b257a1aa51be8041031558931f0be29339a02b))
- **spm:** regenerate markdown with hyperlinked node references ([b965483](https://github.com/ExaDev/SysProM/commit/b9654835f4689bd485ccb7c2a2d3af210095064a))

### Tests

- **md:** add hyperlink tests for single-file and multi-doc modes ([bb992fa](https://github.com/ExaDev/SysProM/commit/bb992fa241ac87f884ef35f04a6d87b4f128ac9e))

## [1.13.2](https://github.com/ExaDev/SysProM/compare/v1.13.1...v1.13.2) (2026-03-23)

### Code Refactoring

- **cli:** convert file-path positional args to flags (DEC38/CHG36) ([34575c4](https://github.com/ExaDev/SysProM/commit/34575c4665527e5a2edcfe5d64ce7c5376b512fc))

### Documentation

- **CHG36:** update skills and CLAUDE.md for flag-based CLI ([8c9f225](https://github.com/ExaDev/SysProM/commit/8c9f22546f9c3df280ae72406614feeb9fb50388))

## [1.13.1](https://github.com/ExaDev/SysProM/compare/v1.13.0...v1.13.1) (2026-03-23)

### Bug Fixes

- **cli:** resolve package.json at runtime to fix ERR_MODULE_NOT_FOUND ([d9e3582](https://github.com/ExaDev/SysProM/commit/d9e358297c8d590b30b7783076f591ee7a27338d))

## [1.13.0](https://github.com/ExaDev/SysProM/compare/v1.12.0...v1.13.0) (2026-03-23)

### Features

- **schema:** normalise ID prefixes to 3-4 chars and add Zod refinement ([a6f786d](https://github.com/ExaDev/SysProM/commit/a6f786d09b4e5495cbcd196395628c16cdb1f758))

### Bug Fixes

- **dx:** include valid options in error messages ([db706ec](https://github.com/ExaDev/SysProM/commit/db706eceb074cbfe5b1cd31c6782d26e10822607))
- **update-node:** use NodeBase.partial() for Zod 4 compatibility ([e825497](https://github.com/ExaDev/SysProM/commit/e825497f20e05468ee79f7f2c5bd1f731b47df42))

### Tests

- **schema:** add node ID prefix validation tests ([07d0acc](https://github.com/ExaDev/SysProM/commit/07d0accf87bac028dd08d7e2d3f46f6ccfb7891b))
- update all test IDs to new prefix convention ([3c07cce](https://github.com/ExaDev/SysProM/commit/3c07cce0341dbb7458496b04b1b735ce20cb03f3))

### Miscellaneous Chores

- **spm:** rename all node IDs to new 3-4 char prefix convention ([e1118d8](https://github.com/ExaDev/SysProM/commit/e1118d8226e4c39c19f36ac22f5c3df22d28a5e2))

## [1.12.0](https://github.com/ExaDev/SysProM/compare/v1.11.0...v1.12.0) (2026-03-23)

### Features

- **plugin:** register commands directory in plugin manifest ([e5edbfe](https://github.com/ExaDev/SysProM/commit/e5edbfe8d462c98d334555a2a9dc8c2aa1c73bab))
- **skills:** add discover-system and audit-system skills and commands ([7515f04](https://github.com/ExaDev/SysProM/commit/7515f04f6f7562824797c61c2b3b20325fc7af02))

## [1.11.0](https://github.com/ExaDev/SysProM/compare/v1.10.2...v1.11.0) (2026-03-23)

### Features

- **add-node:** require decisionId when adding change nodes (INV2) ([8bd2cad](https://github.com/ExaDev/SysProM/commit/8bd2cada154ea22f70464471be7789f95b1fc8bb))
- **add-node:** require elementId for realisations (INV10) and governedById for gates (INV8) ([bec6764](https://github.com/ExaDev/SysProM/commit/bec6764d5b19d45732afd1998fbf67f63bff3cab))

## [1.10.2](https://github.com/ExaDev/SysProM/compare/v1.10.1...v1.10.2) (2026-03-23)

### Bug Fixes

- **cli:** read version from package.json instead of hardcoded constant ([1380114](https://github.com/ExaDev/SysProM/commit/1380114f203348d1b0973092ba69b59c180ad34d))
- **plugin:** use strict:true with plugin.json for MCP discovery ([ebe59d9](https://github.com/ExaDev/SysProM/commit/ebe59d9528523892ac9292e65ac0356450068bf2))
- **skills:** update command syntax to proper markdown bash blocks ([e7a2be2](https://github.com/ExaDev/SysProM/commit/e7a2be21865c83c80950efe8d2d3387d3872079b))
- **spm:** add decision D37 and implements relationship for CH35 ([263c052](https://github.com/ExaDev/SysProM/commit/263c052904619dbefd5cdaa020a43001cdbbf397))

### Miscellaneous Chores

- **spm:** add CH35 - Add YAML Support and Multi-File JSON Formats ([ae5281f](https://github.com/ExaDev/SysProM/commit/ae5281fa7d968deaa622671a12874274a90cfe4f))

## [1.10.1](https://github.com/ExaDev/SysProM/compare/v1.10.0...v1.10.1) (2026-03-22)

### Bug Fixes

- **ci:** add missing \_docs:api:html npm script ([82839d5](https://github.com/ExaDev/SysProM/commit/82839d51bd570600130c0832ae6054b24661816c))

## [1.10.0](https://github.com/ExaDev/SysProM/compare/v1.9.3...v1.10.0) (2026-03-22)

### Features

- **cli:** add mcp subcommand for reliable MCP server invocation ([46e779b](https://github.com/ExaDev/SysProM/commit/46e779b1892de70d367ccc6cbf516cb84caaf496))

## [1.9.3](https://github.com/ExaDev/SysProM/compare/v1.9.2...v1.9.3) (2026-03-22)

### Code Refactoring

- **plugin:** split into skills and MCP server plugins ([97d333d](https://github.com/ExaDev/SysProM/commit/97d333d63cb4d5c1e20f9f3a77fcf6d2b8a8b44d))

## [1.9.2](https://github.com/ExaDev/SysProM/compare/v1.9.1...v1.9.2) (2026-03-22)

### Bug Fixes

- **plugin:** use correct npm package name for MCP server ([dfaa44d](https://github.com/ExaDev/SysProM/commit/dfaa44dd6d71b30ddcb57ade26ed6ae74fd72b6e))

## [1.9.1](https://github.com/ExaDev/SysProM/compare/v1.9.0...v1.9.1) (2026-03-22)

### Bug Fixes

- **plugin:** use './' for relative source path in marketplace.json ([b7b7001](https://github.com/ExaDev/SysProM/commit/b7b7001f8eb991832646bc9bfa66b6928a12f214))

## [1.9.0](https://github.com/ExaDev/SysProM/compare/v1.8.0...v1.9.0) (2026-03-22)

### Features

- **plugin:** add 28 SysProM skills for Claude Code ([f91c880](https://github.com/ExaDev/SysProM/commit/f91c880d5bc591aa0d9461eaab2f854c19c42a5a))
- **plugin:** add marketplace.json for plugin distribution ([1d6efeb](https://github.com/ExaDev/SysProM/commit/1d6efebdbca65a02cd70c89b2296d4cd75f962e9))

### Documentation

- **plugin:** add marketplace install and skill reference to README ([316a139](https://github.com/ExaDev/SysProM/commit/316a139f697203ddcf80d23264c4b383808c0b55))
- **sysprom:** mark CH28 as introduced and update plan ([364270d](https://github.com/ExaDev/SysProM/commit/364270dca70776115fbf93ee69ac24275ca8fb60))

### Build System

- **plugin:** add marketplace version bump script ([cb33e95](https://github.com/ExaDev/SysProM/commit/cb33e95b67c7bc95e7280364ffc0aed367af22ea))
- **release:** bump marketplace version on release ([273323b](https://github.com/ExaDev/SysProM/commit/273323b95fe59d1b685be2cb2dfb8b1a326998bd))

## [1.8.0](https://github.com/ExaDev/SysProM/compare/v1.7.1...v1.8.0) (2026-03-22)

### Features

- **CH32:** expose safe graph removal flags in remove CLI command ([24910e5](https://github.com/ExaDev/SysProM/commit/24910e564fb1952959d093b2c8eeac582437d79b))
- **eslint:** add no-pointless-reassignments rule ([8f027d7](https://github.com/ExaDev/SysProM/commit/8f027d7b7fbdc75b4a9e6db555810a8727d3b40e))

## [1.7.1](https://github.com/ExaDev/SysProM/compare/v1.7.0...v1.7.1) (2026-03-22)

### Bug Fixes

- resolve linting violations in src/ ([7f4c2c7](https://github.com/ExaDev/SysProM/commit/7f4c2c7952d7539958a3cd1a42c0804332530a0c))

### Documentation

- **sysprom:** record CH30 completion and sync document ([79be820](https://github.com/ExaDev/SysProM/commit/79be820400c38e31621523f79af6aaddbce19533))

### Miscellaneous Chores

- **eslint:** disable type-safety rules in test files ([df150ba](https://github.com/ExaDev/SysProM/commit/df150ba494ed5a72af17ec4f191e3e22f2eb1404))

## [1.7.0](https://github.com/ExaDev/SysProM/compare/v1.6.0...v1.7.0) (2026-03-22)

### Features

- **mcp:** implement Model Context Protocol server wrapping SysProM ([a372acb](https://github.com/ExaDev/SysProM/commit/a372acbe4729b21055f113acc64bf342f2a67a8d))

### Miscellaneous Chores

- **deps:** update get-tsconfig to 4.13.7 ([4fac0fe](https://github.com/ExaDev/SysProM/commit/4fac0feaef0d76723b4866f0f5145553f0d04d4c))
- **eslint:** disallow all eslint directive comments ([fd52b1d](https://github.com/ExaDev/SysProM/commit/fd52b1dc5869d0b2901ca9833588b73461e33bd6))
- **eslint:** upgrade to @eslint-community/eslint-plugin-eslint-comments v4.7.1 ([43d2ac8](https://github.com/ExaDev/SysProM/commit/43d2ac8c7a70b9fb8162cb540cf9e4919bd794d8))

## [1.6.0](https://github.com/ExaDev/SysProM/compare/v1.5.0...v1.6.0) (2026-03-22)

### Features

- **cli:** register sync command in CLI ([92791b5](https://github.com/ExaDev/SysProM/commit/92791b51a349792e32d3bf857b43627501d07f93))
- **sync:** implement bidirectional synchronisation command ([a6b24db](https://github.com/ExaDev/SysProM/commit/a6b24db221cf2fcdab497e1173995d74fa039c08))

### Bug Fixes

- **md2json:** preserve multi-line text arrays and $schema in round-trip ([3c20de8](https://github.com/ExaDev/SysProM/commit/3c20de8d0fe607290a538069b7785f2e8244e77f))
- restore sysprom document integrity and mark CH29 tasks complete ([901ecf1](https://github.com/ExaDev/SysProM/commit/901ecf111aaef7a5b30dfd777e8f31a3da0b7ae6))

### Documentation

- **sysprom:** sync CH29 status to introduced ([32a6ede](https://github.com/ExaDev/SysProM/commit/32a6edeedadda75e85c31f0f8f09e2315531f5cd))

### Miscellaneous Chores

- **sysproM:** mark CH29 complete and sync markdown ([06722c3](https://github.com/ExaDev/SysProM/commit/06722c39b8b2a7de4eb019649a70fb54f7bb7905))

## [1.5.0](https://github.com/ExaDev/SysProM/compare/v1.4.0...v1.5.0) (2026-03-22)

### Features

- **CH29:** implement bidirectional sync detection and operation ([5f9cbd9](https://github.com/ExaDev/SysProM/commit/5f9cbd99549530a06bcd19917a75760b4d822912))

### Documentation

- **CH29:** mark conflict detection and sync operation as complete ([1ecc889](https://github.com/ExaDev/SysProM/commit/1ecc8897be2a5b203928043ed115a199e34a4940))

## [1.4.0](https://github.com/ExaDev/SysProM/compare/v1.3.0...v1.4.0) (2026-03-22)

### Features

- **CH32:** implement soft/hard delete and chain repair ([e5a36e8](https://github.com/ExaDev/SysProM/commit/e5a36e8153a43297f3acbb4e3a617f0afb8b6400))

### Documentation

- **CH32:** mark safe graph removal as complete ([bf4769d](https://github.com/ExaDev/SysProM/commit/bf4769de94d234fe6508a21f9f66b61b0765cf09))

## [1.3.0](https://github.com/ExaDev/SysProM/compare/v1.2.6...v1.3.0) (2026-03-22)

### Features

- **ch32:** implement safe graph removal with cleanup ([885a0c2](https://github.com/ExaDev/SysProM/commit/885a0c2ed120311fc2a39debcb2a5b93bdc92745))
- **ch33:** implement graph mutation safety guards ([266b8f3](https://github.com/ExaDev/SysProM/commit/266b8f3d27113561aa386f5646361c2a0479c3eb))
- **ch33:** refine endpoint type validation and update sysprom ([f760a72](https://github.com/ExaDev/SysProM/commit/f760a7233c9b4aadfc31756af8ef7f049e23b62e))

### Tests

- **ch32:** add comprehensive safe removal test suite ([1629308](https://github.com/ExaDev/SysProM/commit/162930870f096f0273d01fdaea86309aa3c8f152))

### Miscellaneous Chores

- update sysprom for ch32 progress ([718f70d](https://github.com/ExaDev/SysProM/commit/718f70d3c6773062a58936f12c099bdca0db2d91))

## [1.2.6](https://github.com/ExaDev/SysProM/compare/v1.2.5...v1.2.6) (2026-03-22)

### Documentation

- **typedoc:** configure folder-based sidebar navigation ([f850db7](https://github.com/ExaDev/SysProM/commit/f850db71319deef873254089f7d24b6706176491))
- **typedoc:** use expand entry point strategy for folder-based organisation ([628d82a](https://github.com/ExaDev/SysProM/commit/628d82aa07433c3c398e61258a0974501b9d63b1))

### Miscellaneous Chores

- **typedoc:** consolidate into single typedoc.json config ([7b26214](https://github.com/ExaDev/SysProM/commit/7b262143627478315d8372cb70798435f81233af))

## [1.2.5](https://github.com/ExaDev/SysProM/compare/v1.2.4...v1.2.5) (2026-03-22)

### Documentation

- **readme:** convert comparison table to HTML with colspan band headers ([10baf07](https://github.com/ExaDev/SysProM/commit/10baf07e5991ed7f121e0d649afae113a26f6e94))

## [1.2.4](https://github.com/ExaDev/SysProM/compare/v1.2.3...v1.2.4) (2026-03-22)

### Miscellaneous Chores

- **lint:** promote all jsdoc rules from warn to error ([5ac7fa4](https://github.com/ExaDev/SysProM/commit/5ac7fa49628e168bc6bb5d5d412a08524a7e4503))

## [1.2.3](https://github.com/ExaDev/SysProM/compare/v1.2.2...v1.2.3) (2026-03-22)

### Documentation

- **jsdoc:** fix informative-docs and match-description warnings in plan ([daa1daf](https://github.com/ExaDev/SysProM/commit/daa1daf10e7f0f317fb3b61cf42eff0fe6c5b593))
- **readme:** add BDD (Gherkin) and Taskmaster to comparison table ([4366aa8](https://github.com/ExaDev/SysProM/commit/4366aa8f10a986e0d6a3fe3c8bfdf3c9e7aa283e))
- **readme:** reorder table rows and columns for logical grouping ([da4c6da](https://github.com/ExaDev/SysProM/commit/da4c6da7bb19d33ea2990e79b40ca8c7d8b1d825))

### Miscellaneous Chores

- **lint:** add jsdoc contents, logical, and stylistic presets ([193601b](https://github.com/ExaDev/SysProM/commit/193601b96cfac9f998f40e9642a55706b4438490))

## [1.2.2](https://github.com/ExaDev/SysProM/compare/v1.2.1...v1.2.2) (2026-03-22)

### Documentation

- **jsdoc:** add [@example](https://github.com/example) tags to CLI functions ([e5198fc](https://github.com/ExaDev/SysProM/commit/e5198fc6e2f9c909037677370ce17b5d931b4e0f))
- **jsdoc:** add [@example](https://github.com/example) tags to conversion functions ([726ac35](https://github.com/ExaDev/SysProM/commit/726ac354de2fd6a18490bb53f909393028f26a68))
- **jsdoc:** add [@example](https://github.com/example) tags to core modules ([9c7f84c](https://github.com/ExaDev/SysProM/commit/9c7f84c65473b972b17343f9dd63bc70a9a587b8))
- **jsdoc:** add [@example](https://github.com/example) tags to speckit library functions ([f405c46](https://github.com/ExaDev/SysProM/commit/f405c461e82edff67b733f94c33407dc2ac9f70f))
- **readme:** add GSD-2, Kiro, cc-sdd, and Ouroboros to comparison table ([a5dc1dc](https://github.com/ExaDev/SysProM/commit/a5dc1dc30dfaf2f57608ba7d96d616fc011d53e8))
- **readme:** add PRD to comparison table ([1355006](https://github.com/ExaDev/SysProM/commit/13550060b8809ab680abf3da976db19a001b548d))
- **readme:** add Spec Kitty and Shotgun to comparison table ([3fc1de4](https://github.com/ExaDev/SysProM/commit/3fc1de42c885a250457dce8f8ccbb12ac65bb890))

### Miscellaneous Chores

- **lint:** add jsdoc requirements-typescript preset ([8daa999](https://github.com/ExaDev/SysProM/commit/8daa999c3b080c465cccff1c1eb50de671f27aa6))

## [1.2.1](https://github.com/ExaDev/SysProM/compare/v1.2.0...v1.2.1) (2026-03-22)

### Documentation

- **cli:** add JSDoc to exported types and functions ([9c1b5ae](https://github.com/ExaDev/SysProM/commit/9c1b5aef377d125257e4bddfdbffdd976733c95e))
- **jsdoc:** add [@param](https://github.com/param) and [@returns](https://github.com/returns) to CLI command definitions ([c7b4e58](https://github.com/ExaDev/SysProM/commit/c7b4e58dd07a1610712820cb14ec107b246de73a))
- **jsdoc:** add [@param](https://github.com/param) and [@returns](https://github.com/returns) to speckit library functions ([dd1cb33](https://github.com/ExaDev/SysProM/commit/dd1cb331790fb1de20b1501ff66bd65823471a86))
- **jsdoc:** add [@throws](https://github.com/throws) {Error} type annotations to operation modules ([6aad9b9](https://github.com/ExaDev/SysProM/commit/6aad9b9dd199f8cca8807878d0e7e7f733a8d731))
- **jsdoc:** add JSDoc to conversion modules ([d7363da](https://github.com/ExaDev/SysProM/commit/d7363da8d71f4ceff3b180d6034d79f41a82ff62))
- **jsdoc:** add JSDoc to schema and core utility modules ([a4a58b1](https://github.com/ExaDev/SysProM/commit/a4a58b121a557e93062bfa14b2a41dfd19f52cc5))
- **operations:** use [@template](https://github.com/template) instead of [@type](https://github.com/type)Param for TSDoc ([cae1691](https://github.com/ExaDev/SysProM/commit/cae169100a4f669382bf5bd30d02ec19a2a05dd1))
- **readme:** add OpenSpec to comparison table ([54fe83e](https://github.com/ExaDev/SysProM/commit/54fe83e1c7934aec799d458aeddb6e99a487fabc))
- **sysprom:** add INV27 auto-sync JSON and Markdown representations ([8d78af0](https://github.com/ExaDev/SysProM/commit/8d78af03d23aa1cc3d1a5bd6f2374cf415db4d2f))

### Styles

- **tests:** apply prettier formatting ([f72c9c2](https://github.com/ExaDev/SysProM/commit/f72c9c202f858a005c43f66bd0a109fa63ba40da))

### Miscellaneous Chores

- **lint:** add eslint-plugin-jsdoc for TSDoc validation ([a79ba18](https://github.com/ExaDev/SysProM/commit/a79ba1865b480005b66db00c08635a66e8571343))
- **lint:** switch jsdoc preset to recommended-typescript ([d4f06b5](https://github.com/ExaDev/SysProM/commit/d4f06b5573df88223e68b37a9e4dcb45441c7afb))

## [1.2.0](https://github.com/ExaDev/SysProM/compare/v1.1.0...v1.2.0) (2026-03-22)

### Features

- **cli:** support .sysprom.\* paths and case-insensitive detection ([3fc01be](https://github.com/ExaDev/SysProM/commit/3fc01beb35bc4a65c127ec467e732a1c90015fd7))

### Bug Fixes

- **cli:** error on ambiguous case-variant document matches ([e12efca](https://github.com/ExaDev/SysProM/commit/e12efca0781efaa6e6f612780ee1801a41446682))

## [1.1.0](https://github.com/ExaDev/SysProM/compare/v1.0.7...v1.1.0) (2026-03-22)

### Features

- **cli:** auto-detect SysProM documents with --path option ([ba2f8a1](https://github.com/ExaDev/SysProM/commit/ba2f8a1a68f848affbc7472a69f1bf4e2e03bf14))
- **cli:** rework init with optional path and --format flag ([ddeaa69](https://github.com/ExaDev/SysProM/commit/ddeaa69a93c33fbf940c8028e37db9462c79272d))

### Code Refactoring

- **cli:** migrate task and plan commands to --path option ([b108eae](https://github.com/ExaDev/SysProM/commit/b108eae54d79031d20f112f9d5cb0f1ea196fa69))
- rename sysprom.spm.json to .spm.json and SysProM/ to .spm/ ([6ae15d1](https://github.com/ExaDev/SysProM/commit/6ae15d152f40ac48b19100bd1cd71b99073c9662))

### Documentation

- **core:** add JSDoc to canonical JSON, I/O, and markdown conversion ([891ec05](https://github.com/ExaDev/SysProM/commit/891ec0592741bd5cdc82a90912afebb9ad2915e2))
- **operations:** add JSDoc to all operation exports ([99f99fa](https://github.com/ExaDev/SysProM/commit/99f99fac1cc42d6b80fe496c6a1571fca9040211))
- **operations:** add JSDoc to operation definition framework ([2376a5f](https://github.com/ExaDev/SysProM/commit/2376a5f05d358c9fd9422d03a09e56d241ff4bc1))
- **schema:** add JSDoc to exported types, schemas, and label maps ([a63b3d3](https://github.com/ExaDev/SysProM/commit/a63b3d3affff58fb6152541166dfa2d8c2934434))
- **speckit:** add JSDoc and replace inline comments with doc comments ([93edf7e](https://github.com/ExaDev/SysProM/commit/93edf7e2eb714016aa760dd4a3908a422adcf907))
- **sysprom:** add D36 and CH34 for default input resolution and init command ([988af00](https://github.com/ExaDev/SysProM/commit/988af00047db96156da41eb64b0f1d0cabc0b4b1))
- **sysprom:** mark CH34 complete, sync markdown ([6719d8c](https://github.com/ExaDev/SysProM/commit/6719d8cfdc00eb1bbe96906bba09ef2a413ac9cc))

### Miscellaneous Chores

- **settings:** deny pnpm run _\* in addition to pnpm _\* ([1217c1c](https://github.com/ExaDev/SysProM/commit/1217c1cd5073f652e530d587b1c4cfa614ff1856))

## [1.0.7](https://github.com/ExaDev/SysProM/compare/v1.0.6...v1.0.7) (2026-03-22)

### Code Refactoring

- **api:** remove convenience wrappers, operations are the API ([e3bf2ef](https://github.com/ExaDev/SysProM/commit/e3bf2ef0fae6f60e970ce6f96e5aaa376f61bd4f))

### Documentation

- **readme:** add Superpowers to comparison table ([ebb1d32](https://github.com/ExaDev/SysProM/commit/ebb1d322cf92f77e0e0aa0b9abd19d07d7ab90e9))

## [1.0.6](https://github.com/ExaDev/SysProM/compare/v1.0.5...v1.0.6) (2026-03-22)

### Bug Fixes

- **pkg:** remove leading ./ from bin paths ([59f4e86](https://github.com/ExaDev/SysProM/commit/59f4e86ac3e8a3193af4f4a5fa2640894825a9db))

### Build System

- **pkg:** update homepage to GitHub Pages URL ([6ee3371](https://github.com/ExaDev/SysProM/commit/6ee3371c811a5b129f5e9040410df0fa1269e8bc))

## [1.0.5](https://github.com/ExaDev/SysProM/compare/v1.0.4...v1.0.5) (2026-03-22)

### Bug Fixes

- **ci:** upgrade to Node 24 for native npm OIDC support ([af676e2](https://github.com/ExaDev/SysProM/commit/af676e2ebe162d99fa85f502faa5c8e7b8ed9075))

## [1.0.4](https://github.com/ExaDev/SysProM/compare/v1.0.3...v1.0.4) (2026-03-22)

### Bug Fixes

- **ci:** publish to npm natively with --provenance ([ac021ef](https://github.com/ExaDev/SysProM/commit/ac021efca28ee788c389e1945b78a868e4cfda73))

## [1.0.3](https://github.com/ExaDev/SysProM/compare/v1.0.2...v1.0.3) (2026-03-22)

### Bug Fixes

- **ci:** set NODE_AUTH_TOKEN to empty for OIDC publishing ([c66bd8f](https://github.com/ExaDev/SysProM/commit/c66bd8fda2b63ad4a22f46e991dd3024ad6ed38f)), closes [semantic-release/npm#1069](https://github.com/semantic-release/npm/issues/1069)

## [1.0.2](https://github.com/ExaDev/SysProM/compare/v1.0.1...v1.0.2) (2026-03-22)

### Bug Fixes

- **ci:** remove registry-url to fix OIDC npm publishing ([8821cc9](https://github.com/ExaDev/SysProM/commit/8821cc96919042bc90a67b49ae8a5b6142d3deff))

## [1.0.1](https://github.com/ExaDev/SysProM/compare/v1.0.0...v1.0.1) (2026-03-22)

### Code Refactoring

- **api:** split task done/undone into separate operations ([ef2a682](https://github.com/ExaDev/SysProM/commit/ef2a6820b6015d0807ff71c6d519e8cda2958145))

## 1.0.0 (2026-03-22)

### Features

- **api:** add conversion and speckit operations, complete unification ([dd73a0d](https://github.com/ExaDev/SysProM/commit/dd73a0d653d9e55dd0d60d3eedf2af81836130ee))
- **api:** add operations for init, task-list, and plan commands ([ab886f3](https://github.com/ExaDev/SysProM/commit/ab886f3b67e18d8286a1f35befab5adf7625674a))
- **cli:** add --option and --selected flags to add command ([02f0cf5](https://github.com/ExaDev/SysProM/commit/02f0cf581bfcbd8f5fb777aa8618a739ab7d9da6))
- **cli:** add command-line tools and schema generator ([f274010](https://github.com/ExaDev/SysProM/commit/f2740102f715405d6f530904a337d675b1215153))
- **cli:** add init, search, check, graph, and rename commands ([e4f77f6](https://github.com/ExaDev/SysProM/commit/e4f77f610f12b6379a32faac975bd1d8c28a19ca))
- **cli:** add plan command for gate checking ([efbd8ef](https://github.com/ExaDev/SysProM/commit/efbd8ef0a58ea85fd3bc48c52e18674ed01fe8d8))
- **cli:** add speckit and task CLI commands ([d62f892](https://github.com/ExaDev/SysProM/commit/d62f8929bba2b30b4e47d812221e418181e5553a))
- **cli:** add timeline and state-at query commands ([6294a02](https://github.com/ExaDev/SysProM/commit/6294a024d53229792c1c73136296faba78117a62))
- **cli:** add unified sysprom bin entry point for npx usage ([d5fa9ec](https://github.com/ExaDev/SysProM/commit/d5fa9ec1b22fc1ad2334eaf6035b2c383affe3a8))
- **cli:** add UX improvements across all commands ([b0d60fd](https://github.com/ExaDev/SysProM/commit/b0d60fdb53691430206dcaa493c0f3350530ff93))
- **cli:** auto-generate node IDs when --id is omitted ([1fd24e8](https://github.com/ExaDev/SysProM/commit/1fd24e89080b705d16e565728a08737876b6b12f))
- **cli:** register speckit and task commands in CLI ([99169aa](https://github.com/ExaDev/SysProM/commit/99169aaeae916bc704c0c63b77b92822e16efa98))
- **cli:** run directly from TypeScript via tsx, add spm alias ([1fa5d3b](https://github.com/ExaDev/SysProM/commit/1fa5d3b05d15c35887f8adf91a849639e02056be))
- **convert:** add JSON ↔ Markdown bidirectional conversion ([3f86a61](https://github.com/ExaDev/SysProM/commit/3f86a6190c404b559176c1d317baa8880da7b5eb))
- **core:** add type definitions and core utilities ([1bca9f5](https://github.com/ExaDev/SysProM/commit/1bca9f5967a16c0c03d38fe6b1dbfd95d8765faf))
- **lib:** add barrel export for programmatic API ([184b09c](https://github.com/ExaDev/SysProM/commit/184b09c3148146386d2c69d2aa3bb7d6dc230dc0))
- **lib:** add I/O utilities module ([9a38ce1](https://github.com/ExaDev/SysProM/commit/9a38ce19767f365a535af5aa7d1ee2f78e5e9655))
- **lib:** add mutation library module ([9b6ac1f](https://github.com/ExaDev/SysProM/commit/9b6ac1fadac327d7bb248b89fb00e79fce0b5866))
- **lib:** add query library module ([5419cc9](https://github.com/ExaDev/SysProM/commit/5419cc939ee42942d1eeafa209f3853c098d6386))
- **lib:** add stats library module ([4ec8f32](https://github.com/ExaDev/SysProM/commit/4ec8f322be594bd5046843d9374a5e6117a57fff))
- **lib:** add validation library module ([6297439](https://github.com/ExaDev/SysProM/commit/6297439a283656f2f02ca52d3c09e878dabef5da))
- **lib:** export plan module from public API ([d4ac72e](https://github.com/ExaDev/SysProM/commit/d4ac72e36d2388bfa8c9172976379e7289200d37))
- **lib:** export speckit module from public API ([e53cf79](https://github.com/ExaDev/SysProM/commit/e53cf796342986a6479752ccaa6f5f0893f4982e))
- **mutate:** add plan task operations for change nodes ([a5a5e07](https://github.com/ExaDev/SysProM/commit/a5a5e075e8ba6e6a4aa2bc52c83b7f6f59188fc3))
- **operations:** add defineOperation infrastructure ([c548574](https://github.com/ExaDev/SysProM/commit/c548574a7da6ae93053d3a36df7ee04ce3a5503d))
- **operations:** define all domain operations with Zod schemas ([dc85dfb](https://github.com/ExaDev/SysProM/commit/dc85dfbc88cdccddbf8194a9d872eb48aef7115b))
- **schema:** add JSON Schema for SysProM document validation ([a32ae96](https://github.com/ExaDev/SysProM/commit/a32ae965f9b7ee80636de86b5dcffc3287ceb01b))
- **schema:** extend lifecycle values to accept ISO date strings ([0a6cdfd](https://github.com/ExaDev/SysProM/commit/0a6cdfd5cbca0fa0617a2dc4c3f57836c757afbc))
- **spec:** add D31 bidirectional sync and CH29 implementation plan ([86f849b](https://github.com/ExaDev/SysProM/commit/86f849b2c336484c0cb399e7bd79e1744ebd074d))
- **spec:** add self-describing SysProM specification ([96a80a4](https://github.com/ExaDev/SysProM/commit/96a80a4033339fd7e06a677284d7fe6e8c16e7ed))
- **speckit:** add bidirectional Spec-Kit file interoperability ([b4f6fd3](https://github.com/ExaDev/SysProM/commit/b4f6fd395b7ea23cee93467db3ac4455bb3a2bf5))
- **speckit:** add plan management module ([9ce47dc](https://github.com/ExaDev/SysProM/commit/9ce47dc6620649e8653c92adc1577337418d3e08))
- **temporal:** add temporal query module ([2e5680c](https://github.com/ExaDev/SysProM/commit/2e5680c3c54026a7a99dc22e33167e9889275f95))

### Bug Fixes

- **ci:** use npx turbo in CI workflow ([d8666cf](https://github.com/ExaDev/SysProM/commit/d8666cff716bb6fc1ebbe5ff868a18f41a2c0526))
- **hooks:** only fail typecheck for errors in staged files ([7862f83](https://github.com/ExaDev/SysProM/commit/7862f838abc806b63c33424636ac4f82e728b70a))
- **json-to-md:** render lifecycle checkboxes correctly for dates and ordering ([4c418be](https://github.com/ExaDev/SysProM/commit/4c418be4bc04a602719e5efcc4f0d5dda337c710))
- **schema:** resolve circular type inference for recursive schemas ([84b71fb](https://github.com/ExaDev/SysProM/commit/84b71fbcb2f1d736516c496219dd4620b125a422))
- **spec:** correct placeholder dates on D1–D3 and regenerate markdown ([06da4d9](https://github.com/ExaDev/SysProM/commit/06da4d97bbb19d0e85f372a94b13781ac03b2eab))
- **speckit:** handle truthy lifecycle values correctly ([c91a7fc](https://github.com/ExaDev/SysProM/commit/c91a7fc8dff859fb444e3edc450939ccb0859ef9))

### Code Refactoring

- **api:** delete original library files, operations are sole impl ([9002a79](https://github.com/ExaDev/SysProM/commit/9002a7976b84f724f224898b521b5e0f3ee7d7b2))
- **cli:** add Zod-driven command definition infrastructure ([2965f20](https://github.com/ExaDev/SysProM/commit/2965f208fd5138d783ed3bcbf685f54a57f3a292))
- **cli:** derive command descriptions from operations ([b9a5597](https://github.com/ExaDev/SysProM/commit/b9a5597393b5743f199a63a25b06dda1bf617e04))
- **cli:** extract shared schemas and helpers ([af2ce8a](https://github.com/ExaDev/SysProM/commit/af2ce8ab794abd7b225a483b1b6e36b74e232425))
- **cli:** make commands thin adapters over operations ([cdb060b](https://github.com/ExaDev/SysProM/commit/cdb060bfd01368c73d5a09917f6546426742aa14))
- **cli:** migrate commands to defineCommand pattern ([1f63b86](https://github.com/ExaDev/SysProM/commit/1f63b8662940937e2e0eae1a3947b12b3899bf75))
- **cli:** migrate to Commander.js ([34951af](https://github.com/ExaDev/SysProM/commit/34951afe90cafe37d78023f01aaa232db1ee2511))
- **cli:** remove type assertions from CLI code ([ca1828d](https://github.com/ExaDev/SysProM/commit/ca1828dc27efd077abfc40eb662d19534924cb0f))
- **cli:** use extractDocs for doc generation instead of reading Commander internals ([4a2b45b](https://github.com/ExaDev/SysProM/commit/4a2b45b8fd5b153454a131627a9758861e41fb26))
- **cli:** use library functions in CLI commands ([56bf7a6](https://github.com/ExaDev/SysProM/commit/56bf7a60fd7e57724d4c2db7c4f0be6be944bdf5))
- **cli:** use shared schemas across all commands ([c6fa662](https://github.com/ExaDev/SysProM/commit/c6fa66215dc0ecee4278d9c2088e25fd0e387a70))
- **lib:** remove type assertions from library code ([85e18a2](https://github.com/ExaDev/SysProM/commit/85e18a2d2cedeb9b514231f78315b367cfa01b50))
- **schema:** replace z.infer type aliases with explicit interfaces ([749d7aa](https://github.com/ExaDev/SysProM/commit/749d7aa422c0d2b16a657bdf30941c7f20f77d89))
- **schema:** revert to z.infer types with typedoc-plugin-zod ([47c048e](https://github.com/ExaDev/SysProM/commit/47c048ed912f3dbf6da27f80828bb1c609f0107c))
- **schema:** unify const and type names to PascalCase ([4f463e8](https://github.com/ExaDev/SysProM/commit/4f463e816e25c73b30b5606406266fdb758ce923))
- **speckit:** implement recursive change model ([9f3ac96](https://github.com/ExaDev/SysProM/commit/9f3ac966cd858062054904fb20b49aac4f64c063))
- **speckit:** use subsystem for tasks generation ([0db4861](https://github.com/ExaDev/SysProM/commit/0db4861fada16e81bf203eb9baf2e2b8b41d4277))
- **speckit:** use subsystem for tasks parsing ([c94baec](https://github.com/ExaDev/SysProM/commit/c94baecb6133521abcf28adc7f04808515724f61))

### Documentation

- add project README with overview and usage ([4085e0a](https://github.com/ExaDev/SysProM/commit/4085e0af9833cee7948eea02b3b2d6a81741c8df))
- add pronunciation to README ([e4ec3dd](https://github.com/ExaDev/SysProM/commit/e4ec3dd1212d207eb0a52893d7274fd2def2f148))
- **api:** add [@param](https://github.com/param) and [@returns](https://github.com/returns) JSDoc tags to all public functions ([10a5342](https://github.com/ExaDev/SysProM/commit/10a53425af26e5a6f9c806378a9d2b8b890d8462))
- **cli:** auto-generate CLI reference from Commander metadata ([685f010](https://github.com/ExaDev/SysProM/commit/685f01072d10f74d604c351ee22bf6c7d9ef3552))
- **readme:** add reminder to keep sysprom.spm.json and SysProM/ in sync ([7ac75e3](https://github.com/ExaDev/SysProM/commit/7ac75e30c5f9a28b5f90560a8f232382696c4c0e))
- **readme:** add Tracking column to comparison table ([9e64606](https://github.com/ExaDev/SysProM/commit/9e64606d157389d9cefcfae13fd37bb7a98ee0c4))
- **readme:** expand comparison table with five additional dimensions ([f7527ab](https://github.com/ExaDev/SysProM/commit/f7527abc015e0f266a3162fd602d69904279405b))
- **readme:** expand self-description section with sync instructions ([f994328](https://github.com/ExaDev/SysProM/commit/f994328c51433879e506ea58e20bbef316d8b32a))
- **readme:** update CLI examples and development scripts ([abaccab](https://github.com/ExaDev/SysProM/commit/abaccab8d4691506c8e9d8a8c9cd1414ee5ae3d9))
- **readme:** update development section with current build commands ([667c017](https://github.com/ExaDev/SysProM/commit/667c017bc7ca1b84cc38bf848c52185ca475204f))
- remove bold formatting from comparison table ([e7533a8](https://github.com/ExaDev/SysProM/commit/e7533a87daf512a5f502be082c60f7ea7403e41b))
- **spec:** add D19 decision and CH17 change for temporal support ([69ec694](https://github.com/ExaDev/SysProM/commit/69ec6949bec6113af5c65631cd1b99def4c13836))
- **spec:** add D20 decision and CH18 change for Commander migration ([6874710](https://github.com/ExaDev/SysProM/commit/6874710310cf20eb9bbfc855a25755968ef87c3e))
- **spec:** add D21/CH19 and D22/CH20 for TypeDoc and Turbo adoption ([faca10a](https://github.com/ExaDev/SysProM/commit/faca10a4f5fbca8d70de227d78d1202459f0eb53))
- **spec:** add D23-D25 and CH21-CH23 for CI, type safety, and dist ([a3c9ba2](https://github.com/ExaDev/SysProM/commit/a3c9ba2bcc0c576df13553c33f926519de4c790f))
- **spec:** add D26/CH24 for auto-ID generation ([921eb33](https://github.com/ExaDev/SysProM/commit/921eb33cb08a5e56fa5eef0e228b599db81e4623))
- **spec:** add D27/CH25 for CLI UX improvements ([1bc2ba5](https://github.com/ExaDev/SysProM/commit/1bc2ba5614aadb0e8b1d52d061f62f5bd8ed9331))
- **spec:** add D29/CH27 for defineOperation unification ([f55db23](https://github.com/ExaDev/SysProM/commit/f55db23fe52ff7215dcc5a0a6712a5e132b382e4))
- **spec:** add remaining unification tasks to CH27 ([686b74e](https://github.com/ExaDev/SysProM/commit/686b74eee449fbc417ce1c56ff7ff67b5f381c88))
- **spec:** mark CH25 complete and regenerate SysProM/ ([a2a2dc1](https://github.com/ExaDev/SysProM/commit/a2a2dc130cfce0418842529b00baaa36a1b0c311))
- **spec:** mark CH27 complete with all 10 tasks done ([92b1d60](https://github.com/ExaDev/SysProM/commit/92b1d60e0b295452e8f2dde672651d4cf421a04d))
- **spec:** record D16 decision and CH14 change for Spec-Kit support ([97a934b](https://github.com/ExaDev/SysProM/commit/97a934b3d3ba0c14fab20f8e428ab4a4032c28cb))
- **spec:** record D28/CH26 for CLI command definition unification ([eff93d4](https://github.com/ExaDev/SysProM/commit/eff93d416720d3e8a1b0277a71b869dd1298c491))
- **spec:** record D30/CH28 for Claude Code plugin ([39dcd69](https://github.com/ExaDev/SysProM/commit/39dcd69420d7270e64c4b7eba88b00e17b703f2e))
- **spec:** record D32/CH30 for MCP server ([2111f45](https://github.com/ExaDev/SysProM/commit/2111f45a401d8b1ad36dd02c8f212fbbdaaad354))
- **spec:** record D33/CH31 for keyed provider registry ([0edb0f9](https://github.com/ExaDev/SysProM/commit/0edb0f93f6a72d0cfbdaea21f30f4ecf2f4acc70))
- **spec:** update self-describing document with new decisions ([e8dee88](https://github.com/ExaDev/SysProM/commit/e8dee8891998069b708c5ace2c64e533c2872a2c))

### Styles

- **lint:** fix all eslint errors in source code ([e490c0a](https://github.com/ExaDev/SysProM/commit/e490c0ad8bcebbd479f8e0ac60770f8d89f0be26))
- **lint:** update test imports and exclude tests from pre-commit lint ([adfa143](https://github.com/ExaDev/SysProM/commit/adfa143f6ce1cd146fce2fbb879ce8691208dc57))

### Tests

- add comprehensive test suite for SysProM ([aad7862](https://github.com/ExaDev/SysProM/commit/aad78625cdc4c01386c0d9c4557da5c850f54f1d))
- **cli:** add task command unit tests ([822b362](https://github.com/ExaDev/SysProM/commit/822b3621599fb858f43c3e1f544019c122bd093b))
- **lib:** add unit tests for library modules ([334e903](https://github.com/ExaDev/SysProM/commit/334e90377d57f95b5700dc8343336b70817f14f1))
- **roundtrip:** add lifecycle date value round-trip test ([6b8b1c3](https://github.com/ExaDev/SysProM/commit/6b8b1c30984eb64c8d5aecc139b841fc52c8f34e))
- **speckit:** add parser and generator unit tests ([2f12562](https://github.com/ExaDev/SysProM/commit/2f12562fe48bba02fea8d37d8d498957346b7dbb))
- **speckit:** add plan module unit tests ([04915b6](https://github.com/ExaDev/SysProM/commit/04915b6f2a502824937e985255caee3b7209532a))
- **speckit:** update generator tests for subsystem ([6c51c20](https://github.com/ExaDev/SysProM/commit/6c51c200520471b9b92318fbb091aa426ae3267c))
- **speckit:** update parser tests for subsystem ([b578873](https://github.com/ExaDev/SysProM/commit/b578873459c7fd31aeac36be968a776e640b9eeb))
- **speckit:** update tests for recursive change model ([4996d3c](https://github.com/ExaDev/SysProM/commit/4996d3c65e959f93ecb5391e155497c3f6fdd618))
- **speckit:** update tests for truthy lifecycle handling ([20b8a92](https://github.com/ExaDev/SysProM/commit/20b8a92fbe3d6dfb49f244e2a39a6c20f621dcaa))
- **temporal:** add full ISO timestamp test coverage ([6eb69b4](https://github.com/ExaDev/SysProM/commit/6eb69b457c05147f85a109749a34ad45b2d97bbc))

### Build System

- **ci:** add commitlint, semantic-release, and husky hooks ([443fdb0](https://github.com/ExaDev/SysProM/commit/443fdb025782b07afc5a0cd7aeaabf6a77f2b550))
- **deps:** add picocolors for CLI output formatting ([a912dea](https://github.com/ExaDev/SysProM/commit/a912deadeae371bac1a77f1afe234d67d2eb6f32))
- **gitignore:** add docs/ to gitignore ([1f33785](https://github.com/ExaDev/SysProM/commit/1f33785435b5305a61835433d34c96b94929550b))
- **lint:** add eslint --fix to pre-commit hook ([ce87717](https://github.com/ExaDev/SysProM/commit/ce87717389340734c12caf807a10f638b71f10aa))
- **lint:** add ESLint with strict type-aware checks ([08a2397](https://github.com/ExaDev/SysProM/commit/08a2397010b9e7e07296c23a2ea6d7424f0d83d7))
- **lint:** add eslint-plugin-prettier with tabs and double quotes ([7bf1f4a](https://github.com/ExaDev/SysProM/commit/7bf1f4a890d410625dd3f6f46a195afd7a5f5e9e))
- **lint:** add turbo task for linting ([bf2455b](https://github.com/ExaDev/SysProM/commit/bf2455b571d37a6f4936262cc361b5db57c28be8))
- **pkg:** use compiled dist for bin and exports ([b88de88](https://github.com/ExaDev/SysProM/commit/b88de8849ee4619291f53a0abba34bfe20aabb48))
- **scripts:** add turbo wrappers for all tasks ([49f455d](https://github.com/ExaDev/SysProM/commit/49f455d9d546b36344ab01ac1e7327661376530d))
- **turbo:** add task orchestration and caching ([8c70cd8](https://github.com/ExaDev/SysProM/commit/8c70cd845cd7c7191d415ba068c38d20cb41eff5))
- **typedoc:** add API documentation generation ([8d02854](https://github.com/ExaDev/SysProM/commit/8d028542fe96188c704c0bba3f1e46cdb30618b9))

### Continuous Integration

- **dependabot:** configure automated dependency updates ([102f078](https://github.com/ExaDev/SysProM/commit/102f078b42db1ee052ba47a94226aba8f92f38c9))
- **github:** add CI workflow with turbo caching and GitHub Pages ([fcbbc7e](https://github.com/ExaDev/SysProM/commit/fcbbc7e18a999254878da27765e12cfa2b2f2e18))
- **release:** publish to npm with provenance and GitHub Packages ([10e55bd](https://github.com/ExaDev/SysProM/commit/10e55bdcf0958d16f1889251a392d7cb59874fa4))

### Miscellaneous Chores

- add .eslintcache to .gitignore ([3b074b9](https://github.com/ExaDev/SysProM/commit/3b074b9f4bdf09dece868a9a685dab13bd9260ed))
- add Claude Code configuration and project rules ([c3be913](https://github.com/ExaDev/SysProM/commit/c3be9131c254b9086c714bb9ced22fbf33ae8aa1))
- initialise project scaffolding ([0a4bcf6](https://github.com/ExaDev/SysProM/commit/0a4bcf6a66da20dd02541c0d1002f400dbff5ac5))
- **pkg:** configure for library publishing ([394c789](https://github.com/ExaDev/SysProM/commit/394c7896e9c63b25e2e38fff400721ed2ec0fada))
- **spec:** update self-describing document with external references ([45a21dd](https://github.com/ExaDev/SysProM/commit/45a21ddee48ccbfff6fb1a14e2e92bb9e29a4aa3))
- **tooling:** add Husky for pre-commit type checking ([6cb857a](https://github.com/ExaDev/SysProM/commit/6cb857ad7bed4315d14fa1800d79dfd181b46efa))
