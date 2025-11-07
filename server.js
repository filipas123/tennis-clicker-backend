/**
 * Tennis Clicker Backend Server
 * WebSocket server that streams live tennis match data from SportScore API
 * Created by @zeddd_365
 */

import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Configuration
const PORT = process.env.PORT || 8765;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'sportscore1.p.rapidapi.com';
const AUTH_USERNAME = process.env.AUTH_USERNAME || 'admin';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'password';

// Tennis sport ID in SportScore API
const TENNIS_SPORT_ID = 2;

// Polling interval for match updates (in milliseconds)
const POLL_INTERVAL = 5000; // 5 seconds

// Store active subscriptions
const subscriptions = new Map();
const monitorIntervals = new Map();

/**
 * Fetch live tennis events from SportScore API
 */
async function fetchLiveTennisEvents() {
  try {
    const url = `https://${RAPIDAPI_HOST}/sports/${TENNIS_SPORT_ID}/events/live?page=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching live tennis events:', error.message);
    return [];
  }
}

/**
 * Fetch detailed event data by ID
 */
async function fetchEventDetails(eventId) {
  try {
    const url = `https://${RAPIDAPI_HOST}/events/${eventId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching event ${eventId}:`, error.message);
    return null;
  }
}

/**
 * Parse match data into simplified format
 */
function parseMatchData(event) {
  if (!event) return null;

  const homeTeam = event.home_team?.name || event.home_team?.name_short || 'Player 1';
  const awayTeam = event.away_team?.name || event.away_team?.name_short || 'Player 2';

  // Extract scores
  const homeScore = event.home_score || {};
  const awayScore = event.away_score || {};

  return {
    id: event.id.toString(),
    name: `${homeTeam} vs ${awayTeam}`,
    category: event.tournament?.name || event.tournament?.slug || 'Unknown',
    homeTeam,
    awayTeam,
    status: event.status || 'live',
    sets: {
      home: homeScore.current || 0,
      away: awayScore.current || 0
    },
    games: {
      home: homeScore.display || 0,
      away: awayScore.display || 0
    },
    points: {
      home: homeScore.point || 0,
      away: awayScore.point || 0
    }
  };
}

/**
 * Monitor a subscribed match for changes
 */
function monitorMatch(ws, eventId) {
  let previousData = null;

  const intervalId = setInterval(async () => {
    const eventData = await fetchEventDetails(eventId);
    if (!eventData) return;

    const matchData = parseMatchData(eventData);
    if (!matchData) return;

    // Check if points changed
    if (previousData) {
      const pointsChanged =
        previousData.points.home !== matchData.points.home ||
        previousData.points.away !== matchData.points.away;

      if (pointsChanged) {
        console.log(`[${eventId}] Point change detected:`, matchData.points);
      }
    }

    // Send update to client
    ws.send(JSON.stringify({
      type: 'match_update',
      data: matchData
    }));

    previousData = matchData;
  }, POLL_INTERVAL);

  monitorIntervals.set(eventId, intervalId);
  console.log(`Started monitoring match ${eventId}`);
}

/**
 * Stop monitoring a match
 */
function stopMonitoring(eventId) {
  const intervalId = monitorIntervals.get(eventId);
  if (intervalId) {
    clearInterval(intervalId);
    monitorIntervals.delete(eventId);
    console.log(`Stopped monitoring match ${eventId}`);
  }
}

/**
 * Handle WebSocket messages
 */
