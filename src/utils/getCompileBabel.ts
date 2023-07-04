import {formatPathForWin} from 'render-utils'
import {getBabelConfig} from 'moga-app-base-webpack-config'


export = (options = {}, { babelPlugins, babelOptions, rootDir }:{babelPlugins:any,babelOptions:any,rootDir:string}) => {
  const { modules } = options as any;

  const defaultBabel = getBabelConfig();

  const additionalPlugins:any= [
    // ES6/ES7转化为对babel-runtime的引用，减少代码体积
    [require.resolve('@babel/plugin-transform-runtime'), {
      corejs: false,
      helpers: true,
      regenerator: true,
      useESModules: false,
    }],
    // 为类添加属性和方法的简写 loose是否启用宽松模式，减少代码体积
    [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
    // 为类提供添加私有方法的语法
    [require.resolve('@babel/plugin-proposal-private-methods'), { loose: true }],
    // 为类提供添加私有属性的语法
    [require.resolve('@babel/plugin-proposal-private-property-in-object'), { loose: true }],
  ];

  const formatedBabelPlugins = (babelPlugins || []).map((plugin:any) => {
    const [pluginName, pluginOptions, ...restOptions] = Array.isArray(plugin) ? plugin : [plugin];
    // 用户自定义的 babelPlugins 需要从项目目录寻址
    const pluginPath = require.resolve(pluginName, { paths: [rootDir] });
    return pluginOptions ? [pluginPath, pluginOptions, ...(restOptions || [])] : pluginPath;
  });

  defaultBabel.plugins = [...defaultBabel.plugins, ...additionalPlugins, ...formatedBabelPlugins];

  // modify @babel/preset-env options
  defaultBabel.presets = defaultBabel.presets.map((preset) => {
    const [presetPath, presetOptions] = Array.isArray(preset) ? preset : [preset];
    const targetConfig = babelOptions.find(({ name }:{name:string}) => (formatPathForWin(presetPath as string).indexOf(name) > -1));
    const modifyOptions = targetConfig && targetConfig.options;

    if (formatPathForWin(presetPath as string).indexOf('@babel/preset-env') > -1) {
      // default preset-env options for component compile
      return [presetPath, { modules, loose: true, ...(modifyOptions || {}) }];
    }
    if (presetOptions && modifyOptions) {
      return [presetPath, { ...presetOptions, ...modifyOptions }];
    }
    return preset;
  });
  return defaultBabel;
};
