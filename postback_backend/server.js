const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const rateLimit = require('express-rate-limit');
const axios = require('axios'); // Add at the top if not already
const nodemailer = require('nodemailer');
const fetch = require('node-fetch'); // If not already installed: npm install node-fetch
const { v4: uuidv4 } = require('uuid'); // npm install uuid

// Import the proxy router
const proxyRouter = require('./proxy');

const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, 'postbacks.json');
const GAMES_FILE = path.join(__dirname, 'games.json');
const API_KEYS_FILE = path.join(__dirname, 'api_keys.json');
const PLAY_RESPONSES_FILE = path.join(__dirname, 'play_responses.json');
const FETCH_HISTORY_FILE = path.join(__dirname, 'fetch_history.json');
const EMAIL_CONFIG_FILE = path.join(__dirname, 'email_config.json');
const SCHEDULES_FILE = path.join(__dirname, 'offer_schedules.json');
const SCHEDULED_EMAILS_FILE = path.join(__dirname, 'scheduled_emails.json');
const CAMPAIGNS_FILE = path.join(__dirname, 'campaigns.json');

// Helper: Load campaigns
async function loadCampaigns() {
  try {
    const exists = await fs.pathExists(CAMPAIGNS_FILE);
    if (!exists) return [];
    return await fs.readJson(CAMPAIGNS_FILE);
  } catch {
    return [];
  }
}

// Helper: Save campaigns
async function saveCampaigns(campaigns) {
  await fs.writeJson(CAMPAIGNS_FILE, campaigns, { spaces: 2 });
}

// Helper: Load play responses
const loadPlayResponses = async () => {
  try {
    const exists = await fs.pathExists(PLAY_RESPONSES_FILE);
    if (!exists) return [];
    return await fs.readJson(PLAY_RESPONSES_FILE);
  } catch {
    return [];
  }
};
// Helper: Save play responses
const savePlayResponses = async (responses) => {
  await fs.writeJson(PLAY_RESPONSES_FILE, responses, { spaces: 2 });
};

// Helper: Load postbacks from file
const loadPostbacks = async () => {
  try {
    const exists = await fs.pathExists(DATA_FILE);
    if (!exists) return [];
    return await fs.readJson(DATA_FILE);
  } catch {
    return [];
  }
};

// Helper: Save postbacks to file
const savePostbacks = async (postbacks) => {
  await fs.writeJson(DATA_FILE, postbacks, { spaces: 2 });
};

// Helper: Load games from file
const loadGames = async () => {
  try {
    const exists = await fs.pathExists(GAMES_FILE);
    if (!exists) return [];
    return await fs.readJson(GAMES_FILE);
  } catch {
    return [];
  }
};
// Helper: Save games to file
const saveGames = async (games) => {
  await fs.writeJson(GAMES_FILE, games, { spaces: 2 });
};

// Helper: Load API keys from file
const loadApiKeys = async () => {
  try {
    const exists = await fs.pathExists(API_KEYS_FILE);
    if (!exists) return [];
    return await fs.readJson(API_KEYS_FILE);
  } catch {
    return [];
  }
};
// Helper: Save API keys to file
const saveApiKeys = async (keys) => {
  await fs.writeJson(API_KEYS_FILE, keys, { spaces: 2 });
};
// Helper: Generate random API key
const generateApiKey = () => {
  return (
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10)
  );
};

// Helper: Load fetch history
const loadFetchHistory = async () => {
  try {
    const exists = await fs.pathExists(FETCH_HISTORY_FILE);
    if (!exists) return [];
    return await fs.readJson(FETCH_HISTORY_FILE);
  } catch {
    return [];
  }
};
// Helper: Save fetch history
const saveFetchHistory = async (history) => {
  await fs.writeJson(FETCH_HISTORY_FILE, history, { spaces: 2 });
};

// Load email config from file if exists
async function loadEmailConfig() {
  try {
    const exists = await fs.pathExists(EMAIL_CONFIG_FILE);
    if (!exists) return {
      host: '', port: 465, secure: true, user: '', pass: '', from: ''
    };
    return await fs.readJson(EMAIL_CONFIG_FILE);
  } catch {
    return { host: '', port: 465, secure: true, user: '', pass: '', from: '' };
  }
}
// Save email config to file
async function saveEmailConfig(config) {
  await fs.writeJson(EMAIL_CONFIG_FILE, config, { spaces: 2 });
}

