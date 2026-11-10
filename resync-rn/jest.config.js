module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-url-polyfill|@notifee)/)',
  ],
  moduleNameMapper: {
    '^@notifee/react-native$': '@notifee/react-native/jest-mock.js',
  },
};
