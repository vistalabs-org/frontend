// Custom webpack plugin to handle fs module
class FsModulePlugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('FsModulePlugin', (normalModuleFactory) => {
      normalModuleFactory.hooks.beforeResolve.tap('FsModulePlugin', (resolveData) => {
        if (resolveData.request === 'fs') {
          resolveData.request = false;
        }
        return resolveData;
      });
    });
  }
}

module.exports = FsModulePlugin; 