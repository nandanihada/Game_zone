const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const rateLimit = require('express-rate-limit');
const axios = require('axios'); // Add at the top if not already
const nodemailer = require('nodemailer');
const fetch = require('node-fetch'); // If not already installed: npm install node-fetch
const { v4: uuidv4 } = require('uuid'); // npm install uuid

const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, 'postbacks.json');
const GAMES_FILE = path.join(__dirname, 'games.json');
const API_KEYS_FILE = path.join(__dirname, 'api_keys.json');
const PLAY_RESPONSES_FILE = path.join(__dirname, 'play_responses.json');
const FETCH_HISTORY_FILE = path.join(__dirname, 'fetch_history.json');
const EMAIL_CONFIG_FILE = path.join(__dirname, 'email_config.json');
const SCHEDULES_FILE = path.join(__dirname, 'offer_schedules.json');

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

app.use(cors());
app.use(express.json());

// Endpoint to receive postbacks (POST)
app.post('/api/receive-postback', async (req, res) => {
  const data = {
    receivedAt: new Date().toISOString(),
    body: req.body,
    headers: req.headers,
    ip: req.ip,
  };
  const postbacks = await loadPostbacks();
  postbacks.push(data);
  await savePostbacks(postbacks);
  res.status(200).json({ message: 'Postback received', data });
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
  if (!title || !genre || !rating || !image || !link) {
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

// List all API keys (no user filtering)
app.get('/api/apikeys', async (req, res) => {
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

// Backend: Add `/api/play-response` Endpoint
app.post('/api/play-response', async (req, res) => {
  const { gameId, utm_source, utm_medium, utm_campaign, utm_term, utm_content, userAgent, referrer, extra } = req.body;
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
    geo
  };
  const responses = await loadPlayResponses();
  responses.push(data);
  await savePlayResponses(responses);
  res.status(200).json({ message: 'Play response recorded', data });
});

// Endpoint to get all play responses
app.get('/api/play-responses', async (req, res) => {
  const responses = await loadPlayResponses();
  res.json(responses);
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

app.listen(PORT, () => {
  console.log(`Postback receiver server running on http://localhost:${PORT}`);
});