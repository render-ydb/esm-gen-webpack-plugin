import ts = require('typescript');
import path = require("path");
import fse = require('fs-extra');
import { REG_TS, REG_JS } from './const'
import { formatPathForWin, log } from 'render-utils';

type Json = Record<string, any>;

// compile options
const options = {
    allowJs: true,
    declaration: true,
    emitDeclarationOnly: true,
};

export = function dtsCompiler(compileInfo: Array<any>) {

    const needCompileList = compileInfo.filter(({ filePath }: { filePath: string }) => REG_JS.test(filePath)).map((data) => {
        const { filePath, destPath, sourceFile } = data;
        const targetPath = path.join(destPath, filePath.replace(REG_JS, '.d.ts'));
        const fileNamesDTS = sourceFile.replace(REG_JS, '.d.ts');
        return {
            ...data,
            targetPath,
            fileNamesDTS,
        };
    });

    if (needCompileList.length === 0) {
        return;
    }
    log.info('Compiling ts declaration ...');
    // Create a Program with an in-memory emit
    let createdFiles: Json = {};
    const host = ts.createCompilerHost(options);
    host.writeFile = (fileName, contents) => { createdFiles[fileName] = contents; };

    // Prepare and emit the d.ts files
    const program = ts.createProgram(needCompileList.map(({ sourceFile }) => sourceFile), options, host);
    const emitResult = program.emit();
    if (emitResult.diagnostics && emitResult.diagnostics.length > 0) {
        emitResult.diagnostics.forEach((diagnostic) => {
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            if (diagnostic.file) {
                const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start as number);
                log.error(`${diagnostic.file.fileName} (${line + 1}, ${character + 1}): ${message}`);
            } else {
                log.error(message);
            }
        });
    }

    needCompileList.forEach(({ targetPath, fileNamesDTS }) => {
        const content = createdFiles[
            formatPathForWin(fileNamesDTS)
        ];
        // write file
        if (content) {
            fse.ensureDirSync(path.dirname(targetPath));
            fse.writeFileSync(targetPath, content, 'utf-8');
        }
    });

    // release
    // @ts-ignore
    createdFiles = null;
};