let emailConfig;
try {
  if (fs.existsSync(EMAIL_CONFIG_FILE)) {
    emailConfig = fs.readJsonSync(EMAIL_CONFIG_FILE);
  } else {
    emailConfig = { host: '', port: 465, secure: true, user: '', pass: '', from: '' };
  }
} catch {
  emailConfig = { host: '', port: 465, secure: true, user: '', pass: '', from: '' };
}

// Helper: Load schedules
async function loadSchedules() {
  try {
    const exists = await fs.pathExists(SCHEDULES_FILE);
    if (!exists) return [];
    return await fs.readJson(SCHEDULES_FILE);
  } catch {
    return [];
  }
}
// Helper: Save schedules
async function saveSchedules(schedules) {
  await fs.writeJson(SCHEDULES_FILE, schedules, { spaces: 2 });
}

// Helper: Load scheduled emails
async function loadScheduledEmails() {
  try {
    const exists = await fs.pathExists(SCHEDULED_EMAILS_FILE);
    if (!exists) return [];
    return await fs.readJson(SCHEDULED_EMAILS_FILE);
  } catch {
    return [];
  }
}

// Helper: Save scheduled emails
async function saveScheduledEmails(emails) {
  await fs.writeJson(SCHEDULED_EMAILS_FILE, emails, { spaces: 2 });
}

// Rate limiter: 10 requests per IP per day for public API
const publicApiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'API rate limit exceeded. You are allowed 10 requests per day.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});


const cheerio = require('cheerio');
const bodyParser = require('body-parser');
const { or } = require('firebase/firestore');
// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // React dev server URL
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add proxy routes
app.use('/api', proxyRouter);

// Endpoint to receive postbacks (both GET and POST)
app.all('/api/receive-postback', async (req, res) => {
  const requestData = {
    method: req.method,
    receivedAt: new Date().toISOString(),
    query: req.query,  // Always include query parameters
    headers: req.headers,
    ip: req.ip,
  };

  // For POST/PUT/PATCH with body
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && Object.keys(req.body).length > 0) {
    requestData.body = req.body;
  }
  // For GET/DELETE or when no body is present
  else if (Object.keys(req.query).length > 0) {
    requestData.body = req.query;
  }
  
  const postbacks = await loadPostbacks();
  postbacks.push(requestData);
  await savePostbacks(postbacks);
  
  // Return a simple response
  res.status(200).json({ 
    success: true, 
    message: 'Postback received', 
    method: req.method,
    data: requestData 
  });
});

// Endpoint to get all received postbacks
app.get('/api/received-postbacks', async (req, res) => {
  const postbacks = await loadPostbacks();
  res.json(postbacks);
});

// Optional: clear postbacks
app.delete('/api/received-postbacks', async (req, res) => {
  await savePostbacks([]);
  res.json({ message: 'All postbacks cleared' });
});

// Get all games
app.get('/api/games', async (req, res) => {
  const games = await loadGames();
  res.json(games);
});
// Add a new game
app.post('/api/games', async (req, res) => {
  const { title, genre, rating, image, link } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  const games = await loadGames();
  const newGame = {
    id: Date.now().toString(),
    title,
    genre,
    rating,
    image,
    link,
    createdAt: new Date().toISOString(),
    default_payout: req.body.default_payout || 0,
    monthly_conversion_cap: req.body.monthly_conversion_cap || 0,
    status: req.body.status || 'active',
    expiration_date: req.body.expiration_date || null,
    payout_type: req.body.payout_type || 'fixed'
  };
  games.push(newGame);
  await saveGames(games);
  res.status(201).json(newGame);
});
// Delete a game by id
app.delete('/api/games/:id', async (req, res) => {
  const { id } = req.params;
  let games = await loadGames();
  const initialLength = games.length;
  games = games.filter(g => g.id !== id);
  if (games.length === initialLength) {
    return res.status(404).json({ error: 'Game not found.' });
  }
  await saveGames(games);
  res.json({ message: 'Game deleted.' });
});

