import path = require("path");
import fse = require('fs-extra');
import glob = require("glob");
import getCompileBabel = require('./utils/getCompileBabel');
import { Compiler } from "webpack";
import * as babel from '@babel/core';
import { log } from 'render-utils';
import dtsCompiler = require('./dts');
import { REG_D_TS, REG_JS } from "./const";

const getBabelConfig = ({
  target,
  rootDir,
  babelPlugins,
  babelOptions,
  alias,
}: { target: string, rootDir: string, babelPlugins: Array<any>, babelOptions: Array<any>, alias: any }) => {
  const params = target === 'es' ? { modules: false } : {};
  let babelConfig;
  babelConfig = getCompileBabel(params, { babelPlugins, babelOptions, rootDir }) as any;
  // generate babel-plugin-import config
  const plugins: Array<string> = [];
  babelConfig.plugins = babelConfig.plugins.concat(plugins);
  if (alias) {
    const aliasRelative: any = {};
    Object.keys(alias).forEach((aliasKey) => {
      aliasRelative[aliasKey] = alias[aliasKey].startsWith('./') ? alias[aliasKey] : `./${alias[aliasKey]}`;
    });
    babelConfig.plugins = babelConfig.plugins.concat([[
      require.resolve('babel-plugin-module-resolver'),
      {
        root: ['./src'],
        alias: aliasRelative,
      },
    ]]);
  }
  return babelConfig;
};

interface IOts {
  context?: string;
  rootDir?: string;
}

class EsmGenWebpackPlugin {
  context: string;
  rootDir: string;
  constructor(options: IOts = {}) {
    this.context = options.context || process.cwd();
    this.rootDir = options.rootDir || 'src';
  }

  apply(compiler: Compiler) {
    compiler.hooks.afterEmit.tapAsync('EsmGenWebpackPlugin', (complication, callback) => {
      const sourcePath = path.resolve(this.context, this.rootDir)
      const compileTargets = ['es', 'lib'];

      const filesPath = glob.sync('**/*.*', { cwd: sourcePath, ignore: ['node_modules/**', '*.d.ts', '.?(ts|tsx|js|jsx)'] });

      // traverse to compile the js files
      const compileInfo: Array<any> = [];
      compileTargets.forEach((target) => {
        const destPath = path.join(this.context, target);
        fse.emptyDirSync(destPath);

        filesPath.forEach(filePath => {
          const sourceFile = path.join(sourcePath, filePath);
          if (!REG_JS.test(filePath) || REG_D_TS.test(filePath)) {
            try {
              fse.copySync(sourceFile, path.join(destPath, filePath));
              log.info(`file ${filePath} copy successfully!`);
            } catch (error) {
              log.error((error as Error).message);
            }
          } else {
            const babaelConfig = getBabelConfig({
              target,
              rootDir: this.context,
              babelPlugins: [],
              babelOptions: [],
              alias: {}
            });

            const rightPath = filePath.replace(REG_JS, '.js');
            // @ts-ignore
            const { code } = babel.transformFileSync(sourceFile, {
              filename: rightPath,
              ...babaelConfig,
            });
            const targetPath = path.join(destPath, rightPath);
            fse.ensureDirSync(path.dirname(targetPath));
            fse.writeFileSync(targetPath, code, 'utf-8');
            compileInfo.push({
              filePath,
              sourceFile,
              destPath,
            });
          }
        })
      });
      dtsCompiler(compileInfo);
      callback()
    });
  }
}

export default EsmGenWebpackPlugin;