// babel-preset-expo carries the whole native chain: TypeScript, JSX, the React Compiler enabled through
// `experiments.reactCompiler` in app.json, and the Reanimated worklets plugin. Nothing is added by hand.

module.exports = (api) => {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
  };
};