// Create a new random API key (no user association)
app.post('/api/apikeys', async (req, res) => {
  const { name } = req.body;
  const keys = await loadApiKeys();
  const newKey = {
    key: generateApiKey(),
    name: name || '',
    createdAt: new Date().toISOString(),
    usage: {}
  };
  keys.push(newKey);
  await saveApiKeys(keys);
  res.status(201).json(newKey);
});

let apiKeys = [];

app.get('/api/apikeys', async (req, res) => {
  const keys = await loadApiKeys();
  res.json(keys);
});

// Rename an API key
app.patch('/api/apikeys/:key', async (req, res) => {
  const { key } = req.params;
  const { name } = req.body;
  let keys = await loadApiKeys();
  const idx = keys.findIndex(k => k.key === key);
  if (idx === -1) return res.status(404).json({ error: 'API key not found.' });
  keys[idx].name = name || '';
  await saveApiKeys(keys);
  res.json(keys[idx]);
});

// API endpoint to get all campaigns
app.get('/api/campaigns', async (req, res) => {
  try {
    let campaigns = await loadCampaigns();
    if (campaigns.length === 0) {
      // Generate dummy data if no campaigns exist
      campaigns = [
        {
          id: 'campaign1',
          campaignName: 'Summer Sale 2024',
          subjectLine: 'Huge Discounts on All Items!',
          interactions: [
            { type: 'received', email: 'user1@example.com', firstName: 'John', lastName: 'Doe', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'opened', email: 'user1@example.com', firstName: 'John', lastName: 'Doe', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'clicked', email: 'user1@example.com', firstName: 'John', lastName: 'Doe', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'received', email: 'user2@example.com', firstName: 'Jane', lastName: 'Smith', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'opened', email: 'user2@example.com', firstName: 'Jane', lastName: 'Smith', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'received', email: 'user3@example.com', firstName: 'Peter', lastName: 'Jones', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'bounced', email: 'user4@example.com', firstName: 'Alice', lastName: 'Brown', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'replied', email: 'user1@example.com', firstName: 'John', lastName: 'Doe', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
          ]
        },
        {
          id: 'campaign2',
          campaignName: 'Winter Collection Launch',
          subjectLine: 'Discover Our New Arrivals!',
          interactions: [
            { type: 'received', email: 'user5@example.com', firstName: 'Chris', lastName: 'Green', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'opened', email: 'user5@example.com', firstName: 'Chris', lastName: 'Green', timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'received', email: 'user6@example.com', firstName: 'Sarah', lastName: 'White', timestamp: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'opened', email: 'user6@example.com', firstName: 'Sarah', lastName: 'White', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
            { type: 'clicked', email: 'user6@example.com', firstName: 'Sarah', lastName: 'White', timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() }
          ]
        }
      ];
      await saveCampaigns(campaigns);
    }
    res.json(campaigns);
  } catch (error) {
    console.error('Error loading campaigns:', error);
    res.status(500).json({ message: 'Error loading campaigns' });
  }
});

// API endpoint to get all API keys
app.get('/api/api-keys', async (req, res) => {
  const keys = await loadApiKeys();
  res.json(keys);
});

// Delete/revoke an API key
app.delete('/api/apikeys/:key', async (req, res) => {
  const { key } = req.params;
  let keys = await loadApiKeys();
  const initialLength = keys.length;
  keys = keys.filter(k => k.key !== key);
  if (keys.length === initialLength) {
    return res.status(404).json({ error: 'API key not found.' });
  }
  await saveApiKeys(keys);
  res.json({ message: 'API key revoked.' });
});

// Helper: Check API key and rate limit (shared quota for all public endpoints)
async function checkApiKeyAndRateLimit(req, res) {
  const apiKey = req.header('x-api-key');
  if (!apiKey) {
    res.status(401).json({ error: 'API key required in x-api-key header.' });
    return null;
  }
  const keys = await loadApiKeys();
  const keyObj = keys.find(k => k.key === apiKey);
  if (!keyObj) {
    res.status(403).json({ error: 'Invalid API key.' });
    return null;
  }
  // Rate limit: 10 requests per key per day (shared across all public endpoints)
  const today = new Date().toISOString().slice(0, 10);
  if (!keyObj.usage[today]) keyObj.usage[today] = 0;
  if (keyObj.usage[today] >= 10) {
    res.status(429).json({ error: 'API rate limit exceeded for this key. 10 requests per day allowed.' });
    return null;
  }
  keyObj.usage[today]++;
  await saveApiKeys(keys);
  return keyObj;
}

// Public API endpoint for games with API key and per-key rate limiting
app.get('/api/public/games', async (req, res) => {
  const keyObj = await checkApiKeyAndRateLimit(req, res);
  if (!keyObj) return;
  const games = await loadGames();
  res.json(games);
});

// Public API endpoint for postbacks
app.get('/api/public/postbacks', async (req, res) => {
  const keyObj = await checkApiKeyAndRateLimit(req, res);
  if (!keyObj) return;
  const postbacks = await loadPostbacks();
  res.json(postbacks);
});

// Public API endpoint for user stats (placeholder)
app.get('/api/public/users', async (req, res) => {
  const keyObj = await checkApiKeyAndRateLimit(req, res);
  if (!keyObj) return;
  // Placeholder: return static array
  const users = [
    { userId: 'user1', coins: 100, level: 2, completedTasks: 5 },
    { userId: 'user2', coins: 250, level: 4, completedTasks: 20 },
    { userId: 'user3', coins: 50, level: 1, completedTasks: 2 },
  ];
  res.json(users);
});

// Get all schedules
app.get('/api/schedules', async (req, res) => {
  const schedules = await loadSchedules();
  res.json(schedules);
});

// Get schedules for an offer
app.get('/api/schedules/:offerId', async (req, res) => {
  const { offerId } = req.params;
  const schedules = await loadSchedules();
  res.json(schedules.filter(s => String(s.offerId) === String(offerId)));
});

// Add new schedules (bulk)
app.post('/api/schedules', async (req, res) => {
  const { offerIds, url, startDate, endDate, startTime, endTime } = req.body;
  if (!offerIds || !Array.isArray(offerIds) || !url || !startDate || !endDate || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  const schedules = await loadSchedules();
  const newSchedules = offerIds.map(offerId => ({
    id: uuidv4(),
    offerId,
    url,
    startDate,
    endDate,
    startTime,
    endTime
  }));
  await saveSchedules([...schedules, ...newSchedules]);
  res.json({ message: 'Schedules added.', newSchedules });
});

// Delete a schedule
app.delete('/api/schedules/:scheduleId', async (req, res) => {
  const { scheduleId } = req.params;
  let schedules = await loadSchedules();
  const initialLength = schedules.length;
  schedules = schedules.filter(s => s.id !== scheduleId);
  await saveSchedules(schedules);
  res.json({ message: schedules.length < initialLength ? 'Schedule deleted.' : 'Schedule not found.' });
});

// Edit a schedule
app.patch('/api/schedules/:scheduleId', async (req, res) => {
  const { scheduleId } = req.params;
  const { url, startDate, endDate, startTime, endTime } = req.body;
  let schedules = await loadSchedules();
  const idx = schedules.findIndex(s => s.id === scheduleId);
  if (idx === -1) return res.status(404).json({ error: 'Schedule not found.' });
  schedules[idx] = { ...schedules[idx], url, startDate, endDate, startTime, endTime };
  await saveSchedules(schedules);
  res.json({ message: 'Schedule updated.', schedule: schedules[idx] });
});


// Check if a schedule is active
function isScheduleActive(schedule) {
  const now = new Date();
  const start = new Date(`${schedule.startDate}T${schedule.startTime}`);
  const end = new Date(`${schedule.endDate}T${schedule.endTime}`);
  return now >= start && now <= end;
}

// Recursively search for a preview_url or link for a given id in any object/array
function findPreviewUrl(obj, id) {
  if (!obj || typeof obj !== 'object') return null;

  // If this object is keyed by id
  if (obj[id] && (obj[id].preview_url || obj[id].link)) {
    let url = obj[id].preview_url || obj[id].link;
    if (url && url.endsWith('id=')) url = url + id;
    return url;
  }

  // If this object has id as a value
  if ((obj.id === id || obj.offer_id === id || obj._id === id) && (obj.preview_url || obj.link)) {
    let url = obj.preview_url || obj.link;
    if (url && url.endsWith('id=')) url = url + id;
    return url;
  }

  // If this object has an Offer sub-object
  if (obj.Offer && typeof obj.Offer === 'object') {
    const offer = obj.Offer;
    if ((offer.id === id || offer.offer_id === id || offer._id === id) && (offer.preview_url || offer.link)) {
      let url = offer.preview_url || offer.link;
      if (url && url.endsWith('id=')) url = url + id;
      return url;
    }
  }

  // Recursively search all properties
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      const found = findPreviewUrl(obj[key], id);
      if (found) return found;
    }
  }

  // If this is an array, search each element
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findPreviewUrl(item, id);
      if (found) return found;
    }
  }

  return null;
}

