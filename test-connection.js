/**
 * WebSocket Connection Test Script
 * Tests Tennis Clicker backend server connection
 */

import WebSocket from 'ws';

// Configuration
const WS_URL = process.argv[2] || 'ws://localhost:8765';
const USERNAME = process.argv[3] || 'admin';
const PASSWORD = process.argv[4] || 'password';

console.log('='.repeat(60));
console.log('🎾 Tennis Clicker WebSocket Connection Test');
console.log('='.repeat(60));
console.log(`URL: ${WS_URL}`);
console.log(`Username: ${USERNAME}`);
console.log('='.repeat(60));
console.log('');

let ws;
let authenticated = false;

function connect() {
  console.log('📡 Connecting to server...');
  
  try {
    ws = new WebSocket(WS_URL);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }

  ws.on('open', () => {
    console.log('✅ Connected successfully!');
    console.log('');
    
    // Send authentication
    console.log('🔐 Authenticating...');
    ws.send(JSON.stringify({
      type: 'authenticate',
      username: USERNAME,
      password: PASSWORD
    }));
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(message);
    } catch (error) {
      console.error('❌ Failed to parse message:', error.message);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });

  ws.on('close', () => {
    console.log('');
    console.log('🔌 Connection closed');
    process.exit(0);
  });
}

function handleMessage(message) {
  console.log(`📨 Received: ${message.type}`);

  switch (message.type) {
    case 'connection':
      console.log(`   ${message.message}`);
      break;

    case 'auth_success':
      console.log('✅ Authentication successful!');
      authenticated = true;
      console.log('');
      
      // Request matches
      console.log('📋 Requesting live matches...');
      ws.send(JSON.stringify({
        type: 'get_matches'
      }));
      break;

    case 'auth_failed':
      console.log('❌ Authentication failed!');
      console.log(`   ${message.message}`);
      ws.close();
      break;

    case 'matches_list':
      console.log(`✅ Received ${message.count} matches`);
      console.log('');
      
      if (message.data && message.data.length > 0) {
        console.log('📊 Available matches:');
        message.data.slice(0, 5).forEach((match, index) => {
          console.log(`   ${index + 1}. ${match.name}`);
          console.log(`      Category: ${match.category}`);
          console.log(`      Status: ${match.status}`);
        });
        
        if (message.data.length > 5) {
          console.log(`   ... and ${message.data.length - 5} more`);
        }
      } else {
        console.log('   No live matches at the moment');
      }
      
      console.log('');
      console.log('='.repeat(60));
      console.log('✅ All tests passed!');
      console.log('='.repeat(60));
      
      // Close connection
      setTimeout(() => {
        ws.close();
      }, 1000);
      break;

    case 'error':
      console.log('❌ Server error:', message.message);
      break;

    default:
      console.log(`   ${JSON.stringify(message, null, 2)}`);
  }
}

// Start connection
connect();

// Timeout after 30 seconds
setTimeout(() => {
  if (!authenticated) {
    console.error('');
    console.error('❌ Test timeout - no response from server');
    process.exit(1);
  }
}, 30000);
