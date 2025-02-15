import { type Module, inject } from 'langium';
import { createDefaultModule, createDefaultSharedModule, type DefaultSharedModuleContext, type LangiumServices, type LangiumSharedServices, type PartialLangiumServices } from 'langium/lsp';
import { HelloWorldGeneratedModule, HelloWorldGeneratedSharedModule } from './generated/module.js';
import { HelloWorldValidator } from './hello-world-validator.js';
import { HelloWorldInterpreter } from '../cli/interpreter.js';
import { HelloWorldAcceptWeaver } from '../semantics/hello-world-accept-weaver.js';
import { registerVisitorAsValidator } from '../semantics/hello-world-visitor.js';

/**
 * Declaration of custom services - add your own service classes here.
 */
export type HelloWorldAddedServices = {
    visitors: {
        HelloWorldAcceptWeaver: HelloWorldAcceptWeaver,
        HelloWorldInterpreter: HelloWorldInterpreter,
        HelloWorldValidator: HelloWorldValidator
    }
}

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type HelloWorldServices = LangiumServices & HelloWorldAddedServices

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export const HelloWorldModule: Module<HelloWorldServices, PartialLangiumServices & HelloWorldAddedServices> = {
    visitors: {
        HelloWorldAcceptWeaver: (services) => new HelloWorldAcceptWeaver(services),
        HelloWorldInterpreter: () => new HelloWorldInterpreter(),
        HelloWorldValidator: () => new HelloWorldValidator()
    }
};

/**
 * Create the full set of services required by Langium.
 *
 * First inject the shared services by merging two modules:
 *  - Langium default shared services
 *  - Services generated by langium-cli
 *
 * Then inject the language-specific services by merging three modules:
 *  - Langium default language-specific services
 *  - Services generated by langium-cli
 *  - Services specified in this file
 *
 * @param context Optional module context with the LSP connection
 * @returns An object wrapping the shared services and the language-specific services
 */
export function createHelloWorldServices(context: DefaultSharedModuleContext): {
    shared: LangiumSharedServices,
    HelloWorld: HelloWorldServices
} {
    const shared = inject(
        createDefaultSharedModule(context),
        HelloWorldGeneratedSharedModule
    );
    const HelloWorld = inject(
        createDefaultModule({ shared }),
        HelloWorldGeneratedModule,
        HelloWorldModule
    );
    shared.ServiceRegistry.register(HelloWorld);
    HelloWorld.visitors.HelloWorldAcceptWeaver;
    registerVisitorAsValidator(HelloWorld.visitors.HelloWorldValidator, HelloWorld);
    if (!context.connection) {
        // We don't run inside a language server
        // Therefore, initialize the configuration provider instantly
        shared.workspace.ConfigurationProvider.initialized({});
    }
    return { shared, HelloWorld };
}
