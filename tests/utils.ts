import { EmptyFileSystem, Grammar, GrammarAST, URI } from "langium";
import { createLangiumGrammarServices } from "langium/grammar";
import fs from 'fs';
import { buildVisitor } from "../src/main.js";
import { expect } from "vitest";

const services = createLangiumGrammarServices(EmptyFileSystem);

export async function build(file: string): Promise<GrammarAST.Grammar> {
    const content = fs.readFileSync(file, 'utf8');
    const document = services.shared.workspace.LangiumDocumentFactory.fromString<Grammar>(content, URI.file('test.langium'));
    services.shared.workspace.LangiumDocuments.addDocument(document);
    await services.shared.workspace.DocumentBuilder.build([document]);
    const grammar = document.parseResult.value;
    return grammar;
}

export async function test(dir: string, grammarName: string = "grammar.test.langium"): Promise<{ expectedVisitor: string, expectedAcceptWeaver: string, resultVisitor: string, resultAcceptWeaver: string } | undefined> {
    const grammar = await build(dir + "/" + grammarName);
    const result = await buildVisitor(grammar, dir + "/ast.ts", dir, "test", "Test");
    const expectedVisitor = fs.readFileSync(dir + "/visitor-result.txt", "utf8");
    const expectedAcceptWeaver = fs.readFileSync(dir + "/accept-weaver-result.txt", "utf8");

    if(result?.visitor && result?.acceptWeaver) {
        return { expectedVisitor, expectedAcceptWeaver, resultVisitor: result.visitor, resultAcceptWeaver: result.acceptWeaver };
    }
    return undefined;
}
