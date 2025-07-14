import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css'; // You can keep or remove this based on your styling needs

// Connect to your Socket.io server
const socket = io('http://localhost:3001'); // Ensure this matches your server's port

function App() {
  const [message, setMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [socketId, setSocketId] = useState('');

  useEffect(() => {
    // Event listener for successful connection
    socket.on('connect', () => {
      console.log('Connected to Socket.io server!');
      setSocketId(socket.id); // Store the client's socket ID
    });

    // Event listener for receiving messages
    socket.on('receive_message', (data) => {
      console.log('Message received:', data);
      setReceivedMessages((prevMessages) => [...prevMessages, data]);
    });

    // Event listener for disconnection
    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server!');
    });

    // Cleanup on component unmount
    return () => {
      socket.off('connect');
      socket.off('receive_message');
      socket.off('disconnect');
    };
  }, []); // Empty dependency array means this effect runs once on mount

  const sendMessage = () => {
    if (message.trim()) {
      const messageData = {
        message: message,
        senderId: socket.id, // Or a username after implementing authentication
        timestamp: new Date().toLocaleTimeString(),
      };
      socket.emit('send_message', messageData);
      setReceivedMessages((prevMessages) => [...prevMessages, { ...messageData, isSent: true }]); // Add to own messages, mark as sent
      setMessage(''); // Clear input field
    }
  };

  return (
    <div className="App" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Real-Time Chat Application</h1>
      <p>Your Socket ID: {socketId}</p>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          style={{ width: '300px', padding: '8px', marginRight: '10px' }}
        />
        <button onClick={sendMessage} style={{ padding: '8px 15px' }}>Send Message</button>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '10px', height: '300px', overflowY: 'scroll' }}>
        {receivedMessages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '5px', padding: '5px', borderRadius: '5px', background: msg.isSent ? '#e0ffe0' : '#f0f0f0', textAlign: msg.isSent ? 'right' : 'left' }}>
            <strong>{msg.senderId === socketId ? 'You' : msg.senderId}:</strong> {msg.message} <small>({msg.timestamp})</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;