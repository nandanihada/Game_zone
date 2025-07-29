const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');

const router = express.Router();
const POSTBACKS_FILE = path.join(__dirname, 'postbacks.json');

// Helper to load postbacks from file
const loadPostbacks = async () => {
  try {
    const exists = await fs.pathExists(POSTBACKS_FILE);
    if (!exists) return [];
    return await fs.readJson(POSTBACKS_FILE);
  } catch (error) {
    console.error('Error loading postbacks:', error);
    return [];
  }
};

// Helper to save postbacks to file
const savePostback = async (postback) => {
  try {
    const postbacks = await loadPostbacks();
    postbacks.unshift({
      id: uuidv4(),
      receivedAt: new Date().toISOString(),
      ...postback
    });
    // Keep only the last 1000 postbacks
    const recentPostbacks = postbacks.slice(0, 1000);
    await fs.writeJson(POSTBACKS_FILE, recentPostbacks, { spaces: 2 });
    return recentPostbacks;
  } catch (error) {
    console.error('Error saving postback:', error);
    throw error;
  }
};

// Proxy GET request
router.get('/proxy-get', async (req, res) => {
  const { target } = req.query;
  
  if (!target) {
    return res.status(400).json({ error: 'Target URL is required' });
  }

  try {
    // Forward the request to the target URL
    const response = await axios.get(target, { 
      validateStatus: () => true, // Don't throw on HTTP error status codes
      headers: {
        'User-Agent': 'PostbackProxy/1.0',
        ...req.headers
      }
    });

    // Save the received postback
    await savePostback({
      method: 'GET',
      url: target,
      status: response.status,
      statusText: response.statusText,
      headers: req.headers,
      query: req.query,
      body: response.data,
      ip: req.ip || req.connection.remoteAddress
    });

    // Forward the response
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Proxy GET error:', error.message);
    res.status(500).json({ 
      error: 'Failed to proxy request',
      details: error.message 
    });
  }
});

// Proxy POST request
router.post('/proxy-post', async (req, res) => {
  const { url, data } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Forward the request to the target URL
    const response = await axios({
      method: 'POST',
      url,
      data: data || {},
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PostbackProxy/1.0',
        ...req.headers
      },
      validateStatus: () => true // Don't throw on HTTP error status codes
    });

    // Save the received postback
    await savePostback({
      method: 'POST',
      url,
      status: response.status,
      statusText: response.statusText,
      headers: req.headers,
      body: data || {},
      response: response.data,
      ip: req.ip || req.connection.remoteAddress
    });

    // Forward the response
    res.status(response.status).json({
      status_code: response.status,
      status_text: response.statusText,
      response_text: response.data,
      headers: response.headers
    });
  } catch (error) {
    console.error('Proxy POST error:', error.message);
    res.status(500).json({ 
      error: 'Failed to proxy request',
      details: error.message 
    });
  }
});

// Get all received postbacks
router.get('/received-postbacks', async (req, res) => {
  try {
    const postbacks = await loadPostbacks();
    res.json(postbacks);
  } catch (error) {
    console.error('Error fetching postbacks:', error);
    res.status(500).json({ error: 'Failed to fetch postbacks' });
  }
});

// Get a single postback by ID
router.get('/postbacks/:id', async (req, res) => {
  try {
    const postbacks = await loadPostbacks();
    const postback = postbacks.find(p => p.id === req.params.id);
    
    if (!postback) {
      return res.status(404).json({ error: 'Postback not found' });
    }
    
    res.json(postback);
  } catch (error) {
    console.error('Error fetching postback:', error);
    res.status(500).json({ error: 'Failed to fetch postback' });
  }
});

module.exports = router;
