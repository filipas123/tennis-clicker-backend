# Tennis Clicker Backend Server

WebSocket server that streams live tennis match data from SportScore API to Tennis Clicker clients.

## Features

- ✅ **WebSocket Server** - Real-time bidirectional communication
- ✅ **SportScore API Integration** - Live tennis match data
- ✅ **Authentication** - Username/password protection
- ✅ **Match Monitoring** - Point-by-point score tracking
- ✅ **Auto-refresh** - Polls API every 5 seconds for updates
- ✅ **Multiple Clients** - Supports concurrent connections

## Prerequisites

- Node.js 18+ and pnpm (or npm)
- RapidAPI account with SportScore API access

## Installation

1. **Install dependencies:**

```bash
pnpm install
```

2. **Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and add your RapidAPI key:

```env
RAPIDAPI_KEY=your_actual_api_key_here
AUTH_USERNAME=admin
AUTH_PASSWORD=your_secure_password
PORT=8765
```

## Getting a RapidAPI Key

1. Go to [RapidAPI SportScore](https://rapidapi.com/tipsters/api/sportscore1)
2. Sign up or log in
3. Subscribe to the **BASIC plan** (FREE - $0.00/month)
4. Copy your API key from the dashboard
5. Paste it into `.env` file

## Usage

### Start the server:

```bash
pnpm start
```

Or for development with auto-reload:

```bash
pnpm dev
```

The server will start on `ws://localhost:8765` (or your configured PORT).

### Server Output:

```
============================================================
🎾 Tennis Clicker Backend Server
============================================================
Server started on port 8765
WebSocket URL: ws://localhost:8765
API: SportScore (RapidAPI)
Auth: admin / password
============================================================
```

## WebSocket Protocol

### Client → Server Messages

**Authenticate:**
```json
{
  "type": "authenticate",
  "username": "admin",
  "password": "password"
}
```

**Get Live Matches:**
```json
{
  "type": "get_matches"
}
```

**Subscribe to Match:**
```json
{
  "type": "subscribe",
  "eventId": "12345"
}
```

**Unsubscribe:**
```json
{
  "type": "unsubscribe"
}
```

**Force Refresh:**
```json
{
  "type": "refresh"
}
```

### Server → Client Messages

**Connection:**
```json
{
  "type": "connection",
  "message": "Connected to Tennis Clicker server"
}
```

**Authentication Success:**
```json
{
  "type": "auth_success",
  "message": "Authentication successful"
}
```

**Matches List:**
```json
{
  "type": "matches_list",
  "data": [
    {
      "id": "12345",
      "name": "Player A vs Player B",
      "category": "ATP Tour",
      "homeTeam": "Player A",
      "awayTeam": "Player B",
      "status": "live"
    }
  ],
  "count": 1
}
```

**Match Update:**
```json
{
  "type": "match_update",
  "data": {
    "id": "12345",
    "name": "Player A vs Player B",
    "category": "ATP Tour",
    "homeTeam": "Player A",
    "awayTeam": "Player B",
    "status": "live",
    "sets": { "home": 1, "away": 0 },
    "games": { "home": 3, "away": 2 },
    "points": { "home": 40, "away": 30 }
  }
}
```

**Subscribed:**
```json
{
  "type": "subscribed",
  "eventId": "12345",
  "message": "Subscribed to match 12345"
}
```

**Error:**
```json
{
  "type": "error",
  "message": "Error description"
}
```

## Configuration

### Environment Variables

- `PORT` - WebSocket server port (default: 8765)
- `RAPIDAPI_KEY` - Your RapidAPI key for SportScore API
- `AUTH_USERNAME` - Authentication username (default: admin)
- `AUTH_PASSWORD` - Authentication password (default: password)

### Polling Interval

The server polls the SportScore API every 5 seconds for match updates. To change this, edit `POLL_INTERVAL` in `server.js`:

```javascript
const POLL_INTERVAL = 5000; // milliseconds
```

## Deployment

### Local Development

```bash
pnpm dev
```

### Production

```bash
pnpm start
```

### Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start server.js --name tennis-clicker-backend

# View logs
pm2 logs tennis-clicker-backend

# Restart
pm2 restart tennis-clicker-backend

# Stop
pm2 stop tennis-clicker-backend
```

### Docker (Optional)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8765
CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t tennis-clicker-backend .
docker run -p 8765:8765 --env-file .env tennis-clicker-backend
```

### Cloud Deployment

The server can be deployed to:
- **Heroku** - Add `Procfile`: `web: node server.js`
- **Railway** - Connect GitHub repo and deploy
- **DigitalOcean App Platform** - Deploy from GitHub
- **AWS EC2** - Run with PM2 on Ubuntu instance
- **Google Cloud Run** - Containerized deployment

## Troubleshooting

### API Key Issues

**Error: API request failed: 401**
- Check your RAPIDAPI_KEY is correct
- Verify you're subscribed to SportScore API
- Ensure your subscription is active

**Error: API request failed: 429**
- You've exceeded the free tier limit
- Wait for the rate limit to reset
- Consider upgrading your RapidAPI plan

### Connection Issues

**Client can't connect:**
- Verify server is running
- Check PORT in .env matches client configuration
- Ensure no firewall blocking WebSocket connections
- For remote connections, use public IP or domain

### No Matches Returned

- Check if there are live tennis matches at the moment
- Verify SportScore API is working
- Check server logs for API errors

## Development

### Project Structure

```
tennis-clicker-backend/
├── server.js           # Main WebSocket server
├── package.json        # Dependencies
├── .env.example        # Environment template
├── .env                # Your configuration (gitignored)
└── README.md           # This file
```

### Adding Features

The server is modular and easy to extend:

- **Add new message types** - Add cases to `handleMessage()`
- **Change API** - Modify `fetchLiveTennisEvents()` and `fetchEventDetails()`
- **Add logging** - Integrate Winston or Pino
- **Add database** - Store match history, user preferences
- **Add rate limiting** - Prevent API abuse

## Security

- **Change default credentials** in production
- **Use HTTPS/WSS** for encrypted connections
- **Implement rate limiting** to prevent abuse
- **Validate all inputs** from clients
- **Keep dependencies updated** with `npm audit`

## Performance

- **Polling interval** - Balance between freshness and API limits
- **Connection limits** - Monitor concurrent connections
- **Memory usage** - Clear old data periodically
- **Error handling** - Graceful degradation on API failures

## License

MIT License - Created by @zeddd_365

## Support

For issues or questions:
- Check this README
- Review server logs
- Test with a WebSocket client (e.g., wscat)
- Verify API key and subscription

## Related Projects

- **Tennis Clicker Web** - React web application
- **Tennis Clicker Extension** - Browser extension for auto-click
- **Tennis Clicker Desktop** - Electron desktop application

---

**Made with ❤️ for accessibility**
