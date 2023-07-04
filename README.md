## 介绍

生成esm规范和cjs规范包的webpack插件。

该插件会把指定的位置目录下的代码，编译成esm和cjs格式的代码，并会生成ts类型文件。插件还会帮你把源码中其他类型的文件，比如css文件，直接生成到构建目录中去，其位置源码中位置保持一致。

插件生成的代码目录分别为es和lib，其中es中存放esm规范下的包，而lib中存放cjs规范下的包。

## 用法

```javascript
const EsmGenWebpackPlugin= require('esm-gen-webpack-plugin');

// webpack配置
module.exports = {
  // 其他配置
  plugins: [
    new EsmGenWebpackPlugin(options)
  ]
}
```
## 配置

| 选项 | 作用 | 默认值 |
| --- | --- | --- |
| context | 插件运行的根目录 | process.cwd() |
| rootDir | 需要编译的源代码目录，基于context | src |