// In /go/:id, before redirecting, check for active schedule
app.get('/go/:id', async (req, res) => {
  const { id } = req.params;
  // 1. Check for active schedule
  const schedules = await loadSchedules();
  const active = schedules.find(s => String(s.offerId) === String(id) && isScheduleActive(s));
  if (active) {
    return res.redirect(active.url);
  }
  console.log('Redirect requested for id:', id);

  // 1. Search games.json
  const games = await loadGames();
  let found = games.find(g => g.id === id && g.link);
  if (found) {
    console.log('Found in games.json:', found.link);
    return res.redirect(found.link);
  }

  // 2. Search fetch_history.json for any response with a matching id and preview_url/link
  try {
    const fetchHistory = await fs.pathExists(FETCH_HISTORY_FILE) ? await fs.readJson(FETCH_HISTORY_FILE) : [];
    for (const entry of fetchHistory) {
      const url = findPreviewUrl(entry.response, id);
      if (url) {
        console.log('Redirecting to found preview_url/link:', url);
        return res.redirect(url);
      }
    }
  } catch (e) {
    console.error('Error in /go/:id redirect:', e);
  }
  res.status(404).send('Not found');
});

// // Backend: Add `/api/play-response` Endpoint
// app.post('/api/play-response', async (req, res) => {
//   const { gameId, utm_source, utm_medium, utm_campaign, utm_term, utm_content, userAgent, referrer, extra } = req.body;
//   const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

