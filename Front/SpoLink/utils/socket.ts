// Front/SpoLink/utils/socket.ts
import  io  from 'socket.io-client';
import { SERVER_URL } from '../constants';

const socket = io(SERVER_URL, {
  transports: ['websocket'],
  autoConnect: false, // 수동 연결
});

export default socket;
