module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: ['node_modules/(?!(react-native[^/]*|@react-native|@react-navigation|@notifee)/)'],
  moduleNameMapper: {'^@notifee/react-native$': '@notifee/react-native/jest-mock.js', '^@react-native-async-storage/async-storage$': '@react-native-async-storage/async-storage/jest/async-storage-mock.js'},
};
