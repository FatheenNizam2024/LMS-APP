module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // This entry must be the last plugin in the array.
      'react-native-reanimated/plugin',
    ],
  };
};