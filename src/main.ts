import fs from "fs";
import { GrammarAST, GrammarUtils, loadGrammarFromJson } from "langium";
import { FlattenedInterface as FlattenedInterface, FlattenedTranslatedInterface as FlattenedTranslatedInterface, OverrideProperty, TranslatedAttribute, TranslatedTypeOption } from "./types.js";
import nunjucks from "nunjucks";
import path from "path";
import { fileURLToPath } from "url";
import { collectAst, InterfaceType, isArrayType, isInterfaceType, isPrimitiveType, isPropertyUnion, isReferenceType, isStringType, isUnionType, isValueType, Property, PropertyType, PropertyUnion, TypeOption, UnionType } from "langium/grammar";
import chalk from "chalk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.resolve(__dirname, "..", "templates");

/**
 * Generate the visitor files from a Langium grammar
 * @param outputPath The path to the output directory, where to generate the visitor files. Default to "src/semantics"
 * @param grammarPath The path to the grammar.ts file, the source of the generation. Default to "src/language/generated/grammar.ts"
 * @param astPath The path to the AST file, useful to compute relative import. Default to "src/language/generated/ast.ts"
 * @param langiumConfigPath The path to the langium-config.json file, to get the project ID and name. Default to "./langium-config.json"
 */
export async function generate(outputPath: string = "src/semantics", grammarPath?: string, astPath?: string, langiumConfigPath: string = "langium-config.json") {
    const projectInfo = getProjectName(langiumConfigPath);
    if (projectInfo) {
        const { projectName, id, outputDir } = projectInfo;
        grammarPath = grammarPath || path.join(outputDir, "grammar.ts");
        astPath = astPath || path.join(outputDir, "ast.ts");

        parseLangiumGrammarAndGenerate(outputPath, grammarPath, astPath, id, projectName);  
    }
}

/**
 * Generate the visitor files from a Langium grammar
 * @param outputPath The path to the output directory, where to generate the visitor files
 * @param grammarPath The path to the grammar.ts file, the source of the generation
 * @param astPath The path to the AST file, useful to compute relative import
 * @param langiumConfigPath The path to the langium-config.json file, to get the project ID and name
 */
async function parseLangiumGrammarAndGenerate(outputPath: string, grammarPath: string, astPath: string, id: string, projectName: string) {
    const grammar = await parseLangiumGrammar(grammarPath);
    if(grammar) {
        const ast = collectAst(grammar);
        const interfaces = ast.interfaces;
        const unions = ast.unions.map(union => ({ name: union.name, types: translateTypeOption(union) }));
        const rootType = getRootType(grammar);
        if(!rootType) {
            console.error(chalk.red("No entry rule found in the grammar"));
            return;
        }
        const flattened = flattenInterfaces(interfaces);
        const translated = flattened.map(interface_ => translateFlattenedInterface(interface_));
        generateFiles(outputPath, astPath, id, projectName, translated, rootType, unions);
    }
}


/**
 * Get the type of the entry rule of the grammar
 * @param grammar The grammar
 * @returns The type of the entry rule of the grammar
 */
export function getRootType(grammar: GrammarAST.Grammar): string | undefined {
    const entryRule = GrammarUtils.getEntryRule(grammar);
    if(!entryRule) {
        return undefined;
    }
    return GrammarUtils.getRuleTypeName(entryRule);
}

/**
 * Parse the Langium grammar from the generated grammar.ts file
 * @param grammarPath The path to the grammar file
 * @returns The Langium grammar
 */
export async function parseLangiumGrammar(grammarPath: string): Promise<GrammarAST.Grammar | undefined> {
    let content: string;
    try {
        content = fs.readFileSync(grammarPath, "utf8");
    } catch (error) {
        console.error(chalk.red(`Failed to read '${grammarPath}'. Make sure to run 'npm run langium:generate' before running this script.`));
        return;
    }

    const jsonGrammar = content.split('`');
    
    if(jsonGrammar.length < 2) {
        console.error(chalk.red(`Failed to get JSON Langium grammar from '${grammarPath}'`));
        return;
    }

    return loadGrammarFromJson(jsonGrammar[1].replaceAll("\\\\", "\\"));
}



/**
 * Get the project name and the ID of the first language from the langium-config.json file
 * @param langiumConfigPath The path to the langium-config.json file
 * @returns The project name and the ID of the first language, or undefined if the file is not found or the JSON is invalid
 */
function getProjectName(langiumConfigPath: string): { projectName: string, id: string, outputDir: string } | undefined {
    try {
        const config = fs.readFileSync(langiumConfigPath, "utf8");
        const json = JSON.parse(config);
        return { projectName: json.projectName, id: json.languages[0].id, outputDir: json.out };
    } catch (error) {
        console.error(chalk.red("Failed to get Langium project name"));
        return undefined;
    }
}


/**
 * Flatten interfaces into a list of interfaces, each resulting interface contains all the attributes of its parents
 * An interface is a leaf if it has no subtypes
 * @param interfaces The list of interfaces to flatten
 * @returns The list of interfaces
 */
