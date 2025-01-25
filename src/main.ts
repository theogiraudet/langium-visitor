import fs from "fs";
import { GrammarAST, loadGrammarFromJson } from "langium";
import { FlattenedInterface as FlattenedInterface, FlattenedTranslatedInterface as FlattenedTranslatedInterface } from "./types.js";
import nunjucks from "nunjucks";
import path from "path";
import { fileURLToPath } from "url";
import { collectAst, InterfaceType, isArrayType, isPrimitiveType, isReferenceType, isStringType, isUnionType, isValueType, Property, PropertyType, TypeOption } from "langium/grammar";

const workdir = process.cwd();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.resolve(__dirname, "..", "templates");

// Reserved typescript keywords
const keywords = ["break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "enum", "export", "extends", "false", "finally", "for", "function", "if", "import", "in", "instanceof", "new", "null", "return", "super", "switch", "this", "throw", "true", "try", "typeof", "var", "void", "while", "with", "as", "implements", "interface", "let", "package", "private", "protected", "public", "static", "yield", "any", "boolean", "constructor", "declare", "get", "module", "require", "number", "set", "string", "symbol", "type", "from", "of"]

main();

// Since Langium 2.0.0, some interfaces may not have $container when their container are too complex to compute: https://github.com/eclipse-langium/langium/pull/1055

async function main() {
    const projectInfo = getProjectName();
    if (projectInfo) {
        const { projectName, id } = projectInfo;
        const grammar = await parseLangiumGrammar();
        if(grammar) {
            const ast = collectAst(grammar);
            const interfaces = ast.interfaces;
            const flattened = flattenInterfaces(interfaces);
            const translated = flattened.map(interface_ => translateFlattenedInterface(interface_));
            generateFiles(id, projectName, translated);
        }       
    }
}



/**
 * Parse the Langium grammar from the generated "src/language/generated/grammar.ts" file
 * @returns The Langium grammar
 */
async function parseLangiumGrammar(): Promise<GrammarAST.Grammar | undefined> {
    let content: string;
    try {
        content = fs.readFileSync(workdir + '/src/language/generated/grammar.ts', "utf8");
    } catch (error) {
        console.error("Failed to read 'src/language/generated/grammar.ts'. Make sure to run 'npm run langium:generate' before running this script.");
        return;
    }

    const jsonGrammar = content.split('`');
    
    if(jsonGrammar.length < 2) {
        console.error("Failed to get JSON Langium grammar from 'src/language/generated/grammar.ts'.");
        return;
    }

    return loadGrammarFromJson(jsonGrammar[1]);
}



/**
 * Get the project name and the ID of the first language from the langium-config.json file
 * @returns The project name and the ID of the first language, or undefined if the file is not found or the JSON is invalid
 */
function getProjectName(): { projectName: string, id: string } | undefined {
    try {
        const config = fs.readFileSync(workdir + "/langium-config.json", "utf8");
        const json = JSON.parse(config);
        return { projectName: json.projectName, id: json.languages[0].id };
    } catch (error) {
        console.error("Failed to get Langium project name");
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
    interfaces.forEach(interface_ => flattenType(interface_, [], map));
    return Array.from(map.values());
}

/**
 * Flatten a type into a list of interfaces, each interface has the attributes of its parents
 * If the type is a leaf, the resulting interface is marked as concrete
 * @param type_ The type to flatten
 * @param attributes The attributes of the parents of the current type
 * @param map The map of already built interfaces
 */
function flattenType(type_: TypeOption, attributes: Property[], map: Map<string, FlattenedInterface>) {
    if(!Object.prototype.hasOwnProperty.call(type_, 'properties')) {
        console.error("Unsupported union type: " + type_.name);
        return;
    }

    const interface_ = type_ as InterfaceType;

    if(map.has(type_.name)) {
        return;
    }
    
    const flattened: FlattenedInterface = { name: interface_.name, properties: [...attributes, ...interface_.properties], isConcrete: interface_.properties.length === 0, containerTypes: [...interface_.containerTypes] };
    map.set(interface_.name, flattened);

    if(type_.subTypes.size > 0) {
        type_.subTypes.forEach(subType => flattenType(subType, [...attributes, ...interface_.properties], map));
    }
}


/**
 * Translate a the attributes of a flattened interface
 * @param interface_ The flattened interface to translate
 * @returns The translated interface
 */
function translateFlattenedInterface(interface_: FlattenedInterface): FlattenedTranslatedInterface {
    const superTypes = interface_.containerTypes.map(superType => superType.name);
    const translated: FlattenedTranslatedInterface = { name: interface_.name, attributes: [], isConcrete: interface_.isConcrete, containerTypes: superTypes };
    for(const property of interface_.properties) {
        translated.attributes.push({ name: property.name, type: translateType(property.type) });
    }
    return translated;
}

/**
 * Translate a type into a string
 * @param type The type to translate
 * @returns The translated type
 */
function translateType(type: PropertyType | undefined): string {
    if(!type) {
        console.error("Unknown type");
        return "unknown";
    }

   if(isPrimitiveType(type)) {
        return type.primitive;
    } else if(isStringType(type)) {
        return type.string;
    } else if(isArrayType(type)) {
        return translateType(type.elementType) + '[]';
    } else if(isReferenceType(type)) {
        return "Reference<" + translateType(type.referenceType) + ">";
    } else if(isValueType(type) && isUnionType(type.value)) {
        return "ASTInterfaces." + type.value.name;
    } else if(isValueType(type)) {
        return type.value.name;
    } else {
        console.error("Unknown type: PropertyUnion");
    }
    return '';
}


/**
 * Generate the visitor files
 * @param projectId The ID of the project
 * @param projectName The name of the project
 * @param interfaces The list of interfaces to generate
 */
function generateFiles(projectId: string, projectName: string, interfaces: FlattenedTranslatedInterface[]) {
    let failed = false;
    // Check if the attribute names are valid Typescript identifiers
    for(const attributes of interfaces.flatMap(interface_ => interface_.attributes)) {
        if(keywords.includes(attributes.name)) {
            console.error(`Reserved keyword ${attributes.name} cannot be used as an attribute name.`);
            failed = true;
        }
    }

    if(failed) {
        console.error("Failed to generate files.");
        return;
    }

    nunjucks.configure(templatesDir, { autoescape: false });
    const visitor = nunjucks.render('visitor.njk', { projectId, projectName, interfaces: interfaces });
    const acceptWeaver = nunjucks.render('accept-weaver.njk', { projectId, projectName, interfaces: interfaces.filter(interface_ => interface_.isConcrete) });
    if(!fs.existsSync(workdir + `/src/semantics`)) {
        fs.mkdirSync(workdir + `/src/semantics`);
    }
    fs.writeFileSync(workdir + `/src/semantics/${projectId}-visitor.ts`, visitor);
    fs.writeFileSync(workdir + `/src/semantics/${projectId}-accept-weaver.ts`, acceptWeaver);
}

