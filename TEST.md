# Testing Your Tennis Clicker Backend

## Quick Test

Test your deployed WebSocket server:

```bash
node test-connection.js wss://your-railway-url.up.railway.app admin password
```

## Test Local Server

```bash
# Start server in one terminal
pnpm start

# Test in another terminal
node test-connection.js ws://localhost:8765 admin password
```

## Expected Output

```
============================================================
🎾 Tennis Clicker WebSocket Connection Test
============================================================
URL: wss://your-server.up.railway.app
Username: admin
============================================================

📡 Connecting to server...
✅ Connected successfully!

🔐 Authenticating...
📨 Received: connection
   Connected to Tennis Clicker server
📨 Received: auth_success
✅ Authentication successful!

📋 Requesting live matches...
📨 Received: matches_list
✅ Received 15 matches

📊 Available matches:
   1. Player A vs Player B
      Category: ATP Tour
      Status: live
   2. Player C vs Player D
      Category: WTA Tour
      Status: live
   ... and 13 more

============================================================
✅ All tests passed!
============================================================

🔌 Connection closed
```

## Troubleshooting

### Connection Refused
- Check server is running
- Verify URL is correct
- Check firewall settings

### Authentication Failed
- Verify username and password
- Check server configuration

### No Matches
- No live tennis matches at the moment
- Check RapidAPI key is valid
- Verify API subscription is active

## Manual Test with wscat

Install wscat:
```bash
npm install -g wscat
```

Connect and test:
```bash
wscat -c wss://your-server.up.railway.app

# After connection, send:
{"type":"authenticate","username":"admin","password":"password"}

# Then request matches:
{"type":"get_matches"}
```
