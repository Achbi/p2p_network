// backend/chatServer.js
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const logMessage = require('./logger');

function startChatServer() {
  const wss = new WebSocket.Server({ port: 7071 });
  const clients = new Set();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('New peer connected');

    ws.on('message', (msg) => {
      console.log('Received:', msg.toString());
      logMessage(msg.toString());

      // Broadcast to all other peers
      for (const client of clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(msg.toString());
        }
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Peer disconnected');
    });
  });

  console.log('Chat server running on ws://localhost:7071');
}

module.exports = startChatServer;
