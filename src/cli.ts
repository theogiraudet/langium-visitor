import minimist from 'minimist';
import { generateFromCli as main_generate } from './main.js';

export function generate() {
    const args = minimist(process.argv.slice(2));
    const output = args.out;
    const grammarPath = args.grammar;
    const astPath = args.ast;
    const langiumConfigPath = args.config;

    main_generate(output, grammarPath, astPath, langiumConfigPath);
}