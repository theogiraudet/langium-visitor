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

export const <LanguageName>Module: Module<<LanguageName>Services, PartialLangiumServices & <LanguageName>AddedServices> = {
    validation: {
        <LanguageName>AcceptWeaver: () => new <LanguageName>AcceptWeaver()
    }
};

...

export function create<LanguageName>Services(context: DefaultSharedModuleContext): {
    shared: LangiumSharedServices,
    <LanguageName>: <LanguageName>Services
} {
    const shared = inject(
        createDefaultSharedModule(context),
        <LanguageName>GeneratedSharedModule
    );
    const <LanguageName> = inject(
        createDefaultModule({ shared }),
        <LanguageName>GeneratedModule,
        <LanguageName>Module
    );
    shared.ServiceRegistry.register(<LanguageName>);
    registerValidationChecks(<LanguageName>);
    weaveAcceptMethods(<LanguageName>);
    if (!context.connection) {
        shared.workspace.ConfigurationProvider.initialized({});
    }
    return { shared, <LanguageName> };
}
```