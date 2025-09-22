import io from 'socket.io-client';

// Use explicit backend URL from environment
const socket = io(process.env.REACT_APP_API_URL, {
  transports: ["websocket"],
  autoConnect: false // connect manually when needed
});

export default socket;