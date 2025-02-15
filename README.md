# Langium Visitor

A CLI tool to generate visitor classes for a Langium project.

## Installation

```bash
npm install -D langium-visitor
```

## Usage

### Generate the visitor files

```bash
langium-visitor
```

Or modify the `package.json` file of your Langium project to add a script:

```json
"scripts": {
  "langium:visitor": "langium-visitor"
}
```

To correctly work, the `langium-visitor` command must be run after the `langium:generate` command.
Indeed, the `langium-visitor` command will use the generated "src/language/generated/grammar.ts" file to generate the visitor classes.
The generated files will be placed in the "src/semantics" directory.

### Plug the visitor files in your Langium project

To allow your Langium project to use the visitor files, you need to import them in your project as a module.
For that, you need to add the following lines in your "src/language/<language-id>-module.ts" file:

```ts
import { <LanguageName>AcceptWeaver } from '../semantics/<language-id>-accept-weaver.js';

...

export type <LanguageName>AddedServices = {
    <LanguageName>AcceptWeaver: <LanguageName>AcceptWeaver
}

...

export const <LanguageName>Module: Module<<LanguageName>Services, PartialLangiumServices & <LanguageName>AddedServices> = {
    <LanguageName>AcceptWeaver: (services) => new <LanguageName>AcceptWeaver(services)
};

...

// On the create services function, just after "shared.ServiceRegistry.register(<LanguageName>);"
HelloWorld.HelloWorldAcceptWeaver; // This is to instantiate the accept weaver
```

### Create a new concrete Visitor

To create a new concrete Visitor, you just need to create a new class that implements the `Visitor` interface.
If the main goal of this visitor is to program dynamic semantics, it is recommended to place your concrete visitor in the `src/cli` directory to follow Langium's convention.

### CLI Arguments

| Argument | Description | Default Value | Optional |
| -------- | ----------- | ------------- | -------- |
| `--out <path>` | The output directory for the generated files | `src/semantics` | Yes |
| `--grammar <path>` | The path to the grammar file | output path specified in the Langium config file + `/grammar.ts` | Yes |
| `--ast <path>` | The path to the AST file | output path specified in the Langium config file + `/ast.ts` | Yes |
| `--config <path>` | The path to the Langium config file | `langium-config.json` | Yes |

### How does this work?

The purpose of the accept-weaver is to dynamically add a new method `accept` to the Langium generated (concrete) types.
The weaver is executed when each time a Langium document goes in "Validated" state, but use a cache to avoid reweaving the same AST nodes multiple times.
However, this method only exists at runtime, so Langium will throw errors when trying to access it.
To fix this, the generator also creates for each type a class inheriting from it, so with the same properties, but also with an accept method.
The only other difference is that instead of containing/referencing other Langium's types, they contain/reference the equivalent classes.
These classes are in the visitor file.
So by casting a Langium type to its equivalent class (duck-typing), we can statically access the accept method we woven earlier.
Accept methods are not woven to abstract types.
We consider any type that doesn't have properties and has subtypes to be an abstract type.