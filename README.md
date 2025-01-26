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
import { <LanguageName>AcceptWeaver, weaveAcceptMethods } from '../semantics/<language-id>-accept-weaver.js';

...

// On your module definition
validation: {
    <LanguageName>AcceptWeaver: () => new <LanguageName>AcceptWeaver()
}

...

// On the create services function
weaveAcceptMethods(<LanguageName>);
```

### Create a new concrete Visitor

To create a new concrete Visitor, you just need to create a new class that implements the `Visitor` interface.
If the main goal of this visitor is to program dynamic semantics, it is recommended to place your concrete visitor in the `src/cli` directory to follow Langium's convention.
