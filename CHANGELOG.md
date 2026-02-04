# Changelog

# 1.4.2

- Fix circular dependency.

# 1.4.0

- The pipeline did not build sources.

## 1.3.0

- Array of union types are now correctly translated into `Array<A | B>` instead of `A | B[]`.
- The generator now generates types instead of classes for each AST Node. Since these classes were only used for TypeScript type-checking, this change has lightened the JavaScript code produced. 
- Add type guards for each generated type.
- Add CD pipeline to publish the package on npm.
- Add some tests to the project.

## 1.2.0

- Some concrete types were not generated because the generator considers them as abstract classes. The generator now rely on the `abstract` attribute of [PlainInterface](https://github.com/eclipse-langium/langium/blob/77d16cf085d6c57d3cce9386aceb21b19d07ac62/packages/langium/src/grammar/type-system/type-collector/plain-types.ts#L25) to know if a type must be abstract or not.
- The weaver does not rely on Langium validator anymore. It is now directly executed when a Langium document goes in "Validated" state. To avoid reweaving the same AST nodes multiple times, the weaver uses a cache.
- Thanks to that, the `module` CLI argument is no longer needed and has been removed.
- Add a new abstract class `AbstractValidationVisitor` that can be used to implement a validation visitor. It uses the Langium validator service under the hood and exposes its `accept` method.
- The generator is now able to generate equivalent union types coming from the original grammar but using the visitor classes instead of the Langium interfaces. Thanks to that, no types/interfaces from the `ast.ts` file are needed anymore in the signature of the visitor classes.
- Add a new example project to showcase the usage of the visitor pattern.


## 1.1.6

- Fix an issue when the `PropertyType` was a StringType: the generated type was not quoted.

## 1.1.4-5

- Remove JS/TS keywords that can be used as parameter names. `as`, `boolean`, `declare`, `get`, `module`, `require`, `number`, `set`, `string`, `symbol`, `type`, `from`, and `of` can now be used.

## 1.1.3

- The Visitor used the Langium interfaces as "visit" methods paramater instead of our custom classes.

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