function handleMessage(ws, message) {
  try {
    const data = JSON.parse(message);
    console.log('Received message:', data.type);

    switch (data.type) {
      case 'authenticate':
        handleAuthentication(ws, data);
        break;

      case 'get_matches':
        handleGetMatches(ws);
        break;

      case 'subscribe':
        handleSubscribe(ws, data);
        break;

      case 'unsubscribe':
        handleUnsubscribe(ws);
        break;

      case 'refresh':
        handleRefresh(ws);
        break;

      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${data.type}`
        }));
    }
  } catch (error) {
    console.error('Error handling message:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Invalid message format'
    }));
  }
}

/**
 * Handle authentication
 */
function handleAuthentication(ws, data) {
  const { username, password } = data;

  if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
    ws.authenticated = true;
    ws.send(JSON.stringify({
      type: 'auth_success',
      message: 'Authentication successful'
    }));
    console.log('Client authenticated');
  } else {
    ws.send(JSON.stringify({
      type: 'auth_failed',
      message: 'Invalid credentials'
    }));
    console.log('Authentication failed');
  }
}

/**
 * Handle get matches request
 */
async function handleGetMatches(ws) {
  if (!ws.authenticated) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Not authenticated'
    }));
    return;
  }

  console.log('Fetching live tennis matches...');
  const events = await fetchLiveTennisEvents();

  const matches = events.map(event => ({
    id: event.id.toString(),
    name: `${event.home_team?.name || 'Player 1'} vs ${event.away_team?.name || 'Player 2'}`,
    category: event.tournament?.name || 'Unknown',
    homeTeam: event.home_team?.name || 'Player 1',
    awayTeam: event.away_team?.name || 'Player 2',
    status: event.status || 'live'
  }));

  ws.send(JSON.stringify({
    type: 'matches_list',
    data: matches,
    count: matches.length
  }));

  console.log(`Sent ${matches.length} matches to client`);
}

/**
 * Handle subscribe request
 */
function handleSubscribe(ws, data) {
  if (!ws.authenticated) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Not authenticated'
    }));
    return;
  }

  const { eventId } = data;
  if (!eventId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Event ID required'
    }));
    return;
  }

  // Unsubscribe from previous match if any
  if (ws.subscribedEventId) {
    stopMonitoring(ws.subscribedEventId);
  }

  // Subscribe to new match
  ws.subscribedEventId = eventId;
  subscriptions.set(eventId, ws);

  ws.send(JSON.stringify({
    type: 'subscribed',
    eventId,
    message: `Subscribed to match ${eventId}`
  }));

  // Start monitoring
  monitorMatch(ws, eventId);
}

/**
 * Handle unsubscribe request
 */
function handleUnsubscribe(ws) {
  if (ws.subscribedEventId) {
    stopMonitoring(ws.subscribedEventId);
    subscriptions.delete(ws.subscribedEventId);
    ws.subscribedEventId = null;

    ws.send(JSON.stringify({
      type: 'unsubscribed',
      message: 'Unsubscribed from match'
    }));
  }
}

/**
 * Handle refresh request
 */
async function handleRefresh(ws) {
  if (ws.subscribedEventId) {
    // Immediately fetch and send updated match data
    const eventData = await fetchEventDetails(ws.subscribedEventId);
    if (eventData) {
      const matchData = parseMatchData(eventData);
      if (matchData) {
        ws.send(JSON.stringify({
          type: 'match_update',
          data: matchData
        }));
        ws.send(JSON.stringify({
          type: 'info',
          message: '🔄 Match data refreshed'
        }));
        console.log(`[${ws.subscribedEventId}] Forced refresh completed`);
        return;
      }
    }
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to refresh match data'
    }));
  } else {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'No match subscribed'
    }));
  }
}

/**
 * Handle client disconnect
 */
function handleDisconnect(ws) {
  if (ws.subscribedEventId) {
    stopMonitoring(ws.subscribedEventId);
    subscriptions.delete(ws.subscribedEventId);
  }
  console.log('Client disconnected');
}

/**
 * Start WebSocket server
 */
function startServer() {
  const wss = new WebSocketServer({ port: PORT });

  console.log('='.repeat(60));
  console.log('🎾 Tennis Clicker Backend Server');
  console.log('='.repeat(60));
  console.log(`Server started on port ${PORT}`);
  console.log(`WebSocket URL: ws://localhost:${PORT}`);
  console.log(`API: SportScore (RapidAPI)`);
  console.log(`Auth: ${AUTH_USERNAME} / ${AUTH_PASSWORD}`);
  console.log('='.repeat(60));

  if (!RAPIDAPI_KEY) {
    console.warn('⚠️  WARNING: RAPIDAPI_KEY not set!');
    console.warn('Please set RAPIDAPI_KEY in .env file');
  }

  wss.on('connection', (ws) => {
    console.log('New client connected');
    ws.authenticated = false;
    ws.subscribedEventId = null;

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to Tennis Clicker server'
    }));

    // Handle messages
    ws.on('message', (message) => {
      handleMessage(ws, message.toString());
    });

    // Handle disconnect
    ws.on('close', () => {
      handleDisconnect(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    
    // Stop all monitoring
    for (const intervalId of monitorIntervals.values()) {
      clearInterval(intervalId);
    }

    wss.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

// Start the server
startServer();
