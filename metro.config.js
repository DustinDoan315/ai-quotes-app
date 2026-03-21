const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

const asyncHookMain = path.join(
  __dirname,
  "node_modules/react-async-hook/dist/index.js",
);

const tslibCjs = path.join(__dirname, "node_modules/tslib/tslib.js");

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-async-hook") {
    return {
      filePath: asyncHookMain,
      type: "sourceFile",
    };
  }
  if (moduleName === "tslib") {
    return {
      filePath: tslibCjs,
      type: "sourceFile",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