function flattenInterfaces(interfaces: InterfaceType[]): FlattenedInterface[] {
    const map = new Map<string, FlattenedInterface>();
    interfaces.forEach(interface_ => flattenType(interface_, [], map ));
    return Array.from(map.values());
}

/**
 * Flatten a type into a list of interfaces, each interface has the attributes of its parents
 * @param type The type to flatten
 * @param attributes The attributes of the parents of the current type
 * @param map The map of already built interfaces
 * @returns The subtypes name
 */
function flattenType(type: TypeOption, attributes: Property[], map: Map<string, FlattenedInterface>): string[] {
    if(!isInterfaceType(type)) {
        console.error(chalk.red("Unsupported union type: " + type.name));
        return [];
    }
    
    if(map.has(type.name)) {
        return [];
    }
    
    const types: string[] = [type.name]
    const properties: OverrideProperty[] = attributes.map(attribute => ({ property: attribute, override: true }));
    type.properties.forEach(property => properties.push({ property, override: false }));

    const flattened: FlattenedInterface = { name: type.name, properties, isConcrete: type.subTypes.size === 0, containerTypes: [...type.containerTypes], types: types };
    map.set(type.name, flattened);


    if(!type.abstract) {
        type.subTypes.forEach(subType => types.push(...flattenType(subType, [...attributes, ...type.properties], map)));
    }

    return flattened.types;
}


/**
 * Translate a the attributes of a flattened interface
 * @param interface_ The flattened interface to translate
 * @returns The translated interface
 */
function translateFlattenedInterface(interface_: FlattenedInterface): FlattenedTranslatedInterface {
    const references: TranslatedAttribute[] = [];
    const containerTypes = interface_.containerTypes.map(superType => superType.name);
    if(containerTypes.length > 0) {
        references.push({ name: "$container", type: containerTypes.join(" | "), isReference: true });
    }
    for(const property of interface_.properties) {
        const [type, isReference] = translateType(property.property.type);
        if(isReference) {
            references.push({ name: property.property.name, type, isReference: true });
        }
    }
    const translated: FlattenedTranslatedInterface = { name: interface_.name, references, isConcrete: interface_.isConcrete, containerTypes: containerTypes, types: interface_.types };
    return translated;
}

/**
 * Translate a type into a string
 * @param type The type to translate
 * @returns The translated type
 */
function translateType(type: PropertyType | undefined): [string, boolean] {
    if(!type) {
        console.error(chalk.red("Unknown type"));
        return ["unknown", false];
    }

   if(isPrimitiveType(type)) {
        return [type.primitive, false];
    } else if(isStringType(type)) {
        return [`'${type.string}'`, false];
    } else if(isArrayType(type)) {
        const [elementType, isReference] = translateType(type.elementType);
        return ['Array<' + elementType + '>', isReference];
    } else if(isReferenceType(type)) {
        const [referenceType, isReference] = translateType(type.referenceType);
        return ["Reference<" + referenceType + ">", isReference];
    } else if(isValueType(type)) {
        return [type.value.name, true];
    } else if(isPropertyUnion(type)) {
        const types = type.types.map(type => translateType(type)).reduce((acc, current) => {
            acc[0].push(current[0]);
            return [acc[0], acc[1] || current[1]] as [string[], boolean];
        }, [[], false] as [string[], boolean]);
        return [types[0].join(" | "), types[1]];
    }
    return ['unknown', false];
}

/**
 * Translate a type option into a string
 * @param type The type option to translate
 * @returns The translated type option
 */
function translateTypeOption(type: TypeOption): string {
    if(isInterfaceType(type)) {
        return type.name;
    } else {
        return translateType(type.type)[0];
    }
}

/**
 * Generate the visitor files
 * @param outputDir The path to the output directory
 * @param astDir The path to the AST directory to compute import paths
 * @param projectId The ID of the project
 * @param projectName The name of the project
 * @param interfaces The list of interfaces to generate
 * @param rootType The type of the entry rule of the grammar
 * @param unions The list of unions to generate
 */
function generateFiles(outputDir: string, astDir: string, projectId: string, projectName: string, interfaces: FlattenedTranslatedInterface[], rootType: string, unions: TranslatedTypeOption[]) {
    nunjucks.configure(templatesDir, { autoescape: false });
    let resolvedImportAst = path.relative(outputDir, astDir).replace(".ts", ".js").replaceAll("\\", "/");

    if(!resolvedImportAst.startsWith(".")) {
        resolvedImportAst = "./" + resolvedImportAst;
    }

    const hasAnyReference = interfaces.some(interface_ => interface_.references.length > 0);

    const visitor = nunjucks.render('visitor.njk', { projectId, projectName, interfaces: interfaces, resolvedImportAst, rootType, unions, hasAnyReference });
    const acceptWeaver = nunjucks.render('accept-weaver.njk', { projectId, projectName, interfaces: interfaces.filter(interface_ => interface_.isConcrete), resolvedImportAst });
    if(!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    fs.writeFileSync(path.join(outputDir, `${projectId}-visitor.ts`), visitor);
    fs.writeFileSync(path.join(outputDir, `${projectId}-accept-weaver.ts`), acceptWeaver);
    console.log(chalk.green("Files generated successfully."));
}

