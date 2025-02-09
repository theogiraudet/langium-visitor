# Changelog

## 1.1.2

- Fixed the generation of the visitor classes when the container types come from a supertype. The `$container` attribute was not prefixed with `override` when needed, and was not given to the super constructor.
- Fixed a fail during the generation of the visitor when a `PropertyUnion` type was encountered. PropertyUnion are now translated into a TypeScript union type.

## 1.1.1

- Fix a parse error during the parsing of the grammar.ts file, due to to many escape characters. This error caused the generator not to work on the Hello World Langium project.
- Fix a bug during the identification of concrete grammar types.
- Add CLI arguments to specify the output directory, the grammar file, the AST file, the module file and the Langium config file. This arguments are optional and will use the default values if not specified.
- The generator now use the `langium-config.json` file to get the output directory of the grammar and AST files.

## 1.1.0

- Added colors to the CLI errors.
- Added inheritance between the different generated classes when needed.
- Improved the `$type` attribute typing.
- Prefixed the Visitor interface name with the project name, to follow Langium's convention.