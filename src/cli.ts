import minimist from 'minimist';
import { generate as main_generate } from './main.js';

export function generate() {
    const args = minimist(process.argv.slice(2));
    const output = args.out;
    const modulePath = args.module;
    const grammarPath = args.grammar;
    const astPath = args.ast;
    const langiumConfigPath = args.config;

    main_generate(output, modulePath, grammarPath, astPath, langiumConfigPath);
}