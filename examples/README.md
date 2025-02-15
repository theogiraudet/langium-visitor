# Langium Visitor - Examples

## Hello World

This example demonstrates how to use the visitor pattern to validate and interpret the Hello World language from Langium.
The three interesting files are:

- `src/language/hello-world-module.ts`: The module definition for the Hello World language with the custom visitor services.
- `src/language/hello-world-visitor.ts`: A validator implemented with the visitor pattern. Uses the default Langium validator service under the hood.
- `src/cli/interpreter.ts`: An interpreter that uses the visitor pattern to interpret the Hello World language.

### Running the example

```bash
npm run i
npm run build
node ./bin/cli.js generate test.hello # should print "Hello Foo!"
node ./bin/cli.js generate test_with_error.hello # should print an error since the name "foo" is not capitalized
```