//   // Fetch geolocation info
//   let geo = {};
//   try {
//     const geoRes = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,query,lat,lon`);
//     if (geoRes.data.status === 'success') {
//       geo = {
//         country: geoRes.data.country,
//         region: geoRes.data.regionName,
//         city: geoRes.data.city,
//         lat: geoRes.data.lat,
//         lon: geoRes.data.lon,
//         ip: geoRes.data.query
//       };
//     }
//   } catch (e) {
//     geo = {};
//   }

//   const data = {
//     timestamp: new Date().toISOString(),
//     ip,
//     gameId,
//     utm_source,
//     utm_medium,
//     utm_campaign,
//     utm_term,
//     utm_content,
//     userAgent,
//     referrer,
//     extra,
//     geo
//   };
//   const responses = await loadPlayResponses();
//   responses.push(data);
//   await savePlayResponses(responses);
//   res.status(200).json({ message: 'Play response recorded', data });
// });

// Endpoint to get all play responses
// app.get('/api/play-responses', async (req, res) => {
//   const responses = await loadPlayResponses();
//   res.json(responses);
// });

app.get('/api/play-responses', async (req, res) => {
  const responses = await loadPlayResponses();
  const games = await loadGames();

  // Attach full game data to each response
  const enriched = responses.map(r => {
    const game = games.find(g => String(g.id) === String(r.gameId));
    return {
      ...r,
      game: game || null // Attach the full game data, or null if not found
    };
  });

  res.json(enriched);
});


