import 'react-native-gesture-handler';  // 👈 이 줄이 꼭 맨 위에 있어야 함
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
