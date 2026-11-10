/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {registerNotificationHandlers} from './src/services/notifications';
import App from './App';
import {name as appName} from './app.json';

registerNotificationHandlers();
AppRegistry.registerComponent(appName, () => App);