// Update a game by id
// Update a game by id
app.put('/api/games/:id', async (req, res) => {
  const { id } = req.params;
  let games = await loadGames();
  const idx = games.findIndex(g => g.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Game not found.' });

  // Merge updated fields (keep id)
  games[idx] = { ...games[idx], ...req.body, id };
  await saveGames(games);
  res.json(games[idx]);
});




// Get all games (offers)
app.get('/api/games', async (req, res) => {
  const games = await loadGames();
  res.json(games);
});

// Endpoint to add a fetch record
app.post('/api/fetch-history', async (req, res) => {
  const { url, method, headers, params, body, response, status, timestamp } = req.body;
  const history = await loadFetchHistory();
  history.push({
    url, method, headers, params, body, response, status, timestamp: timestamp || new Date().toISOString()
  });
  await saveFetchHistory(history);
  res.status(201).json({ message: 'Fetch history recorded' });
});

// app.post('/api/play-response', async (req, res) => {
//   const {
//     gameId,
//     utm_source,
//     utm_medium,
//     utm_campaign,
//     utm_term,
//     utm_content,
//     userAgent,
//     referrer,
//     extra,
//     geo: clientGeo // Accept geo from client if provided
//   } = req.body;

//   if (!gameId) {
//     return res.status(400).json({ error: 'gameId is required.' });
//   }

//   const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

//   // Prefer client geo, else fetch from server
//   let geo = clientGeo || {};
//   if (!geo || !geo.country) {
//     try {
//       const geoRes = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,query,lat,lon`);
//       if (geoRes.data.status === 'success') {
//         geo = {
//           country: geoRes.data.country,
//           region: geoRes.data.regionName,
//           city: geoRes.data.city,
//           lat: geoRes.data.lat,
//           lon: geoRes.data.lon,
//           ip: geoRes.data.query
//         };
//       }
//     } catch (e) {
//       console.error('Geo lookup failed:', e.message);
//       geo = {};
//     }
//   }

//   const data = {
//     timestamp: new Date().toISOString(),
//     ip,
//     gameId,
//     utm_source,
//     utm_medium,
//     utm_campaign,
//     utm_term,
//     utm_content,
//     userAgent,
//     referrer,
//     extra,
//     geo
//   };

//   try {
//     const responses = await loadPlayResponses();
//     responses.push(data);
//     await savePlayResponses(responses);
//     res.status(201).json({ message: 'Play response recorded', data });
//   } catch (e) {
//     console.error('Failed to save play response:', e.message);
//     res.status(500).json({ error: 'Failed to save play response.' });
//   }
// });



app.post('/api/play-response', async (req, res) => {
  console.log("hii")
  const {
    gameId,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    userAgent,
    referrer,
    extra,
    screenWidth,
    screenHeight,
    language,
    platform,
    payout,
    payout_type,
    expiration_date,
    monthly_conversion_cap,
    status,
    title,
    genre,
    rating,
    image
    // ...add any other fields you want to store
  } = req.body;


  // Add this line to get the IP address:
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

  // Fetch geolocation info
  let geo = {};
  try {
    const geoRes = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,query,lat,lon`);
    if (geoRes.data.status === 'success') {
      geo = {
        country: geoRes.data.country,
        region: geoRes.data.regionName,
        city: geoRes.data.city,
        lat: geoRes.data.lat,
        lon: geoRes.data.lon,
        ip: geoRes.data.query
      };
    }
  } catch (e) {
    geo = {};
  }

  const data = {
    timestamp: new Date().toISOString(),
    ip,
    gameId,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    userAgent,
    referrer,
    extra,
    screenWidth,
    screenHeight,
    language,
    platform,
    payout,
    payout_type,
    expiration_date,
    monthly_conversion_cap,
    status,
    title,
    genre,
    rating,
    image,
    geo
    // ...add any other fields you want to store
  };

  const responses = await loadPlayResponses();
  responses.push(data);
  await savePlayResponses(responses);
  res.status(200).json({ message: 'Play response recorded', data });
});

// Endpoint to get fetch history
app.get('/api/fetch-history', async (req, res) => {
  const history = await loadFetchHistory();
  res.json(history.reverse()); // newest first
});

// Endpoint to set/update email config
app.post('/api/email-config', async (req, res) => {
  const { host, port, secure, user, pass, from } = req.body;
  if (!host || !port || !user || !pass || !from) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  emailConfig = { host, port, secure, user, pass, from };
  try {
    await saveEmailConfig(emailConfig);
    res.json({ message: 'Email config updated.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save email config', details: e.message });
  }
});

// Endpoint to send an email
app.post('/api/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;
  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ error: 'To, subject, and text or html are required.' });
  }
  try {
    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
      }
    });
    await transporter.sendMail({
      from: emailConfig.from,
      to,
      subject,
      text,
      html
    });
    res.json({ message: 'Email sent.' });
  } catch (e) {
    console.log()
    res.status(500).json({ error: 'Failed to send email', details: e.message });
  }
});

// Endpoint to check if a domain/URL is working
app.post('/api/check-domain', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required.' });

  try {
    // Only follow up to 5 redirects, timeout after 7 seconds
    const response = await fetch(url, { method: 'GET', redirect: 'follow', timeout: 7000 });
    res.json({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      finalUrl: response.url
    });
  } catch (e) {
    res.json({
      ok: false,
      error: e.message
    });
  }
});

const gamesFile = path.join(__dirname, '../games.json');

// filepath: backend/server.js (or your backend entry)
app.post('/api/games/bulk',async (req, res) => {
  const offers = req.body.offers;
  if (!Array.isArray(offers)) {
    return res.status(400).json({ error: 'Offers must be an array' });}
  try {
    // Load existing games
    let games = await loadGames();
    // Optionally deduplicate by id
    const existingIds = new Set(games.map(g => g.id || g.offer_id || g._id));
    const newOffers = offers.filter(
      offer => {
        const id = offer.id || offer.offer_id || offer._id;
        return id && !existingIds.has(id);
      }
    );
    // Add new offers
    games = [...games, ...newOffers];
    await saveGames(games);
    res.json({ success: true, added: newOffers.length });
  } catch (e) {
    res.status(500).json({ error: 'Failed to add offers', details: e.message });
  }
});
  




// filepath: backend/routes/games.js
const router = express.Router();



router.post('/bulk', (req, res) => {
  const { offers } = req.body;
  if (!Array.isArray(offers)) return res.status(400).json({ error: 'Offers must be an array' });

  fs.readFile(gamesFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read games.json' });
    let games = [];
    try { games = JSON.parse(data); } catch { games = []; }
    // Optionally deduplicate by id
    const newGames = [...games, ...offers];
    fs.writeFile(gamesFile, JSON.stringify(newGames, null, 2), err2 => {
      if (err2) return res.status(500).json({ error: 'Failed to write games.json' });
      res.json({ success: true, added: offers.length });
    });
  });
});

module.exports = router;


// Endpoint to get all schedules
const schedulesFile = path.join(__dirname, '../schedules.json');

// Helper functions
async function loadSchedules() {
  try {
    const data = await fs.promises.readFile(schedulesFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}
async function saveSchedules(schedules) {
  await fs.promises.writeFile(schedulesFile, JSON.stringify(schedules, null, 2));
}

// POST /api/offer-schedules (for OfferSchedularSection)
app.post('/api/offer-schedules', async (req, res) => {
  const { offerIds, externalLinks, schedules } = req.body;
  if (!Array.isArray(offerIds) || !Array.isArray(externalLinks) || !Array.isArray(schedules)) {
    return res.status(400).json({ error: 'Invalid payload.' });
  }
  let allSchedules = await loadSchedules();
  offerIds.forEach(offerId => {
    externalLinks.forEach(url => {
      schedules.forEach(sch => {
        allSchedules.push({
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          offerId,
          url,
          ...sch
        });
      });
    });
  });
  await saveSchedules(allSchedules);
  res.json({ success: true });
});

// POST /api/schedules (for BulkSchedulingSection)
app.post('/api/schedules', async (req, res) => {
  const { offerIds, url, startDate, endDate, startTime, endTime } = req.body;
  if (!Array.isArray(offerIds) || !url || !startDate || !endDate || !startTime || !endTime) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  let allSchedules = await loadSchedules();
  offerIds.forEach(offerId => {
    allSchedules.push({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      offerId,
      url,
      startDate,
      endDate,
      startTime,
      endTime
    });
  });
  await saveSchedules(allSchedules);
  res.json({ success: true });
});

// GET /api/schedules
app.get('/api/schedules', async (req, res) => {
  const allSchedules = await loadSchedules();
  res.json(allSchedules);
});

// PATCH /api/schedules/:id
app.patch('/api/schedules/:id', async (req, res) => {
  const { id } = req.params;
  let allSchedules = await loadSchedules();
  const idx = allSchedules.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Schedule not found.' });
  allSchedules[idx] = { ...allSchedules[idx], ...req.body };
  await saveSchedules(allSchedules);
  res.json(allSchedules[idx]);
});

// DELETE /api/schedules/:id
app.delete('/api/schedules/:id', async (req, res) => {
  const { id } = req.params;
  let allSchedules = await loadSchedules();
  allSchedules = allSchedules.filter(s => s.id !== id);
  await saveSchedules(allSchedules);
  res.json({ success: true });
});


const PROXY_CONFIG = {
  username: 'spf2gs4v0b',
  password: 'AGn7=Sp15kdwvGp4eg',
  proxy_map: {
    'IN': { host: 'in.decodo.com', port: 10001 },
    'CN': { host: 'cn.decodo.com', port: 30001 },
    'US': { host: 'us.decodo.com', port: 10001 },
    'AU': { host: 'au.decodo.com', port: 30001 },
    'GB': { host: 'gb.decodo.com', port: 30001 },
    'CA': { host: 'ca.decodo.com', port: 20001 },
    'AF': { host: 'af.decodo.com', port: 36001 },
    'AL': { host: 'al.decodo.com', port: 33001 },
    'AD': { host: 'ad.decodo.com', port: 34001 },
    'AO': { host: 'ao.decodo.com', port: 18001 },
    'AR': { host: 'ar.decodo.com', port: 10001 },
    'AM': { host: 'am.decodo.com', port: 42001 },
    'AW': { host: 'aw.decodo.com', port: 21001 },
    'AT': { host: 'at.decodo.com', port: 35001 },
    'AZ': { host: 'az.decodo.com', port: 30001 },
    'BS': { host: 'bs.decodo.com', port: 17001 },
    'BH': { host: 'bh.decodo.com', port: 37001 }
  }
};


const { HttpsProxyAgent } = require('https-proxy-agent');

// Proxy checker endpoint
// app.post('/api/check-proxy', async (req, res) => {
//   const { country, testUrl = 'https://www.google.com' } = req.body;
//   const proxy = PROXY_CONFIG.proxy_map[country];
//   if (!proxy) {
//     return res.status(400).json({ error: 'Proxy not found for this country.' });
//   }
//   const proxyUrl = `http://${PROXY_CONFIG.username}:${PROXY_CONFIG.password}@${proxy.host}:${proxy.port}`;
//   try {
//     const agent = new HttpsProxyAgent(proxyUrl);
//     const response = await axios.get(testUrl, { httpsAgent: agent, timeout: 8000 });
//     res.json({
//       ok: true,
//       status: response.status,
//       statusText: response.statusText,
//       country,
//       proxy: proxyUrl
//     });
//   } catch (e) {
//     res.json({
//       ok: false,
//       error: e.message,
//       country,
//       proxy: proxyUrl
//     });
//   }
// });

app.post('/api/check-proxy', async (req, res) => {
  const { country, url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required.' });
  }
  const proxy = PROXY_CONFIG.proxy_map[country];
  if (!proxy) {
    return res.status(400).json({ error: 'Proxy not found for this country.' });
  }
  const proxyUrl = `http://${PROXY_CONFIG.username}:${PROXY_CONFIG.password}@${proxy.host}:${proxy.port}`;
  try {
    const agent = new HttpsProxyAgent(proxyUrl);
    const response = await axios.get(url, { httpsAgent: agent, timeout: 8000 });
    res.json({
      ok: true,
      status: response.status,
      statusText: response.statusText,
      country,
      proxy: proxyUrl
    });
  } catch (e) {
    res.json({
      ok: false,
      error: e.message,
      country,
      proxy: proxyUrl
    });
  }
});

app.listen(PORT, () => {
  console.log(`Postback receiver server running on http://localhost:${PORT}`);
});