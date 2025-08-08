import React, { useEffect, useState, useRef, useMemo } from 'react';
import './Dashboard.css';
import styled from 'styled-components';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from "axios";
import * as XLSX from 'xlsx';
import PostbackDocumentation from './PostbackDocumentation';
import Tesseract from 'tesseract.js';

// ...rest of your code...


// Import useNavigate and useLocation
// import backgroundImage from './image_36d7c2.png'; // Removed the image import
/* global __app_id, __firebase_config, __initial_auth_token */

export default function Dashboard() {
  // All useState/useEffect hooks at the top level, only once each
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [postbackUrl, setPostbackUrl] = useState('');
  const [postbackResponse, setPostbackResponse] = useState(null);
  const [postbackLoading, setPostbackLoading] = useState(false);
  const [postbackMethod, setPostbackMethod] = useState('POST');
  const [coreFields, setCoreFields] = useState({
    userId: { enabled: true, value: userId },
    accountId: { enabled: false, value: '' },
    formId: { enabled: false, value: '' },
    submissionTime: { enabled: false, value: new Date().toISOString() },
  });
  const [customFields, setCustomFields] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  // Postback Test Automation
  const [testUrl, setTestUrl] = useState('');
  const [testInterval, setTestInterval] = useState(10);
  const [testDuration, setTestDuration] = useState(10);
  const [jobs, setJobs] = useState([]);
  const [jobCounter, setJobCounter] = useState(1);
  const [openLogs, setOpenLogs] = useState({});
  // Postback Receiver
  const [receivedPostbacks, setReceivedPostbacks] = useState([]);
  const [loadingPostbacks, setLoadingPostbacks] = useState(false);
  const [errorPostbacks, setErrorPostbacks] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  const [filterIp, setFilterIp] = useState('');
  const [filterTime, setFilterTime] = useState('');
  const [filterBody, setFilterBody] = useState('');
  const [filterHeaders, setFilterHeaders] = useState('');
  const [filterDate, setFilterDate] = useState('');
  // Games
  const [games, setGames] = useState([]);
  const [gameForm, setGameForm] = useState({ title: '', genre: '', rating: '', image: '', link: '' });
  const [gameFormError, setGameFormError] = useState('');
  const [gameFormLoading, setGameFormLoading] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const [extractedEmails, setExtractedEmails] = useState([]);
  const [selectableEmails, setSelectableEmails] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  // Helper: replace placeholders in URL with random values
  const resolvePlaceholders = (url) => {
    // Replace {form_id}, {user_id}, {account_id}, {submission_time} with random or current values
    return url
      .replace(/\{form_id\}/g, Math.floor(Math.random() * 10000))
      .replace(/\{user_id\}/g, userId || 'user123')
      .replace(/\{account_id\}/g, coreFields.accountId.value || 'acc123')
      .replace(/\{submission_time\}/g, new Date().toISOString());
  };
  // Start a new test job
  const startTestJob = () => {
    if (!testUrl) return;
    const resolvedUrl = resolvePlaceholders(testUrl);
    const id = `Job #${jobCounter}`;
    setJobCounter(c => c + 1);
    const intervalMs = Number(testInterval) * 1000;
    const durationMs = Number(testDuration) * 1000;
    const log = [];
    const stopAt = Date.now() + durationMs;
    let count = 0;
    // Function to send postback and log
    const sendPostback = async () => {
      const sendUrl = resolvePlaceholders(testUrl);
      let response, text, data, error = null;
      try {
        // response = await fetch(sendUrl, { method: 'GET' });
        console.log(`Sending postback to: ${sendUrl}`);
        response = await fetch(`/proxy-postback?target=${encodeURIComponent(sendUrl)}`, { method: 'GET' });
        text = await response.text();

        try { data = JSON.parse(text); } catch { data = text; }
      } catch (err) { error = err.message; }
      log.push({
        timestamp: new Date().toLocaleTimeString(),
        url: sendUrl,
        response: data,
        error,
      });
      setJobs(jobs => jobs.map(j => j.id === id ? { ...j, log: [...log] } : j));
    };
    // Start interval
    const timerId = setInterval(() => {
      if (Date.now() >= stopAt) {
        clearInterval(timerId);
        setJobs(jobs => jobs.map(j => j.id === id ? { ...j, status: 'stopped' } : j));
        return;
      }
      sendPostback();
      count++;
    }, intervalMs);
    // Initial send
    sendPostback();
    setJobs(jobs => [
      ...jobs,
      {
        id,
        url: resolvedUrl,
        interval: testInterval,
        duration: testDuration,
        status: 'running',
        log: [],
        timerId,
        stopAt,
      },
    ]);
  };
  // Stop a job
  const stopJob = (id) => {
    setJobs(jobs => jobs.map(j => {
      if (j.id === id && j.status === 'running') {
        clearInterval(j.timerId);
        return { ...j, status: 'stopped' };
      }
      return j;
    }));
  };
  // Remove a job
  const removeJob = (id) => {
    setJobs(jobs => jobs.filter(j => j.id !== id));
  };
  // Toggle log visibility
  const toggleLog = (id) => {
    setOpenLogs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Add at the top level with other hooks
  const toggleRow = (idx) => {
    setExpandedRows(rows => rows.includes(idx) ? rows.filter(i => i !== idx) : [...rows, idx]);
  };
  // Postback filters
  // Compute filtered postbacks
  const filteredPostbacks = receivedPostbacks.filter(pb => {
    // IP filter
    const ipMatch = filterIp ? (pb.ip || '').toLowerCase().includes(filterIp.toLowerCase()) : true;
    // Time filter (partial match)
    const timeMatch = filterTime ? (pb.receivedAt || '').toLowerCase().includes(filterTime.toLowerCase()) : true;
    // Date filter (exact date match)
    const dateMatch = filterDate ? (pb.receivedAt || '').slice(0, 10) === filterDate : true;
    // Body filter (stringify and search)
    const bodyMatch = filterBody ? JSON.stringify(pb.body).toLowerCase().includes(filterBody.toLowerCase()) : true;
    // Headers filter (stringify and search)
    const headersMatch = filterHeaders ? JSON.stringify(pb.headers).toLowerCase().includes(filterHeaders.toLowerCase()) : true;
    return ipMatch && timeMatch && dateMatch && bodyMatch && headersMatch;
  });

  const fetchPostbacks = async () => {
    setLoadingPostbacks(true);
    setErrorPostbacks(null);
    try {
      const res = await fetch('http://localhost:5000/api/received-postbacks');
      const data = await res.json();
      setReceivedPostbacks(data);
    } catch (err) {
      setErrorPostbacks('Failed to fetch postbacks');
    }
    setLoadingPostbacks(false);
  };

  useEffect(() => {
    if (currentView === 'postback-receiver') {
      fetchPostbacks();
    }
    // eslint-disable-next-line
  }, [currentView]);

  useEffect(() => {
    // Initialize Firebase
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

    let app;
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    const firestoreDb = getFirestore(app);
    const firebaseAuth = getAuth(app);

    setDb(firestoreDb);
    setAuth(firebaseAuth);

    // Sign in and listen for auth state changes
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const docRef = doc(firestoreDb, `artifacts/${appId}/users/${user.uid}/user_data`, 'profile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          console.log('No user data found! Creating default data.');
          // Create default user data if none exists
          const defaultData = {
            coins: 0,
            balance: 0,
            totalEarnings: 0,
            pendingRewards: 0,
            completedTasks: 0,
            weeklyGoal: 10,
            level: 1,
          };
          await setDoc(docRef, defaultData);
          setUserData(defaultData);
        }
        setLoading(false);
      } else {
        // Sign in anonymously if no user is logged in
        if (typeof __initial_auth_token !== 'undefined') {
          await signInWithCustomToken(firebaseAuth, __initial_auth_token);
        } else {
          await signInAnonymously(firebaseAuth);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch games from backend
  const fetchGames = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/games');
      const data = await res.json();
      setGames(data);
    } catch (err) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  if (loading || !userData) {
    return <div className="loading">Loading Dashboard...</div>;
  }

  const {
    coins,
    balance,
    totalEarnings,
    pendingRewards,
    completedTasks,
    weeklyGoal,
    level,
  } = userData;

  const progress = Math.min((completedTasks / weeklyGoal) * 100, 100);

  // Function to handle sidebar navigation clicks
  const handleNavigationClick = (view) => {
    if (view === 'logout') {
      // Handle logout logic
      if (auth) {
        signOut(auth).then(() => {
          setUserData(null);
          setUserId(null);
          setLoading(true);
          console.log('User logged out');
          navigate('/'); // Navigate to landing page after logout
        }).catch((error) => {
          console.error("Error signing out: ", error);
        });
      }
    } else if (view === 'support') {
      navigate('/SupportPage'); // Navigate to the SupportPage route
    } else if (view === 'task') {
      navigate('/task'); 
    } else if (view === 'home') {
      navigate('/home'); 
    } else if (view === 'profile') {
      navigate('/profile');  // Navigate to the Profile page (assuming settings is profile)
    } else if (view === 'condition') {
      navigate('/condition'); 
    } else if (view === 'postback-sender') {
      setCurrentView('postback-sender');
    } else if (view === 'postback-receiver') {
      setCurrentView('postback-receiver');
    } else if (view === 'postback-tester') {
      setCurrentView('postback-tester');
    } else if (view === 'responses') {
      setCurrentView('responses');
    }
    else {
      setCurrentView(view); // For internal dashboard views
    }
  };

  // Update core field value
  const handleCoreFieldChange = (field, prop, val) => {
    setCoreFields(prev => ({
      ...prev,
      [field]: { ...prev[field], [prop]: val }
    }));
  };
  // Add/remove/update custom fields
  const addCustomField = () => {
    setCustomFields(prev => [...prev, { key: '', value: '', enabled: true }]);
  };
  const updateCustomField = (idx, prop, val) => {
    setCustomFields(prev => prev.map((f, i) => i === idx ? { ...f, [prop]: val } : f));
  };
  const removeCustomField = (idx) => {
    setCustomFields(prev => prev.filter((_, i) => i !== idx));
  };
  // Build query params from enabled fields
  const buildQueryParams = () => {
    const params = [];
    Object.entries(coreFields).forEach(([k, v]) => {
      if (v.enabled && v.value) params.push(`${encodeURIComponent(k)}=${encodeURIComponent(v.value)}`);
    });
    customFields.forEach(f => {
      if (f.enabled && f.key) params.push(`${encodeURIComponent(f.key)}=${encodeURIComponent(f.value)}`);
    });
    return params.length ? `?${params.join('&')}` : '';
  };
  // Build preview URL
  const previewUrl = postbackUrl ? postbackUrl + buildQueryParams() : '';
  // Build POST payload (same as query params, as object)
  const postPayload = {};
  Object.entries(coreFields).forEach(([k, v]) => {
    if (v.enabled && v.value) postPayload[k] = v.value;
  });
  customFields.forEach(f => {
    if (f.enabled && f.key) postPayload[f.key] = f.value;
  });



  const handlePostbackSend = async (e) => {
    e.preventDefault();
    setPostbackLoading(true);
    setPostbackResponse(null);
    console.log(postbackUrl);
    console.log(previewUrl);
    try {
      let response, text, data;
      if (postbackMethod === 'GET') {
        // Use backend proxy to avoid CORS issues with third-party postback URLs
        response = await fetch(`/proxy-postback?target=${encodeURIComponent(previewUrl)}`, { method: 'GET' });
        text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
        setPostbackResponse({ status: response.status, data });
      } else {
        // Use backend proxy for POST postbacks
        response = await fetch('/proxy-postback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: postbackUrl, data: postPayload }),
        });
        const proxyResult = await response.text();
        setPostbackResponse({ status: proxyResult.status_code, data: proxyResult.response_text });
      }
    } catch (err) {
      setPostbackResponse({ error: err.message });
    }
    setPostbackLoading(false);
  };



  // Function to send postback
  // const handlePostbackSend = async (e) => {
  //   e.preventDefault();
  //   setPostbackLoading(true);
  //   setPostbackResponse(null);
  //   console.log(`Sending postback to: ${previewUrl}`);
  //   console.log(`postbackurl: ${postbackUrl}`);
  //   try {
  //     let response, text, data;
  //     if (postbackMethod === 'GET') {
  //       response = await fetch(`/proxy-postback?target=${encodeURIComponent(previewUrl)}`, { method: 'GET' });
  //       // response = await fetch(previewUrl, { method: 'GET' });
  //       text = await response.text();
  //     } else {
  //       response = await fetch('/proxy-postback', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           target: postbackUrl,
  //           payload: postPayload
  //         }
  //         ),
  //       });
  //       text = await response.text();
  //       console.log("status",response.status);
  //       console.log("body",text);
  //     }
  //     try {
  //       data = JSON.parse(text);
  //     } catch {
  //       data = text;
  //     }
  //     setPostbackResponse({ status: response.status, data });
  //   } catch (err) {
  //     setPostbackResponse({ error: err.message });
  //   }
  //   setPostbackLoading(false);
  // };

  // Add at the top level with other hooks
  // Add game
  const handleGameFormChange = (e) => {
    setGameForm({ ...gameForm, [e.target.name]: e.target.value });
  };
  const handleGameFormSubmit = async (e) => {
    e.preventDefault();
    setGameFormError('');
    setGameFormLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameForm),
      });
      if (!res.ok) {
        const err = await res.json();
        setGameFormError(err.error || 'Failed to add game');
      } else {
        setGameForm({ title: '', genre: '', rating: '', image: '', link: '' });
        fetchGames();
      }
    } catch (err) {
      setGameFormError('Failed to add game');
    }
    setGameFormLoading(false);
  };
  // Delete game
  const handleDeleteGame = async (id) => {
    await fetch(`http://localhost:5000/api/games/${id}`, { method: 'DELETE' });
    fetchGames();
  };

  // Render content based on currentView
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <>
            <div className="topbar">
              <h1>Dashboard</h1>
              <div className="actions">
                {/* Buttons were here, now they are removed */}
              </div>
            </div>

            <div className="stats">
              <div className="stat-box">
                <strong>Coins</strong>
                <span>{coins}</span>
              </div>
              <div className="stat-box">
                <strong>Balance</strong>
                <span>₹{balance}</span>
              </div>
              <div className="stat-box">
                <strong>Total Earnings</strong>
                <span>₹{totalEarnings}</span>
              </div>
              <div className="stat-box">
                <strong>Pending Rewards</strong>
                <span>₹{pendingRewards}</span>
              </div>
              <div className="stat-box">
                <strong>Tasks Completed</strong>
                <span>{completedTasks}</span>
              </div>
              <div className="stat-box">
                <strong>Level</strong>
                <span>{level}</span>
              </div>
            </div>

            <div className="progress-section">
              <h2>Weekly Goal Progress</h2>
              <div className="progress-bar">
                <div style={{ width: `${progress}%` }}></div>
              </div>
              <p className="milestone">{completedTasks} of {weeklyGoal} tasks completed</p>
            </div>
          </>
        );
      
      case 'withdraw':
        return (
          <div>
            <h1>Withdrawal Details</h1>
            <p>Here you can manage your withdrawals.</p>
            <div className="stats" style={{ marginTop: '2rem' }}> {/* Reusing stats class for layout */}
              <div className="stat-box">
                <strong>Total Coins</strong>
                <span>{coins}</span>
              </div>
              <div className="stat-box">
                <strong>Current Balance</strong>
                <span>₹{balance}</span>
              </div>
            </div>
            {/* Add more withdrawal options/form here */}
          </div>
        );
      case 'rewards':
        return (
          <div>
            <h1>Your Rewards</h1>
            <p>Here are the rewards you've earned:</p>
            <ul className="rewards-list">
              <li className="reward-item">
                <strong>Reward 1:</strong> 100 Bonus Coins (Completed 5 tasks)
              </li>
              <li className="reward-item">
                <strong>Reward 2:</strong> ₹50 Cash Bonus (Reached Level 2)
              </li>
              <li className="reward-item">
                <strong>Reward 3:</strong> Exclusive Game Access (Referral Bonus)
              </li>
              {/* Add more rewards dynamically based on user data if available */}
              {userData.level >= 5 && (
                <li className="reward-item">
                  <strong>Level 5 Bonus:</strong> Special Avatar Unlock
                </li>
              )}
            </ul>
            {/* Content for rewards based on user progress/achievements */}
          </div>
        );
      case 'postback-sender':
        return (
          <div style={{ maxWidth: 600, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>Postback Sender</h2>
            <form onSubmit={handlePostbackSend} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <label>
                Base URL:
                <input
                  type="url"
                  value={postbackUrl}
                  onChange={e => setPostbackUrl(e.target.value)}
                  placeholder="https://example.com/postback"
                  required
                  style={{ width: '100%', padding: 8, marginTop: 4 }}
                />
              </label>
              <label style={{ marginTop: 8 }}>
                Method:
                <select value={postbackMethod} onChange={e => setPostbackMethod(e.target.value)} style={{ marginLeft: 8 }}>
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                </select>
              </label>
              <fieldset style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12, marginTop: 12 }}>
                <legend>Core Fields</legend>
                {Object.entries(coreFields).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <input type="checkbox" checked={v.enabled} onChange={e => handleCoreFieldChange(k, 'enabled', e.target.checked)} />
                    <label style={{ minWidth: 90 }}>{k}</label>
                    <input
                      type="text"
                      value={v.value}
                      onChange={e => handleCoreFieldChange(k, 'value', e.target.value)}
                      disabled={!v.enabled}
                      style={{ flex: 1, padding: 4 }}
                    />
                  </div>
                ))}
              </fieldset>
              <fieldset style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12, marginTop: 12 }}>
                <legend>Custom Fields</legend>
                {customFields.map((f, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <input type="checkbox" checked={f.enabled} onChange={e => updateCustomField(idx, 'enabled', e.target.checked)} />
                    <input
                      type="text"
                      placeholder="Key"
                      value={f.key}
                      onChange={e => updateCustomField(idx, 'key', e.target.value)}
                      style={{ width: 120, padding: 4 }}
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={f.value}
                      onChange={e => updateCustomField(idx, 'value', e.target.value)}
                      style={{ flex: 1, padding: 4 }}
                    />
                    <button type="button" onClick={() => removeCustomField(idx)} style={{ color: 'red', border: 'none', background: 'none', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}>×</button>
                  </div>
                ))}
                <button type="button" onClick={addCustomField} style={{ marginTop: 6 }}>+ Add Custom Field</button>
              </fieldset>
              <div style={{ marginTop: 16, background: '#f6f6f6', padding: 12, borderRadius: 4 }}>
                <strong>Preview URL:</strong>
                <div style={{ wordBreak: 'break-all', color: '#333', margin: '6px 0' }}>{previewUrl}</div>
                {postbackMethod === 'POST' && (
                  <>
                    <strong>POST Payload:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#eee', padding: 8, borderRadius: 4 }}>{JSON.stringify(postPayload, null, 2)}</pre>
                  </>
                )}
              </div>
              <button type="submit" disabled={postbackLoading || !postbackUrl} style={{ padding: 8 }}>
                {postbackLoading ? 'Sending...' : 'Send Postback'}
              </button>
            </form>
            {postbackResponse && (
              <div style={{ marginTop: 16, background: '#f6f6f6', padding: 12, borderRadius: 4 }}>
                <strong>Response:</strong>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(postbackResponse, null, 2)}</pre>
              </div>
            )}
          </div>
        );
      case 'postback-receiver':
        return (
          <div style={{ maxWidth: 800, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>Postback Receiver</h2>
            <div style={{ marginTop: 16, color: '#555' }}>
              <button onClick={fetchPostbacks} style={{ marginBottom: 16 }}>Refresh</button>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontWeight: 500 }}>Filter by IP:</label><br />
                  <input type="text" value={filterIp} onChange={e => setFilterIp(e.target.value)} placeholder="e.g. 127.0.0.1" style={{ padding: 6, width: 150, borderRadius: 4, border: '1px solid #ccc' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 500 }}>Filter by Date:</label><br />
                  <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ padding: 6, width: 150, borderRadius: 4, border: '1px solid #ccc' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 500 }}>Filter by Time (text):</label><br />
                  <input type="text" value={filterTime} onChange={e => setFilterTime(e.target.value)} placeholder="e.g. 12:30" style={{ padding: 6, width: 120, borderRadius: 4, border: '1px solid #ccc' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 500 }}>Filter by Body:</label><br />
                  <input type="text" value={filterBody} onChange={e => setFilterBody(e.target.value)} placeholder="Search body..." style={{ padding: 6, width: 200, borderRadius: 4, border: '1px solid #ccc' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 500 }}>Filter by Headers:</label><br />
                  <input type="text" value={filterHeaders} onChange={e => setFilterHeaders(e.target.value)} placeholder="Search headers..." style={{ padding: 6, width: 200, borderRadius: 4, border: '1px solid #ccc' }} />
                </div>
              </div>
              {loadingPostbacks && <div>Loading...</div>}
              {errorPostbacks && <div style={{ color: 'red' }}>{errorPostbacks}</div>}
              {filteredPostbacks.length === 0 && !loadingPostbacks && <div>No postbacks match your filters.</div>}
              {filteredPostbacks.length > 0 && (
                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fafafa' }}>
                    <thead>
                      <tr style={{ background: '#f3f3f3' }}>
                        <th style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>#</th>
                        <th style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Received At</th>
                        <th style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>IP</th>
                        <th style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPostbacks.map((pb, idx) => (
                        <React.Fragment key={idx}>
                          <tr style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px' }}>{idx + 1}</td>
                            <td style={{ padding: '8px' }}>{pb.receivedAt}</td>
                            <td style={{ padding: '8px' }}>{pb.ip}</td>
                            <td style={{ padding: '8px' }}>
                              <button onClick={() => toggleRow(idx)} style={{ padding: '4px 12px', borderRadius: 4, border: 'none', background: '#1976d2', color: '#fff', cursor: 'pointer' }}>
                                {expandedRows.includes(idx) ? 'Hide' : 'Details'}
                              </button>
                            </td>
                          </tr>
                          {expandedRows.includes(idx) && (
                            <tr>
                              <td colSpan={4} style={{ background: '#f6f6f6', padding: 16 }}>
                                <div><strong>Headers:</strong> <pre style={{ background: '#fff', padding: 8, borderRadius: 4, marginBottom: 8 }}>{JSON.stringify(pb.headers, null, 2)}</pre></div>
                                <div><strong>Body:</strong> <pre style={{ background: '#fff', padding: 8, borderRadius: 4 }}>{JSON.stringify(pb.body, null, 2)}</pre></div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      case 'postback-documentation':
        return <PostbackDocumentation />;
      case 'postback-tester':
        return (
          <div style={{ maxWidth: 700, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2 style={{ marginBottom: 12 }}>Postback URL Tester</h2>
            <div style={{ background: '#222', color: '#fff', padding: 18, borderRadius: 8, marginBottom: 24 }}>
              <h3 style={{ margin: 0, marginBottom: 10 }}>Start New Test</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label>
                  Postback URL:
                  <input
                    type="text"
                    value={testUrl}
                    onChange={e => setTestUrl(e.target.value)}
                    placeholder="https://example.com/webhook?form_id={form_id}"
                    style={{ width: '100%', padding: 8, marginTop: 4 }}
                  />
                </label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label>
                    Interval (seconds):
                    <input
                      type="number"
                      min={1}
                      value={testInterval}
                      onChange={e => setTestInterval(e.target.value)}
                      style={{ width: 80, marginLeft: 8 }}
                    />
                  </label>
                  <label>
                    Duration (seconds):
                    <input
                      type="number"
                      min={1}
                      value={testDuration}
                      onChange={e => setTestDuration(e.target.value)}
                      style={{ width: 80, marginLeft: 8 }}
                    />
                  </label>
                </div>
                <button type="button" onClick={startTestJob} style={{ marginTop: 8, background: '#1976d2', color: '#fff', padding: '8px 18px', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>Start Test</button>
              </div>
            </div>
            <div style={{ background: '#181818', color: '#fff', padding: 18, borderRadius: 8 }}>
              <h3 style={{ margin: 0, marginBottom: 10 }}>My Postback Jobs</h3>
              {jobs.length === 0 && <div style={{ color: '#aaa' }}>No jobs running.</div>}
              {jobs.map(job => (
                <div key={job.id} style={{ border: '1px solid #333', borderRadius: 6, marginBottom: 16, padding: 12, background: '#222' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{job.id}</strong>
                      <div style={{ fontSize: 13, color: '#aaa', marginTop: 2 }}>URL: <span style={{ color: '#fff' }}>{job.url}</span></div>
                      <div style={{ fontSize: 13, color: '#aaa' }}>Interval: {job.interval}s | Duration: {job.duration}s</div>
                      <div style={{ fontSize: 13, color: job.status === 'running' ? '#4caf50' : '#f44336' }}>Status: {job.status}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {job.status === 'running' && <button onClick={() => stopJob(job.id)} style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}>Stop</button>}
                      <button onClick={() => removeJob(job.id)} style={{ background: '#444', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}>Remove</button>
                      <button onClick={() => toggleLog(job.id)} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}>{openLogs[job.id] ? 'Hide Log' : 'Log'}</button>
                    </div>
                  </div>
                  {openLogs[job.id] && (
                    <div style={{ marginTop: 10, background: '#111', borderRadius: 4, padding: 10, maxHeight: 200, overflowY: 'auto' }}>
                      {job.log.length === 0 && <div style={{ color: '#aaa' }}>No log entries yet.</div>}
                      {job.log.map((entry, idx) => (
                        <div key={idx} style={{ borderBottom: '1px solid #222', padding: '4px 0' }}>
                          <div style={{ color: '#90caf9' }}>{entry.timestamp}</div>
                          <div style={{ color: '#fff', fontSize: 13 }}>URL: {entry.url}</div>
                          <div style={{ color: entry.error ? '#f44336' : '#4caf50', fontSize: 13 }}>Response: {entry.error ? entry.error : JSON.stringify(entry.response)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'add-game':
        return (
          <div style={{ maxWidth: 500, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>Add Game</h2>
            <form onSubmit={handleGameFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label>Title:<input name="title" value={gameForm.title} onChange={handleGameFormChange} required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} /></label>
              <label>Genre:<input name="genre" value={gameForm.genre} onChange={handleGameFormChange} required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} /></label>
              <label>Rating:<input name="rating" value={gameForm.rating} onChange={handleGameFormChange} required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} /></label>
              <label>Image Link:<input name="image" value={gameForm.image} onChange={handleGameFormChange} required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} /></label>
              <label>Final Link:<input name="link" value={gameForm.link} onChange={handleGameFormChange} required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} /></label>
              {gameFormError && <div style={{ color: 'red' }}>{gameFormError}</div>}
              <button type="submit" disabled={gameFormLoading} style={{ padding: 10, borderRadius: 4, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 'bold' }}>{gameFormLoading ? 'Submitting...' : 'Submit'}</button>
            </form>
          </div>
        );
      case 'api-access':
        return (
          <div style={{ maxWidth: 700, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>Public API Access</h2>
            <p>
              You can fetch data from our public API endpoints. All endpoints require an API key in the <code>x-api-key</code> header. <b>API keys are not user-specific</b>—anyone can generate a random API key from the API Keys section. Each key is limited to <b>10 requests per day</b> (shared across all endpoints).
            </p>
            <div style={{ background: '#f6f6f6', padding: 16, borderRadius: 6, margin: '18px 0' }}>
              <strong>Endpoints:</strong>
              <ul style={{ margin: '10px 0 0 0', padding: 0, listStyle: 'none' }}>
                <li style={{ marginBottom: 12 }}>
                  <b>GET /api/public/games</b><br />
                  <span style={{ color: '#888' }}>Returns all games.</span>
                  <pre style={{ background: '#eee', padding: 8, borderRadius: 4, margin: '8px 0' }}>{`fetch('http://localhost:5000/api/public/games', {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
})
  .then(res => res.json())
  .then(data => console.log(data));`}</pre>
                  <strong>Example Response:</strong>
                  <pre style={{ background: '#eee', padding: 8, borderRadius: 4, margin: '8px 0' }}>{`[
  {
    "id": "1712345678901",
    "title": "Game Title",
    "genre": "Action",
    "rating": "4.5",
    "image": "https://example.com/image.jpg",
    "link": "https://example.com/game",
    "createdAt": "2024-06-01T12:00:00.000Z"
  },
  ...
]`}</pre>
                </li>
                <li style={{ marginBottom: 12 }}>
                  <b>GET /api/public/postbacks</b><br />
                  <span style={{ color: '#888' }}>Returns all received postbacks.</span>
                  <pre style={{ background: '#eee', padding: 8, borderRadius: 4, margin: '8px 0' }}>{`fetch('http://localhost:5000/api/public/postbacks', {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
})
  .then(res => res.json())
  .then(data => console.log(data));`}</pre>
                  <strong>Example Response:</strong>
                  <pre style={{ background: '#eee', padding: 8, borderRadius: 4, margin: '8px 0' }}>{`[
  {
    "receivedAt": "2024-06-01T12:00:00.000Z",
    "body": { ... },
    "headers": { ... },
    "ip": "127.0.0.1"
  },
  ...
]`}</pre>
                </li>
                <li style={{ marginBottom: 12 }}>
                  <b>GET /api/public/users</b><br />
                  <span style={{ color: '#888' }}>Returns a list of user stats (placeholder data).</span>
                  <pre style={{ background: '#eee', padding: 8, borderRadius: 4, margin: '8px 0' }}>{`fetch('http://localhost:5000/api/public/users', {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
})
  .then(res => res.json())
  .then(data => console.log(data));`}</pre>
                  <strong>Example Response:</strong>
                  <pre style={{ background: '#eee', padding: 8, borderRadius: 4, margin: '8px 0' }}>{`[
  { "userId": "user1", "coins": 100, "level": 2, "completedTasks": 5 },
  { "userId": "user2", "coins": 250, "level": 4, "completedTasks": 20 },
  ...
]`}</pre>
                </li>
              </ul>
              <strong>Headers:</strong>
              <div style={{ margin: '8px 0' }}><code>x-api-key: YOUR_API_KEY</code></div>
              <strong>Rate Limit:</strong>
              <div style={{ marginBottom: 8 }}>10 requests per API key per day (shared across all endpoints)</div>
            </div>
            <div style={{ color: '#888', fontSize: 14, marginTop: 16 }}>
              <strong>Note:</strong> If you exceed the rate limit, you will receive an error message and must wait until the next day to make more requests. All endpoints require a valid API key.
            </div>
          </div>
        );
      case 'api-keys':
        return (
          <div style={{ maxWidth: 700, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>API Keys</h2>
            <ApiKeysSection />
          </div>
        );
      case 'api-fetcher':
        return (
          <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>API Fetcher (Test & Preview)</h2>
            <ApiFetcherSection />
          </div>
        );
      case 'responses':
        return (
          <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>Responses</h2>
            <ResponsesSection />
          </div>
        );
      case 'fetch-history':
        return (
          <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>API Fetch History</h2>
            <FetchHistorySection />
          </div>
        );
        case 'our-offer':
        return (
          <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>our Offer</h2>
            <OurOffer />
          </div>
        );
        case 'offer-schedular':
        return (
          <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>Offer Schedular</h2>
            <OfferSchedularSection />
          </div>
        );
      case 'scheduled-offer':
        return (
          <div style={{ maxWidth: 800, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>Scheduled Offers</h2>
            <ShowingScheduledOffersSection />
          </div>
        );
        case 'proxy-checker':
          return (
            <div style={{ maxWidth: 800, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
              <h2>Proxy Checker</h2>
              <ProxyCheckerSection />
            </div>
          );
      case 'email-config':
        return (
          <div style={{ maxWidth: 600, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>Email Configuration</h2>
            <EmailConfigSection />
          </div>
        );
      case 'domain-checker':
        return (
          <div style={{ maxWidth: 700, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>Domain Checker</h2>
            <DomainCheckerSection />
          </div>
        );
      case 'bulk-scheduling':
        return (
          <div style={{ maxWidth: 1100, margin: '2rem auto', padding: 24, background: '#181c24', borderRadius: 8 }}>
            <h2>Bulk Offer Scheduling</h2>
            <BulkSchedulingSection />
          </div>
        );
        case 'campaign':
        return (
          <div style={{ maxWidth: 1100, margin: '2rem auto', padding: 24, background: '#181c24', borderRadius: 8 }}>
            <h2>campaign</h2>
            <CampaignManager />
          </div>
        );
      case 'image-extractor':
        return (
          <div style={{ maxWidth: 1100, margin: '2rem auto', padding: 24, background: '#181c24', borderRadius: 8 }}>
            <h2>Image Extractor</h2>
            <ScreenshotOfferExtractor />
          </div>
        );

      default: // No default case for 'support', 'terms', 'logged-out' as they will navigate
        return null;
    }
  };

  return (
    <div className="dashboard-wrapper"> {/* Removed inline style for background image */}
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">Game<span>Pro</span></div>
        <ul>
          <li className={location.pathname === '/home' ? 'active' : ''} onClick={() => handleNavigationClick('home')}>
            Home
          </li>
          <li className={currentView === 'dashboard' ? 'active' : ''} onClick={() => handleNavigationClick('dashboard')}>Dashboard</li>
          {/* Removed 'Games' from here */}
          
          <li className={currentView === 'withdraw' ? 'active' : ''} onClick={() => handleNavigationClick('withdraw')}>Withdraw</li>
          <li className={currentView === 'rewards' ? 'active' : ''} onClick={() => handleNavigationClick('rewards')}>Rewards</li>
          <li className={location.pathname === '/task' ? 'active' : ''} onClick={() => handleNavigationClick('task')}>
            task list
          </li>

          {/* New Support button with active state based on route */}
          <li className={location.pathname === '/support' ? 'active' : ''} onClick={() => handleNavigationClick('support')}>
            Support
          </li>
          <li className={location.pathname === '/condition' ? 'active' : ''} onClick={() => handleNavigationClick('condition')}>
            terms&Conditions
          </li>
          <li className={currentView === 'postback-sender' ? 'active' : ''} onClick={() => handleNavigationClick('postback-sender')}>
            Postback Sender
        </li>
          <li className={currentView === 'postback-receiver' ? 'active' : ''} onClick={() => handleNavigationClick('postback-receiver')}>
            Postback Receiver
        </li>
        <li className={currentView === 'postback-documentation' ? 'active' : ''} onClick={() => handleNavigationClick('postback-documentation')}>
            Postback Documentation
        </li>
          <li className={currentView === 'postback-tester' ? 'active' : ''} onClick={() => handleNavigationClick('postback-tester')}>
            Postback URL Tester
          </li>
          <li className={currentView === 'add-game' ? 'active' : ''} onClick={() => handleNavigationClick('add-game')}>
            Add Game
          </li>
          <li className={currentView === 'api-access' ? 'active' : ''} onClick={() => handleNavigationClick('api-access')}>
            API Access
          </li>
          <li className={currentView === 'api-keys' ? 'active' : ''} onClick={() => handleNavigationClick('api-keys')}>
            API Keys
          </li>
          <li className={currentView === 'api-fetcher' ? 'active' : ''} onClick={() => handleNavigationClick('api-fetcher')}>
            API Fetcher
          </li>
          <li className={currentView === 'responses' ? 'active' : ''} onClick={() => handleNavigationClick('responses')}>
            Responses
          </li>
          <li className={currentView === 'fetch-history' ? 'active' : ''} onClick={() => handleNavigationClick('fetch-history')}>
            Fetch History
          </li>
          <li className={currentView === 'our-offer' ? 'active' : ''} onClick={() => handleNavigationClick('our-offer')}>
            Our Offer
          </li>
          <li className={currentView === 'offer-schedular' ? 'active' : ''} onClick={() => handleNavigationClick('offer-schedular')}>
            Offer Schedular
          </li>
          <li className={currentView === 'scheduled-offer' ? 'active' : ''} onClick={() => handleNavigationClick('scheduled-offer')}>
            Scheduled Offers  
          </li>
          <li className={currentView === 'proxy-checker' ? 'active' : ''} onClick={() => handleNavigationClick('proxy-checker')}>
            Proxy Checker
          </li>
          <li className={currentView === 'email-config' ? 'active' : ''} onClick={() => handleNavigationClick('email-config')}>
            Email Config
          </li>
          <li className={currentView === 'domain-checker' ? 'active' : ''} onClick={() => handleNavigationClick('domain-checker')}>
            Domain Checker
          </li>
          <li className={currentView === 'bulk-scheduling' ? 'active' : ''} onClick={() => handleNavigationClick('bulk-scheduling')}>
            Bulk Scheduling
          </li>
          <li className={location.pathname === 'campaign' ? 'active' : ''} onClick={() => handleNavigationClick('campaign')}>
            campaigns
          </li>
          <li className={location.pathname === 'image-extractor' ? 'active' : ''} onClick={() => handleNavigationClick('image-extractor')}>
            Image Extractor
          </li>
        </ul>
        <div className="bottom-links">
          {/* Settings link with active state based on route */}
          <span className={location.pathname === '/profile' ? 'active' : ''} onClick={() => handleNavigationClick('profile')}>Profile</span>
          <span className={location.pathname === '/' && !userId ? 'active' : ''} onClick={() => handleNavigationClick('logout')}>Logout</span>
        </div>
      </aside>

      {/* Main Dashboard */}
      <main className="dashboard-main">
        {renderContent()}
        {userId && location.pathname !== '/' && <p style={{ textAlign: 'center', marginTop: '20px', color: '#777' }}>User ID: {userId}</p>}
      </main>
    </div>
  );
}

function ApiKeysSection() {
  const [keys, setKeys] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [revoking, setRevoking] = React.useState('');
  const [newKeyName, setNewKeyName] = React.useState('');
  const [editingKey, setEditingKey] = React.useState(null);
  const [editingName, setEditingName] = React.useState('');
  const [savingEdit, setSavingEdit] = React.useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/apikeys');
      const data = await res.json();
      setKeys(data);
    } catch (err) {
      setError('Failed to fetch API keys');
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchKeys();
    // eslint-disable-next-line
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/apikeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to create API key');
      } else {
        setNewKeyName('');
        await fetchKeys();
      }
    } catch (err) {
      setError('Failed to create API key');
    }
    setCreating(false);
  };

  const handleEdit = (key, currentName) => {
    setEditingKey(key);
    setEditingName(currentName || '');
  };

  const handleEditSave = async (key) => {
    setSavingEdit(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/apikeys/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to rename API key');
      } else {
        setEditingKey(null);
        setEditingName('');
        await fetchKeys();
      }
    } catch (err) {
      setError('Failed to rename API key');
    }
    setSavingEdit(false);
  };

  const handleEditCancel = () => {
    setEditingKey(null);
    setEditingName('');
  };

  const handleRevoke = async (key) => {
    setRevoking(key);
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/apikeys/${key}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to revoke API key');
      } else {
        await fetchKeys();
      }
    } catch (err) {
      setError('Failed to revoke API key');
    }
    setRevoking('');
  };

  // Helper: get last 7 days as array of YYYY-MM-DD
  const getLast7Days = () => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(d.toISOString().slice(0, 10));
    }
    return arr;
  };
  const last7Days = getLast7Days();

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Key name (optional)"
          value={newKeyName}
          onChange={e => setNewKeyName(e.target.value)}
          style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', flex: 1 }}
        />
        <button onClick={handleCreate} disabled={creating} style={{ padding: '8px 18px', borderRadius: 4, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 'bold' }}>
          {creating ? 'Creating...' : 'Generate New API Key'}
        </button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {keys.length === 0 && !loading && <div style={{ color: '#888' }}>No API keys yet.</div>}
      {keys.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fafafa', marginTop: 12 }}>
          <thead>
            <tr style={{ background: '#f3f3f3' }}>
              <th style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>API Key</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Created At</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Usage (Today)</th>
              <th style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => {
              const today = new Date().toISOString().slice(0, 10);
              const usage = k.usage && k.usage[today] ? k.usage[today] : 0;
              return (
                <React.Fragment key={k.key}>
                  <tr>
                    <td style={{ padding: '8px' }}>
                      {editingKey === k.key ? (
                        <>
                          <input
                            type="text"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 120 }}
                          />
                          <button onClick={() => handleEditSave(k.key)} disabled={savingEdit} style={{ marginLeft: 4, color: '#1976d2', border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                          <button onClick={handleEditCancel} style={{ marginLeft: 2, color: '#888', border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          {k.name || <span style={{ color: '#aaa' }}>(no name)</span>}
                          <button onClick={() => handleEdit(k.key, k.name)} style={{ marginLeft: 6, color: '#1976d2', border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Edit</button>
                        </>
                      )}
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{k.key}</td>
                    <td style={{ padding: '8px' }}>{new Date(k.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '8px' }}>{usage} / 10</td>
                    <td style={{ padding: '8px' }}>
                      <button onClick={() => navigator.clipboard.writeText(k.key)} style={{ marginRight: 8 }}>Copy</button>
                      <button onClick={() => handleRevoke(k.key)} disabled={revoking === k.key} style={{ color: 'red', border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer' }}>{revoking === k.key ? 'Revoking...' : 'Revoke'}</button>
                    </td>
                  </tr>
                  {/* Usage history row */}
                  <tr>
                    <td colSpan={5} style={{ background: '#f6f6f6', padding: 8 }}>
                      <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Usage (last 7 days):</div>
                      <table style={{ width: '100%', fontSize: 13, background: 'none' }}>
                        <thead>
                          <tr>
                            {last7Days.map(day => (
                              <th key={day} style={{ padding: '2px 4px', color: '#888', fontWeight: 'normal' }}>{day.slice(5)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {last7Days.map(day => (
                              <td key={day} style={{ padding: '2px 4px', textAlign: 'center' }}>{k.usage && k.usage[day] ? k.usage[day] : 0}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: 32, background: '#f6f6f6', padding: 16, borderRadius: 6 }}>
        <strong>How to use your API key:</strong>
        <div style={{ margin: '10px 0' }}>Include your API key in the <code>x-api-key</code> header when making requests to the public API endpoint:</div>
        <pre style={{ background: '#222', color: '#fff', padding: 12, borderRadius: 6 }}>{`fetch('http://localhost:5000/api/public/games', {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
})
  .then(res => res.json())
  .then(data => console.log(data));`}</pre>
        <div style={{ color: '#888', fontSize: 14, marginTop: 10 }}>
          <strong>Note:</strong> Each API key is limited to 10 requests per day. You can revoke a key at any time.
        </div>
      </div>
    </div>
  );
}

// function ApiFetcherSection() {
//   const [url, setUrl] = React.useState('http://localhost:5000/api/public/games');
//   const [method, setMethod] = React.useState('GET');
//   const [headers, setHeaders] = React.useState([{ key: 'x-api-key', value: '' }]);
//   const [params, setParams] = React.useState([]); // <-- new
//   const [body, setBody] = React.useState('');
//   const [data, setData] = React.useState(null);
//   const [loading, setLoading] = React.useState(false);
//   const [error, setError] = React.useState('');
//   const [selected, setSelected] = React.useState([]);
//   const [corsError, setCorsError] = React.useState(false);
//   const [detailsIdx, setDetailsIdx] = React.useState(null); // for modal
//   const [sortCol, setSortCol] = React.useState(null);
//   const [sortDir, setSortDir] = React.useState('asc');
//   const [filters, setFilters] = React.useState({});
//   const [page, setPage] = React.useState(1);
//   const [rowsPerPage, setRowsPerPage] = React.useState(10);
//   const [useCorsProxy, setUseCorsProxy] = React.useState(false);
//   const [viewMode, setViewMode] = React.useState('table'); // 'table', 'pretty', 'raw'

//   // --- Data normalization for nested structures ---
//   function normalizeData(raw) {
//     if (!raw || typeof raw !== 'object') return raw;
//     // Try to find a nested array-like structure
//     // 1. If raw has a 'response' or 'data' property, drill down
//     let obj = raw;
//     if (obj.response && typeof obj.response === 'object') obj = obj.response;
//     if (obj.data && typeof obj.data === 'object') obj = obj.data;
//     // 2. If obj is an object whose values are all objects (array-like)
//     if (
//       obj &&
//       typeof obj === 'object' &&
//       !Array.isArray(obj) &&
//       Object.values(obj).length > 0 &&
//       Object.values(obj).every(v => typeof v === 'object' && v !== null)
//     ) {
//       let arr = Object.values(obj);
//       // 3. If all values are objects with a single property, extract that property (regardless of value type)
//       if (arr.every(x => x && typeof x === 'object' && Object.keys(x).length === 1)) {
//         arr = arr.map(x => x[Object.keys(x)[0]]);
//       }
//       // If the result is an array of strings, try to parse as JSON
//       if (arr.every(x => typeof x === 'string')) {
//         try {
//           arr = arr.map(x => JSON.parse(x));
//         } catch {
//           // If parsing fails, leave as is
//         }
//       }
//       return arr;
//     }
//     return raw;
//   }

//   // Move isArray/type here so all functions can use them
//   // Use normalized data for all rendering
//   const normalizedData = React.useMemo(() => normalizeData(data), [data]);
//   let isArray = Array.isArray(normalizedData);
//   let type = '';
//   if (isArray && normalizedData && normalizedData.length > 0) {
//     if (normalizedData[0].title && normalizedData[0].image) type = 'game';
//     else if (normalizedData[0].receivedAt && normalizedData[0].ip) type = 'postback';
//     else if (normalizedData[0].userId && normalizedData[0].level !== undefined) type = 'user';
//   }

//   const methodOptions = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

//   // Parameter handlers
//   const handleParamChange = (idx, field, value) => {
//     setParams(ps => ps.map((p, i) => i === idx ? { ...p, [field]: value } : p));
//   };
//   const handleAddParam = () => {
//     setParams(ps => [...ps, { key: '', value: '' }]);
//   };
//   const handleRemoveParam = (idx) => {
//     setParams(ps => ps.filter((_, i) => i !== idx));
//   };

//   const handleHeaderChange = (idx, field, value) => {
//     setHeaders(hs => hs.map((h, i) => i === idx ? { ...h, [field]: value } : h));
//   };
//   const handleAddHeader = () => {
//     setHeaders(hs => [...hs, { key: '', value: '' }]);
//   };
//   const handleRemoveHeader = (idx) => {
//     setHeaders(hs => hs.filter((_, i) => i !== idx));
//   };

//   const buildUrlWithParams = () => {
//     if (!params.length) return url;
//     const search = params
//       .filter(p => p.key)
//       .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
//       .join('&');
//     if (!search) return url;
//     return url.includes('?') ? `${url}&${search}` : `${url}?${search}`;
//   };

//   const getFinalUrl = () => {
//     let u = buildUrlWithParams();
//     if (useCorsProxy) {
//       // Remove protocol for double-proxy safety
//       u = u.replace(/^https?:\/\//, '');
//       return `https://cors-anywhere.herokuapp.com/${u}`;
//     }
//     return buildUrlWithParams();
//   };

//   const handleFetch = async () => {
//     setLoading(true);
//     setError('');
//     setData(null);
//     setSelected([]);
//     setCorsError(false);
//     try {
//       const fetchHeaders = {};
//       headers.forEach(h => {
//         if (h.key) fetchHeaders[h.key] = h.value;
//       });
//       const options = {
//         method,
//         headers: fetchHeaders,
//       };
//       if (['POST', 'PUT', 'PATCH'].includes(method)) {
//         options.body = body;
//       }
//       const finalUrl = getFinalUrl();
//       const res = await fetch(finalUrl, options);
//       let result;
//       const contentType = res.headers.get('content-type') || '';
//       if (contentType.includes('application/json')) {
//         result = await res.json();
//       } else {
//         result = await res.text();
//       }
//       if (!res.ok) {
//         setError((result && result.error) || res.statusText || 'Failed to fetch');
//       } else {
//         setData(result);
//         // Save fetch to backend
//         fetch('http://localhost:5000/api/fetch-history', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             url: finalUrl,
//             method,
//             headers: fetchHeaders,
//             params,
//             body: options.body,
//             response: result,
//             status: res.status,
//             timestamp: new Date().toISOString()
//           })
//         });
//       }
//     } catch (err) {
//       if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
//         setCorsError(true);
//         setError('CORS error: This API does not allow cross-origin requests.');
//       } else {
//         setError('Failed to fetch');
//       }
//     }
//     setLoading(false);
//   };

//   const handleSelect = (idx) => {
//     setSelected(sel => sel.includes(idx) ? sel.filter(i => i !== idx) : [...sel, idx]);
//   };

//   // Filtering and sorting logic
//   const getFilteredSortedData = () => {
//     if (!isArray || !normalizedData) return [];
//     let filtered = normalizedData;
//     // Filtering
//     Object.entries(filters).forEach(([col, val]) => {
//       if (val) {
//         filtered = filtered.filter(item =>
//           (item[col] !== undefined && String(item[col]).toLowerCase().includes(val.toLowerCase()))
//         );
//       }
//     });
//     // Sorting
//     if (sortCol) {
//       filtered = [...filtered].sort((a, b) => {
//         if (a[sortCol] === undefined) return 1;
//         if (b[sortCol] === undefined) return -1;
//         if (typeof a[sortCol] === 'number' && typeof b[sortCol] === 'number') {
//           return sortDir === 'asc' ? a[sortCol] - b[sortCol] : b[sortCol] - a[sortCol];
//         }
//         return sortDir === 'asc'
//           ? String(a[sortCol]).localeCompare(String(b[sortCol]))
//           : String(b[sortCol]).localeCompare(String(a[sortCol]));
//       });
//     }
//     return filtered;
//   };
//   const filteredSortedData = getFilteredSortedData();
//   // Pagination logic
//   const totalRows = filteredSortedData.length;
//   const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
//   const pagedData = filteredSortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
//   const handlePageChange = (newPage) => {
//     setPage(Math.max(1, Math.min(totalPages, newPage)));
//   };
//   const handleRowsPerPageChange = (e) => {
//     setRowsPerPage(Number(e.target.value));
//     setPage(1);
//   };

//   // Card renderers (same as before)
//   const renderGameCard = (game, idx) => (
//     <div key={idx} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, margin: 8, width: 220, background: '#fafbfc', boxShadow: '0 2px 8px #eee' }}>
//       <img src={game.image} alt={game.title} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }} />
//       <div style={{ fontWeight: 'bold', fontSize: 18 }}>{game.title}</div>
//       <div style={{ color: '#555', margin: '4px 0' }}>{game.genre}</div>
//       <div style={{ color: '#888', fontSize: 14 }}>Rating: {game.rating}</div>
//       <a href={`http://localhost:5000/go/${game.id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', fontWeight: 'bold', textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>Play</a>
//     </div>
//   );
//   const renderPostbackCard = (pb, idx) => (
//     <div key={idx} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, margin: 8, width: 320, background: '#fafbfc', boxShadow: '0 2px 8px #eee' }}>
//       <div><strong>Received At:</strong> {pb.receivedAt}</div>
//       <div><strong>IP:</strong> {pb.ip}</div>
//       <div><strong>Headers:</strong> <pre style={{ background: '#f6f6f6', padding: 6, borderRadius: 4 }}>{JSON.stringify(pb.headers, null, 2)}</pre></div>
//       <div><strong>Body:</strong> <pre style={{ background: '#f6f6f6', padding: 6, borderRadius: 4 }}>{JSON.stringify(pb.body, null, 2)}</pre></div>
//     </div>
//   );
//   const renderUserCard = (user, idx) => (
//     <div key={idx} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, margin: 8, width: 220, background: '#fafbfc', boxShadow: '0 2px 8px #eee' }}>
//       <div style={{ fontWeight: 'bold', fontSize: 18 }}>User: {user.userId}</div>
//       <div style={{ color: '#555', margin: '4px 0' }}>Level: {user.level}</div>
//       <div style={{ color: '#888', fontSize: 14 }}>Coins: {user.coins}</div>
//       <div style={{ color: '#888', fontSize: 14 }}>Completed Tasks: {user.completedTasks}</div>
//     </div>
//   );

//   // Universal renderTable for any JSON data
//   const renderTable = () => {
//     if (!normalizedData) return null;

//     let rows = [];
//     let columns = [];

//     // Array of primitives
//     if (Array.isArray(normalizedData) && normalizedData.length > 0 && typeof normalizedData[0] !== 'object') {
//       rows = normalizedData.map(val => ({ value: val }));
//       columns = [{ key: 'value', label: 'Value' }];
//     }
//     // Array of objects (possibly with different keys)
//     else if (Array.isArray(normalizedData) && normalizedData.length > 0 && typeof normalizedData[0] === 'object') {
//       const unwrapped = normalizedData.map(obj => obj && obj.Offer).filter(Boolean);
//       const visibleKeys = ['id', 'name', 'description', 'payout_type', 'expiration_date', 'actions'];
//       columns = visibleKeys.map(k => ({ key: k, label: k.replace(/_/g, ' ').toUpperCase() }));
//       rows = unwrapped;
      
//     }
    
//     // Single object
//     else if (normalizedData && typeof normalizedData === 'object' && !Array.isArray(normalizedData)) {
//       columns = Object.keys(normalizedData).map(k => ({ key: k, label: k }));
//       rows = [normalizedData];
//     } else {
//       return <div>No tabular data to display.</div>;
//     }

//     // After determining columns, add Preview Link column if not present
//     if (!columns.some(c => c.key === 'preview_link')) {
//       columns.push({ key: 'preview_link', label: 'Preview Link' });
//     }

//     return (
//       <div style={{ overflowX: 'auto', marginTop: 18 }}>
//         <table style={{ width: '100%', borderCollapse: 'collapse', background: '#181a20', color: '#fff', borderRadius: 10, fontFamily: 'Montserrat, Arial, sans-serif', fontSize: 14, boxShadow: '0 2px 8px #222' }}>
//           <thead>
//             <tr>
//               {columns.map(col => (
//                 <th
//                   key={col.key}
//                   style={{
//                     padding: '7px 6px',
//                     borderBottom: '2px solid #23263a',
//                     textAlign: 'left',
//                     background: '#23263a',
//                     fontWeight: 700,
//                     fontSize: 15,
//                     letterSpacing: 0.3,
//                     position: 'sticky',
//                     top: 0,
//                     zIndex: 2,
//                   }}
//                 >
//                   {col.label}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((item, idx) => (
//               <tr
//                 key={idx}
//                 style={{
//                   borderBottom: '1px solid #23263a',
//                   background: idx % 2 === 0 ? '#23263a' : '#181a20',
//                   transition: 'background 0.2s',
//                   minHeight: 28,
//                   height: 32,
//                 }}
//               >
//                 {columns.map(col => {
//                   if (col.key === 'actions') {
//                     return (
//                       <td key={col.key} style={{ padding: 4 }}>
//                         <button
//                           onClick={() => setDetailsIdx(idx)}
//                           style={{ background: '#2196f3', color: '#fff', border: 'none', borderRadius: 5, padding: '2px 10px', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 4px #0002', transition: 'background 0.2s' }}
//                           title="View details"
//                         >
//                           View
//                         </button>
//                       </td>
//                     );
//                   }
//                   if (col.key === 'preview_link') {
//                     // Try to find a link or preview_url property
//                     const link = (item && (item.link || item.preview_url)) || null;
//                     const id = item && (item.id || item.offer_id || item._id);
//                     if (link && id) {
//                       return (
//                         <td key={col.key} style={{ padding: 4 }}>
//                           <a href={`http://localhost:5000/go/${id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', fontWeight: 600, textDecoration: 'underline' }}>Preview</a>
//                         </td>
//                       );
//                     } else {
//                       return <td key={col.key} style={{ padding: 4, color: '#888', textAlign: 'center', fontStyle: 'italic', fontSize: 13 }}>—</td>;
//                     }
//                   }
//                   const value = item ? item[col.key] : undefined;
//                   if (value === null || value === undefined || value === '') {
//                     return <td key={col.key} style={{ padding: 4, color: '#888', textAlign: 'center', fontStyle: 'italic', fontSize: 13 }}>—</td>;
//                   }
//                   if (typeof value === 'object') {
//                     return <td key={col.key} style={{ padding: 4, color: '#90caf9', fontSize: 13 }}>{JSON.stringify(value)}</td>;
//                   }
//                   return <td key={col.key} style={{ padding: 4, color: '#fff', fontSize: 13 }}>{String(value)}</td>;
//                 })}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//         {/* Details Modal */}
//         {detailsIdx !== null && (
//           <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDetailsIdx(null)}>
//             <div style={{ background: '#23263a', color: '#fff', borderRadius: 10, padding: 32, minWidth: 400, maxWidth: 600, boxShadow: '0 4px 32px #0008', position: 'relative' }} onClick={e => e.stopPropagation()}>
//               <button onClick={() => setDetailsIdx(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}>&times;</button>
//               <h3 style={{ marginTop: 0, marginBottom: 16 }}>Details</h3>
//               <ReactJson src={rows[detailsIdx]} name={false} collapsed={1} enableClipboard={true} displayDataTypes={false} theme="monokai" style={{ background: 'none', fontSize: 15, borderRadius: 8, padding: 12, maxHeight: 400, overflow: 'auto' }} />
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div>
//       <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 18 }}>
//         <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
//           <label style={{ flex: 1 }}>
//             URL:
//             <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.example.com/data" style={{ marginLeft: 8, padding: 6, borderRadius: 4, width: '100%' }} />
//           </label>
//           <label>
//             Method:
//             <select value={method} onChange={e => setMethod(e.target.value)} style={{ marginLeft: 8, padding: 6, borderRadius: 4 }}>
//               {methodOptions.map(m => <option key={m} value={m}>{m}</option>)}
//             </select>
//           </label>
//           <label style={{ display: 'flex', alignItems: 'center', marginLeft: 12 }}>
//             <input type="checkbox" checked={useCorsProxy} onChange={e => setUseCorsProxy(e.target.checked)} style={{ marginRight: 6 }} />
//             Use CORS Proxy
//           </label>
//           <button onClick={handleFetch} disabled={loading} style={{ padding: '8px 18px', borderRadius: 4, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 'bold' }}>{loading ? 'Fetching...' : 'Fetch'}</button>
//         </div>
//         <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
//           <div style={{ flex: 2 }}>
//             <strong>Headers:</strong>
//             {headers.map((h, idx) => (
//               <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
//                 <input type="text" value={h.key} onChange={e => handleHeaderChange(idx, 'key', e.target.value)} placeholder="Header name" style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 120 }} />
//                 <input type="text" value={h.value} onChange={e => handleHeaderChange(idx, 'value', e.target.value)} placeholder="Header value" style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 220 }} />
//                 <button onClick={() => handleRemoveHeader(idx)} style={{ color: 'red', border: 'none', background: 'none', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}>×</button>
//               </div>
//             ))}
//             <button type="button" onClick={handleAddHeader} style={{ marginTop: 4 }}>+ Add Header</button>
//           </div>
//         </div>
//         <div style={{ background: '#f6f6f6', borderRadius: 6, padding: 12, marginBottom: 8 }}>
//           <strong>Parameters:</strong>
//           {params.map((p, idx) => (
//             <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
//               <input type="text" value={p.key} onChange={e => handleParamChange(idx, 'key', e.target.value)} placeholder="Param name" style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 120 }} />
//               <input type="text" value={p.value} onChange={e => handleParamChange(idx, 'value', e.target.value)} placeholder="Param value" style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 220 }} />
//               <button onClick={() => handleRemoveParam(idx)} style={{ color: 'red', border: 'none', background: 'none', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}>×</button>
//             </div>
//           ))}
//           <button type="button" onClick={handleAddParam} style={{ marginTop: 4 }}>+ Add Parameter</button>
//         </div>
//         {['POST', 'PUT', 'PATCH'].includes(method) && (
//           <div style={{ flex: 3 }}>
//             <strong>Body (JSON or text):</strong>
//             <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginTop: 4 }} placeholder='{"key": "value"}' />
//           </div>
//         )}
//       </div>
//       {corsError && (
//         <div style={{ color: 'red', marginBottom: 12 }}>
//           <strong>CORS Error:</strong> This API does not allow cross-origin requests. You can use a CORS proxy like <a href="https://cors-anywhere.herokuapp.com/" target="_blank" rel="noopener noreferrer">cors-anywhere</a> for testing, or run your own proxy server.
//         </div>
//       )}
//       {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
//       {/* View toggle - now always visible if data exists */}
//       {data && (
//         <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
//           <button onClick={() => setViewMode('table')} style={{ background: viewMode === 'table' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Table View</button>
//           <button onClick={() => setViewMode('pretty')} style={{ background: viewMode === 'pretty' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Pretty View</button>
//           <button onClick={() => setViewMode('raw')} style={{ background: viewMode === 'raw' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Raw JSON</button>
//         </div>
//       )}
//       {/* {data && viewMode === 'table' && renderTable()} */}
//       {/* {data && viewMode === 'pretty' && renderPrettyCards()}
//       {data && viewMode === 'raw' && renderRawJson()} */}
//       {Array.isArray(normalizedData) && selected.length > 0 && (
//         <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 18 }}>
//           {selected.map(idx => {
//             if (type === 'game') return renderGameCard(normalizedData[idx], idx);
//             if (type === 'postback') return renderPostbackCard(normalizedData[idx], idx);
//             if (type === 'user') return renderUserCard(normalizedData[idx], idx);
//             return (
//               <div key={idx} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, margin: 8, width: 220, background: '#fafbfc', boxShadow: '0 2px 8px #eee' }}>
//                 <pre style={{ fontSize: 13 }}>{typeof normalizedData[idx] === 'object' ? JSON.stringify(normalizedData[idx], null, 2) : String(normalizedData[idx])}</pre>
//               </div>
//             );
//           })}
//         </div>
//       )}
//       {!Array.isArray(normalizedData) && normalizedData && typeof normalizedData === 'object' && (
//         <div style={{ marginTop: 18 }}>
//           <strong>Response:</strong>
//           <pre style={{ background: '#eee', padding: 12, borderRadius: 6 }}>{typeof normalizedData === 'object' ? JSON.stringify(normalizedData, null, 2) : String(normalizedData)}</pre>
//         </div>
//       )}
//       {/* Summary bar */}
//       {normalizedData && (
//         <div style={{
//           background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)',
//           color: '#fff',
//           borderRadius: 12,
//           padding: '18px 28px',
//           marginBottom: 18,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           boxShadow: '0 2px 12px #2224',
//           fontSize: 20,
//           fontWeight: 500,
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//             <span role="img" aria-label="offers" style={{ fontSize: 28 }}>🔎</span>
//             <span>
//               {type === 'game' ? 'Offers Found' : type === 'postback' ? 'Postbacks Found' : type === 'user' ? 'Users Found' : 'Items Found'}
//             </span>
//             <span style={{ fontSize: 15, fontWeight: 400, marginLeft: 10, color: '#e0e0e0' }}>
//               {Array.isArray(normalizedData) ? (filteredSortedData.length === 1 ? '1 item' : `${filteredSortedData.length} items`) : '1 item'} (View: {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)})
//             </span>
//           </div>
//           <div style={{ background: '#fff', color: '#333', borderRadius: 20, padding: '6px 18px', fontWeight: 700, fontSize: 18, boxShadow: '0 1px 4px #0002' }}>
//             {Array.isArray(normalizedData) ? filteredSortedData.length : 1}
//           </div>
//         </div>
//       )}
//       {data && (
//         <div style={{
//           background: '#23263a',
//           color: '#fff',
//           borderRadius: 12,
//           padding: '24px 32px',
//           margin: '24px 0',
//           boxShadow: '0 2px 12px #2224',
//           fontFamily: 'Montserrat, Arial, sans-serif',
//           position: 'relative'
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
//             <div>
//               <span style={{ fontWeight: 700, fontSize: 18, marginRight: 16 }}>Response</span>
//               <span style={{ background: '#1976d2', color: '#fff', borderRadius: 8, padding: '4px 12px', fontWeight: 600, fontSize: 14, marginRight: 8 }}>
//                 {error ? 'Error' : 'Success'}
//               </span>
//               <span style={{ color: '#aaa', fontSize: 13 }}>
//                 {new Date().toLocaleTimeString()}
//               </span>
//             </div>
//             <div>
//               <button
//                 onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
//                 style={{
//                   background: '#1976d2',
//                   color: '#fff',
//                   border: 'none',
//                   borderRadius: 6,
//                   padding: '6px 18px',
//                   fontWeight: 'bold',
//                   marginRight: 8,
//                   cursor: 'pointer'
//                 }}
//               >
//                 Copy JSON
//               </button>
//               <button
//                 onClick={() => {
//                   const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
//                   const url = URL.createObjectURL(blob);
//                   const a = document.createElement('a');
//                   a.href = url;
//                   a.download = 'api-response.json';
//                   a.click();
//                   URL.revokeObjectURL(url);
//                 }}
//                 style={{
//                   background: '#444',
//                   color: '#fff',
//                   border: 'none',
//                   borderRadius: 6,
//                   padding: '6px 18px',
//                   fontWeight: 'bold',
//                   cursor: 'pointer'
//                 }}
//               >
//                 Export JSON
//               </button>
//             </div>
//           </div>
//           {/* Tabs for Table, Pretty, Raw */}
//           {/* <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
//             <button onClick={() => setViewMode('table')} style={{ background: viewMode === 'table' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Table View</button>
//             <button onClick={() => setViewMode('pretty')} style={{ background: viewMode === 'pretty' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Pretty View</button>
//             <button onClick={() => setViewMode('raw')} style={{ background: viewMode === 'raw' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Raw JSON</button>
//           </div> */}
//           {/* Render the selected view */}
//           {viewMode === 'table' && renderTable()}
//           {viewMode === 'pretty' && (
//             <div style={{ margin: '32px auto', maxWidth: 900, background: '#181a20', borderRadius: 14, boxShadow: '0 2px 12px #2224', padding: 28 }}>
//               <ReactJson src={normalizedData} name={false} collapsed={2} enableClipboard={true} displayDataTypes={false} theme="monokai" style={{ background: 'none', fontSize: 16, borderRadius: 8, padding: 12 }} />
//             </div>
//           )}
//           {viewMode === 'raw' && (
//             <div style={{ margin: '32px auto', maxWidth: 900, background: '#181a20', borderRadius: 14, boxShadow: '0 2px 12px #2224', padding: 28 }}>
//               <strong style={{ color: '#fff', fontSize: 18 }}>Raw JSON Response:</strong>
//               <ReactJson src={data} name={false} collapsed={1} enableClipboard={true} displayDataTypes={false} theme="monokai" style={{ background: 'none', fontSize: 16, borderRadius: 8, padding: 12, marginTop: 10 }} />
//             </div>
//           )}
//         </div>
//       )}
      
//     </div>
//   );
// }



function ApiFetcherSection() {
  const [url, setUrl] = React.useState('https://cpamerchant.api.hasoffers.com/Apiv3/json?api_key=eeb0f8b62e03dde5844adb2bba29bc6583b941e39bf09e0a94d2ab6e38863a5c&Target=Affiliate_Offer&Method=findMyOffers');
  const [method, setMethod] = React.useState('GET');
  const [headers, setHeaders] = React.useState([{ key: '', value: '' }]);
  const [params, setParams] = React.useState([]);
  const [body, setBody] = React.useState('');
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [selected, setSelected] = React.useState([]);
  const [corsError, setCorsError] = React.useState(false);
  const [detailsIdx, setDetailsIdx] = React.useState(null);
  const [sortCol, setSortCol] = React.useState(null);
  const [sortDir, setSortDir] = React.useState('asc');
  const [filters, setFilters] = React.useState({});
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [useCorsProxy, setUseCorsProxy] = React.useState(true); // Default to true for better compatibility
  const [viewMode, setViewMode] = React.useState('table');

  // Data normalization function
  function normalizeData(raw) {
    if (!raw || typeof raw !== 'object') return raw;
    let obj = raw;
    if (obj.response && typeof obj.response === 'object') obj = obj.response;
    if (obj.data && typeof obj.data === 'object') obj = obj.data;
    
    if (
      obj &&
      typeof obj === 'object' &&
      !Array.isArray(obj) &&
      Object.values(obj).length > 0 &&
      Object.values(obj).every(v => typeof v === 'object' && v !== null)
    ) {
      let arr = Object.values(obj);
      if (arr.every(x => x && typeof x === 'object' && Object.keys(x).length === 1)) {
        arr = arr.map(x => x[Object.keys(x)[0]]);
      }
      if (arr.every(x => typeof x === 'string')) {
        try {
          arr = arr.map(x => JSON.parse(x));
        } catch {
          // If parsing fails, leave as is
        }
      }
      return arr;
    }
    return raw;
  }

  const normalizedData = React.useMemo(() => normalizeData(data), [data]);
  let isArray = Array.isArray(normalizedData);
  let type = '';
  if (isArray && normalizedData && normalizedData.length > 0) {
    if (normalizedData[0].title && normalizedData[0].image) type = 'game';
    else if (normalizedData[0].receivedAt && normalizedData[0].ip) type = 'postback';
    else if (normalizedData[0].userId && normalizedData[0].level !== undefined) type = 'user';
  }

  const methodOptions = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  // Handler functions
  const handleParamChange = (idx, field, value) => {
    setParams(ps => ps.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };
  const handleAddParam = () => {
    setParams(ps => [...ps, { key: '', value: '' }]);
  };
  const handleRemoveParam = (idx) => {
    setParams(ps => ps.filter((_, i) => i !== idx));
  };

  const handleHeaderChange = (idx, field, value) => {
    setHeaders(hs => hs.map((h, i) => i === idx ? { ...h, [field]: value } : h));
  };
  const handleAddHeader = () => {
    setHeaders(hs => [...hs, { key: '', value: '' }]);
  };
  const handleRemoveHeader = (idx) => {
    setHeaders(hs => hs.filter((_, i) => i !== idx));
  };

  const buildUrlWithParams = () => {
    if (!params.length) return url;
    const search = params
      .filter(p => p.key)
      .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&');
    if (!search) return url;
    return url.includes('?') ? `${url}&${search}` : `${url}?${search}`;
  };

  const getFinalUrl = () => {
    let u = buildUrlWithParams();
    if (useCorsProxy) {
      u = u.replace(/^https?:\/\//, '');
      return `https://cors-anywhere.herokuapp.com/${u}`;
    }
    return buildUrlWithParams();
  };

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    setData(null);
    setSelected([]);
    setCorsError(false);
    
    try {
      const fetchHeaders = {};
      headers.forEach(h => {
        if (h.key) fetchHeaders[h.key] = h.value;
      });
      
      const options = {
        method,
        headers: fetchHeaders,
      };
      
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        options.body = body;
      }
      
      const finalUrl = getFinalUrl();
      console.log("Fetching URL:", finalUrl, "with options:", options);

      const res = await fetch(finalUrl, options);
      let result;
      const contentType = res.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        result = await res.json();
      } else {
        result = await res.text();
      }
      
      if (!res.ok) {
        setError((result && result.error) || res.statusText || 'Failed to fetch');
        console.error("API response not OK:", res.status, result);
      } else {
        setData(result);
        console.log("API response successful:", result);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setCorsError(true);
        setError('CORS error: This API does not allow cross-origin requests.');
      } else {
        setError('Failed to fetch');
      }
    }
    setLoading(false);
  };

  const getFilteredSortedData = () => {
    if (!isArray || !normalizedData) return [];
    let filtered = normalizedData;
    
    Object.entries(filters).forEach(([col, val]) => {
      if (val) {
        filtered = filtered.filter(item =>
          (item[col] !== undefined && String(item[col]).toLowerCase().includes(val.toLowerCase()))
        );
      }
    });
    
    if (sortCol) {
      filtered = [...filtered].sort((a, b) => {
        if (a[sortCol] === undefined) return 1;
        if (b[sortCol] === undefined) return -1;
        if (typeof a[sortCol] === 'number' && typeof b[sortCol] === 'number') {
          // Fixed: Changed 'b[col]' and 'a[col]' to 'b[sortCol]' and 'a[sortCol]'
          return sortDir === 'asc' ? a[sortCol] - b[sortCol] : b[sortCol] - a[sortCol];
        }
        return sortDir === 'asc'
          ? String(a[sortCol]).localeCompare(String(b[sortCol]))
          : String(b[sortCol]).localeCompare(String(a[sortCol]));
      });
    }
    return filtered;
  };

  const filteredSortedData = getFilteredSortedData();
  const totalRows = filteredSortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const pagedData = filteredSortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const renderTable = () => {
    if (!normalizedData) return null;

    let rows = [];
    let columns = [];

    if (Array.isArray(normalizedData) && normalizedData.length > 0 && typeof normalizedData[0] !== 'object') {
      rows = normalizedData.map(val => ({ value: val }));
      columns = [{ key: 'value', label: 'Value' }];
    } else if (Array.isArray(normalizedData) && normalizedData.length > 0 && typeof normalizedData[0] === 'object') {
      rows = normalizedData; 
      const visibleKeys = ['id', 'name', 'description', 'payout_type', 'expiration_date', 'actions'];
      columns = visibleKeys.map(k => ({ key: k, label: k.replace(/_/g, ' ').toUpperCase() }));
    } else if (normalizedData && typeof normalizedData === 'object' && !Array.isArray(normalizedData)) {
      columns = Object.keys(normalizedData).map(k => ({ key: k, label: k }));
      rows = [normalizedData];
    } else {
      return <div className="no-data-message">No tabular data to display.</div>;
    }

    if (!columns.some(c => c.key === 'preview_link')) {
      columns.push({ key: 'preview_link', label: 'Preview Link' });
    }

    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr className="table-header-row">
              {columns.map(col => (
                <th key={col.key} className="table-header-cell">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((item, idx) => (
              <tr key={idx} className={`table-row ${idx % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                {columns.map(col => {
                  if (col.key === 'actions') {
                    return (
                      <td key={col.key} className="table-cell">
                        <button
                          onClick={() => setDetailsIdx(idx)}
                          className="view-button"
                        >
                          View
                        </button>
                      </td>
                    );
                  }
                  if (col.key === 'preview_link') {
                    const link = (item && (item.link || item.preview_url)) || null;
                    const id = item && (item.id || item.offer_id || item._id);
                    if (link && id) {
                      return (
                        <td key={col.key} className="table-cell">
                          <a
                            href={`http://localhost:5000/go/${id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="preview-link"
                          >
                            Preview
                          </a>
                        </td>
                      );
                    } else {
                      return (
                        <td key={col.key} className="table-cell italic-text">
                          —
                        </td>
                      );
                    }
                  }
                  const value = item ? item[col.key] : undefined;
                  if (value === null || value === undefined || value === '') {
                    return (
                      <td key={col.key} className="table-cell italic-text">
                        —
                      </td>
                    );
                  }
                  if (typeof value === 'object') {
                    return (
                      <td key={col.key} className="table-cell json-cell">
                        {JSON.stringify(value)}
                      </td>
                    );
                  }
                  return (
                    <td key={col.key} className="table-cell">
                      {String(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Details Modal */}
        {detailsIdx !== null && (
          <div className="modal-overlay" onClick={() => setDetailsIdx(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Details</h3>
                <button onClick={() => setDetailsIdx(null)} className="modal-close-button">
                  &times;
                </button>
              </div>
              <pre className="modal-pre">
                {JSON.stringify(rows[detailsIdx], null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-container">
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        body {
          margin: 0;
          font-family: 'Inter', sans-serif;
          background: linear-gradient(to bottom right, #1a202c, #2d3748, #1a202c);
          color: #e2e8f0;
          min-height: 100vh;
          padding: 1.5rem;
        }

        .app-container {
          max-width: 1280px;
          margin: 0 auto;
        }

        .header-section {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .header-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #fff; /* Changed to white for better visibility */
          margin-bottom: 0.5rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .header-subtitle {
          color: #a0aec0;
          font-size: 1.125rem;
        }

        .main-form {
          background-color: rgba(45, 55, 72, 0.7); /* Slightly transparent */
          border-radius: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
          padding: 2rem;
          margin-bottom: 2.5rem;
          border: 1px solid #4a5568;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        @media (min-width: 1024px) {
          .form-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .url-input-container {
            grid-column: span 2;
          }
        }

        .form-label {
          display: block;
          color: #cbd5e0;
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .input-field, .select-field, .textarea-field {
          width: 100%;
          padding: 0.75rem 1rem;
          background-color: #4a5568;
          border: 1px solid #667080;
          border-radius: 0.75rem;
          color: #fff;
          placeholder-color: #a0aec0;
          transition: all 0.2s ease-in-out;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .input-field:focus, .select-field:focus, .textarea-field:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5);
          border-color: #4299e1;
        }

        .input-field.icon-left {
          padding-left: 2.5rem; /* For icon */
        }

        .icon-container {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #a0aec0;
          width: 1.25rem;
          height: 1.25rem;
        }

        .select-field {
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3e%3cpath d='M7 7l3-3 3 3m0 6l-3 3-3-3' stroke='%23CBD5E0' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1em;
        }

        .send-request-button {
          width: 100%;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(to right, #4299e1, #805ad5);
          color: #fff;
          font-weight: 700;
          border-radius: 0.75rem;
          transition: all 0.2s ease-in-out;
          transform: scale(1);
          opacity: 1;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .send-request-button:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 10px rgba(0, 0, 0, 0.4);
        }

        .send-request-button:active {
          transform: scale(0.95);
        }

        .send-request-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: scale(1);
          box-shadow: none;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
          border: 2px solid #fff;
          border-bottom-color: transparent;
          border-radius: 50%;
          width: 1.25rem;
          height: 1.25rem;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .advanced-options-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 1024px) {
          .advanced-options-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          color: #cbd5e0;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .add-button {
          padding: 0.25rem 0.75rem;
          background-color: #38a169;
          color: #fff;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
        }

        .add-button:hover {
          background-color: #2f855a;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .input-group {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          background-color: #4a5568;
          padding: 0.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .input-group .input-field {
          flex: 1;
          padding: 0.5rem 0.75rem;
          background-color: #2d3748;
          border: 1px solid #667080;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .remove-button {
          color: #fc8181;
          font-weight: 700;
          font-size: 1.25rem;
          padding: 0.25rem;
          border-radius: 50%;
          transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
        }

        .remove-button:hover {
          color: #e53e3e;
          background-color: #2d3748;
        }

        .textarea-field {
          min-height: 10rem;
          resize: vertical;
        }

        .cors-checkbox-container {
          margin-top: 1.5rem;
          display: flex;
          align-items: center;
        }

        .cors-checkbox {
          width: 1.25rem;
          height: 1.25rem;
          color: #4299e1;
          background-color: #4a5568;
          border: 1px solid #667080;
          border-radius: 0.25rem;
          transition: all 0.2s ease-in-out;
          cursor: pointer;
        }

        .cors-checkbox:focus {
          box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5);
          outline: none;
        }

        .cors-label {
          margin-left: 0.75rem;
          color: #cbd5e0;
          font-size: 1rem;
          cursor: pointer;
        }

        .error-message-container {
          background-color: rgba(159, 18, 57, 0.4); /* Red-900 with transparency */
          border: 1px solid #991b1b;
          border-radius: 0.75rem;
          padding: 1.25rem;
          margin-bottom: 2rem;
          animation: fade-in 0.3s ease-out forwards;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
        }

        .error-icon {
          color: #fbd38d; /* Yellow-400 for warning */
          font-size: 1.5rem;
          margin-right: 1rem;
        }

        .error-title {
          color: #fca5a5; /* Red-300 */
          font-weight: 600;
          font-size: 1.125rem;
          margin-bottom: 0.25rem;
        }

        .error-text {
          color: #fecaca; /* Red-200 */
          font-size: 0.875rem;
        }

        .error-link {
          text-decoration: underline;
          color: #fca5a5;
          transition: color 0.2s ease-in-out;
        }

        .error-link:hover {
          color: #f87171;
        }

        .response-section {
          background-color: rgba(45, 55, 72, 0.7); /* Slightly transparent */
          border-radius: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
          border: 1px solid #4a5568;
          overflow: hidden;
          animation: fade-in 0.3s ease-out forwards;
        }

        .response-header {
          background: linear-gradient(to right, #38a169, #4299e1);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .response-header {
            flex-direction: row;
          }
        }

        .response-icon {
          font-size: 2.25rem;
          margin-right: 1rem;
        }

        .response-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fff;
        }

        .response-time {
          color: #d1fae5; /* Green-100 */
          font-size: 0.875rem;
        }

        .response-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.75rem;
        }

        .action-button {
          padding: 0.5rem 1rem;
          background-color: rgba(255, 255, 255, 0.2);
          color: #fff;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
        }

        .action-button:hover {
          background-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .view-mode-tabs {
          background-color: #4a5568;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #667080;
          display: flex;
          justify-content: center;
        }

        @media (min-width: 640px) {
          .view-mode-tabs {
            justify-content: flex-start;
          }
        }

        .tab-group {
          display: flex;
          gap: 0.75rem;
          background-color: #2d3748;
          padding: 0.25rem;
          border-radius: 0.5rem;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .tab-button {
          padding: 0.625rem 1.25rem;
          border-radius: 0.375rem;
          font-weight: 500;
          transition: all 0.2s ease-in-out;
          display: flex;
          align-items: center;
          color: #a0aec0;
          background-color: transparent;
        }

        .tab-button.active {
          background-color: #4299e1;
          color: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .tab-button:hover:not(.active) {
          background-color: #4a5568;
          color: #fff;
        }

        .response-content {
          padding: 1.5rem;
        }

        .json-display-container {
          background-color: #1a202c;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
          border: 1px solid #2d3748;
        }

        .json-pre {
          color: #68d391; /* Green-400 */
          font-size: 0.875rem;
          overflow: auto;
          max-height: 24rem;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
        }

        .raw-json-title {
          color: #fff;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        /* Table specific styles */
        .table-container {
          overflow-x: auto;
          border-radius: 0.75rem;
          border: 1px solid #4a5568;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        }

        .data-table {
          width: 100%;
          background-color: #2d3748;
          color: #fff;
          border-collapse: collapse; /* Ensure borders collapse */
        }

        .table-header-row {
          background-color: #4a5568;
        }

        .table-header-cell {
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.875rem;
          border-bottom: 1px solid #667080;
          position: sticky;
          top: 0;
          background-color: #4a5568; /* Ensure header background is consistent */
          z-index: 10;
        }

        .table-row {
          border-bottom: 1px solid #4a5568;
          transition: background-color 0.2s ease-in-out;
        }

        .table-row:hover {
          background-color: rgba(74, 85, 104, 0.5); /* Hover effect */
        }

        .even-row {
          background-color: #2d3748;
        }

        .odd-row {
          background-color: #1a202c;
        }

        .table-cell {
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
        }

        .italic-text {
          color: #a0aec0;
          text-align: center;
          font-style: italic;
        }

        .json-cell {
          color: #90cdf4; /* Blue-300 */
          font-size: 0.75rem;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
        }

        .view-button {
          background-color: #4299e1;
          color: #fff;
          padding: 0.25rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .view-button:hover {
          background-color: #3182ce;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .preview-link {
          color: #63b3ed; /* Blue-400 */
          font-weight: 500;
          text-decoration: underline;
          transition: color 0.2s ease-in-out;
        }

        .preview-link:hover {
          color: #4299e1;
        }

        .no-data-message {
          color: #a0aec0;
          text-align: center;
          padding: 2rem;
        }

        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fade-in 0.3s ease-out forwards;
        }

        .modal-content {
          background-color: #2d3748;
          color: #fff;
          border-radius: 0.75rem;
          padding: 2rem;
          min-width: 24rem;
          max-width: 48rem;
          max-height: 90vh;
          overflow: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border: 1px solid #4a5568;
          transform: scale(0.95);
          animation: scale-in 0.3s ease-out forwards;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #63b3ed; /* Blue-400 */
        }

        .modal-close-button {
          color: #a0aec0;
          font-size: 2rem;
          transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
          padding: 0.25rem;
          border-radius: 50%;
        }

        .modal-close-button:hover {
          color: #fff;
          background-color: #4a5568;
        }

        .modal-pre {
          background-color: #1a202c;
          padding: 1.5rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          overflow: auto;
          max-height: 60vh;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
          color: #68d391; /* Green-400 */
          border: 1px solid #2d3748;
        }

        /* Custom scrollbar for better aesthetics */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #2d3748;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #63b3ed;
          border-radius: 10px;
          border: 2px solid #2d3748;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4299e1;
        }
        `}
      </style>

      <div className="app-container">
        {/* Header */}
        <div className="header-section">
          <h1 className="header-title">
            API Explorer
          </h1>
          <p className="header-subtitle">Effortlessly test and visualize API responses</p>
        </div>

        {/* Main Form */}
        <div className="main-form">
          {/* URL and Method Row */}
          <div className="form-grid">
            <div className="url-input-container">
              <label className="form-label">API Endpoint</label>
              <div className="icon-container">
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://api.example.com/data"
                  className="input-field icon-left"
                />
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
            </div>
            <div>
              <label className="form-label">Method</label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="select-field"
              >
                {methodOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={handleFetch}
                disabled={loading}
                className="send-request-button"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Fetching...
                  </>
                ) : (
                  'Send Request'
                )}
              </button>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="advanced-options-grid">
            {/* Headers Section */}
            <div>
              <div className="section-header">
                <h3>Headers</h3>
                <button
                  onClick={handleAddHeader}
                  className="add-button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}><path d="M12 5v14"/><path d="M5 12h14"/></svg> Add Header
                </button>
              </div>
              <div className="custom-scrollbar" style={{ maxHeight: '10rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {headers.map((h, idx) => (
                  <div key={idx} className="input-group" style={{ marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      value={h.key}
                      onChange={e => handleHeaderChange(idx, 'key', e.target.value)}
                      placeholder="Header name"
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={h.value}
                      onChange={e => handleHeaderChange(idx, 'value', e.target.value)}
                      placeholder="Header value"
                      className="input-field"
                    />
                    <button
                      onClick={() => handleRemoveHeader(idx)}
                      className="remove-button"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Parameters Section */}
            <div>
              <div className="section-header">
                <h3>Query Parameters</h3>
                <button
                  onClick={handleAddParam}
                  className="add-button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}><path d="M12 5v14"/><path d="M5 12h14"/></svg> Add Parameter
                </button>
              </div>
              <div className="custom-scrollbar" style={{ maxHeight: '10rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {params.map((p, idx) => (
                  <div key={idx} className="input-group" style={{ marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      value={p.key}
                      onChange={e => handleParamChange(idx, 'key', e.target.value)}
                      placeholder="Parameter name"
                      className="input-field"
                    />
                    <input
                      type="text"
                      value={p.value}
                      onChange={e => handleParamChange(idx, 'value', e.target.value)}
                      placeholder="Parameter value"
                      className="input-field"
                    />
                    <button
                      onClick={() => handleRemoveParam(idx)}
                      className="remove-button"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Request Body */}
          {['POST', 'PUT', 'PATCH'].includes(method) && (
            <div style={{ marginTop: '2rem' }}>
              <h3 className="section-header">Request Body</h3>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={8}
                className="textarea-field"
                placeholder='Enter JSON body here, e.g., {"name": "John Doe", "age": 30}'
              />
            </div>
          )}

          {/* CORS Proxy Option */}
          <div className="cors-checkbox-container">
            <input
              type="checkbox"
              id="corsProxy"
              checked={useCorsProxy}
              onChange={e => setUseCorsProxy(e.target.checked)}
              className="cors-checkbox"
            />
            <label htmlFor="corsProxy" className="cors-label">
              Use CORS Proxy (for cross-origin requests)
            </label>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message-container">
            <svg className="error-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            <div>
              <h4 className="error-title">Request Failed</h4>
              <p className="error-text">{error}</p>
              {corsError && (
                <p className="error-text" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                  This might be a CORS issue. Try enabling the "Use CORS Proxy" option above.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Response Section */}
        {data && (
          <div className="response-section">
            {/* Response Header */}
            <div className="response-header">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="response-icon">✨</span>
                <div>
                  <h2 className="response-title">
                    {Array.isArray(normalizedData) ? filteredSortedData.length : 1} Items Found
                  </h2>
                  <p className="response-time">
                    Response received at {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="response-actions">
                <button
                  onClick={() => document.execCommand('copy')}
                  className="action-button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v2"/></svg> Copy JSON
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'api-response.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="action-button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Export JSON
                </button>
              </div>
            </div>

            {/* View Mode Tabs */}
            <div className="view-mode-tabs">
              <div className="tab-group">
                <button
                  onClick={() => setViewMode('table')}
                  className={`tab-button ${viewMode === 'table' ? 'active' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/></svg> Table View
                </button>
                <button
                  onClick={() => setViewMode('pretty')}
                  className={`tab-button ${viewMode === 'pretty' ? 'active' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><path d="M12 20h9"/><path d="M12 4h7a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-7"/><path d="M12 12h5a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-5"/><path d="M4 16v-4a2 2 0 0 1 2-2h1"/><path d="M4 8V6a2 2 0 0 1 2-2h1"/></svg> Pretty View
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`tab-button ${viewMode === 'raw' ? 'active' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> Raw View
                </button>
              </div>
            </div>

            {/* Response Content */}
            <div className="response-content">
              {viewMode === 'table' && renderTable()}
              {viewMode === 'pretty' && (
                <div className="json-display-container">
                  <pre className="json-pre custom-scrollbar">
                    {JSON.stringify(normalizedData, null, 2)}
                  </pre>
                </div>
              )}
              {viewMode === 'raw' && (
                <div className="json-display-container">
                  <h4 className="raw-json-title">Raw JSON Response:</h4>
                  <pre className="json-pre custom-scrollbar">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function ResponsesSection() {
  const [responses, setResponses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [filters, setFilters] = React.useState({ gameId: '', ip: '', utm_source: '', utm_medium: '', location: '' });

  React.useEffect(() => {
    const fetchResponses = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('http://localhost:5000/api/play-responses');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setResponses(data.reverse()); // newest first
      } catch (err) {
        setError('Failed to load responses');
      }
      setLoading(false);
    };
    fetchResponses();
  }, []);

  // Filtering logic
  const filteredResponses = React.useMemo(() => {
    return responses.filter(r => {
      const matchGameId = filters.gameId ? String(r.gameId || '').toLowerCase().includes(filters.gameId.toLowerCase()) : true;
      const matchIp = filters.ip ? String(r.ip || '').toLowerCase().includes(filters.ip.toLowerCase()) : true;
      const matchUtmSource = filters.utm_source ? String(r.utm_source || '').toLowerCase().includes(filters.utm_source.toLowerCase()) : true;
      const matchUtmMedium = filters.utm_medium ? String(r.utm_medium || '').toLowerCase().includes(filters.utm_medium.toLowerCase()) : true;
      const locationString = r.geo ? [r.geo.city, r.geo.region, r.geo.country].filter(Boolean).join(', ') : '';
      const matchLocation = filters.location ? locationString.toLowerCase().includes(filters.location.toLowerCase()) : true;
      return matchGameId && matchIp && matchUtmSource && matchUtmMedium && matchLocation;
    });
  }, [responses, filters]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!responses.length) return <div>No responses yet.</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Filter by Game ID"
          value={filters.gameId}
          onChange={e => setFilters(f => ({ ...f, gameId: e.target.value }))}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}
        />
        <input
          type="text"
          placeholder="Filter by IP"
          value={filters.ip}
          onChange={e => setFilters(f => ({ ...f, ip: e.target.value }))}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}
        />
        <input
          type="text"
          placeholder="Filter by UTM Source"
          value={filters.utm_source}
          onChange={e => setFilters(f => ({ ...f, utm_source: e.target.value }))}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}
        />
        <input
          type="text"
          placeholder="Filter by UTM Medium"
          value={filters.utm_medium}
          onChange={e => setFilters(f => ({ ...f, utm_medium: e.target.value }))}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}
        />
        <input
          type="text"
          placeholder="Filter by Location"
          value={filters.location}
          onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}
        />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fafafa' }}>
        <thead>
          <tr style={{ background: '#f3f3f3' }}>
            <th style={{ padding: 8 }}>Time</th>
            <th style={{ padding: 8 }}>Game ID</th>
            <th style={{ padding: 8 }}>IP</th>
            <th style={{ padding: 8 }}>UTM Source</th>
            <th style={{ padding: 8 }}>UTM Medium</th>
            <th style={{ padding: 8 }}>UTM Campaign</th>
            <th style={{ padding: 8 }}>Location</th>
            <th style={{ padding: 8 }}>User Agent</th>
            <th style={{ padding: 8 }}>Payout</th>
            <th style={{ padding: 8 }}>Payout Type</th>
            <th style={{ padding: 8 }}>Expires</th>
            <th style={{ padding: 8 }}>Monthly Cap</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Title</th>
            <th style={{ padding: 8 }}>Genre</th>
            <th style={{ padding: 8 }}>Rating</th>
            <th style={{ padding: 8 }}>Image</th>
          </tr>
        </thead>
        <tbody>
          {filteredResponses.map((r, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{r.timestamp ? new Date(r.timestamp).toLocaleString() : ''}</td>
              <td style={{ padding: 8 }}>{r.gameId}</td>
              <td style={{ padding: 8 }}>{r.ip}</td>
              <td style={{ padding: 8 }}>{r.utm_source}</td>
              <td style={{ padding: 8 }}>{r.utm_medium}</td>
              <td style={{ padding: 8 }}>{r.utm_campaign}</td>
              <td style={{ padding: 8 }}>
                {r.geo && (r.geo.city || r.geo.region || r.geo.country)
                  ? [r.geo.city, r.geo.region, r.geo.country].filter(Boolean).join(', ')
                  : ''}
              </td>
              <td style={{ padding: 8, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.userAgent}</td>
              <td style={{ padding: 8 }}>{r.payout || '-'}</td>
              <td style={{ padding: 8 }}>{r.payout_type || '-'}</td>
              <td style={{ padding: 8 }}>{r.expiration_date ? new Date(r.expiration_date).toLocaleDateString() : '-'}</td>
              <td style={{ padding: 8 }}>{r.monthly_conversion_cap || '-'}</td>
              <td style={{ padding: 8 }}>{r.status || '-'}</td>
              <td style={{ padding: 8 }}>{r.title || '-'}</td>
              <td style={{ padding: 8 }}>{r.genre || '-'}</td>
              <td style={{ padding: 8 }}>{r.rating || '-'}</td>
              <td style={{ padding: 8 }}>
                {r.image ? <img src={r.image} alt={r.title} style={{ width: 40, height: 28, objectFit: 'cover', borderRadius: 4 }} /> : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredResponses.length === 0 && <div style={{ marginTop: 16, color: '#888' }}>No responses match your filters.</div>}
    </div>
  );
}



// Helper to flatten offers from fetch history
function flattenOffers(fetchHistory) {
  const offers = [];
  function extractOffers(obj) {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach(extractOffers);
    } else {
      // If this object is keyed by id
      Object.entries(obj).forEach(([key, value]) => {
        if (value && (value.preview_url || value.link)) {
          offers.push({ id: key, ...value });
        }
      });
      // If this object has id as a value
      if ((obj.id || obj.offer_id || obj._id) && (obj.preview_url || obj.link)) {
        offers.push(obj);
      }
      // If this object has an Offer sub-object
      if (obj.Offer && typeof obj.Offer === "object") {
        const offer = obj.Offer;
        if ((offer.id || offer.offer_id || offer._id) && (offer.preview_url || offer.link)) {
          offers.push(offer);
        }
      }
      // Recursively search all properties
      Object.values(obj).forEach(extractOffers);
    }
  }
  fetchHistory.forEach(entry => extractOffers(entry.response));
  return offers;
}

const OurOffer = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffers, setSelectedOffers] = useState([]);
  const COUNTRY_LIST = [
  'IN', 'CN', 'US', 'AU', 'GB', 'CA', 'AF', 'AL', 'AD', 'AO', 'AR', 'AM', 'AW', 'AT', 'AZ', 'BS', 'BH'
];
const [checking, setChecking] = useState({});
const [proxyResults, setProxyResults] = useState({});

  useEffect(() => {
    axios.get("http://localhost:5000/api/fetch-history")
      .then(res => {
        const allOffers = flattenOffers(res.data);
        // Only keep offers with numeric id and deduplicate by id
        const uniqueOffers = Array.from(
          new Map(
            allOffers
              .filter(offer => {
                const id = offer.id || offer.offer_id || offer._id;
                return id && !isNaN(Number(id));
              })
              .map(offer => [offer.id || offer.offer_id || offer._id, offer])
          ).values()
        );
        setOffers(uniqueOffers);
      })
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);
  
  const handleProxyCheck = async (offerId, previewUrl) => {
  setChecking(prev => ({ ...prev, [offerId]: true }));
  let results = {};
  for (const country of COUNTRY_LIST) {
    try {
      const res = await fetch("http://localhost:5000/api/check-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, url: previewUrl })
      });
      const data = await res.json();
      results[country] = data.ok ? "✅" : "❌";
    } catch {
      results[country] = "❌";
    }
  }
  setProxyResults(prev => ({ ...prev, [offerId]: results }));
  setChecking(prev => ({ ...prev, [offerId]: false }));
};

  return (
<div className="our-offer-page">
  <h2 style={{ textAlign: "center", margin: "2rem 0" }}>Our Offers</h2>
  {loading ? (
    <p>Loading...</p>
  ) : offers.length === 0 ? (
    <p>No offers found.</p>
  ) : (
    <div className="offertable">
      <button
  disabled={selectedOffers.length === 0}
  onClick={async () => {
    const selected = offers.filter(offer =>
      selectedOffers.includes(offer.id || offer.offer_id || offer._id)
    );
    for (const offer of selected) {
      await fetch('http://localhost:5000/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: offer.id || offer.offer_id || offer._id,
          title: offer.title || offer.name || offer.id,
          image: offer.image,
          description: offer.description || '',
          link: `http://localhost:5000/go/${offer.id || offer.offer_id || offer._id}`,
          preview_url: offer.preview_url || offer.link,
          genre: offer.genre || '',
          rating: offer.rating || '',
          traffic_type: offer.traffic_type || '',
          countries: offer.countries || [],
          payout: offer.default_payout ? (offer.default_payout * 0.5).toFixed(2) : '',
          payout_type: offer.payout_type || '',
        }),
      });
    }
    alert('Selected offers have been added to games.json! Go to Home to see them.');
    setSelectedOffers([]);
  }}
  style={{
    margin: '1rem 0',
    padding: '8px 20px',
    background: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontWeight: 'bold',
    fontSize: 16,
    cursor: selectedOffers.length === 0 ? 'not-allowed' : 'pointer'
  }}
>
  Add Selected to Home Page
</button>
      <table className="offer-table">
        
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={offers.length > 0 && selectedOffers.length === offers.length}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedOffers(offers.map(offer => offer.id || offer.offer_id || offer._id));
                  } else {
                    setSelectedOffers([]);
                  }
                }}
              />
            </th>
            <th>Image</th>
            <th>Offer Name</th>
            <th>Traffic Type</th>
            <th>Countries</th>
            <th>ID</th>
            <th>Genre</th>
            <th>Rating</th>
            <th>Price</th>
            <th>Payout Type</th>
            <th>Monthly Cap</th>
            <th>Expires</th>
            <th>Masked Link</th>
            <th>Preview URL</th>
            <th>Description</th>
            <th>Preview Working In</th>
            <th>Add To HomePage</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer, idx) => {
            const [namePart, rest] = offer.name?.split("_") || [offer.name, ""];
            const parts = rest.trim().split(" ");
            const lastPart = parts[parts.length - 1];
            const trafficType = parts.slice(0, -1).join(" ");
            const countries = lastPart.split(",").map(c => c.trim());

            return (
              <tr key={offer.id || offer.offer_id || offer._id || idx}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedOffers.includes(offer.id || offer.offer_id || offer._id)}
                    onChange={e => {
                        const id = offer.id || offer.offer_id || offer._id;
                        setSelectedOffers(prev => e.target.checked ? [...prev, id] : prev.filter(selId => selId !== id));
                        }}
                      />
                </td>
                <td>
                  {offer.image && (
                    <img
                      src={offer.image}
                      alt={offer.title || offer.id}
                      style={{ width: 80, height: 50, objectFit: "cover" }}
                    />
                  )}
                </td>
                <td>{namePart}</td>
                <td>{trafficType}</td>
                <td>{countries.join(", ")}</td>
                <td>{offer.title || offer.id || offer.offer_id || offer._id}</td>
                <td>{offer.genre || "-"}</td>
                <td>{offer.rating || "-"}</td>
                <td>{offer.default_payout ? (offer.default_payout * 0.5).toFixed(2) : "-"}</td>
                <td>{offer.payout_type || "-"}</td>
                <td>{offer.monthly_conversion_cap || "-"}</td>
                <td>{offer.expiration_date ? new Date(offer.expiration_date).toLocaleDateString() : "-"}</td>
                <td>
                  <a
                    href={`http://localhost:5000/go/${offer.id || offer.offer_id || offer._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    Link
                  </a>
                </td>
                <td>
                  {offer.preview_url || offer.link ? (
                    <a
                      href={offer.preview_url || offer.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      Preview
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {offer.description ? (
                    <button
                      onClick={() => alert(offer.description)}
                      className="btn btn-info"
                    >
                      View
                    </button>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
  <button
    onClick={() => handleProxyCheck(offer.id || offer.offer_id || offer._id || idx, offer.preview_url || offer.link)}
    disabled={checking[offer.id || offer.offer_id || offer._id || idx]}
    style={{ padding: "4px 12px", borderRadius: 4, background: "#1976d2", color: "#fff", border: "none", fontWeight: "bold" }}
  >
    {checking[offer.id || offer.offer_id || offer._id || idx] ? "Checking..." : "Check"}
  </button>
  {proxyResults[offer.id || offer.offer_id || offer._id || idx] && (
    <div style={{ marginTop: 8, fontSize: 13, maxWidth: 200, overflowX: "auto" }}>
      {COUNTRY_LIST.map(c => (
        <span key={c} style={{ marginRight: 6 }}>
          {c}: {proxyResults[offer.id || offer.offer_id || offer._id || idx][c]}
        </span>
      ))}
    </div>
  )}
</td>
  <button
    style={{
      background: "#1976d2",
      color: "#fff",
      border: "none",
      borderRadius: 6,
      padding: "10px 22px",
      fontWeight: "bold",
      fontSize: 16,
      cursor: "pointer",
      boxShadow: "0 2px 8px #1976d222"
    }}
    onClick={async () => {
      // Send all offers to backend to add to games.json
      try {
        const res = await fetch('http://localhost:5000/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: offer.id || offer.offer_id || offer._id,
            title: offer.title || offer.name || offer.id,
            image: offer.image,
            description: offer.description || '',
            link: `http://localhost:5000/go/${offer.id || offer.offer_id || offer._id}`,
            preview_url: offer.preview_url || offer.link,
            genre: offer.genre || '',
            rating: offer.rating || '',
            traffic_type: offer.traffic_type || '',
            countries: offer.countries || [],
            payout: offer.default_payout ? (offer.default_payout * 0.5).toFixed(2) : '',
            payout_type: offer.payout_type || '',
          }),
          });
        if (res.ok) {
          alert('offers have been added to games.json! Go to Home to see them.');
        } else {
          const err = await res.json();
          alert('Failed to add offers: ' + (err.error || 'Unknown error'));
        }
      } catch (e) {
        alert('Failed to add offers: ' + e.message);
      }
    }}
  >
    Add Offers to Games
  </button>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}
</div>
  );
};

function OfferSchedularSection() {
  const [offers, setOffers] = React.useState([]);
  const [selectedOfferIds, setSelectedOfferIds] = React.useState([]);
  const [externalLinks, setExternalLinks] = React.useState([{ url: '' }]);
  const [schedules, setSchedules] = React.useState([
    { startDate: '', endDate: '', startTime: '', endTime: '' }
  ]);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');

  // Fetch offers on mount
  React.useEffect(() => {
    fetch('http://localhost:5000/api/fetch-history')
      .then(res => res.json())
      .then(data => {
        const allOffers = flattenOffers(data);
        const uniqueOffers = Array.from(
          new Map(
            allOffers
              .filter(offer => {
                const id = offer.id || offer.offer_id || offer._id;
                return id && !isNaN(Number(id));
              })
              .map(offer => [offer.id || offer.offer_id || offer._id, offer])
          ).values()
        );
        setOffers(uniqueOffers);
      });
  }, []);

  // Select/deselect offers
  const toggleOffer = id => setSelectedOfferIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  // External links handlers
  const addExternalLink = () => setExternalLinks(prev => [...prev, { url: '' }]);
  const removeExternalLink = idx => setExternalLinks(prev => prev.filter((_, i) => i !== idx));
  const updateExternalLink = (idx, value) => setExternalLinks(prev => prev.map((l, i) => i === idx ? { url: value } : l));

  // Scheduler row handlers
  const addSchedule = () => setSchedules(prev => [...prev, { startDate: '', endDate: '', startTime: '', endTime: '' }]);
  const removeSchedule = idx => setSchedules(prev => prev.filter((_, i) => i !== idx));
  const updateSchedule = (idx, field, value) => setSchedules(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  // Submit handler
  const handleSubmit = async () => {
    setLoading(true);
    setMessage('');
    if (selectedOfferIds.length === 0) {
      setMessage('Select at least one offer.');
      setLoading(false);
      return;
    }
    if (externalLinks.some(l => !l.url)) {
      setMessage('All external link fields must be filled.');
      setLoading(false);
      return;
    }
    if (schedules.some(s => !s.startDate || !s.endDate || !s.startTime || !s.endTime)) {
      setMessage('All schedule fields must be filled.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/offer-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerIds: selectedOfferIds,
          externalLinks: externalLinks.map(l => l.url),
          schedules
        })
      });
      if (res.ok) {
        setMessage('Schedules saved!');
        setSelectedOfferIds([]);
        setExternalLinks([{ url: '' }]);
        setSchedules([{ startDate: '', endDate: '', startTime: '', endTime: '' }]);
      } else {
        const err = await res.json();
        setMessage(err.error || 'Failed to save schedules.');
      }
    } catch (e) {
      setMessage('Network error.');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Offer Scheduler</h2>
      {/* Offer Picker */}
      <div style={{ marginBottom: 18 }}>
        <strong>Select Offers:</strong>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
          {offers.map(offer => {
            const id = offer.id || offer.offer_id || offer._id;
            return (
              <label key={id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 8, minWidth: 180, cursor: 'pointer', background: selectedOfferIds.includes(id) ? '#e6f0fa' : '#fafbfc' }}>
                <input
                  type="checkbox"
                  checked={selectedOfferIds.includes(id)}
                  onChange={() => toggleOffer(id)}
                  style={{ marginRight: 8 }}
                />
                {offer.title || id}
              </label>
            );
          })}
        </div>
      </div>
      {/* External Links */}
      <div style={{ marginBottom: 18 }}>
        <strong>External Links:</strong>
        {externalLinks.map((link, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <input
              type="url"
              value={link.url}
              onChange={e => updateExternalLink(idx, e.target.value)}
              placeholder="https://external-link.com"
              style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
            {externalLinks.length > 1 && (
              <button onClick={() => removeExternalLink(idx)} style={{ color: 'red', border: 'none', background: 'none', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}>×</button>
            )}
          </div>
        ))}
        <button type="button" onClick={addExternalLink} style={{ marginTop: 4 }}>+ Add Link</button>
      </div>
      {/* Schedules */}
      <div style={{ marginBottom: 18 }}>
        <strong>Schedule:</strong>
        {schedules.map((s, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <input type="date" value={s.startDate} onChange={e => updateSchedule(idx, 'startDate', e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
            <input type="time" value={s.startTime} onChange={e => updateSchedule(idx, 'startTime', e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
            <span>to</span>
            <input type="date" value={s.endDate} onChange={e => updateSchedule(idx, 'endDate', e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
            <input type="time" value={s.endTime} onChange={e => updateSchedule(idx, 'endTime', e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
            {schedules.length > 1 && (
              <button onClick={() => removeSchedule(idx)} style={{ color: 'red', border: 'none', background: 'none', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}>×</button>
            )}
          </div>
        ))}
        <button type="button" onClick={addSchedule} style={{ marginTop: 4 }}>+ Add Schedule</button>
      </div>
      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ padding: '12px 32px', borderRadius: 6, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: 16, marginTop: 12 }}
      >
        {loading ? 'Saving...' : 'Schedule Offers'}
      </button>
      {message && <div style={{ marginTop: 18, color: message.includes('error') ? 'red' : 'green' }}>{message}</div>}
    </div>
  );
}


// Add this component to your Dashboard.jsx


const PROXY_CONFIG = {
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

function ProxyCheckerSection() {
  const [country, setCountry] = React.useState('IN');
  const [url, setUrl] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const countryList = Object.keys(PROXY_CONFIG.proxy_map);

  const handleCheck = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('http://localhost:5000/api/check-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, url })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ ok: false, error: e.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <h2>Proxy Checker</h2>
      <div style={{ marginBottom: 12 }}>
        <label>
          Country:&nbsp;
          <select value={country} onChange={e => setCountry(e.target.value)}>
            {countryList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>
          Offer/Preview URL:&nbsp;
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/offer"
            style={{ width: "80%" }}
          />
        </label>
      </div>
      <button onClick={handleCheck} disabled={loading || !url} style={{ padding: '6px 18px', borderRadius: 4, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 'bold' }}>
        {loading ? 'Checking...' : 'Check Proxy'}
      </button>
      {result && (
        <div style={{ marginTop: 18 }}>
          {result.ok ? (
            <div style={{ color: 'green' }}>
              ✅ Proxy for {country} is working!<br />
              Status: {result.status} {result.statusText}
            </div>
          ) : (
            <div style={{ color: 'red' }}>
              ❌ Proxy failed: {result.error}
            </div>
          )}
          <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
            Proxy: {result.proxy}
          </div>
        </div>
      )}
    </div>
  );
}

function ShowingScheduledOffersSection() {
  const [schedules, setSchedules] = React.useState([]);
  const [offers, setOffers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch schedules and offers on mount
  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [schedulesRes, offersRes] = await Promise.all([
        axios.get("http://localhost:5000/api/schedules"),
        axios.get("http://localhost:5000/api/games"),
      ]);
      setSchedules(schedulesRes.data);
      setOffers(offersRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Helper to get offer info by id
  function getOffer(offerId) {
    return offers.find(
      (o) =>
        String(o.id) === String(offerId) ||
        String(o.offer_id) === String(offerId) ||
        String(o._id) === String(offerId)
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: 24, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #eee" }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Scheduled Offers</h2>
      {loading ? (
        <div>Loading...</div>
      ) : schedules.length === 0 ? (
        <div>No scheduled offers found.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f4fa" }}>
              <th>Offer</th>
              <th>Image</th>
              <th>External Link</th>
              <th>Schedule</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => {
              const offer = getOffer(s.offerId);
              return (
                <tr key={s.id}>
                  <td>
                      <div>
                        {s.offerId}
                      </div>
                  </td>
                  <td>
                    {offer && offer.image ? (
                      <img src={offer.image} alt={offer.title} style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 4 }} />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.url}
                    </a>
                  </td>
                  <td>
                    {s.startDate} {s.startTime} <br />to<br /> {s.endDate} {s.endTime}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}



function FetchHistorySection() {
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('http://localhost:5000/api/fetch-history');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        setError('Failed to load fetch history');
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!history.length) return <div>No fetch history yet.</div>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fafafa' }}>
        <thead>
          <tr style={{ background: '#f3f3f3' }}>
            <th style={{ padding: 8 }}>Time</th>
            <th style={{ padding: 8 }}>Method</th>
            <th style={{ padding: 8 }}>URL</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Response (Preview)</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}</td>
              <td style={{ padding: 8 }}>{h.method}</td>
              <td style={{ padding: 8, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.url}</td>
              <td style={{ padding: 8 }}>{h.status}</td>
              <td style={{ padding: 8, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {typeof h.response === 'object' ? JSON.stringify(h.response).slice(0, 100) : String(h.response).slice(0, 100)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// function EmailConfigSection() {
//   const [config, setConfig] = React.useState({ host: '', port: 465, secure: true, user: '', pass: '', from: '' });
//   const [to, setTo] = React.useState('');
//   const [subject, setSubject] = React.useState('');
//   const [body, setBody] = React.useState('');
//   const [status, setStatus] = React.useState('');
//   const [sending, setSending] = React.useState(false);
//   const [offers, setOffers] = React.useState([]);
//   const [selectedOffers, setSelectedOffers] = React.useState([]);

//   React.useEffect(() => {
//     fetch('http://localhost:5000/api/fetch-history')
//       .then(res => res.json())
//       .then(data => {
//         const allOffers = flattenOffers(data);
//         // Only keep offers with numeric id and deduplicate by id
//         const uniqueOffers = Array.from(
//           new Map(
//             allOffers
//               .filter(offer => {
//                 const id = offer.id || offer.offer_id || offer._id;
//                 return id && !isNaN(Number(id));
//               })
//               .map(offer => [offer.id || offer.offer_id || offer._id, offer])
//           ).values()
//         );
//         setOffers(uniqueOffers);
//       })
//       .catch(() => setOffers([]));
//   }, []);

//   // Update body when selectedOffers changes
//   React.useEffect(() => {
//     if (selectedOffers.length === 0) return;
//     const offersText = selectedOffers.map(offer =>
//       `Offer: ${offer.title || offer.id}\nLink: http://localhost:5000/go/${offer.id || offer.offer_id || offer._id}`
//     ).join('\n\n');
//     setBody(offersText);
//   }, [selectedOffers]);

//   // Toggle offer selection
//   const toggleOffer = (offer) => {
//     const id = offer.id || offer.offer_id || offer._id;
//     setSelectedOffers(prev => {
//       if (prev.some(o => (o.id || o.offer_id || o._id) === id)) {
//         return prev.filter(o => (o.id || o.offer_id || o._id) !== id);
//       } else {
//         return [...prev, offer];
//       }
//     });
//   };

//   // Save config
//   const saveConfig = async () => {
//     setStatus('');
//     try {
//       const res = await fetch('http://localhost:5000/api/email-config', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(config)
//       });
//       const data = await res.json();
//       if (res.ok) setStatus('Config saved!');
//       else setStatus(data.error || 'Failed to save config');
//     } catch (e) {
//       setStatus('Failed to save config');
//     }
//   };

//   // Send test email
//   const sendEmail = async () => {
//     setSending(true);
//     setStatus('');
//     try {
//       const res = await fetch('http://localhost:5000/api/send-email', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ to, subject, text: body })
//       });
//       const data = await res.json();
//       if (res.ok) setStatus('Email sent!');
//       else setStatus(data.error || 'Failed to send email');
//     } catch (e) {
//       setStatus('Failed to send email');
//     }
//     setSending(false);
//   };

//   return (
//     <div>
//       <h3>SMTP Config</h3>
//       <input placeholder="Host" value={config.host} onChange={e => setConfig(c => ({ ...c, host: e.target.value }))} style={{ width: '100%', marginBottom: 8 }} />
//       <input placeholder="Port" type="number" value={config.port} onChange={e => setConfig(c => ({ ...c, port: Number(e.target.value) }))} style={{ width: '100%', marginBottom: 8 }} />
//       <label>
//         <input type="checkbox" checked={config.secure} onChange={e => setConfig(c => ({ ...c, secure: e.target.checked }))} />
//         Secure (SSL/TLS)
//       </label>
//       <input placeholder="User" value={config.user} onChange={e => setConfig(c => ({ ...c, user: e.target.value }))} style={{ width: '100%', marginBottom: 8 }} />
//       <input placeholder="Password" type="password" value={config.pass} onChange={e => setConfig(c => ({ ...c, pass: e.target.value }))} style={{ width: '100%', marginBottom: 8 }} />
//       <input placeholder="From Email" value={config.from} onChange={e => setConfig(c => ({ ...c, from: e.target.value }))} style={{ width: '100%', marginBottom: 8 }} />
//       <button onClick={saveConfig} style={{ marginBottom: 16 }}>Save Config</button>
//       <h3>Send Test Email</h3>
//       <input placeholder="To Email" value={to} onChange={e => setTo(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
//       <input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
//       {/* Offer Picker */}
//       <label style={{ fontWeight: 500, marginBottom: 4 }}>Choose Offers to Include:</label>
//       <div style={{
//         display: 'flex',
//         overflowX: 'auto',
//         gap: 12,
//         padding: '8px 0',
//         marginBottom: 12,
//         borderBottom: '1px solid #eee'
//       }}>
//         {offers.map((offer, idx) => {
//           const id = offer.id || offer.offer_id || offer._id;
//           const isSelected = selectedOffers.some(o => (o.id || o.offer_id || o._id) === id);
//           return (
//             <button
//               key={id || idx}
//               style={{
//                 minWidth: 180,
//                 border: isSelected ? '2px solid #3182ce' : '1px solid #ccc',
//                 borderRadius: 8,
//                 background: isSelected ? '#e6f0fa' : '#fafbfc',
//                 padding: 8,
//                 cursor: 'pointer',
//                 boxShadow: isSelected ? '0 2px 8px #3182ce33' : '0 1px 4px #eee'
//               }}
//               onClick={() => toggleOffer(offer)}
//             >
//               <div style={{ fontWeight: 600 }}>{offer.title || id}</div>
//               {offer.image && <img src={offer.image} alt={offer.title} style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 6, margin: '6px 0' }} />}
//               <div style={{ fontSize: 13, color: '#555' }}>{offer.genre}</div>
//               <div style={{ fontSize: 13, color: '#888' }}>{offer.rating && `⭐ ${offer.rating}`}</div>
//             </button>
//           );
//         })}
//       </div>
//       <textarea placeholder="Body" value={body} onChange={e => setBody(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
//       <button onClick={sendEmail} disabled={sending}>{sending ? 'Sending...' : 'Send Email'}</button>
//       {status && <div style={{ marginTop: 12, color: status.includes('fail') ? 'red' : 'green' }}>{status}</div>}
//     </div>
//   );
// }

function EmailConfigSection() {
    // State for SMTP configuration
    const [config, setConfig] = React.useState({
        host: '',
        port: 465,
        secure: true,
        user: '',
        pass: '',
        from: ''
    });

    // State for the test email form
    const [to, setTo] = React.useState('');
    const [subject, setSubject] = React.useState('');
    const [body, setBody] = React.useState('');
    const [cc, setCc] = React.useState('');
    const [bcc, setBcc] = React.useState('');

    // State for component status and async operations
    const [status, setStatus] = React.useState({ message: '', type: '' }); // type can be 'success' or 'error'
    const [sending, setSending] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [parsingFile, setParsingFile] = React.useState(false); // New state for file parsing
    
    // State for email scheduler
    const [scheduleEnabled, setScheduleEnabled] = React.useState(false);
    const [scheduleType, setScheduleType] = React.useState('daily'); // daily, weekly, monthly
    const [scheduleTime, setScheduleTime] = React.useState('12:00');
    const [scheduleDays, setScheduleDays] = React.useState([]); // For weekly: ['monday', 'wednesday', etc]
    const [scheduleDate, setScheduleDate] = React.useState(1); // For monthly: 1-31
    const [scheduleSaving, setScheduleSaving] = React.useState(false);
    const [scheduledEmails, setScheduledEmails] = React.useState([]);

    // State for offers fetched from the backend
    const [offers, setOffers] = React.useState([]);
    const [selectedOffers, setSelectedOffers] = React.useState([]);

    // New state for extracted emails from Excel
    const [extractedEmails, setExtractedEmails] = React.useState([]);
    // New state for selectable emails (can be populated from extractedEmails or other sources)
    const [selectableEmails, setSelectableEmails] = React.useState([]);
    // New state for selected recipient emails
    const [selectedRecipients, setSelectedRecipients] = React.useState([]);

    // Fetch config, offer history, and scheduled emails on component mount
    React.useEffect(() => {
        const fetchConfigAndOffers = async () => {
            // Fetch configuration
            try {
                const configRes = await fetch('http://localhost:5000/api/email-config');
                if (configRes.ok) {
                    const configData = await configRes.json();
                    setConfig(prevConfig => ({ ...prevConfig, ...configData }));
                }
            } catch (e) {
                console.error("Failed to fetch email config:", e);
                // Optionally set status for config fetch error
            }
            
            // Fetch scheduled emails
            try {
                const scheduledRes = await fetch('http://localhost:5000/api/scheduled-emails');
                if (scheduledRes.ok) {
                    const scheduledData = await scheduledRes.json();
                    setScheduledEmails(scheduledData);
                }
            } catch (e) {
                console.error("Failed to fetch scheduled emails:", e);
                // Optionally set status for scheduled emails fetch error
            }

            // Fetch offers
            try {
                const res = await fetch('http://localhost:5000/api/fetch-history');
                const data = await res.json();
                const allOffers = flattenOffers(data);
                // Deduplicate offers by a composite key to ensure uniqueness
                const uniqueOffers = Array.from(
                    new Map(
                        allOffers
                            .filter(offer => {
                                const id = offer.id || offer.offer_id || offer._id;
                                return id && !isNaN(Number(id));
                            })
                            .map(offer => [offer.id || offer.offer_id || offer._id, offer])
                    ).values()
                );
                setOffers(uniqueOffers);
            } catch (e) {
                setStatus({ message: 'Could not fetch offers.', type: 'error' });
                setOffers([]);
            }
        };

        fetchConfigAndOffers();
    }, []);

    // Update email body automatically when selected offers change
    React.useEffect(() => {
        if (selectedOffers.length === 0) {
            setBody(''); // Clear body if no offers are selected
            return;
        }
        // Generate a simple text body with offer details
        const offersText = selectedOffers.map(offer => {
            const id = offer.id || offer.offer_id || offer._id;
            const title = offer.title || offer.name || `Offer #${id}`;
            const link = `http://localhost:5000/go/${id}`;
            return `Title: ${title}\nLink: ${link}`;
        }).join('\n\n---\n\n');

        setBody(`Hello,\n\nHere are the offers you requested:\n\n${offersText}\n\nBest regards.`);
    }, [selectedOffers]);

    // Toggle selection of an offer card
    const toggleOffer = (offer) => {
        const id = offer.id || offer.offer_id || offer._id;
        setSelectedOffers(prev => {
            const isSelected = prev.some(o => (o.id || o.offer_id || o._id) === id);
            if (isSelected) {
                return prev.filter(o => (o.id || o.offer_id || o._id) !== id);
            } else {
                return [...prev, offer];
            }
        });
    };

    // Toggle selection of an email recipient card
    const toggleRecipient = (email) => {
        setSelectedRecipients(prev => {
            const isSelected = prev.includes(email);
            if (isSelected) {
                return prev.filter(e => e !== email);
            } else {
                return [...prev, email];
            }
        });
    };

    // Save the SMTP configuration
    const saveConfig = async () => {
        setSaving(true);
        setStatus({ message: '', type: '' });
        try {
            const res = await fetch('http://localhost:5000/api/email-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            const data = await res.json();
            if (res.ok) {
                setStatus({ message: 'Configuration saved successfully!', type: 'success' });
            } else {
                setStatus({ message: data.error || 'Failed to save config. Please check the details.', type: 'error' });
            }
        } catch (e) {
            setStatus({ message: 'A network error occurred while saving.', type: 'error' });
        }
        setSaving(false);
    };

    // Send the test email
    const sendEmail = async () => {
        setSending(true);
        setStatus({ message: '', type: '' });
        try {
            const res = await fetch('http://localhost:5000/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, cc, bcc, subject, text: body })
            });
            const data = await res.json();
            if (res.ok) {
                setStatus({ message: 'Test email sent successfully!', type: 'success' });
            } else {
                setStatus({ message: data.error || 'Failed to send email. Check your config and recipient.', type: 'error' });
            }
        } catch (e) {
            setStatus({ message: 'A network error occurred while sending.', type: 'error' });
        }
        setSending(false);
    };
    
    // Save a scheduled email
    const saveScheduledEmail = async () => {
        setScheduleSaving(true);
        setStatus({ message: '', type: '' });
        
        // Validate inputs
        if (!to) {
            setStatus({ message: 'Recipient email is required', type: 'error' });
            setScheduleSaving(false);
            return;
        }
        
        if (!subject || !body) {
            setStatus({ message: 'Subject and body are required', type: 'error' });
            setScheduleSaving(false);
            return;
        }
        
        // For weekly schedule, ensure at least one day is selected
        if (scheduleType === 'weekly' && scheduleDays.length === 0) {
            setStatus({ message: 'Please select at least one day of the week', type: 'error' });
            setScheduleSaving(false);
            return;
        }
        
        try {
            const scheduleData = {
                to,
                cc,
                bcc,
                subject,
                body,
                scheduleType,
                scheduleTime,
                scheduleDays: scheduleType === 'weekly' ? scheduleDays : [],
                scheduleDate: scheduleType === 'monthly' ? scheduleDate : null,
                enabled: scheduleEnabled,
                createdAt: new Date().toISOString()
            };
            
            const res = await fetch('http://localhost:5000/api/scheduled-emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scheduleData)
            });
            
            const data = await res.json();
            
            if (res.ok) {
                // Add the new scheduled email to the state
                setScheduledEmails(prev => [...prev, data]);
                setStatus({ message: 'Email schedule saved successfully!', type: 'success' });
                
                // Optionally reset form fields
                // setTo('');
                // setSubject('');
                // setBody('');
                // setCc('');
                // setBcc('');
            } else {
                setStatus({ message: data.error || 'Failed to save scheduled email', type: 'error' });
            }
        } catch (e) {
            setStatus({ message: 'A network error occurred while saving the schedule', type: 'error' });
            console.error('Error saving scheduled email:', e);
        }
        
        setScheduleSaving(false);
    };

    // Handle Excel file upload and extract Gmail addresses
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        setParsingFile(true);
        setStatus({ message: '', type: '' });
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                // XLSX is globally available via the script tag
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Read as array of arrays

                // Updated regex to capture all email addresses
                const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
                const foundEmails = new Set();

                json.forEach(row => {
                    if (Array.isArray(row)) {
                        row.forEach(cell => {
                            if (typeof cell === 'string') {
                                let match;
                                while ((match = emailRegex.exec(cell)) !== null) {
                                    foundEmails.add(match[0]);
                                }
                            }
                        });
                    }
                });

                const uniqueFoundEmails = Array.from(foundEmails);
                setExtractedEmails(uniqueFoundEmails);
                setSelectableEmails(uniqueFoundEmails); // Populate selectable emails
                setSelectedRecipients([]); // Clear previous selections
                setStatus({ message: `Found ${foundEmails.size} email addresses!`, type: 'success' });
            } catch (error) {
                console.error("Error reading Excel file:", error);
                setStatus({ message: `Error reading file: ${error.message}`, type: 'error' });
                setExtractedEmails([]);
                setSelectableEmails([]);
            } finally {
                setParsingFile(false);
            }
        };

        reader.onerror = (error) => {
            console.error("File reader error:", error);
            setStatus({ message: `File read error: ${error.message}`, type: 'error' });
            setParsingFile(false);
        };

        reader.readAsArrayBuffer(file);
    };

    // Function to copy ALL extracted emails to a target input field (from Excel section)
    const copyAllExtractedEmailsToField = (field) => {
        const allEmails = extractedEmails.join(', ');
        if (field === 'to') setTo(prev => (prev ? `${prev}, ${allEmails}` : allEmails));
        else if (field === 'cc') setCc(prev => (prev ? `${prev}, ${allEmails}` : allEmails));
        else if (field === 'bcc') setBcc(prev => (prev ? `${prev}, ${allEmails}` : allEmails));
        setStatus({ message: `All extracted emails copied to ${field} field!`, type: 'success' });
    };

    // Function to copy SELECTED emails to a target input field (from new selection section)
    const copySelectedRecipientsToField = (field) => {
        const selected = selectedRecipients.join(', ');
        if (field === 'to') setTo(prev => (prev ? `${prev}, ${selected}` : selected));
        else if (field === 'cc') setCc(prev => (prev ? `${prev}, ${selected}` : selected));
        else if (field === 'bcc') setBcc(prev => (prev ? `${prev}, ${selected}` : selected));
        setStatus({ message: `Selected emails copied to ${field} field!`, type: 'success' });
    };
    
    // Delete a scheduled email
    const deleteScheduledEmail = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/scheduled-emails/${id}`, {
                method: 'DELETE'
            });
            
            if (res.ok) {
                // Remove the deleted email from state
                setScheduledEmails(prev => prev.filter(email => email.id !== id));
                setStatus({ message: 'Scheduled email deleted successfully!', type: 'success' });
            } else {
                const data = await res.json();
                setStatus({ message: data.error || 'Failed to delete scheduled email', type: 'error' });
            }
        } catch (e) {
            setStatus({ message: 'A network error occurred while deleting', type: 'error' });
            console.error('Error deleting scheduled email:', e);
        }
    };
    
    // Toggle the enabled status of a scheduled email
    const toggleScheduledEmail = async (id, currentEnabled) => {
        try {
            const res = await fetch(`http://localhost:5000/api/scheduled-emails/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !currentEnabled })
            });
            
            if (res.ok) {
                // Update the email in state
                setScheduledEmails(prev => prev.map(email => 
                    email.id === id ? { ...email, enabled: !currentEnabled } : email
                ));
                setStatus({ 
                    message: `Scheduled email ${!currentEnabled ? 'enabled' : 'disabled'} successfully!`, 
                    type: 'success' 
                });
            } else {
                const data = await res.json();
                setStatus({ message: data.error || 'Failed to update scheduled email', type: 'error' });
            }
        } catch (e) {
            setStatus({ message: 'A network error occurred while updating', type: 'error' });
            console.error('Error updating scheduled email:', e);
        }
    };

    return (
        <div className="email-config-container">
            {/* CDN for SheetJS (xlsx) library */}
            <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
            
            {/* Status Message */}
            {status.message && (
                <div className={`status-message ${status.type}`}>
                    {status.message}
                </div>
            )}
            <style>
                {`
                /* General Styles */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

                .email-config-container {
                    min-height: 100vh;
                    background: linear-gradient(to bottom right, #1a202c, #000000);
                    color: #ffffff;
                    padding: 1rem;
                    font-family: 'Inter', sans-serif;
                }

                @media (min-width: 640px) { /* sm breakpoint */
                    .email-config-container {
                        padding: 1.5rem;
                    }
                }

                @media (min-width: 1024px) { /* lg breakpoint */
                    .email-config-container {
                        padding: 2rem;
                    }
                }

                .max-width-wrapper {
                    max-width: 64rem; /* max-w-5xl */
                    margin-left: auto;
                    margin-right: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 2.5rem; /* space-y-10 */
                }

                /* Section Styles */
                .section-card {
                    background-color: rgba(43, 52, 66, 0.7); /* bg-gray-800 with opacity */
                    backdrop-filter: blur(4px); /* backdrop-blur-sm */
                    padding: 2rem; /* p-8 */
                    border-radius: 1rem; /* rounded-2xl */
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1); /* shadow-2xl */
                    border: 1px solid #4a5568; /* border border-gray-700 */
                    transition: transform 0.3s ease-in-out;
                }

                .section-card:hover {
                    transform: scale(1.005);
                }

                .section-header {
                    font-size: 1.5rem; /* text-2xl */
                    font-weight: 700; /* font-bold */
                    margin-bottom: 1.5rem; /* mb-6 */
                    color: #f7fafc; /* text-gray-100 */
                    border-bottom: 2px solid #4299e1; /* border-b-2 border-blue-500 */
                    padding-bottom: 0.75rem; /* pb-3 */
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                /* Status Message */
                .status-message {
                    padding: 0.75rem 1rem; /* p-3 p-4 */
                    border-radius: 0.5rem; /* rounded-lg */
                    margin-bottom: 1.5rem; /* mb-6 */
                    font-weight: 500; /* font-medium */
                    text-align: center;
                    animation: fadeIn 0.3s ease-in-out;
                }
                
                .status-message.success {
                    background-color: rgba(72, 187, 120, 0.2); /* bg-green-500 with opacity */
                    color: #48bb78; /* text-green-500 */
                    border: 1px solid #48bb78; /* border border-green-500 */
                }
                
                .status-message.error {
                    background-color: rgba(245, 101, 101, 0.2); /* bg-red-500 with opacity */
                    color: #f56565; /* text-red-500 */
                    border: 1px solid #f56565; /* border border-red-500 */
                }
                
                .status-message.warning {
                    background-color: rgba(237, 137, 54, 0.2); /* bg-orange-500 with opacity */
                    color: #ed8936; /* text-orange-500 */
                    border: 1px solid #ed8936; /* border border-orange-500 */
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                /* Form Styles */
                .form-group {
                    display: flex;
                    align-items: center;
                    gap: 1rem; /* gap-4 */
                    margin-bottom: 1.5rem; /* mb-6 */
                }

                .section-icon-wrapper {
                    padding: 0.75rem; /* p-3 */
                    border-radius: 9999px; /* rounded-full */
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg */
                }

                .section-icon {
                    height: 2rem; /* h-8 */
                    width: 2rem; /* w-8 */
                    color: #ffffff;
                }

                .section-title {
                    font-size: 1.875rem; /* text-3xl */
                    font-weight: 800; /* font-extrabold */
                    color: #f7fafc; /* text-gray-100 */
                }

                /* Input and Label Styles */
                .label-style {
                    display: block;
                    font-size: 0.875rem; /* text-sm */
                    font-weight: 500; /* font-medium */
                    color: #e2e8f0; /* text-gray-300 */
                    margin-bottom: 0.25rem; /* mb-1 */
                }

                .input-style {
                    width: 100%;
                    padding: 0.5rem 1rem; /* px-4 py-2 */
                    background-color: #4a5568; /* bg-gray-700 */
                    border: 1px solid #2d3748; /* border border-gray-600 */
                    border-radius: 0.5rem; /* rounded-lg */
                    color: #f7fafc; /* text-gray-100 */
                    transition: all 0.3s ease-in-out;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
                }

                .input-style::placeholder {
                    color: #a0aec0; /* placeholder-gray-400 */
                }

                .input-style:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px #4299e1, 0 0 0 4px #2b6cb0; /* focus:ring-2 focus:ring-blue-500, focus:border-blue-500 */
                    border-color: #4299e1;
                }

                textarea.input-style {
                    min-height: 9.375rem; /* min-h-[150px] */
                    resize: vertical; /* resize-y */
                }

                .grid-layout {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.5rem 2rem; /* gap-x-8 gap-y-6 */
                    margin-top: 1rem; /* mt-4 */
                }

                @media (min-width: 768px) { /* md breakpoint */
                    .grid-layout {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                    .md-col-span-2 {
                        grid-column: span 2 / span 2;
                    }
                }

                /* Checkbox Style */
                .checkbox-container {
                    display: flex;
                    align-items: center;
                    margin-top: 0.5rem; /* mt-2 */
                }

                .checkbox-input {
                    height: 1.25rem; /* h-5 */
                    width: 1.25rem; /* w-5 */
                    color: #4299e1; /* text-blue-500 */
                    background-color: #4a5568; /* bg-gray-700 */
                    border: 1px solid #2d3748; /* border-gray-600 */
                    border-radius: 0.25rem; /* rounded */
                    cursor: pointer;
                }

                .checkbox-input:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5); /* focus:ring-blue-600 */
                }

                .checkbox-label {
                    margin-left: 0.75rem; /* ml-3 */
                    font-size: 1rem; /* text-base */
                    color: #e2e8f0; /* text-gray-300 */
                    user-select: none; /* select-none */
                }

                /* Button Styles */
                .button-base {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.75rem 2rem; /* px-8 py-3 */
                    border-radius: 0.5rem; /* rounded-lg */
                    font-weight: 700; /* font-bold */
                    font-size: 1.125rem; /* text-lg */
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg */
                    transition: all 0.3s ease-in-out;
                    cursor: pointer;
                }

                .button-base:hover {
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1); /* hover:shadow-xl */
                    transform: scale(1.05); /* hover:scale-105 */
                }

                .button-base:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .save-button {
                    background: linear-gradient(to right, #2b6cb0, #2c5282); /* from-blue-600 to-blue-700 */
                    color: #ffffff;
                }

                .save-button:hover {
                    background: linear-gradient(to right, #2c5282, #2a4365); /* hover:from-blue-700 hover:to-blue-800 */
                }

                .send-button {
                    background: linear-gradient(to right, #38a169, #2f855a); /* from-green-600 to-green-700 */
                    color: #ffffff;
                }

                .send-button:hover {
                    background: linear-gradient(to right, #2f855a, #276749); /* hover:from-green-700 hover:to-green-800 */
                }

                .copy-button {
                    background-color: #2b6cb0; /* bg-blue-600 */
                    color: #ffffff;
                    padding: 0.5rem 1.5rem; /* px-6 py-2 */
                    font-size: 1rem; /* font-semibold */
                    box-shadow: none; /* remove default shadow */
                }

                .copy-button:hover {
                    background-color: #2c5282; /* hover:bg-blue-700 */
                    transform: none; /* remove scale on hover */
                    box-shadow: none;
                }

                /* Button Icon Animations */
                .button-icon {
                    margin-right: 0.5rem; /* mr-2 */
                    height: 1.5rem; /* h-6 */
                    width: 1.5rem; /* w-6 */
                    transition: transform 0.2s ease-in-out;
                }

                .save-button:hover .button-icon {
                    transform: rotate(6deg); /* group-hover:rotate-6 */
                }

                .send-button:hover .button-icon {
                    transform: translateX(0.25rem); /* group-hover:translate-x-1 */
                }

                /* Spinner Animation */
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .spinner {
                    animation: spin 1s linear infinite;
                    margin-right: 0.75rem; /* mr-3 */
                    height: 1.25rem; /* h-5 */
                    width: 1.25rem; /* w-5 */
                    color: #ffffff;
                }
                
                /* Scheduler Styles */
                .scheduler-section {
                    margin-top: 2rem;
                    padding-top: 2rem;
                    border-top: 1px solid #4a5568;
                }
                
                .scheduler-toggle {
                    display: flex;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                
                .scheduler-toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 60px;
                    height: 34px;
                    margin-right: 1rem;
                }
                
                .scheduler-toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                
                .scheduler-toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #2d3748;
                    transition: .4s;
                    border-radius: 34px;
                }
                
                .scheduler-toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 26px;
                    width: 26px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                
                input:checked + .scheduler-toggle-slider {
                    background-color: #4299e1;
                }
                
                input:checked + .scheduler-toggle-slider:before {
                    transform: translateX(26px);
                }
                
                .scheduler-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                
                .scheduler-type-option {
                    padding: 0.5rem 1rem;
                    background-color: #2d3748;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .scheduler-type-option.active {
                    background-color: #4299e1;
                    color: white;
                }
                
                .scheduler-days {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }
                
                .day-option {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background-color: #2d3748;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .day-option.selected {
                    background-color: #4299e1;
                    color: white;
                }
                
                .scheduled-emails-list {
                    margin-top: 2rem;
                }
                
                .scheduled-email-item {
                    background-color: rgba(45, 55, 72, 0.7);
                    border-radius: 0.5rem;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    border: 1px solid #4a5568;
                    transition: all 0.3s ease;
                }
                
                .scheduled-email-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
                
                .scheduled-email-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }
                
                .scheduled-email-title {
                    font-weight: 600;
                    font-size: 1.125rem;
                }
                
                .scheduled-email-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                
                .scheduled-email-toggle {
                    width: 50px;
                    height: 26px;
                    position: relative;
                    display: inline-block;
                }
                
                .scheduled-email-toggle input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                
                .scheduled-email-toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #2d3748;
                    transition: .4s;
                    border-radius: 34px;
                }
                
                .scheduled-email-toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                
                input:checked + .scheduled-email-toggle-slider {
                    background-color: #4299e1;
                }
                
                input:checked + .scheduled-email-toggle-slider:before {
                    transform: translateX(24px);
                }
                
                .scheduled-email-delete {
                    background-color: rgba(245, 101, 101, 0.2);
                    color: #f56565;
                    border: 1px solid #f56565;
                    border-radius: 0.25rem;
                    padding: 0.25rem 0.5rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .scheduled-email-delete:hover {
                    background-color: rgba(245, 101, 101, 0.4);
                }
                
                .scheduled-email-info {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }
                
                .scheduled-email-info-item {
                    display: flex;
                    flex-direction: column;
                }
                
                .scheduled-email-info-label {
                    font-size: 0.75rem;
                    color: #a0aec0;
                    margin-bottom: 0.25rem;
                }
                
                .scheduled-email-info-value {
                    font-size: 0.875rem;
                }
                
                .scheduled-email-recipients {
                    margin-top: 0.5rem;
                    font-size: 0.875rem;
                    color: #a0aec0;
                }
                
                .no-scheduled-emails {
                    text-align: center;
                    padding: 2rem;
                    color: #a0aec0;
                    font-style: italic;
                }

                /* Status Message Alert */
                .status-alert {
                    padding: 1rem; /* p-4 */
                    border-radius: 0.5rem; /* rounded-lg */
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* shadow-md */
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: all 0.3s ease-in-out;
                }

                .status-alert.error {
                    background-color: #9b2c2c; /* bg-red-800 */
                    color: #fbd38d; /* text-red-100 */
                }

                .status-alert.success {
                    background-color: #276749; /* bg-green-800 */
                    color: #c6f6d5; /* text-green-100 */
                }

                .status-alert-content {
                    display: flex;
                    align-items: center;
                }

                .status-alert-icon {
                    height: 1.5rem; /* h-6 */
                    width: 1.5rem; /* w-6 */
                    margin-right: 0.75rem; /* mr-3 */
                }

                .status-alert-message {
                    font-weight: 600; /* font-semibold */
                }

                .status-alert-close-button {
                    color: #ffffff;
                    opacity: 0.75;
                    transition: opacity 0.2s;
                }

                .status-alert-close-button:hover {
                    opacity: 1;
                }

                /* Offer/Email Picker Styles */
                .picker-container {
                    display: flex;
                    overflow-x: auto;
                    gap: 1rem; /* space-x-4 */
                    padding: 1rem; /* p-4 */
                    background-color: rgba(26, 32, 44, 0.5); /* bg-gray-900/50 */
                    border-radius: 0.5rem; /* rounded-lg */
                    margin-top: 0.5rem; /* mt-2 */
                    border: 1px solid #4a5568; /* border border-gray-700 */
                }

                /* Custom scrollbar for Webkit browsers */
                .custom-scrollbar::-webkit-scrollbar {
                    height: 8px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #2d3748; /* gray-800 */
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #4a5568; /* gray-600 */
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #6b7280; /* gray-500 */
                }

                .offer-card, .email-card {
                    position: relative;
                    flex-shrink: 0;
                    width: 12rem; /* w-48 */
                    padding: 1rem; /* p-4 */
                    border-radius: 0.75rem; /* rounded-xl */
                    cursor: pointer;
                    transition: all 0.3s ease-in-out;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg */
                }

                .offer-card:hover, .email-card:hover {
                    transform: translateY(-0.5rem); /* hover:-translate-y-2 */
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1); /* hover:shadow-xl */
                }

                .offer-card.selected {
                    background-color: #2c5282; /* bg-blue-700 */
                    box-shadow: 0 0 0 2px #63b3ed, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* ring-2 ring-blue-400 */
                }

                .email-card.selected {
                    background-color: #2c7a7b; /* bg-teal-700 */
                    box-shadow: 0 0 0 2px #4fd1c5, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* ring-2 ring-teal-400 */
                }

                .offer-card-content, .email-card-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }

                .offer-image {
                    width: 100%;
                    height: 6rem; /* h-24 */
                    object-fit: cover;
                    border-radius: 0.375rem; /* rounded-md */
                    margin-bottom: 0.75rem; /* mb-3 */
                    border: 1px solid #2d3748; /* border border-gray-600 */
                    transition: transform 0.2s ease-in-out;
                }

                .offer-card:hover .offer-image {
                    transform: scale(1.05); /* group-hover:scale-105 */
                }

                .offer-title, .email-text {
                    font-weight: 700; /* font-bold */
                    font-size: 1rem; /* text-base */
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    width: 100%;
                    color: #f7fafc; /* text-gray-100 */
                    transition: color 0.2s;
                }

                .offer-card:hover .offer-title {
                    color: #bfdbfe; /* group-hover:text-blue-200 */
                }

                .email-card:hover .email-text {
                    color: #99f6e4; /* group-hover:text-teal-200 */
                }

                .offer-genre {
                    font-size: 0.75rem; /* text-xs */
                    color: #a0aec0; /* text-gray-400 */
                    margin-top: 0.25rem; /* mt-1 */
                }

                .selected-check-icon {
                    position: absolute;
                    top: 0.5rem; /* top-2 */
                    right: 0.5rem; /* right-2 */
                    background-color: #48bb78; /* bg-green-500 */
                    border-radius: 9999px; /* rounded-full */
                    padding: 0.25rem; /* p-1 */
                    color: #ffffff;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* shadow-md */
                }

                .email-icon-emoji {
                    font-size: 1.25rem; /* text-xl */
                    margin-bottom: 0.5rem; /* mb-2 */
                }

                .no-items-message {
                    color: #a0aec0; /* text-gray-500 */
                    text-align: center;
                    width: 100%;
                    padding: 2rem 0; /* py-8 */
                }

                .file-input-style {
                    width: 100%;
                    color: #e2e8f0; /* text-gray-300 */
                    border-radius: 0.5rem; /* rounded-lg */
                    border: 1px solid #2d3748; /* border border-gray-600 */
                    padding: 0.5rem; /* p-2 */
                    transition: all 0.2s ease-in-out;
                }

                .file-input-style::-webkit-file-upload-button {
                    margin-right: 1rem; /* file:mr-4 */
                    padding: 0.5rem 1rem; /* file:py-2 file:px-4 */
                    border-radius: 0.5rem; /* file:rounded-lg */
                    border: 0; /* file:border-0 */
                    font-size: 0.875rem; /* file:text-sm */
                    font-weight: 600; /* file:font-semibold */
                    background-color: #4299e1; /* file:bg-blue-500 */
                    color: #ffffff; /* file:text-white */
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .file-input-style::-webkit-file-upload-button:hover {
                    background-color: #3182ce; /* hover:file:bg-blue-600 */
                }

                .file-input-style:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .parsing-message {
                    font-size: 0.875rem; /* text-sm */
                    color: #90cdf4; /* text-blue-300 */
                    margin-top: 0.5rem; /* mt-2 */
                    display: flex;
                    align-items: center;
                }

                .parsing-message .spinner {
                    margin-right: 0.5rem; /* mr-2 */
                    height: 1rem; /* h-4 */
                    width: 1rem; /* w-4 */
                    color: #90cdf4; /* text-blue-300 */
                }

                .extracted-emails-textarea {
                    background-color: rgba(26, 32, 44, 0.5); /* bg-gray-900/50 */
                }

                .copy-buttons-container {
                    margin-top: 1rem; /* mt-4 */
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem; /* gap-3 */
                    justify-content: flex-end;
                }
                .offertable {
  overflow-x: auto;
  margin: 1rem;
}

.offer-table {
  width: 100%;
  border-collapse: collapse;
  font-family: Arial, sans-serif;
  font-size: 14px;
}

.offer-table th,
.offer-table td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: center;
  vertical-align: middle;
}

.offer-table th {
  background-color: #f4f4f4;
  font-weight: bold;
  color: #333;
}

.offer-table tr:nth-child(even) {
  background-color: #fafafa;
}

.offer-table tr:hover {
  background-color: #f1f1f1;
}

.offer-table img {
  display: block;
  margin: 0 auto;
}

                `}
            </style>
            <div className="max-width-wrapper">

                {/* --- Status Message Alert --- */}
                {status.message && (
                    <div className={`status-alert ${status.type === 'error' ? 'error' : 'success'}`}>
                        <div className="status-alert-content">
                            {status.type === 'error' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="status-alert-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="status-alert-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                            <span className="status-alert-message">{status.message}</span>
                        </div>
                        <button onClick={() => setStatus({ message: '', type: '' })} className="status-alert-close-button">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                )}

                {/* --- SMTP Configuration Section --- */}
                <section className="section-card">
                    <div className="section-header">
                        <div className="section-icon-wrapper" style={{ backgroundColor: '#2b6cb0' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="section-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                        </div>
                        <h2 className="section-title">SMTP Configuration</h2>
                    </div>
                    <div className="grid-layout">
                        <div>
                            <label htmlFor="host" className="label-style">Host</label>
                            <input id="host" placeholder="smtp.example.com" value={config.host} onChange={e => setConfig(c => ({ ...c, host: e.target.value }))} className="input-style" />
                        </div>
                        <div>
                            <label htmlFor="port" className="label-style">Port</label>
                            <input id="port" placeholder="465" type="number" value={config.port} onChange={e => setConfig(c => ({ ...c, port: Number(e.target.value) }))} className="input-style" />
                        </div>
                        <div>
                            <label htmlFor="user" className="label-style">Username</label>
                            <input id="user" placeholder="your_username" value={config.user} onChange={e => setConfig(c => ({ ...c, user: e.target.value }))} className="input-style" />
                        </div>
                        <div>
                            <label htmlFor="pass" className="label-style">Password</label>
                            <input id="pass" placeholder="••••••••" type="password" value={config.pass} onChange={e => setConfig(c => ({ ...c, pass: e.target.value }))} className="input-style" />
                        </div>
                        <div className="md-col-span-2">
                            <label htmlFor="from" className="label-style">"From" Email Address</label>
                            <input id="from" placeholder="no-reply@example.com" value={config.from} onChange={e => setConfig(c => ({ ...c, from: e.target.value }))} className="input-style" />
                        </div>
                        <div className="checkbox-container md-col-span-2">
                            <input id="secure" type="checkbox" checked={config.secure} onChange={e => setConfig(c => ({ ...c, secure: e.target.checked }))} className="checkbox-input" />
                            <label htmlFor="secure" className="checkbox-label">Use Secure Connection (SSL/TLS)</label>
                        </div>
                    </div>
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={saveConfig} disabled={saving} className="button-base save-button">
                            {saving ? (
                                <>
                                    <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-2 4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Save Configuration
                                </>
                            )}
                        </button>
                    </div>
                </section>

                {/* --- Excel Email Extraction Section --- */}
                <section className="section-card">
                    <div className="section-header">
                        <div className="section-icon-wrapper" style={{ backgroundColor: '#805ad5' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="section-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path fillRule="evenodd" d="M15.293 9.293a1 1 0 001.414 1.414L18 8.414V18a1 1 0 11-2 0v-9.586l-2.293 2.293a1 1 0 00-1.414-1.414L14 6l4-4 4 4z" clipRule="evenodd" /></svg>
                        </div>
                        <h2 className="section-title">Extract Emails from Excel</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                        <div>
                            <label htmlFor="excel-file" className="label-style">Upload Excel File (.xlsx, .xls)</label>
                            <input
                                id="excel-file"
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                className="file-input-style"
                                disabled={parsingFile}
                            />
                            {parsingFile && (
                                <p className="parsing-message">
                                    <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.000 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Parsing file...
                                </p>
                            )}
                        </div>

                        {extractedEmails.length > 0 && (
                            <div>
                                <label htmlFor="extracted-emails" className="label-style">All Extracted Gmail Addresses ({extractedEmails.length})</label>
                                <textarea
                                    id="extracted-emails"
                                    value={extractedEmails.join(', ')}
                                    readOnly
                                    rows="5"
                                    className="input-style extracted-emails-textarea"
                                    placeholder="Extracted emails will appear here..."
                                />
                                <div className="copy-buttons-container">
                                    <button onClick={() => copyAllExtractedEmailsToField('to')} className="copy-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2H6zM5 9a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" /></svg>
                                        Copy All to To
                                    </button>
                                    <button onClick={() => copyAllExtractedEmailsToField('cc')} className="copy-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2H6zM5 9a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" /></svg>
                                        Copy All to CC
                                    </button>
                                    <button onClick={() => copyAllExtractedEmailsToField('bcc')} className="copy-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2H6zM5 9a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" /></svg>
                                        Copy All to BCC
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* --- Select Email Recipients Section --- */}
                <section className="section-card">
                    <div className="section-header">
                        <div className="section-icon-wrapper" style={{ backgroundColor: '#319795' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="section-icon" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M3 8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5-1a1 1 0 00-1 1v4a1 1 0 001 1h8a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /><path d="M10 12a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" /></svg>
                        </div>
                        <h2 className="section-title">Select Email Recipients</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                        <div>
                            <label className="label-style">Choose Emails to Include</label>
                            <div className="picker-container custom-scrollbar">
                                {selectableEmails.length > 0 ? selectableEmails.map((email, idx) => {
                                    const isSelected = selectedRecipients.includes(email);
                                    return (
                                        <button
                                            key={email || idx}
                                            className={`email-card ${isSelected ? 'selected' : ''}`}
                                            onClick={() => toggleRecipient(email)}
                                        >
                                            {isSelected && (
                                                <div className="selected-check-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                </div>
                                            )}
                                            <div className="email-card-content">
                                                <div className="email-icon-emoji">📧</div> {/* Email icon emoji */}
                                                <div className="email-text" title={email}>{email}</div>
                                            </div>
                                        </button>
                                    );
                                }) : <div className="no-items-message">Upload an Excel file to see emails here.</div>}
                            </div>
                        </div>
                        {selectedRecipients.length > 0 && (
                            <div className="copy-buttons-container">
                                <button onClick={() => copySelectedRecipientsToField('to')} className="copy-button">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2H6zM5 9a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" /></svg>
                                    Copy Selected to To
                                </button>
                                <button onClick={() => copySelectedRecipientsToField('cc')} className="copy-button">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2H6zM5 9a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" /></svg>
                                    Copy Selected to CC
                                </button>
                                <button onClick={() => copySelectedRecipientsToField('bcc')} className="copy-button">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2H6zM5 9a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" /></svg>
                                    Copy Selected to BCC
                                </button>
                            </div>
                        )}
                    </div>
                </section>
                
                {/* --- Email Scheduler Section --- */}
                <section className="section-card">
                    <div className="section-header">
                        <div className="section-icon-wrapper" style={{ backgroundColor: '#805ad5' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="section-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="section-title">Email Scheduler</h2>
                    </div>
                    
                    <div className="scheduler-section">
                        <div className="scheduler-toggle">
                            <label className="scheduler-toggle-switch">
                                <input 
                                    type="checkbox" 
                                    checked={scheduleEnabled}
                                    onChange={(e) => setScheduleEnabled(e.target.checked)}
                                />
                                <span className="scheduler-toggle-slider"></span>
                            </label>
                            <span>Enable Email Scheduling</span>
                        </div>
                        
                        {scheduleEnabled && (
                            <div>
                                <div className="scheduler-options">
                                    <div 
                                        className={`scheduler-type-option ${scheduleType === 'daily' ? 'active' : ''}`}
                                        onClick={() => setScheduleType('daily')}
                                    >
                                        Daily
                                    </div>
                                    <div 
                                        className={`scheduler-type-option ${scheduleType === 'weekly' ? 'active' : ''}`}
                                        onClick={() => setScheduleType('weekly')}
                                    >
                                        Weekly
                                    </div>
                                    <div 
                                        className={`scheduler-type-option ${scheduleType === 'monthly' ? 'active' : ''}`}
                                        onClick={() => setScheduleType('monthly')}
                                    >
                                        Monthly
                                    </div>
                                </div>
                                
                                <div className="grid-layout">
                                    <div>
                                        <label className="label-style">Schedule Time</label>
                                        <input 
                                            type="time" 
                                            value={scheduleTime}
                                            onChange={(e) => setScheduleTime(e.target.value)}
                                            className="input-style"
                                        />
                                    </div>
                                    
                                    {scheduleType === 'weekly' && (
                                        <div>
                                            <label className="label-style">Days of Week</label>
                                            <div className="scheduler-days">
                                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                                    <div 
                                                        key={day}
                                                        className={`day-option ${scheduleDays.includes(index) ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            if (scheduleDays.includes(index)) {
                                                                setScheduleDays(scheduleDays.filter(d => d !== index));
                                                            } else {
                                                                setScheduleDays([...scheduleDays, index]);
                                                            }
                                                        }}
                                                    >
                                                        {day}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {scheduleType === 'monthly' && (
                                        <div>
                                            <label className="label-style">Day of Month</label>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                max="31" 
                                                value={scheduleDate}
                                                onChange={(e) => setScheduleDate(parseInt(e.target.value))}
                                                className="input-style"
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button 
                                        onClick={saveScheduledEmail} 
                                        disabled={scheduleSaving} 
                                        className="button-base save-button"
                                    >
                                        {scheduleSaving ? (
                                            <>
                                                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving Schedule...
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                                </svg>
                                                Save Schedule
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Scheduled Emails List */}
                    <div className="scheduled-emails-list">
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Scheduled Emails</h3>
                        
                        {scheduledEmails.length > 0 ? (
                            scheduledEmails.map(email => (
                                <div key={email.id} className="scheduled-email-item">
                                    <div className="scheduled-email-header">
                                        <div className="scheduled-email-title">{email.subject}</div>
                                        <div className="scheduled-email-actions">
                                            <label className="scheduled-email-toggle">
                                                <input 
                                                    type="checkbox" 
                                                    checked={email.enabled} 
                                                    onChange={() => toggleScheduledEmail(email.id, email.enabled)}
                                                />
                                                <span className="scheduled-email-toggle-slider"></span>
                                            </label>
                                            <button 
                                                className="scheduled-email-delete"
                                                onClick={() => deleteScheduledEmail(email.id)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="scheduled-email-info">
                                        <div className="scheduled-email-info-item">
                                            <span className="scheduled-email-info-label">Schedule Type</span>
                                            <span className="scheduled-email-info-value">{email.scheduleType}</span>
                                        </div>
                                        <div className="scheduled-email-info-item">
                                            <span className="scheduled-email-info-label">Time</span>
                                            <span className="scheduled-email-info-value">{email.scheduleTime}</span>
                                        </div>
                                        {email.scheduleType === 'weekly' && (
                                            <div className="scheduled-email-info-item">
                                                <span className="scheduled-email-info-label">Days</span>
                                                <span className="scheduled-email-info-value">
                                                    {email.scheduleDays.map(day => [
                                                        'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
                                                    ][day]).join(', ')}
                                                </span>
                                            </div>
                                        )}
                                        {email.scheduleType === 'monthly' && (
                                            <div className="scheduled-email-info-item">
                                                <span className="scheduled-email-info-label">Day of Month</span>
                                                <span className="scheduled-email-info-value">{email.scheduleDate}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="scheduled-email-recipients">
                                        To: {email.to}
                                        {email.cc && <span> | CC: {email.cc}</span>}
                                        {email.bcc && <span> | BCC: {email.bcc}</span>}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-scheduled-emails">
                                No scheduled emails yet. Create one by enabling the scheduler above.
                            </div>
                        )}
                    </div>
                </section>

                {/* --- Excel Email Extraction Section --- */}
                <section className="section-card">
                    <div className="section-header">
                        <div className="section-icon-wrapper" style={{ backgroundColor: '#4299e1' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="section-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="section-title">Extract Emails from Excel</h2>
                    </div>
                    <div className="form-group">
                        <label htmlFor="excel-upload" className="label-style">Upload Excel File (.xlsx, .xls)</label>
                        <input
                            type="file"
                            id="excel-upload"
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                            className="file-input-style"
                        />
                        {parsingFile && (
                            <p className="parsing-message">
                                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Parsing file...
                            </p>
                        )}
                        {extractedEmails.length > 0 && (
                            <div style={{ marginTop: '1rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Extracted Emails:</h3>
                                <div className="email-list-container">
                                    {selectableEmails.map((email, index) => (
                                        <label key={index} className="email-checkbox-item">
                                            <input
                                                type="checkbox"
                                                checked={selectedRecipients.includes(email)}
                                                onChange={() => {
                                                    if (selectedRecipients.includes(email)) {
                                                        setSelectedRecipients(selectedRecipients.filter(e => e !== email));
                                                    } else {
                                                        setSelectedRecipients([...selectedRecipients, email]);
                                                    }
                                                }}
                                            />
                                            <span className="email-address-text">{email}</span>
                                        </label>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                    <button onClick={() => copyAllExtractedEmailsToField('to')} className="button-base copy-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                        </svg>
                                        Copy All to To
                                    </button>
                                    <button onClick={() => copySelectedRecipientsToField('to')} className="button-base copy-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                        </svg>
                                        Copy Selected to To
                                    </button>
                                    <button onClick={() => copySelectedRecipientsToField('cc')} className="button-base copy-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                        </svg>
                                        Copy Selected to CC
                                    </button>
                                    <button onClick={() => copySelectedRecipientsToField('bcc')} className="button-base copy-button">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                        </svg>
                                        Copy Selected to BCC
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* --- Send Test Email Section --- */}
                <section className="section-card">
                    <div className="section-header">
                        <div className="section-icon-wrapper" style={{ backgroundColor: '#38a169' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="section-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.003 5.884L10 2.5l7.997 3.384A2 2 0 0019 7.584V15a2 2 0 01-2 2H3a2 2 0 01-2-2V7.584a2 2 0 001.003-1.7zM11 12a1 1 0 10-2 0v3a1 1 0 102 0v-3z" clipRule="evenodd" /><path d="M10 6a1 1 0 100-2 1 1 0 000 2z" /></svg>
                        </div>
                        <h2 className="section-title">Send a Test Email</h2>
                    </div>
                    <div className="grid-layout">
                        <div>
                            <label htmlFor="to" className="label-style">To</label>
                            <input id="to" placeholder="recipient@example.com" value={to} onChange={e => setTo(e.target.value)} className="input-style" />
                        </div>
                        <div>
                            <label htmlFor="subject" className="label-style">Subject</label>
                            <input id="subject" placeholder="Test Email Subject" value={subject} onChange={e => setSubject(e.target.value)} className="input-style" />
                        </div>
                        {/* CC field */}
                        <div>
                            <label htmlFor="cc" className="label-style">CC</label>
                            <input id="cc" placeholder="cc@example.com (optional)" value={cc} onChange={e => setCc(e.target.value)} className="input-style" />
                        </div>
                        {/* BCC field */}
                        <div>
                            <label htmlFor="bcc" className="label-style">BCC</label>
                            <input id="bcc" placeholder="bcc@example.com (optional)" value={bcc} onChange={e => setBcc(e.target.value)} className="input-style" />
                        </div>
                    </div>

                    {/* --- Offer Picker --- */}
                    <div style={{ marginTop: '1.5rem' }}>
                        <label className="label-style">Choose Offers to Include</label>
                        <div className="picker-container custom-scrollbar">
                            {offers.length > 0 ? offers.map((offer, idx) => {
                                const id = offer.id || offer.offer_id || offer._id;
                                const isSelected = selectedOffers.some(o => (o.id || o.offer_id || o._id) === id);
                                return (
                                    <button
                                        key={id || idx}
                                        className={`offer-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => toggleOffer(offer)}
                                    >
                                        {isSelected && (
                                            <div className="selected-check-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                            </div>
                                        )}
                                        <div className="offer-card-content">
                                            <img
                                                src={offer.image || offer.icon || `https://placehold.co/100x60/374151/D1D5DB?text=No+Image`}
                                                alt={offer.title || id}
                                                className="offer-image"
                                                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/100x60/374151/D1D5DB?text=No+Image`; }}
                                            />
                                            <div className="offer-title" title={offer.title || offer.name || id}>{offer.title || offer.name || id}</div>
                                            <div className="offer-genre">{offer.genre || 'No Genre'}</div>
                                        </div>
                                    </button>
                                );
                            }) : <div className="no-items-message">No offers available to select.</div>}
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <label htmlFor="body" className="label-style">Body</label>
                        <textarea id="body" placeholder="Email body will be auto-generated when you select offers, or you can write your own here." value={body} onChange={e => setBody(e.target.value)} rows="8" className="input-style" />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button onClick={sendEmail} disabled={sending} className="button-base send-button" style={{ marginLeft: 'auto' }}>
                            {sending ? (
                                <>
                                    <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                    Send Email
                                </>
                            )}
                        </button>
                    </div>
                </section>

            </div>
        </div>
    );
}

function DomainCheckerSection() {
  const [offers, setOffers] = React.useState([]);
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [results, setResults] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  // Fetch offers on mount
  React.useEffect(() => {
    fetch('http://localhost:5000/api/fetch-history')
      .then(res => res.json())
      .then(data => {
        const allOffers = flattenOffers(data);
        // Only keep offers with numeric id and deduplicate by id
        const uniqueOffers = Array.from(
          new Map(
            allOffers
              .filter(offer => {
                const id = offer.id || offer.offer_id || offer._id;
                return id && !isNaN(Number(id));
              })
              .map(offer => [offer.id || offer.offer_id || offer._id, offer])
          ).values()
        );
        setOffers(uniqueOffers);
      });
  }, []);

  // Toggle offer selection
  const toggleOffer = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Select all offers
  const selectAll = () => setSelectedIds(offers.map(o => o.id || o.offer_id || o._id));
  const deselectAll = () => setSelectedIds([]);

  // Bulk check selected offers
  const checkSelected = async () => {
    setLoading(true);
    setResults({});
    const checks = await Promise.all(selectedIds.map(async id => {
      const url = `http://localhost:5000/go/${id}`;
      try {
        const res = await fetch('http://localhost:5000/api/check-domain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        let data;
        try {
          data = await res.json();
        } catch (e) {
          // If not JSON, get text and show as error
          const text = await res.text();
          data = { ok: false, error: `Non-JSON response: ${text.slice(0, 100)}` };
        }
        return [id, { ...data, url }];
      } catch (e) {
        return [id, { ok: false, error: e.message, url }];
      }
    }));
    setResults(Object.fromEntries(checks));
    setLoading(false);
  };

  return (
    <div>
      <h3>Bulk Domain Checker</h3>
      <div style={{ marginBottom: 12 }}>
        <button onClick={selectAll} style={{ marginRight: 8 }}>Select All</button>
        <button onClick={deselectAll} style={{ marginRight: 8 }}>Deselect All</button>
        <button onClick={checkSelected} disabled={loading || selectedIds.length === 0}>
          {loading ? 'Checking...' : 'Check Selected'}
        </button>
      </div>
      <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, marginBottom: 16 }}>
        <table style={{ width: '100%', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f3f3f3' }}>
              <th></th>
              <th>Offer</th>
              <th>Masked Link</th>
            </tr>
          </thead>
          <tbody>
            {offers.map(offer => {
              const id = offer.id || offer.offer_id || offer._id;
              return (
                <tr key={id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(id)}
                      onChange={() => toggleOffer(id)}
                    />
                  </td>
                  <td>
                    {offer.title || id}
                  </td>
                  <td>
                    <a href={`http://localhost:5000/go/${id}`} target="_blank" rel="noopener noreferrer">
                      /go/{id}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {Object.keys(results).length > 0 && (
        <div style={{ marginTop: 18 }}>
          <h4>Results</h4>
          <table style={{ width: '100%', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f3f3f3' }}>
                <th>Offer</th>
                <th>Masked Link</th>
                <th>Status</th>
                <th>Final URL</th>
              </tr>
            </thead>
            <tbody>
              {selectedIds.map(id => (
                <tr key={id}>
                  <td>{offers.find(o => (o.id || o.offer_id || o._id) === id)?.title || id}</td>
                  <td>
                    <a href={`http://localhost:5000/go/${id}`} target="_blank" rel="noopener noreferrer">
                      /go/{id}
                    </a>
                  </td>
                  <td>
                    {results[id]
                      ? results[id].ok
                        ? <span style={{ color: 'green' }}>Working ({results[id].status})</span>
                        : <span style={{ color: 'red' }}>Not Working {results[id].error ? `(${results[id].error})` : `(${results[id].status})`}</span>
                      : '-'}
                  </td>
                  <td>
                    {results[id]?.finalUrl ? (
                      <a href={results[id].finalUrl} target="_blank" rel="noopener noreferrer">
                        {results[id].finalUrl}
                      </a>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Utility function to generate dummy campaign data
const generateDummyCampaignData = () => {
    const campaignNames = [
        "Spring Newsletter 2024", "Product Launch Q1", "Holiday Sale Blast", "Customer Loyalty Program",
        "Webinar Series Promotion", "New Feature Announcement", "Feedback Survey Campaign",
        "Abandoned Cart Reminder", "Welcome Series Emails", "Re-engagement Campaign",
        "Black Friday Deals", "Cyber Monday Offers", "New Year Resolutions", "Summer Collection Launch",
        "Back to School Promo", "Autumn Deals", "Winter Wonderland Sale", "Spring Cleaning Tips",
        "Flash Sale Alert", "Exclusive Member Discount", "Early Bird Access", "Birthday Special",
        "Anniversary Celebration", "Referral Program Invite", "App Download Prompt"
    ];
    const subjectLines = [
        "Your Spring Update!", "Introducing Our New Product!", "Don't Miss Our Holiday Sale!",
        "Exclusive Offer Just For You", "Join Our Upcoming Webinar", "Exciting New Features Inside!",
        "We Value Your Feedback", "Did You Forget Something?", "Welcome to Our Community!",
        "We Miss You! Come Back!", "Unbeatable Black Friday Deals", "Cyber Monday Steals!",
        "Start Your New Year Right", "Dive into Our Summer Collection", "Back to School Essentials",
        "Cozy Autumn Savings", "Winter Wonderland Discounts", "Spring Cleaning Made Easy",
        "Limited Time Flash Sale", "Your Special Member Discount", "Get Early Access Now!",
        "Happy Birthday from Us!", "Celebrate Your Anniversary With Us", "Referral Program Invite",
        "Download Our App Today!"
    ];

    const dummyCampaigns = [];

    for (let i = 0; i < campaignNames.length; i++) {
        const campaignId = `campaign-${i + 1}`;
        const campaignName = campaignNames[i];
        const subjectLine = subjectLines[i];

        const dummyInteractions = [];
        const numInteractions = Math.floor(Math.random() * 50) + 20; // 20 to 70 interactions per campaign

        for (let j = 0; j < numInteractions; j++) {
            const email = `user${i * numInteractions + j + 1}@example.com`;
            const firstName = `First${i * numInteractions + j + 1}`;
            const lastName = `Last${i * numInteractions + j + 1}`;
            const daysAgo = Math.floor(Math.random() * 60); // Interactions over the last 60 days
            const hoursAgo = Math.floor(Math.random() * 24);
            const timestamp = new Date(Date.now() - (daysAgo * 86400000) - (hoursAgo * 3600000)).toISOString();

            // Ensure 'received' always happens
            dummyInteractions.push({ email, firstName, lastName, type: 'received', timestamp });

            // Randomly add other interaction types
            if (Math.random() < 0.7) { // 70% chance of opened
                dummyInteractions.push({ email, firstName, lastName, type: 'opened', timestamp: new Date(new Date(timestamp).getTime() + Math.random() * 3600000).toISOString() });
                if (Math.random() < 0.4) { // 40% chance of clicked if opened
                    dummyInteractions.push({ email, firstName, lastName, type: 'clicked', timestamp: new Date(new Date(timestamp).getTime() + Math.random() * 7200000).toISOString() });
                }
                if (Math.random() < 0.1) { // 10% chance of replied if opened
                    dummyInteractions.push({ email, firstName, lastName, type: 'replied', timestamp: new Date(new Date(timestamp).getTime() + Math.random() * 10800000).toISOString() });
                }
            } else if (Math.random() < 0.05) { // 5% chance of bounced if not opened
                dummyInteractions.push({ email, firstName, lastName, type: 'bounced', timestamp: new Date(new Date(timestamp).getTime() + Math.random() * 3600000).toISOString() });
            }
        }

        dummyCampaigns.push({
            id: campaignId, // Add id for easier lookup
            campaignName: campaignName,
            subjectLine: subjectLine,
            totalRecipients: dummyInteractions.filter(int => int.type === 'received').length,
            interactions: dummyInteractions
        });
    }
    return dummyCampaigns;
};

// New component to encapsulate campaign management logic with dummy data
function CampaignManagementApi({ userId }) {
    const [activeTab, setActiveTab] = useState('campaign-analytics');
    const [openedEmails, setOpenedEmails] = useState([]);
    const [clickedEmails, setClickedEmails] = useState([]);
    const [receivedEmails, setReceivedEmails] = useState([]);
    const [repliedEmails, setRepliedEmails] = useState([]);
    const [bouncedEmails, setBouncedEmails] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' });

    // State for the dynamically displayed table
    const [displayedDetails, setDisplayedDetails] = useState([]);
    const [displayedDetailsTitle, setDisplayedDetailsTitle] = useState('');

    // States for campaign selection and search
    const [campaigns, setCampaigns] = useState([]);
    const [filteredCampaigns, setFilteredCampaigns] = useState([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState('');
    const [selectedCampaignName, setSelectedCampaignName] = useState('Select a Campaign');
    const [searchQuery, setSearchQuery] = useState('');

    // States for KPIs and Chart Data
    const [allCampaignKpis, setAllCampaignKpis] = useState({});
    const [currentCampaignKpis, setCurrentCampaignKpis] = useState({});
    const [engagementChartData, setEngagementChartData] = useState([]);
    const [rawInteractions, setRawInteractions] = useState([]); // New state to store all raw interactions for the current view

    // State for chart hover details
    const [hoveredPoint, setHoveredPoint] = useState(null); // { date, opened, clicked, replied, x, y }

    // States for chart line visibility
    const [showOpened, setShowOpened] = useState(true); // Default to true
    const [showClicked, setShowClicked] = useState(true); // Default to true
    const [showReplied, setShowReplied] = useState(true); // Default to true

    // States for date range selection
    const [startDate, setStartDate] = useState(''); // YYYY-MM-DD format
    const [endDate, setEndDate] = useState('');   // YYYY-MM-DD format
    const [selectedDateRangeOption, setSelectedDateRangeOption] = useState('all-time'); // 'all-time', 'last-15-days', 'last-month', etc.

    // Function to show messages in the message box
    const showMessage = (text, type = 'info') => {
        setMessage({ text, type });
        setTimeout(() => {
            setMessage({ text: '', type: '' });
        }, 3000); // Hide after 3 seconds
    };

    // Simulate API fetch on component mount
    useEffect(() => {
        const dummyData = generateDummyCampaignData();
        setCampaigns(dummyData.map(c => ({ id: c.id, name: c.campaignName, subjectLine: c.subjectLine })));
        setRawInteractions(dummyData.flatMap(c => c.interactions)); // Aggregate all interactions

        // Initial selection of the first campaign if available
        if (dummyData.length > 0) {
            setSelectedCampaignId(dummyData[0].id);
            setSelectedCampaignName(dummyData[0].campaignName);
        }
    }, []);

    // Filter campaigns based on search query
    useEffect(() => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const filtered = campaigns.filter(campaign =>
            campaign.name.toLowerCase().includes(lowerCaseQuery)
        );
        setFilteredCampaigns(filtered);
        // If selected campaign is filtered out, reset selection
        if (selectedCampaignId && !filtered.find(c => c.id === selectedCampaignId)) {
            setSelectedCampaignId('');
            setSelectedCampaignName('Select a Campaign');
        }
    }, [searchQuery, campaigns, selectedCampaignId]);

    // Effect to handle predefined date range selection
    useEffect(() => {
        const today = new Date();
        let calculatedStartDate = '';
        let calculatedEndDate = today.toISOString().split('T')[0]; // Default end to today

        if (selectedDateRangeOption === 'last-15-days') {
            const d = new Date(today);
            d.setDate(today.getDate() - 14);
            calculatedStartDate = d.toISOString().split('T')[0];
        } else if (selectedDateRangeOption === 'last-month') {
            const d = new Date(today);
            d.setMonth(today.getMonth() - 1);
            calculatedStartDate = d.toISOString().split('T')[0];
        } else if (selectedDateRangeOption === 'last-3-months') {
            const d = new Date(today);
            d.setMonth(today.getMonth() - 3);
            calculatedStartDate = d.toISOString().split('T')[0];
        } else if (selectedDateRangeOption === 'last-6-months') {
            const d = new Date(today);
            d.setMonth(today.getMonth() - 6);
            calculatedStartDate = d.toISOString().split('T')[0];
        } else if (selectedDateRangeOption === 'last-year') {
            const d = new Date(today);
            d.setFullYear(today.getFullYear() - 1);
            calculatedStartDate = d.toISOString().split('T')[0];
        } else if (selectedDateRangeOption === 'all-time') {
            calculatedStartDate = ''; // Empty string means no start date filter
            calculatedEndDate = ''; // Empty string means no end date filter
        }
        // For 'custom', startDate and endDate are already set by user inputs

        // Only update if they are different to prevent infinite loops
        if (selectedDateRangeOption !== 'custom') {
             if (startDate !== calculatedStartDate) setStartDate(calculatedStartDate);
             if (endDate !== calculatedEndDate) setEndDate(calculatedEndDate);
        }
    }, [selectedDateRangeOption]);


    // Calculate KPIs and chart data based on selected campaign and date range
    useEffect(() => {
        let interactionsForCalculation = [];
        let campaignSubjectLine = 'N/A';

        if (selectedCampaignId) {
            const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
            if (selectedCampaign) {
                // Find the full campaign object from the dummy data to get its interactions
                const fullDummyData = generateDummyCampaignData(); // Re-generate to find the full object
                const fullCampaign = fullDummyData.find(c => c.id === selectedCampaignId);
                if (fullCampaign && fullCampaign.interactions) {
                    interactionsForCalculation = fullCampaign.interactions;
                    campaignSubjectLine = fullCampaign.subjectLine;
                }
            }
        } else {
            interactionsForCalculation = rawInteractions; // All interactions if no campaign selected
        }

        // Filter interactions based on date range
        const filteredInteractions = interactionsForCalculation.filter(interaction => {
            const interactionDate = new Date(interaction.timestamp);
            const start = startDate ? new Date(startDate + 'T00:00:00') : null;
            const end = endDate ? new Date(endDate + 'T23:59:59.999') : null;

            let isWithinRange = true;
            if (start && interactionDate < start) {
                isWithinRange = false;
            }
            if (end && interactionDate > end) {
                isWithinRange = false;
            }
            return isWithinRange;
        });

        // Calculate KPIs
        const totalReceived = filteredInteractions.filter(int => int.type === 'received').length;
        const totalOpened = filteredInteractions.filter(int => int.type === 'opened').length;
        const totalClicked = filteredInteractions.filter(int => int.type === 'clicked').length;
        const totalReplied = filteredInteractions.filter(int => int.type === 'replied').length;
        const totalBounced = filteredInteractions.filter(int => int.type === 'bounced').length;

        const kpis = {
            totalSent: totalReceived,
            openRate: totalReceived > 0 ? ((totalOpened / totalReceived) * 100).toFixed(2) : '0.00',
            ctr: totalReceived > 0 ? ((totalClicked / totalReceived) * 100).toFixed(2) : '0.00',
            replyRate: totalReceived > 0 ? ((totalReplied / totalReceived) * 100).toFixed(2) : '0.00',
            bounceRate: totalReceived > 0 ? ((totalBounced / totalReceived) * 100).toFixed(2) : '0.00',
            bestPerformingSubjectLine: campaignSubjectLine, // This will be the selected campaign's subject line or N/A
        };
        console.log(kpis);

        if (selectedCampaignId) {
            setCurrentCampaignKpis(kpis);
            // For the "All Campaigns" KPIs, we need to re-calculate based on ALL raw interactions, not just filtered ones.
            // This is slightly redundant but ensures the "Overall Campaign KPIs" always reflect the entire dataset.
            const allRec = rawInteractions.filter(int => int.type === 'received').length;
            const allOpen = rawInteractions.filter(int => int.type === 'opened').length;
            const allClick = rawInteractions.filter(int => int.type === 'clicked').length;
            const allReply = rawInteractions.filter(int => int.type === 'replied').length;
            const allBounce = rawInteractions.filter(int => int.type === 'bounced').length;

            let bestSubLineOverall = { subject: 'N/A', openRate: 0 };
            generateDummyCampaignData().forEach(camp => {
                const campRec = camp.interactions.filter(int => int.type === 'received').length;
                const campOpen = camp.interactions.filter(int => int.type === 'opened').length;
                if (campRec > 0) {
                    const rate = (campOpen / campRec) * 100;
                    if (rate > bestSubLineOverall.openRate) {
                        bestSubLineOverall = { subject: camp.subjectLine, openRate: rate };
                    }
                }
            });

            setAllCampaignKpis({
                totalSent: allRec,
                openRate: allRec > 0 ? ((allOpen / allRec) * 100).toFixed(2) : '0.00',
                ctr: allRec > 0 ? ((allClick / allRec) * 100).toFixed(2) : '0.00',
                replyRate: allRec > 0 ? ((allReply / allRec) * 100).toFixed(2) : '0.00',
                bounceRate: allRec > 0 ? ((allBounce / allRec) * 100).toFixed(2) : '0.00',
                bestPerformingSubjectLine: bestSubLineOverall.subject,
            });

        } else {
            setAllCampaignKpis(kpis);
            setCurrentCampaignKpis({}); // No specific campaign selected
        }


        // Aggregate data for the Time Series Line Chart
        const dailyData = filteredInteractions.reduce((acc, interaction) => {
            const date = new Date(interaction.timestamp).toLocaleDateString('en-CA'); // YYYY-MM-DD
            if (!acc[date]) {
                acc[date] = { date, opened: 0, clicked: 0, replied: 0 };
            }
            if (interaction.type === 'opened') acc[date].opened++;
            if (interaction.type === 'clicked') acc[date].clicked++;
            if (interaction.type === 'replied') acc[date].replied++;
            return acc;
        }, {});

        const sortedChartData = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));
        setEngagementChartData(sortedChartData);

    }, [selectedCampaignId, campaigns, rawInteractions, startDate, endDate]);


    // Helper to render the details table
    const renderDetailsTable = (details, title) => {
        if (details.length === 0) {
            return <p className="text-gray-400 italic">No data to display for {title}.</p>;
        }

        // Determine if the title should be purple
        const isPurpleTitle = ['Who Opened', 'Who Clicked', 'Who Received', 'Which Bounced', 'Total Mails Sent', 'Who Replied'].includes(title);
        const titleColorClass = isPurpleTitle ? 'purple-text' : 'white-text';

        return (
            <div className="details-table-container custom-scrollbar">
                <h3 className={`details-table-title ${titleColorClass}`}>{title} Details</h3>
                <table className="details-table">
                    <thead><tr>
                        <th scope="col">First Name</th>
                        <th scope="col">Last Name</th>
                        <th scope="col">Email</th>
                        <th scope="col">Type</th> {/* Added Type column */}
                        <th scope="col">Timestamp</th>
                    </tr></thead>
                    <tbody>
                        {details.map((data, index) => (
                            <tr key={index}>
                                <td>{data.firstName}</td>
                                <td>{data.lastName}</td>
                                <td>{data.email}</td>
                                <td>{data.type ? data.type.charAt(0).toUpperCase() + data.type.slice(1) : 'N/A'}</td> {/* Display type */}
                                <td>{data.timestamp}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="download-button-container">
                    <button
                        onClick={() => downloadCSV(details, title.replace(/\s/g, '_').toLowerCase())}
                        className="download-button"
                    >
                        Download Current Data CSV
                    </button>
                </div>
            </div>
        );
    };

    const getMessageBoxClasses = () => {
        let classes = "message-box";
        if (message.text === '') {
            classes += ' hidden';
        } else if (message.type === 'error') {
            classes += ' error-message';
        } else if (message.type === 'success') {
            classes += ' success-message';
        } else {
            classes += ' info-message';
        }
        return classes;
    };

    // Function to download data as CSV
    const downloadCSV = (data, filename) => {
        if (data.length === 0) {
            showMessage('No data to download.', 'info');
            return;
        }

        // Define CSV headers
        const headers = ["First Name", "Last Name", "Email", "Type", "Timestamp"]; // Added Type header

        // Map data to CSV rows
        const csvRows = data.map(row =>
            [row.firstName, row.lastName, row.email, row.type, row.timestamp].map(field => // Added row.type
                `"${String(field).replace(/"/g, '""')}"` // Escape double quotes and wrap in quotes
            ).join(',')
        );

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(',') + "\n"
            + csvRows.join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link); // Required for Firefox
        link.click();
        document.body.removeChild(link); // Clean up
        showMessage(`Downloading ${filename}.csv`, 'success');
    };

    const kpisToDisplay = selectedCampaignId ? currentCampaignKpis : allCampaignKpis;

    // Function to handle chart clicks
    const handleChartClick = (event) => {
        const svg = event.currentTarget;
        const rect = svg.getBoundingClientRect();
        const x = event.clientX - rect.left; // X-coordinate relative to SVG

        const width = 600; // Must match SVG width
        const height = 300; // Must match SVG height
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        const innerWidth = width - margin.left - margin.right;

        if (engagementChartData.length === 0) return;

        // Calculate the approximate date based on the click's X position
        const dates = engagementChartData.map(d => new Date(d.date));
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);

        // Reverse scale to get approximate date from x-coordinate
        const clickedXRelativeToInner = x - margin.left;
        const fraction = clickedXRelativeToInner / innerWidth;
        const clickedTimestamp = minDate + (maxDate - minDate) * fraction;
        const clickedDate = new Date(clickedTimestamp).toLocaleDateString('en-CA');

        // Filter raw interactions for the clicked date
        const dailyInteractions = rawInteractions.filter(interaction =>
            new Date(interaction.timestamp).toLocaleDateString('en-CA') === clickedDate
        ).map(interaction => ({
            email: interaction.email || 'N/A',
            firstName: interaction.firstName || 'N/A',
            lastName: interaction.lastName || 'N/A',
            timestamp: new Date(interaction.timestamp).toLocaleString(),
            type: interaction.type // Include type
        }));

        setDisplayedDetails(dailyInteractions);
        setDisplayedDetailsTitle(`Interactions for ${clickedDate}`);
    };

    // Function to handle mouse move on the chart for hover details
    const handleMouseMove = (event) => {
        const svg = event.currentTarget;
        const rect = svg.getBoundingClientRect();
        const mouseX = event.clientX - rect.left; // X-coordinate relative to SVG
        const mouseY = event.clientY - rect.top; // Y-coordinate relative to SVG

        const width = 600;
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        if (engagementChartData.length === 0) {
            setHoveredPoint(null);
            return;
        }

        const dates = engagementChartData.map(d => new Date(d.date));
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        const allEngagementValues = engagementChartData.flatMap(d => [d.opened, d.clicked, d.replied]);
        const maxValue = Math.max(...allEngagementValues);

        const xScale = (date) => {
            if (minDate === maxDate) return margin.left + innerWidth / 2;
            return margin.left + (innerWidth * (date - minDate) / (maxDate - minDate));
        };

        const yScale = (value) => {
            if (maxValue === 0) return innerHeight + margin.top;
            return innerHeight - (innerHeight * value / maxValue) + margin.top;
        };

        // Find the closest data point based on mouse X
        let closestPoint = null;
        let minDistance = Infinity;

        engagementChartData.forEach(d => {
            const dateObj = new Date(d.date);
            const pointX = xScale(dateObj);
            const distance = Math.abs(mouseX - pointX);

            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = {
                    date: d.date,
                    opened: d.opened,
                    clicked: d.clicked,
                    replied: d.replied,
                    x: pointX,
                    y: yScale(Math.max(d.opened, d.clicked, d.replied)) // Position tooltip near the highest value for that day
                };
            }
        });

        // Only update if the mouse is within a reasonable distance of a point
        if (closestPoint && minDistance < 20) { // Threshold for "hovering over a point"
            setHoveredPoint(closestPoint);
        } else {
            setHoveredPoint(null);
        }
    };

    // Function to handle mouse leave on the chart
    const handleMouseLeave = () => {
        setHoveredPoint(null);
    };


    // Helper to render the SVG line chart
    const renderSvgLineChart = (data) => {
        if (data.length === 0) {
            return <p className="chart-description">No data available for the chart.</p>;
        }

        const width = 600; // Fixed width for SVG, can be made responsive with viewBox
        const height = 300;
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Extract values for scaling
        const dates = data.map(d => new Date(d.date));
        const allEngagementValues = data.flatMap(d => [d.opened, d.clicked, d.replied]);

        const xScale = (date) => {
            const minDate = Math.min(...dates);
            const maxDate = Math.max(...dates);
            if (minDate === maxDate) return margin.left + innerWidth / 2; // Handle single date case
            return margin.left + (innerWidth * (date - minDate) / (maxDate - minDate));
        };

        const yScale = (value) => {
            const maxValue = Math.max(...allEngagementValues);
            if (maxValue === 0) return innerHeight + margin.top; // Handle no engagement case
            return innerHeight - (innerHeight * value / maxValue) + margin.top;
        };

        // Function to generate smooth path data
        const linePath = (points) => {
            if (points.length === 0) return "";
            let path = `M${points[0]}`;
            for (let i = 1; i < points.length; i++) {
                path += `L${points[i]}`;
            }
            return path;
        };

        const curveFactor = 0.5; // Adjust for more or less curve

        const getSmoothPath = (points) => {
            if (points.length < 2) return linePath(points);

            let path = `M${points[0]}`;
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i].split(',').map(Number);
                const p2 = points[i+1].split(',').map(Number);

                const midX = (p1[0] + p2[0]) / 2;
                const midY = (p1[1] + p2[1]) / 2;

                const cp1x = p1[0] + (p2[0] - p1[0]) * curveFactor;
                const cp1y = p1[1];
                const cp2x = p2[0] - (p2[0] - p1[0]) * curveFactor;
                const cp2y = p2[1];

                path += `C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
            }
            return path;
        };


        // Create points for lines
        const openedPoints = data.map(d => `${xScale(new Date(d.date))},${yScale(d.opened)}`);
        const clickedPoints = data.map(d => `${xScale(new Date(d.date))},${yScale(d.clicked)}`);
        const repliedPoints = data.map(d => `${xScale(new Date(d.date))},${yScale(d.replied)}`);

        // X-axis labels (simplified for SVG)
        const xTicks = [];
        if (dates.length > 0) {
            const firstDate = dates[0];
            const lastDate = dates[dates.length - 1];
            // Show start, middle, and end dates
            xTicks.push({ value: firstDate, label: firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
            if (dates.length > 2) {
                const midDate = dates[Math.floor(dates.length / 2)];
                xTicks.push({ value: midDate, label: midDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
            }
            if (dates.length > 1) {
                xTicks.push({ value: lastDate, label: lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
            }
        }


        // Y-axis labels (simplified for SVG)
        const yTicks = [];
        const maxValue = Math.max(...allEngagementValues);
        const numYTicks = 5;
        for (let i = 0; i <= numYTicks; i++) {
            const value = Math.round(maxValue * i / numYTicks);
            yTicks.push({ value: value, label: value.toString() });
        }


        return (
            <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="chart-svg"
                 onClick={handleChartClick} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                <defs>
                    {/* Gradient for Opened Emails */}
                    <linearGradient id="gradientOpened" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    {/* Gradient for Clicked Emails */}
                    <linearGradient id="gradientClicked" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                    {/* Gradient for Replied Emails */}
                    <linearGradient id="gradientReplied" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#ffc658" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#ffc658" stopOpacity={0}/>
                    </linearGradient>
                </defs>

                <g transform={`translate(${margin.left},${margin.top})`}>
                    {/* Grid Lines */}
                    {yTicks.map((tick, i) => (
                        <line key={`y-grid-${i}`} x1="0" y1={yScale(tick.value) - margin.top} x2={innerWidth} y2={yScale(tick.value) - margin.top} stroke="#4a4a4a" strokeDasharray="3 3" />
                    ))}
                    {xTicks.map((tick, i) => (
                        <line key={`x-grid-${i}`} x1={xScale(tick.value) - margin.left} y1="0" x2={xScale(tick.value) - margin.left} y2={innerHeight} stroke="#4a4a4a" strokeDasharray="3 3" />
                    ))}

                    {/* X-Axis */}
                    <line x1="0" y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="#9ca3af" strokeWidth="1.5"/>
                    {xTicks.map((tick, i) => (
                        <text key={`x-label-${i}`} x={xScale(tick.value) - margin.left} y={innerHeight + 20} fill="#9ca3af" textAnchor="middle" fontSize="11">
                            {tick.label}
                        </text>
                    ))}

                    {/* Y-Axis */}
                    <line x1="0" y1="0" x2="0" y2={innerHeight} stroke="#9ca3af" strokeWidth="1.5"/>
                    {yTicks.map((tick, i) => (
                        <text key={`y-label-${i}`} x="-10" y={yScale(tick.value) - margin.top} fill="#9ca3af" textAnchor="end" alignmentBaseline="middle" fontSize="11">
                            {tick.label}
                        </text>
                    ))}

                    {/* Conditional rendering of lines and areas based on state */}
                    {showOpened && (
                        <>
                            <path d={getSmoothPath(openedPoints.concat([`${xScale(dates[dates.length - 1])},${yScale(0)}`, `${xScale(dates[0])},${yScale(0)}`]))} fill="url(#gradientOpened)" />
                            <path fill="none" stroke="#8884d8" strokeWidth="3" d={getSmoothPath(openedPoints)} />
                        </>
                    )}
                    {showClicked && (
                        <>
                            <path d={getSmoothPath(clickedPoints.concat([`${xScale(dates[dates.length - 1])},${yScale(0)}`, `${xScale(dates[0])},${yScale(0)}`]))} fill="url(#gradientClicked)" />
                            <path fill="none" stroke="#82ca9d" strokeWidth="3" d={getSmoothPath(clickedPoints)} />
                        </>
                    )}
                    {showReplied && (
                        <>
                            <path d={getSmoothPath(repliedPoints.concat([`${xScale(dates[dates.length - 1])},${yScale(0)}`, `${xScale(dates[0])},${yScale(0)}`]))} fill="url(#gradientReplied)" />
                            <path fill="none" stroke="#ffc658" strokeWidth="3" d={getSmoothPath(repliedPoints)} />
                        </>
                    )}

                    {/* Hover Tooltip and vertical line */}
                    {hoveredPoint && (
                        <g>
                            <line
                                x1={hoveredPoint.x - margin.left}
                                y1="0"
                                x2={hoveredPoint.x - margin.left}
                                y2={innerHeight}
                                stroke="#6b7280" // Gray vertical line
                                strokeDasharray="4 4"
                            />
                            {showOpened && <circle cx={hoveredPoint.x - margin.left} cy={yScale(hoveredPoint.opened) - margin.top} r="5" fill="#8884d8" stroke="#fff" strokeWidth="2" />}
                            {showClicked && <circle cx={hoveredPoint.x - margin.left} cy={yScale(hoveredPoint.clicked) - margin.top} r="5" fill="#82ca9d" stroke="#fff" strokeWidth="2" />}
                            {showReplied && <circle cx={hoveredPoint.x - margin.left} cy={yScale(hoveredPoint.replied) - margin.top} r="5" fill="#ffc658" stroke="#fff" strokeWidth="2" />}

                            <rect
                                x={hoveredPoint.x - margin.left + 15}
                                y={hoveredPoint.y - margin.top - 40}
                                width="120"
                                height="80"
                                fill="#2d3748" // Darker background for tooltip
                                rx="8"
                                ry="8"
                                opacity="0.95"
                                stroke="#4a5568" // Border for tooltip
                                strokeWidth="1"
                            />
                            <text x={hoveredPoint.x - margin.left + 25} y={hoveredPoint.y - margin.top - 20} fill="#fff" fontSize="11" fontWeight="bold">
                                {new Date(hoveredPoint.date).toLocaleDateString()}
                            </text>
                            {showOpened && <text x={hoveredPoint.x - margin.left + 25} y={hoveredPoint.y - margin.top} fill="#8884d8" fontSize="11">
                                Opened: {hoveredPoint.opened}
                            </text>}
                            {showClicked && <text x={hoveredPoint.x - margin.left + 25} y={hoveredPoint.y - margin.top + 15} fill="#82ca9d" fontSize="11">
                                Clicked: {hoveredPoint.clicked}
                            </text>}
                            {showReplied && <text x={hoveredPoint.x - margin.left + 25} y={hoveredPoint.y - margin.top + 30} fill="#ffc658" fontSize="11">
                                Replied: {hoveredPoint.replied}
                            </text>}
                        </g>
                    )}

                    {/* Legend */}
                    <g transform={`translate(${innerWidth - 150}, 10)`}>
                        {/* Emails Opened */}
                        <rect x="0" y="3" width="15" height="15" fill="#8884d8" rx="3" ry="3"/>
                        <text x="20" y="12" fill="#fff" fontSize="12">Emails Opened</text>

                        {/* Emails Clicked */}
                        <rect x="0" y="23" width="15" height="15" fill="#82ca9d" rx="3" ry="3"/>
                        <text x="20" y="32" fill="#fff" fontSize="12">Emails Clicked</text>

                        {/* Emails Replied */}
                        <rect x="0" y="43" width="15" height="15" fill="#ffc658" rx="3" ry="3"/>
                        <text x="20" y="52" fill="#fff" fontSize="12">Emails Replied</text>
                    </g>
                </g>
            </svg>
        );
    };


    return (
        <div className="app-container">
            <style>{`
                /* General Styles */
                body {
                    margin: 0;
                    font-family: 'Inter', sans-serif;
                    background-color: #0d1117; /* Deeper dark background */
                    color: #c9d1d9; /* Lighter text for contrast */
                }

                .app-container {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background-color: #0d1117; /* Consistent dark background */
                    color: #c9d1d9;
                }

                .header {
                    background: linear-gradient(to right, #243b55, #141e30); /* Darker, more subtle gradient */
                    color: white;
                    padding: 1.5rem;
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2); /* Stronger shadow */
                    border-bottom: 1px solid #30363d; /* Subtle border */
                }

                .header-content {
                    max-width: 1200px;
                    margin-left: auto;
                    margin-right: auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header-title {
                    font-size: 2.2rem; /* Slightly larger */
                    font-weight: bold;
                    letter-spacing: 0.02em; /* A bit more space */
                    color: #58a6ff; /* A vibrant blue for title */
                }

                .user-info {
                    font-size: 0.9rem; /* Slightly larger */
                    background-color: #161b22; /* Darker background for user info */
                    padding: 0.4rem 1rem;
                    border-radius: 9999px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    border: 1px solid #30363d; /* Subtle border */
                    color: #8b949e; /* Muted text */
                }

                .main-content {
                    flex-grow: 1;
                    max-width: 1200px;
                    margin-left: auto;
                    margin-right: auto;
                    padding: 2rem 1.5rem; /* More vertical padding */
                }

                .main-card {
                    border-radius: 0.75rem;
                    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3); /* Deeper shadow */
                    overflow: hidden;
                    background-color: #161b22; /* Darker card background */
                    border: 1px solid #30363d; /* Subtle border */
                }

                .tabs-nav {
                    display: flex;
                    border-bottom: 1px solid #30363d;
                    background-color: #161b22; /* Same as card background */
                    padding: 0 1.5rem; /* Padding for tabs */
                }

                .tab-button {
                    padding: 1rem 1.8rem; /* More padding */
                    font-size: 1.1rem;
                    font-weight: 600; /* Bolder */
                    color: #8b949e; /* Muted text */
                    background: none;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease-in-out; /* Smoother transition */
                    position: relative;
                    overflow: hidden;
                }

                .tab-button:hover {
                    color: #58a6ff; /* Vibrant blue on hover */
                    background-color: #21262d; /* Slightly lighter on hover */
                }

                .tab-button.active-tab {
                    border-bottom: 3px solid #58a6ff; /* Thicker, vibrant blue border */
                    color: #c9d1d9; /* White text for active */
                    background-color: #21262d; /* Slightly lighter for active */
                }
                .tab-button.active-tab::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 3px;
                    background-color: #58a6ff;
                    transform: scaleX(1);
                    transition: transform 0.3s ease-in-out;
                }
                .tab-button:not(.active-tab)::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 3px;
                    background-color: transparent;
                    transform: scaleX(0);
                    transition: transform 0.3s ease-in-out;
                }

                .tab-content {
                    padding: 2rem; /* More padding */
                }

                .section-title {
                    font-size: 1.8rem; /* Larger */
                    font-weight: 700; /* Bolder */
                    color: #79c0ff; /* Lighter blue */
                    margin-bottom: 1.8rem; /* More space */
                    border-bottom: 1px solid #30363d; /* Separator */
                    padding-bottom: 0.8rem;
                }

                .section-description {
                    color: #8b949e; /* Muted text */
                    margin-bottom: 2.5rem; /* More space */
                    line-height: 1.7; /* Better readability */
                }

                .campaign-selection-card {
                    margin-bottom: 2rem; /* More space */
                    padding: 1.5rem; /* More padding */
                    border-radius: 0.6rem; /* Slightly more rounded */
                    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
                    background-color: #21262d; /* Darker background */
                    border: 1px solid #30363d;
                }

                .label-text {
                    display: block;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #79c0ff; /* Lighter blue */
                    margin-bottom: 0.6rem; /* More space */
                }

                .input-field, .select-field {
                    display: block;
                    width: 100%;
                    padding: 0.6rem 0.8rem; /* Increased padding */
                    font-size: 0.95rem; /* Slightly smaller */
                    border: 1px solid #484f58; /* Darker border */
                    outline: none;
                    border-radius: 0.4rem; /* Slightly more rounded */
                    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
                    background-color: #0d1117; /* Darker input background */
                    color: #c9d1d9; /* Lighter text */
                    appearance: none; /* Remove default select arrow */
                }

                .input-field::placeholder {
                    color: #6e7681; /* Muted placeholder */
                }

                .input-field:focus, .select-field:focus {
                    border-color: #58a6ff; /* Vibrant blue focus */
                    box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.5); /* Blue glow */
                }

                .select-field {
                    margin-top: 0.5rem; /* More space */
                    background-image: url('data:image/svg+xml;utf8,<svg fill="%23c9d1d9" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>'); /* Custom arrow */
                    background-repeat: no-repeat;
                    background-position: right 0.8rem center;
                    background-size: 1.2em;
                }

                .grid-container {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.8rem; /* More gap */
                }

                @media (min-width: 768px) {
                    .grid-container {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (min-width: 1024px) {
                    .grid-container {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }

                @media (min-width: 1280px) {
                    .kpi-grid {
                        grid-template-columns: repeat(5, 1fr);
                    }
                }

                .kpi-card {
                    padding: 1.5rem; /* More padding */
                    border-radius: 0.6rem;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); /* Slightly stronger shadow */
                    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                }
                .kpi-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
                }

                .kpi-card h3 {
                    font-size: 1.3rem; /* Larger */
                    font-weight: 600;
                    margin-bottom: 0.8rem; /* More space */
                    display: flex;
                    align-items: center;
                    gap: 0.5rem; /* Space for icon */
                }
                .kpi-card p {
                    font-size: 2.2rem; /* Larger value */
                    font-weight: bold;
                    margin-top: 0.5rem;
                }
                .kpi-card button {
                    margin-top: 1rem; /* More space */
                    background-color: #58a6ff; /* Vibrant blue */
                    color: #0d1117; /* Dark text on blue */
                    padding: 0.6rem 1.2rem; /* More padding */
                    border-radius: 0.4rem;
                    transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out;
                    font-size: 0.9rem;
                    border: none;
                    cursor: pointer;
                    font-weight: 600;
                }
                .kpi-card button:hover {
                    background-color: #79c0ff; /* Lighter blue on hover */
                    transform: translateY(-1px);
                }
                .kpi-card button:active {
                    transform: translateY(0);
                }

                /* Specific KPI Card Colors */
                .kpi-card.opened { background-color: #1a2c42; border: 1px solid #2f4e72; color: #a3b3c9; }
                .kpi-card.opened h3 { color: #58a6ff; }
                .kpi-card.opened p { color: #8b949e; }

                .kpi-card.clicked { background-color: #1a3628; border: 1px solid #2f6b4e; color: #a3c9b3; }
                .kpi-card.clicked h3 { color: #3fb950; }
                .kpi-card.clicked p { color: #8b949e; }

                .kpi-card.received { background-color: #301f4a; border: 1px solid #5d3d8c; color: #c9a3e6; }
                .kpi-card.received h3 { color: #a78bfa; }
                .kpi-card.received p { color: #8b949e; }

                .kpi-card.replied { background-color: #4a341a; border: 1px solid #8c682f; color: #e6c9a3; }
                .kpi-card.replied h3 { color: #fcd34d; }
                .kpi-card.replied p { color: #8b949e; }

                .kpi-card.bounced { background-color: #4a1a1a; border: 1px solid #8c2f2f; color: #e6a3a3; }
                .kpi-card.bounced h3 { color: #f85149; }
                .kpi-card.bounced p { color: #8b949e; }

                .kpi-card.sent { background-color: #1a2036; border: 1px solid #2f3d6b; color: #a3a9c9; }
                .kpi-card.sent h3 { color: #818cf8; }
                .kpi-card.sent p { color: #8b949e; }


                .no-campaign-selected {
                    color: #6e7681;
                    text-align: center;
                    font-size: 1.2rem; /* Larger */
                    margin-top: 3rem; /* More space */
                    padding: 1.5rem;
                    background-color: #21262d;
                    border-radius: 0.6rem;
                    border: 1px solid #30363d;
                }

                .details-table-wrapper {
                    margin-top: 2.5rem; /* More space */
                    padding: 1.8rem; /* More padding */
                    background-color: #21262d; /* Darker background */
                    border-radius: 0.6rem;
                    border: 1px solid #30363d;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                }

                .details-table-container {
                    color: #c9d1d9;
                    font-size: 0.9rem;
                    max-height: 25rem; /* Increased max height */
                    overflow-y: auto;
                }

                .details-table-title {
                    font-size: 1.4rem; /* Larger */
                    font-weight: 700;
                    margin-bottom: 1rem;
                    color: #79c0ff; /* Lighter blue */
                    border-bottom: 1px solid #30363d;
                    padding-bottom: 0.5rem;
                }

                .details-table {
                    width: 100%; /* Changed to width: 100% for better responsiveness */
                    border-collapse: collapse;
                    border-spacing: 0;
                }

                .details-table thead {
                    background-color: #161b22; /* Darker header */
                }

                .details-table th {
                    padding: 0.8rem 1.2rem; /* More padding */
                    text-align: left;
                    font-size: 0.8rem; /* Slightly larger */
                    font-weight: 600;
                    color: #8b949e; /* Muted text */
                    text-transform: uppercase;
                    letter-spacing: 0.08em; /* More tracking */
                    border-bottom: 2px solid #30363d;
                }

                .details-table tbody {
                    background-color: #0d1117; /* Darker body */
                }
                .details-table tbody tr {
                    border-bottom: 1px solid #21262d; /* Subtle row separator */
                }
                .details-table tbody tr:last-child {
                    border-bottom: none;
                }
                .details-table tbody tr:hover {
                    background-color: #161b22; /* Highlight row on hover */
                }

                .details-table td {
                    padding: 0.7rem 1.2rem; /* More padding */
                    white-space: nowrap;
                    color: #c9d1d9;
                }

                .download-button-container {
                    margin-top: 1.5rem; /* More space */
                    display: flex;
                    justify-content: flex-end;
                }

                .download-button {
                    background-color: #58a6ff;
                    color: #0d1117;
                    padding: 0.7rem 1.4rem;
                    border-radius: 0.4rem;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out;
                    border: none;
                    cursor: pointer;
                    font-weight: 600;
                }

                .download-button:hover {
                    background-color: #79c0ff;
                    transform: translateY(-1px);
                }
                .download-button:active {
                    transform: translateY(0);
                }

                .message-box {
                    margin-top: 1.5rem;
                    text-align: center;
                    font-size: 0.9rem;
                    padding: 0.8rem;
                    border-radius: 0.4rem;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    font-weight: 500;
                }

                .message-box.hidden {
                    display: none;
                }

                .message-box.error-message {
                    background-color: #4a1a1a;
                    color: #f85149;
                    border: 1px solid #8c2f2f;
                }

                .message-box.success-message {
                    background-color: #1a3628;
                    color: #3fb950;
                    border: 1px solid #2f6b4e;
                }

                .message-box.info-message {
                    background-color: #1a2c42;
                    color: #58a6ff;
                    border: 1px solid #2f4e72;
                }

                .footer {
                    background-color: #111827;
                    color: #6e7681;
                    padding: 1.2rem;
                    text-align: center;
                    font-size: 0.85rem;
                    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
                    margin-top: 2.5rem;
                    border-top: 1px solid #30363d;
                }

                .footer-content {
                    max-width: 1200px;
                    margin-left: auto;
                    margin-right: auto;
                }

                /* Custom Scrollbar */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 10px; /* Thicker scrollbar */
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #161b22; /* Darker track */
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #484f58; /* Thumb color */
                    border-radius: 10px;
                    border: 2px solid #161b22; /* Border around thumb */
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #6e7681; /* Hover thumb color */
                }

                /* KPI Scorecard Styles */
                .kpi-summary-card {
                    margin-bottom: 2.5rem;
                    padding: 2rem; /* More padding */
                    background-color: #21262d; /* Darker background */
                    border-radius: 0.6rem;
                    border: 1px solid #30363d;
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2); /* Stronger shadow */
                }

                .kpi-summary-title {
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #79c0ff;
                    margin-bottom: 1.5rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid #30363d;
                }

                .kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); /* Responsive grid */
                    gap: 1.2rem; /* More gap */
                }

                .kpi-item {
                    background-color: #161b22; /* Darker background */
                    padding: 1.2rem; /* More padding */
                    border-radius: 0.5rem;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    text-align: center;
                    border: 1px solid #30363d;
                    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                }
                .kpi-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                }

                .kpi-item p:first-child {
                    font-size: 0.9rem;
                    color: #8b949e;
                    margin-bottom: 0.4rem;
                }

                .kpi-item p:last-child {
                    font-size: 1.8rem; /* Larger */
                    font-weight: bold;
                    color: #c9d1d9;
                }

                .kpi-item .green-text { color: #3fb950; }
                .kpi-item .indigo-text { color: #818cf8; }
                .kpi-item .yellow-text { color: #fcd34d; }
                .kpi-item .red-text { color: #f85149; }

                .best-subject-line-card {
                    margin-top: 1.5rem;
                    background-color: #21262d;
                    padding: 1.2rem;
                    border-radius: 0.5rem;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                    border: 1px solid #30363d;
                }

                .best-subject-line-card p:first-child {
                    font-size: 0.9rem;
                    color: #8b949e;
                }

                .best-subject-line-card p:nth-child(2) {
                    font-size: 1.1rem;
                    font-weight: bold;
                    color: #a78bfa;
                    margin-top: 0.3rem;
                }

                .best-subject-line-card p:last-child {
                    font-size: 0.7rem;
                    color: #6e7681;
                    margin-top: 0.4rem;
                }

                /* Chart Styles */
                .chart-container {
                    margin-bottom: 2.5rem;
                    padding: 2rem;
                    background-color: #21262d;
                    border-radius: 0.6rem;
                    border: 1px solid #30363d;
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
                }

                .chart-title {
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #79c0ff;
                    margin-bottom: 1.5rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid #30363d;
                }

                .chart-description {
                    font-size: 0.85rem;
                    color: #8b949e;
                    margin-top: 1rem;
                    text-align: center;
                    line-height: 1.5;
                }

                .chart-svg {
                    width: 100%;
                    height: auto;
                    max-height: 350px; /* Slightly increased max height */
                    background-color: #0d1117; /* Darker background for chart area */
                    border-radius: 0.4rem;
                    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
                }

                /* AB Testing Card */
                .ab-testing-card {
                    padding: 1.8rem;
                    border-radius: 0.6rem;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                    background-color: #2e261a; /* Darker yellow-ish background */
                    border: 1px solid #5c432f; /* Darker yellow-ish border */
                    color: #fcd34d; /* Yellow text */
                }

                .ab-testing-card h3 {
                    font-size: 1.3rem;
                    font-weight: 600;
                    color: #fcd34d;
                    margin-bottom: 1rem;
                }

                .ab-testing-card ul {
                    list-style-type: '👉 '; /* Custom bullet point */
                    list-style-position: inside;
                    color: #c9d1d9;
                    margin-left: 0;
                    padding-left: 0;
                }

                .ab-testing-card li {
                    margin-bottom: 0.6rem;
                    padding-left: 0.5rem; /* Indent list items */
                }

                .ab-testing-card li:last-child {
                    margin-bottom: 0;
                }

                /* Icon styling (simple text/emoji replacement) */
                .icon {
                    margin-right: 0.6rem;
                    font-size: 1.6rem;
                    vertical-align: middle;
                }

                .purple-text { color: #a78bfa; }
                .white-text { color: #c9d1d9; }

                /* Styles for chart controls */
                .chart-controls {
                    display: flex;
                    justify-content: center;
                    gap: 1.8rem; /* More space */
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                    padding: 0.8rem 0;
                    border-top: 1px solid #30363d;
                    border-bottom: 1px solid #30363d;
                    background-color: #161b22;
                    border-radius: 0.4rem;
                }

                .chart-control-item {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    font-size: 1rem; /* Slightly larger */
                    color: #8b949e;
                    transition: color 0.2s ease-in-out;
                }
                .chart-control-item:hover {
                    color: #c9d1d9;
                }

                .chart-control-item input[type="checkbox"] {
                    margin-right: 0.6rem;
                    width: 1.2rem; /* Slightly larger checkbox */
                    height: 1.2rem;
                    accent-color: #58a6ff; /* Vibrant blue accent */
                    cursor: pointer;
                }

                .chart-controls-date-range {
                    display: flex;
                    flex-direction: column;
                    gap: 1.2rem; /* More space */
                    margin-bottom: 1.8rem;
                    padding: 1.5rem;
                    background-color: #161b22; /* Darker background */
                    border-radius: 0.6rem;
                    border: 1px solid #30363d;
                    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                @media (min-width: 768px) {
                    .chart-controls-date-range {
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;
                    }
                }

                .date-inputs {
                    display: flex;
                    align-items: center;
                    gap: 0.8rem; /* More space */
                    flex-wrap: wrap;
                }

                .date-input-field {
                    padding: 0.5rem 0.7rem;
                    border: 1px solid #484f58;
                    border-radius: 0.4rem;
                    background-color: #0d1117;
                    color: #c9d1d9;
                    font-size: 0.9rem;
                    flex-grow: 1; /* Allow inputs to grow */
                    min-width: 120px; /* Minimum width for date inputs */
                }

                .date-input-field:focus {
                    border-color: #58a6ff;
                    box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.5);
                }

                .predefined-ranges {
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    flex-wrap: wrap;
                }
            `}</style>
            <header className="header">
                <div className="header-content">
                    <h1 className="header-title">Campaign Management Dashboard</h1>
                    <div id="user-info" className="user-info">
                        User ID: {userId}
                    </div>
                </div>
            </header>

            <main className="main-content">
                <div className="main-card">
                    {/* Tabs Navigation */}
                    <nav className="tabs-nav">
                        <button
                            className={`tab-button ${activeTab === 'campaign-analytics' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('campaign-analytics')}
                        >
                            Campaign Analytics
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'ab-testing' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('ab-testing')}
                        >
                            AB Testing
                        </button>
                    </nav>

                    {/* Tab Content */}
                    <div id="tab-content" className="tab-content">
                        {/* Campaign Analytics Tab Content */}
                        {activeTab === 'campaign-analytics' && (
                            <div id="campaign-analytics" className="tab-pane">
                                <h2 className="section-title">Campaign Analytics</h2>
                                <p className="section-description">Track opens, clicks, replies, and bounces directly within Gmail.</p>

                                {/* Campaign Selection Dropdown with Search */}
                                <div className="campaign-selection-card">
                                    <label htmlFor="campaign-search" className="label-text">
                                        Search Campaigns:
                                    </label>
                                    <input
                                        type="text"
                                        id="campaign-search"
                                        placeholder="Search campaign names..."
                                        className="input-field"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />

                                    <label htmlFor="campaign-select" className="label-text">
                                        Choose Campaign:
                                    </label>
                                    <select
                                        id="campaign-select"
                                        className="select-field"
                                        value={selectedCampaignId}
                                        onChange={(e) => {
                                            const newId = e.target.value;
                                            setSelectedCampaignId(newId);
                                            const selectedCamp = campaigns.find(c => c.id === newId);
                                            setSelectedCampaignName(selectedCamp ? selectedCamp.name : 'Select a Campaign');
                                        }}
                                    >
                                        <option value="">All Campaigns</option> {/* Option to view all campaigns */}
                                        {filteredCampaigns.map(campaign => (
                                            <option key={campaign.id} value={campaign.id}>
                                                {campaign.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Scorecard Summary (Top KPIs) */}
                                <div className="kpi-summary-card">
                                    <h3 className="kpi-summary-title">
                                        📊 Overall Campaign KPIs
                                    </h3>
                                    <div className="kpi-grid">
                                        <div className="kpi-item">
                                            <p>Total Sent</p>
                                            <p>{kpisToDisplay.totalSent}</p>
                                        </div>
                                        <div className="kpi-item">
                                            <p>Open Rate</p>
                                            <p className="green-text">{kpisToDisplay.openRate}%</p>
                                        </div>
                                        <div className="kpi-item">
                                            <p>CTR</p>
                                            <p className="indigo-text">{kpisToDisplay.ctr}%</p>
                                        </div>
                                        <div className="kpi-item">
                                            <p>Reply Rate</p>
                                            <p className="yellow-text">{kpisToDisplay.replyRate}%</p>
                                        </div>
                                        <div className="kpi-item">
                                            <p>Bounce Rate</p>
                                            <p className="red-text">{kpisToDisplay.bounceRate}%</p>
                                        </div>
                                    </div>
                                    <div className="best-subject-line-card">
                                        <p>Best-performing Subject Line</p>
                                        <p>{kpisToDisplay.bestPerformingSubjectLine || 'N/A'}</p>
                                        <p>
                                            (Based on highest open rate for available dummy data. For true A/B testing, subject line data needs to be tied to individual email interactions.)
                                        </p>
                                    </div>
                                </div>

                                {/* Time Series Line Chart: Engagement Over Time */}
                                {engagementChartData.length > 0 && (
                                    <div className="chart-container">
                                        <h3 className="chart-title">
                                            📈 Engagement Over Time {selectedCampaignId ? `for ${selectedCampaignName}` : ''}
                                        </h3>
                                        {/* Date Range Controls */}
                                        <div className="chart-controls-date-range">
                                            <div className="date-inputs">
                                                <label htmlFor="start-date" className="text-gray-300">From:</label>
                                                <input
                                                    type="date"
                                                    id="start-date"
                                                    value={startDate}
                                                    onChange={(e) => {
                                                        setStartDate(e.target.value);
                                                        setSelectedDateRangeOption('custom');
                                                    }}
                                                    className="date-input-field"
                                                />
                                                <label htmlFor="end-date" className="text-gray-300">To:</label>
                                                <input
                                                    type="date"
                                                    id="end-date"
                                                    value={endDate}
                                                    onChange={(e) => {
                                                        setEndDate(e.target.value);
                                                        setSelectedDateRangeOption('custom');
                                                    }}
                                                    className="date-input-field"
                                                />
                                            </div>
                                            <div className="predefined-ranges">
                                                <label htmlFor="date-range-select" className="text-gray-300">Quick Select:</label>
                                                <select
                                                    id="date-range-select"
                                                    value={selectedDateRangeOption}
                                                    onChange={(e) => setSelectedDateRangeOption(e.target.value)}
                                                    className="select-field"
                                                >
                                                    <option value="all-time">All Time</option>
                                                    <option value="last-15-days">Last 15 Days</option>
                                                    <option value="last-month">Last Month</option>
                                                    <option value="last-3-months">Last 3 Months</option>
                                                    <option value="last-6-months">Last 6 Months</option>
                                                    <option value="last-year">Last Year</option>
                                                    <option value="custom">Custom Range</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Chart Line Visibility Controls */}
                                        <div className="chart-controls">
                                            <label className="chart-control-item">
                                                <input
                                                    type="checkbox"
                                                    checked={showOpened}
                                                    onChange={() => setShowOpened(!showOpened)}
                                                />
                                                Emails Opened
                                            </label>
                                            <label className="chart-control-item">
                                                <input
                                                    type="checkbox"
                                                    checked={showClicked}
                                                    onChange={() => setShowClicked(!showClicked)}
                                                />
                                                Emails Clicked
                                            </label>
                                            <label className="chart-control-item">
                                                <input
                                                    type="checkbox"
                                                    checked={showReplied}
                                                    onChange={() => setShowReplied(!showReplied)}
                                                />
                                                Emails Replied
                                            </label>
                                        </div>
                                        <div style={{ width: '100%', height: 300 }}>
                                            {renderSvgLineChart(engagementChartData)}
                                        </div>
                                        <p className="chart-description">
                                            Daily breakdown of opened, clicked, and replied emails. Click on the chart to see details for a specific day.
                                        </p>
                                    </div>
                                )}


                                {selectedCampaignId ? (
                                    <div className="grid-container">
                                        {/* Who Opened Card */}
                                        <div className="kpi-card opened">
                                            <h3>
                                                📧 Who Opened
                                            </h3>
                                            <p>{openedEmails.length}</p>
                                            <button
                                                onClick={() => {
                                                    setDisplayedDetails(openedEmails);
                                                    setDisplayedDetailsTitle('Who Opened');
                                                }}
                                            >
                                                View Details
                                            </button>
                                        </div>

                                        {/* Who Clicked Card */}
                                        <div className="kpi-card clicked">
                                            <h3>
                                                👆 Who Clicked
                                            </h3>
                                            <p>{clickedEmails.length}</p>
                                            <button
                                                onClick={() => {
                                                    setDisplayedDetails(clickedEmails);
                                                    setDisplayedDetailsTitle('Who Clicked');
                                                }}
                                            >
                                                View Details
                                            </button>
                                        </div>

                                        {/* Who Received Card */}
                                        <div className="kpi-card received">
                                            <h3>
                                                📥 Who Received
                                            </h3>
                                            <p>{receivedEmails.length}</p>
                                            <button
                                                onClick={() => {
                                                    setDisplayedDetails(receivedEmails);
                                                    setDisplayedDetailsTitle('Who Received');
                                                }}
                                            >
                                                View Details
                                            </button>
                                        </div>

                                        {/* Who Replied Card */}
                                        <div className="kpi-card replied">
                                            <h3>
                                                ↩️ Who Replied
                                            </h3>
                                            <p>{repliedEmails.length}</p>
                                            <button
                                                onClick={() => {
                                                    setDisplayedDetails(repliedEmails);
                                                    setDisplayedDetailsTitle('Who Replied');
                                                }}
                                            >
                                                View Details
                                            </button>
                                        </div>

                                        {/* Which Bounced Card */}
                                        <div className="kpi-card bounced">
                                            <h3>
                                                🚫 Which Bounced
                                            </h3>
                                            <p>{bouncedEmails.length}</p>
                                            <button
                                                onClick={() => {
                                                    setDisplayedDetails(bouncedEmails);
                                                    setDisplayedDetailsTitle('Which Bounced');
                                                }}
                                            >
                                                View Details
                                            </button>
                                        </div>

                                        {/* Total Mails Sent Card */}
                                        <div className="kpi-card sent">
                                            <h3>
                                                ✉️ Total Mails Sent
                                            </h3>
                                            <p>{receivedEmails.length}</p>
                                            <button
                                                onClick={() => {
                                                    setDisplayedDetails(receivedEmails);
                                                    setDisplayedDetailsTitle('Total Mails Sent');
                                                }}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="no-campaign-selected">Please select a campaign from the dropdown above to view detailed analytics, or view overall KPIs.</p>
                                )}


                                {/* Dynamic Details Table */}
                                {displayedDetails.length > 0 && (
                                    <div className="details-table-wrapper">
                                        {renderDetailsTable(displayedDetails, displayedDetailsTitle)}
                                    </div>
                                )}

                            </div>
                        )}

                        {/* AB Testing Tab Content */}
                        {activeTab === 'ab-testing' && (
                            <div id="ab-testing" className="tab-pane">
                                <h2 className="section-title">AB Testing</h2>
                                <p className="section-description">
                                    Test variations within campaigns to optimize performance. Experiment with different subject lines,
                                    call-to-actions, email content, and send times to discover what resonates best with your audience.
                                </p>
                                {/* AB Testing content */}
                                <div className="ab-testing-card">
                                    <h3>What you can A/B Test:</h3>
                                    <ul>
                                        <li>Subject Lines</li>
                                        <li>Email Content (body text, images, layout)</li>
                                        <li>Call-to-Action (CTA) buttons</li>
                                        <li>Send Times and Days</li>
                                        <li>Sender Name</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <footer className="footer">
                <div className="footer-content">
                    &copy; 2024 Campaign Management Dashboard. All rights reserved.
                </div>
            </footer>
            <div className={getMessageBoxClasses()}>{message.text}</div>
        </div>
    );
}



function CampaignManager() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/campaigns');
        if (!res.ok) throw new Error('Failed to fetch campaigns');
        const data = await res.json();
        setCampaigns(data);
      } catch (err) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  if (loading) return <div>Loading campaigns...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <h2>Email Campaigns</h2>
      {campaigns.length === 0 ? (
        <p>No campaigns found.</p>
      ) : (
        <ul style={{ paddingLeft: 0 }}>
          {campaigns.map(camp => (
            <li key={camp.id} style={{ listStyle: 'none', marginBottom: 20, padding: 16, border: '1px solid #ccc', borderRadius: 6 }}>
              <h3>{camp.campaignName}</h3>
              <p><strong>Subject:</strong> {camp.subjectLine}</p>
              <p><strong>Interactions:</strong></p>
              <ul>
                {camp.interactions.map((i, idx) => (
                  <li key={idx}>
                    [{i.timestamp.split('T')[0]}] {i.email} - <strong>{i.type}</strong>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


// Main App component now renders the CampaignManagementApi component
function App() {
    // We'll use a static dummy user ID since Firebase is no longer the data source for campaigns
    const [userId] = useState('DummyUser123');

    return (
        <CampaignManagementApi userId={userId} />
    );
}

// Main BulkSchedulingSection Component
function BulkSchedulingSection() {
  const [offers, setOffers] = React.useState([]);
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [schedulers, setSchedulers] = React.useState([
    { url: '', startDate: '', endDate: '', startTime: '', endTime: '' }
  ]);
  const [schedules, setSchedules] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [viewOfferId, setViewOfferId] = React.useState(null); // Offer being viewed
  const [editScheduleId, setEditScheduleId] = React.useState(null); // Schedule being edited
  const [editFields, setEditFields] = React.useState({ url: '', startDate: '', endDate: '', startTime: '', endTime: '' });
  const [message, setMessage] = React.useState({ text: '', type: '' }); // For status/error messages

  // Fetch offers and schedules on component mount
  React.useEffect(() => {
    fetch('http://localhost:5000/api/fetch-history')
      .then(res => res.json())
      .then(data => {
        const allOffers = flattenOffers(data);
        const uniqueOffers = Array.from(
          new Map(
            allOffers
              .filter(offer => {
                const id = offer.id || offer.offer_id || offer._id;
                return id && !isNaN(Number(id));
              })
              .map(offer => [offer.id || offer.offer_id || offer._id, offer])
          ).values()
        );
        setOffers(uniqueOffers);
      })
      .catch(err => showMessage('Failed to fetch offers.', 'error'));

    fetch('http://localhost:5000/api/schedules')
      .then(res => res.json())
      .then(setSchedules)
      .catch(err => showMessage('Failed to fetch schedules.', 'error'));
  }, []);

  // Helper function to display messages
  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000); // Hide after 4 seconds
  };

  // Select/deselect offers
  const toggleOffer = id => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelectedIds(offers.map(o => o.id || o.offer_id || o._id));
  const deselectAll = () => setSelectedIds([]);

  // Scheduler row handlers
  const addScheduler = () => setSchedulers(prev => [...prev, { url: '', startDate: '', endDate: '', startTime: '', endTime: '' }]);
  const removeScheduler = idx => setSchedulers(prev => prev.filter((_, i) => i !== idx));
  const updateScheduler = (idx, field, value) => setSchedulers(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  // Apply all scheduler rows to all selected offers
  const applySchedule = async () => {
    setLoading(true);
    showMessage(''); // Clear previous messages
    try {
      if (selectedIds.length === 0) {
        showMessage('Please select at least one offer to apply schedules.', 'warning');
        setLoading(false);
        return;
      }
      for (const scheduler of schedulers) {
        if (!scheduler.url || !scheduler.startDate || !scheduler.endDate || !scheduler.startTime || !scheduler.endTime) {
          showMessage('All scheduler fields must be filled for each entry.', 'error');
          setLoading(false);
          return;
        }
        await fetch('http://localhost:5000/api/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            offerIds: selectedIds,
            url: scheduler.url,
            startDate: scheduler.startDate,
            endDate: scheduler.endDate,
            startTime: scheduler.startTime,
            endTime: scheduler.endTime
          })
        });
      }
      // Refresh schedules
      fetch('http://localhost:5000/api/schedules')
        .then(res => res.json())
        .then(setSchedules);
      showMessage('Schedules applied successfully!', 'success');
    } catch (err) {
      showMessage('Failed to apply schedules. Please try again.', 'error');
      console.error('Apply Schedule Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get schedule count for an offer
  const getScheduleCount = offerId => schedules.filter(s => String(s.offerId) === String(offerId)).length;

  // Helper to get message box classes
  const getMessageBoxClasses = () => {
    let classes = "message-box";
    if (message.text === '') {
      classes += ' hidden';
    } else if (message.type === 'error') {
      classes += ' error-message';
    } else if (message.type === 'success') {
      classes += ' success-message';
    } else if (message.type === 'warning') {
      classes += ' warning-message';
    } else {
      classes += ' info-message';
    }
    return classes;
  };

  return (
    <div className="bulk-scheduling-container">
      {/* Basic Styles for the component */}
      <style>
        {`
        .bulk-scheduling-container {
          padding: 24px;
          background-color: #1a202c; /* Dark background */
          color: #edf2f7; /* Light text */
          font-family: 'Inter', Arial, sans-serif; /* Modern font */
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .section-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 24px;
          color: #63b3ed; /* Primary blue */
          text-align: center;
        }

        .scheduler-inputs-section {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .scheduler-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          background-color: #2d3748; /* Darker input background */
          padding: 12px;
          border-radius: 8px;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .scheduler-row input {
          flex: 1;
          min-width: 120px; /* Ensure inputs don't get too small */
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #4a5568; /* Gray-700 */
          background-color: #1a202c; /* Even darker for inputs */
          color: #edf2f7;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .scheduler-row input:focus {
          border-color: #4299e1; /* Blue-500 */
          box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5);
        }

        .button {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: background-color 0.2s, opacity 0.2s, transform 0.1s;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        .button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
        }
        .button:active:not(:disabled) {
          transform: translateY(0);
        }
        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .button-add-entry {
          background-color: #4299e1; /* Blue-500 */
          align-self: flex-start;
          margin-top: 8px;
        }
        .button-add-entry:hover:not(:disabled) {
          background-color: #3182ce; /* Blue-600 */
        }

        .button-remove {
          background-color: #e53e3e; /* Red-600 */
          padding: 8px 16px;
          font-size: 14px;
          align-self: center; /* Align with inputs */
        }
        .button-remove:hover:not(:disabled) {
          background-color: #c53030; /* Red-700 */
        }

        .action-buttons-group {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 32px;
          justify-content: center;
        }

        .button-apply {
          background-color: #38a169; /* Green-600 */
        }
        .button-apply:hover:not(:disabled) {
          background-color: #2f855a; /* Green-700 */
        }

        .button-select-all, .button-deselect-all {
          background-color: #4a5568; /* Gray-700 */
        }
        .button-select-all:hover:not(:disabled), .button-deselect-all:hover:not(:disabled) {
          background-color: #2d3748; /* Gray-800 */
        }

        .offers-table-container {
          overflow-x: auto;
          border-radius: 14px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
          background: #181c24; /* Darker background for table */
          border: 1px solid #2d3748;
        }

        .offers-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          color: #fff;
          font-size: 15px;
          min-width: 900px; /* Ensures horizontal scroll on smaller screens */
        }

        .offers-table th, .offers-table td {
          padding: 12px 10px;
          text-align: left;
          border-bottom: 1px solid #2d3748; /* Darker border */
        }

        .offers-table thead {
          background: #23263a; /* Header background */
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .offers-table th:first-child { border-top-left-radius: 14px; }
        .offers-table th:last-child { border-top-right-radius: 14px; }

        .offers-table tbody tr {
          transition: background-color 0.2s;
        }
        .offers-table tbody tr:nth-child(even) { background-color: #1a202c; } /* Even row background */
        .offers-table tbody tr:nth-child(odd) { background-color: #181c24; } /* Odd row background */
        .offers-table tbody tr:hover { background-color: #2d3748; } /* Hover effect */

        .offer-checkbox {
          width: 20px;
          height: 20px;
          accent-color: #4299e1; /* Blue-500 */
          border-radius: 4px;
          cursor: pointer;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        .offer-checkbox:checked {
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.4);
        }

        .offer-image {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 50%;
          border: 2px solid #4299e1; /* Blue border */
        }

        .no-image-text {
          color: #a0aec0;
          font-size: 13px;
          font-style: italic;
        }

        .offer-link {
          color: #63b3ed; /* Blue-400 */
          text-decoration: underline;
          transition: color 0.2s;
        }
        .offer-link:hover {
          color: #4299e1; /* Blue-500 */
        }

        .scheduling-status {
          display: inline-block;
          background: #1976d2; /* Default blue for scheduled */
          color: #fff;
          border-radius: 18px;
          padding: 6px 16px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: background 0.2s, box-shadow 0.2s;
        }
        .scheduling-status.active {
          background: #38a169; /* Green for active */
          box-shadow: 0 2px 8px rgba(56, 161, 105, 0.4);
        }

        .active-now-badge {
          margin-left: 8px;
          font-size: 12px;
          background: #fff;
          color: #38a169;
          border-radius: 10px;
          padding: 2px 8px;
          font-weight: 600;
        }

        .view-schedules-button {
          margin-left: 10px;
          background: #4a5568; /* Gray-700 */
          color: #63b3ed; /* Blue-400 */
          border: none;
          border-radius: 6px;
          padding: 6px 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        }
        .view-schedules-button:hover {
          background: #2d3748; /* Gray-800 */
          color: #4299e1; /* Blue-500 */
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.8); /* Darker overlay */
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.3s ease-out;
        }

        .modal-content {
          background-color: #23263a; /* Modal background */
          color: #fff;
          border-radius: 18px;
          padding: 36px;
          min-width: 420px;
          max-width: 700px; /* Increased max-width for better table display */
          width: 100%;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);
          position: relative;
          font-family: 'Inter', Arial, sans-serif;
          animation: scaleIn 0.3s ease-out;
        }

        .modal-close-button {
          position: absolute;
          top: 18px;
          right: 18px;
          background: none;
          border: none;
          color: #a0aec0; /* Gray-400 */
          font-size: 32px; /* Larger close button */
          cursor: pointer;
          font-weight: 700;
          opacity: 0.7;
          transition: opacity 0.2s, color 0.2s;
        }
        .modal-close-button:hover {
          opacity: 1;
          color: #fff;
        }

        .modal-header-title {
          margin: 0;
          margin-bottom: 24px;
          font-weight: 700;
          font-size: 28px;
          letter-spacing: 0.5px;
          color: #63b3ed; /* Primary blue for modal title */
        }
        .modal-header-title span {
          color: #90cdf4; /* Lighter blue for offer ID */
        }

        .no-schedules-text {
          color: #a0aec0;
          font-size: 16px;
          margin: 24px 0;
          text-align: center;
        }

        .modal-table-container {
          width: 100%;
          font-size: 15px;
          margin-top: 20px; /* More space from title */
          border-radius: 12px;
          overflow: hidden;
          background: #181c24; /* Darker table background */
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
          border: 1px solid #2d3748;
        }

        .modal-table {
          width: 100%;
          border-collapse: collapse;
        }

        .modal-table thead {
          background: #2d3748; /* Modal table header background */
        }
        .modal-table th {
          padding: 10px 8px;
          text-align: left;
          color: #a0aec0;
          font-weight: 600;
        }

        .modal-table tbody tr {
          border-bottom: 1px solid #2d3748;
          transition: background-color 0.2s;
        }
        .modal-table tbody tr:nth-child(even) { background-color: #1a202c; }
        .modal-table tbody tr:nth-child(odd) { background-color: #181c24; }
        .modal-table tbody tr.editing-row { background-color: #3d4a5c; } /* Highlight editing row */
        .modal-table tbody tr:hover:not(.editing-row) { background-color: #2d3748; }

        .modal-table td {
          padding: 10px 8px;
          vertical-align: middle;
        }

        .modal-table-link {
          color: #90cdf4;
          text-decoration: underline;
          transition: color 0.2s;
          display: block;
          max-width: 150px; /* Constrain URL width */
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .modal-table-link:hover {
          color: #63b3ed;
        }

        .modal-input-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .modal-table-input {
          width: 100%;
          padding: 6px;
          border-radius: 6px;
          border: 1px solid #4a5568;
          background-color: #1a202c;
          color: #fff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .modal-table-input:focus {
          border-color: #4299e1;
          box-shadow: 0 0 0 1px rgba(66, 153, 225, 0.3);
        }

        .modal-status-badge {
          display: inline-block;
          background: #718096; /* Gray for inactive */
          color: #fff;
          border-radius: 12px;
          padding: 4px 12px;
          font-weight: 600;
          font-size: 13px;
        }
        .modal-status-badge.active {
          background: #38a169; /* Green for active */
        }

        .modal-action-buttons {
          display: flex;
          gap: 8px;
        }

        .modal-action-button {
          padding: 6px 14px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: background-color 0.2s, transform 0.1s;
          color: #fff;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        }
        .modal-action-button:hover {
          transform: translateY(-1px);
        }
        .modal-action-button:active {
          transform: translateY(0);
        }

        .modal-action-button.save {
          background-color: #3182ce; /* Blue for save */
        }
        .modal-action-button.save:hover {
          background-color: #2b6cb0;
        }

        .modal-action-button.cancel {
          background-color: #718096; /* Gray for cancel */
        }
        .modal-action-button.cancel:hover {
          background-color: #555c69;
        }

        .modal-action-button.edit {
          background-color: #3182ce; /* Blue for edit */
          font-size: 18px; /* Emoji size */
        }
        .modal-action-button.edit:hover {
          background-color: #2b6cb0;
        }

        .modal-action-button.delete {
          background-color: #e53e3e; /* Red for delete */
          font-size: 18px; /* Emoji size */
        }
        .modal-action-button.delete:hover {
          background-color: #c53030;
        }

        .message-box {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          color: #fff;
          z-index: 1001;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          opacity: 1;
          transition: opacity 0.3s ease-in-out;
        }
        .message-box.hidden {
          opacity: 0;
          pointer-events: none; /* Disable interaction when hidden */
        }
        .message-box.info-message {
          background-color: #4299e1; /* Blue */
        }
        .message-box.success-message {
          background-color: #38a169; /* Green */
        }
        .message-box.error-message {
          background-color: #e53e3e; /* Red */
        }
        .message-box.warning-message {
          background-color: #ecc94b; /* Yellow */
          color: #333;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
          to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .bulk-scheduling-container {
            padding: 16px;
          }
          .section-title {
            font-size: 24px;
          }
          .scheduler-row {
            flex-direction: column;
            align-items: stretch;
          }
          .scheduler-row input {
            width: 100%;
            min-width: unset;
          }
          .button-remove {
            width: 100%;
            margin-top: 8px;
          }
          .action-buttons-group {
            flex-direction: column;
            gap: 12px;
          }
          .button {
            width: 100%;
          }
          .offers-table {
            min-width: 600px; /* Still allow some horizontal scroll for small screens */
          }
          .modal-content {
            min-width: unset;
            padding: 24px;
            margin: 0 10px;
          }
          .modal-table th, .modal-table td {
            padding: 8px 6px;
            font-size: 13px;
          }
          .modal-table-link {
            max-width: 100px;
          }
          .modal-table-input {
            width: 90%;
          }
          .modal-action-button {
            padding: 4px 10px;
            font-size: 12px;
          }
          .modal-action-button.edit, .modal-action-button.delete {
            font-size: 16px;
          }
        }
        `}
      </style>

      <h1 className="section-title">Bulk Offer Scheduling</h1>

      {/* Scheduler Inputs Section */}
      <div className="scheduler-inputs-section">
        {schedulers.map((scheduler, idx) => (
          <div key={idx} className="scheduler-row">
            <input
              placeholder="https://example.com"
              value={scheduler.url}
              onChange={e => updateScheduler(idx, 'url', e.target.value)}
              type="url"
            />
            <input
              type="time"
              value={scheduler.startTime}
              onChange={e => updateScheduler(idx, 'startTime', e.target.value)}
            />
            <input
              type="time"
              value={scheduler.endTime}
              onChange={e => updateScheduler(idx, 'endTime', e.target.value)}
            />
            <input
              type="date"
              value={scheduler.startDate}
              onChange={e => updateScheduler(idx, 'startDate', e.target.value)}
            />
            <input
              type="date"
              value={scheduler.endDate}
              onChange={e => updateScheduler(idx, 'endDate', e.target.value)}
            />
            {schedulers.length > 1 && (
              <button
                onClick={() => removeScheduler(idx)}
                className="button button-remove"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button onClick={addScheduler} className="button button-add-entry">
          + Add More Entries
        </button>
      </div>

      {/* Action Buttons Group */}
      <div className="action-buttons-group">
        <button
          onClick={applySchedule}
          disabled={loading || selectedIds.length === 0 || schedulers.some(s => !s.url || !s.startDate || !s.endDate || !s.startTime || !s.endTime)}
          className="button button-apply"
        >
          {loading ? 'Applying...' : 'Apply to Selected'}
        </button>
        <button onClick={selectAll} className="button button-select-all">
          Select All
        </button>
        <button onClick={deselectAll} className="button button-deselect-all">
          Deselect All
        </button>
      </div>

      {/* Offers Table */}
      <div className="offers-table-container">
        <table className="offers-table">
          <thead>
            <tr>
              <th> </th>
              <th>Row ID</th>
              <th>Offer Name</th>
              <th>Offer ID</th>
              <th>Image</th>
              <th>Target URL</th>
              <th>Scheduling</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer, idx) => {
              const id = offer.id || offer.offer_id || offer._id;
              const hasActive = schedules.some(s => String(s.offerId) === String(id) && (() => {
                const now = new Date();
                const start = new Date(`${s.startDate}T${s.startTime}`);
                const end = new Date(`${s.endDate}T${s.endTime}`);
                return now >= start && now <= end;
              })());
              return (
                <tr key={id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(id)}
                      onChange={() => toggleOffer(id)}
                      className="offer-checkbox"
                    />
                  </td>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{offer.title || id}</td>
                  <td>{id}</td>
                  <td>
                    {offer.image
                      ? <img src={offer.image} alt="" className="offer-image" />
                      : <span className="no-image-text">No Image</span>}
                  </td>
                  <td>
                    {/* Changed: Link in Offers Table to masked URL */}
                    <a href={`http://localhost:5000/go/${id}`} target="_blank" rel="noopener noreferrer" className="offer-link">
                      {`localhost:5000/go/${id}`} {/* Display the masked URL */}
                    </a>
                  </td>
                  <td>
                    <span
                      className={`scheduling-status ${hasActive ? 'active' : ''}`}
                      title={hasActive ? 'At least one schedule is active now' : 'No active schedule'}>
                      {getScheduleCount(id)} Scheduled
                      {hasActive && <span className="active-now-badge">Active Now</span>}
                    </span>
                    {getScheduleCount(id) > 0 && (
                      <button onClick={() => setViewOfferId(id)} className="view-schedules-button">
                        View
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Schedule Details Modal */}
      {viewOfferId && (
        <div
          className="modal-overlay"
          onClick={() => { setViewOfferId(null); setEditScheduleId(null); showMessage(''); }}
        >
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { setViewOfferId(null); setEditScheduleId(null); showMessage(''); }}
              className="modal-close-button"
              title="Close"
            >
              &times;
            </button>
            <h2 className="modal-header-title">
              Schedules for Offer <span className="text-blue-400">{viewOfferId}</span>
            </h2>

            {schedules.filter(s => String(s.offerId) === String(viewOfferId)).length === 0 && (
              <div className="no-schedules-text">No schedules found for this offer.</div>
            )}

            <div className="modal-table-container">
              <table className="modal-table">
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.filter(s => String(s.offerId) === String(viewOfferId)).map((s, idx) => {
                    const isActive = (() => {
                      const now = new Date();
                      const start = new Date(`${s.startDate}T${s.startTime}`);
                      const end = new Date(`${s.endDate}T${s.endTime}`);
                      return now >= start && now <= end;
                    })();
                    return (
                      <tr key={s.id} className={editScheduleId === s.id ? 'editing-row' : ''}>
                        <td>
                          {editScheduleId === s.id ? (
                            <input
                              value={editFields.url}
                              onChange={e => setEditFields(f => ({ ...f, url: e.target.value }))}
                              className="modal-table-input"
                              type="url"
                            />
                          ) : (
                            // Changed: Link in Modal Table to masked URL
                            <a href={`http://localhost:5000/go/${s.offerId}`} target="_blank" rel="noopener noreferrer" className="modal-table-link">
                              {`localhost:5000/go/${s.offerId}`} {/* Display the masked URL */}
                            </a>
                          )}
                        </td>
                        <td>
                          {editScheduleId === s.id ? (
                            <div className="modal-input-group">
                              <input type="date" value={editFields.startDate} onChange={e => setEditFields(f => ({ ...f, startDate: e.target.value }))} className="modal-table-input" />
                              <input type="time" value={editFields.startTime} onChange={e => setEditFields(f => ({ ...f, startTime: e.target.value }))} className="modal-table-input" />
                            </div>
                          ) : (
                            <span>{s.startDate} <span style={{ color: '#90cdf4' }}>{s.startTime}</span></span>
                          )}
                        </td>
                        <td>
                          {editScheduleId === s.id ? (
                            <div className="modal-input-group">
                              <input type="date" value={editFields.endDate} onChange={e => setEditFields(f => ({ ...f, endDate: e.target.value }))} className="modal-table-input" />
                              <input type="time" value={editFields.endTime} onChange={e => setEditFields(f => ({ ...f, endTime: e.target.value }))} className="modal-table-input" />
                            </div>
                          ) : (
                            <span>{s.endDate} <span style={{ color: '#90cdf4' }}>{s.endTime}</span></span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`modal-status-badge ${isActive ? 'active' : ''}`}
                          >
                            {isActive ? 'Active Now' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {editScheduleId === s.id ? (
                            <div className="modal-action-buttons">
                              <button
                                onClick={async () => {
                                  // Validation: check for overlap
                                  const overlap = schedules.some(other =>
                                    other.id !== s.id &&
                                    String(other.offerId) === String(viewOfferId) &&
                                    !(
                                      editFields.endDate < other.startDate ||
                                      editFields.startDate > other.endDate ||
                                      (editFields.endDate === other.startDate && editFields.endTime <= other.startTime) ||
                                      (editFields.startDate === other.endDate && editFields.startTime >= other.endTime)
                                    )
                                  );
                                  if (!editFields.url || !editFields.startDate || !editFields.endDate || !editFields.startTime || !editFields.endTime) {
                                    showMessage('All fields required for editing.', 'error');
                                    return;
                                  }
                                  if (overlap) {
                                    showMessage('Schedule overlaps with another existing schedule for this offer.', 'error');
                                    return;
                                  }
                                  showMessage(''); // Clear previous error
                                  try {
                                    await fetch(`http://localhost:5000/api/schedules/${s.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(editFields)
                                    });
                                    fetch('http://localhost:5000/api/schedules')
                                      .then(res => res.json())
                                      .then(setSchedules);
                                    setEditScheduleId(null);
                                    showMessage('Schedule updated successfully!', 'success');
                                  } catch (err) {
                                    showMessage('Failed to update schedule. Please try again.', 'error');
                                    console.error('Update Schedule Error:', err);
                                  }
                                }}
                                className="modal-action-button save"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => { setEditScheduleId(null); showMessage(''); }}
                                className="modal-action-button cancel"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="modal-action-buttons">
                              <button
                                onClick={() => { setEditScheduleId(s.id); setEditFields({ url: s.url, startDate: s.startDate, endDate: s.endDate, startTime: s.startTime, endTime: s.endTime }); }}
                                className="modal-action-button edit"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await fetch(`http://localhost:5000/api/schedules/${s.id}`, { method: 'DELETE' });
                                    fetch('http://localhost:5000/api/schedules')
                                      .then(res => res.json())
                                      .then(setSchedules);
                                    showMessage('Schedule deleted successfully!', 'success');
                                  } catch (err) {
                                    showMessage('Failed to delete schedule. Please try again.', 'error');
                                    console.error('Delete Schedule Error:', err);
                                  }
                                }}
                                className="modal-action-button delete"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Message Box */}
      <div className={getMessageBoxClasses()}>{message.text}</div>
    </div>
  );
}



// function ScreenshotOfferExtractor({ onAddToHome }) {
//   const [image, setImage] = useState(null);
//   const [results, setResults] = useState([]); // Each result is a string from one slice
//   const [loading, setLoading] = useState(false);
//   const [numSlices, setNumSlices] = useState(6);
//   const [selected, setSelected] = useState([]); // Holds indices of selected OCR slices
//   const [tableData, setTableData] = useState([]);

//   // Upload image
//   const handleImageUpload = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       const imgUrl = URL.createObjectURL(file);
//       setImage(imgUrl);
//       setResults([]);
//       setSelected([]);
//     }
//   };

//   // OCR logic
//   const handleOCR = async () => {
//     if (!image) return;
//     setLoading(true);
//     const img = new Image();
//     img.src = image;

//     img.onload = async () => {
//       const sliceHeight = img.height / numSlices;
//       const canvas = document.createElement("canvas");
//       canvas.width = img.width;
//       canvas.height = sliceHeight;
//       const ctx = canvas.getContext("2d");

//       const slices = [];

//       for (let i = 0; i < numSlices; i++) {
//         ctx.clearRect(0, 0, canvas.width, canvas.height);
//         ctx.drawImage(
//           img,
//           0,
//           i * sliceHeight,
//           img.width,
//           sliceHeight,
//           0,
//           0,
//           img.width,
//           sliceHeight
//         );
//         const dataUrl = canvas.toDataURL("image/png");
//         slices.push(dataUrl);
//       }

//       const ocrResults = [];

//       for (let i = 0; i < slices.length; i++) {
//         const result = await Tesseract.recognize(slices[i], "eng", {
//           logger: (m) => console.log(`Slice ${i + 1} Progress:`, m),
//         });
//         ocrResults.push(result.data.text.trim());
//       }

//       setResults(ocrResults);
//       setOcrOffers(ocrResults); // Store OCR results for later use
//       setSelected([]); // Reset selection after OCR
//       console.log("OCR Results:", ocrResults);
//       alert("OCR completed! You can now select offers to add to Home.");
//       setLoading(false);
//     };
//   };

//   // Handle checkbox selection
//   const toggleSelect = (index) => {
//     setSelected((prev) =>
//       prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
//     );
//   };
//   const [ocrOffers, setOcrOffers] = useState([]); // ✅ Not null or undefined
  
//   // Send selected offers to parent
//   const handleAddSelected = async () => {
//   const selectedOffers = selected.map((idx) => ocrOffers[idx]);

//   for (const ocrText of selectedOffers) {
//     await fetch('http://localhost:5000/api/games', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         title: ocrText.slice(0, 40), // Use first 40 chars as title
//         genre: '',
//         rating: '',
//         image: '',
//         link: '',
//       }),
//     });
//   }

//   alert('Selected OCR offers have been added to games.json! Go to Home to see them.');
// };

    
    

//   return (
//     <div style={{ textAlign: "center", padding: 20 }}>
//       <h2>📸 Image Slicer & OCR Extractor</h2>

//       <input type="file" accept="image/*" onChange={handleImageUpload} />

//       <div style={{ marginTop: 10 }}>
//         <label style={{ color: "#ccc" }}>Number of Rows:</label>
//         <input
//           type="number"
//           min={1}
//           max={20}
//           value={numSlices}
//           onChange={(e) => setNumSlices(Number(e.target.value))}
//           style={{ width: 60, marginLeft: 10 }}
//         />
//       </div>

//       {image && (
//         <div>
//           <img
//             src={image}
//             alt="Uploaded"
//             style={{ maxWidth: "100%", marginTop: 20 }}
//           />
//           <button onClick={handleOCR} style={{ marginTop: 20 }}>
//             ▶️ Run OCR on Slices
//           </button>
//         </div>
//       )}

//       {loading && <p>⏳ Processing OCR...</p>}

//       {results.length > 0 && (
//         <div style={{ marginTop: 20 }}>
//           <h3 style={{ color: "#aaa" }}>Extracted Offers:</h3>

//           <button
//             onClick={handleAddSelected}
//             disabled={selected.length === 0}
//             style={{
//               marginBottom: 10,
//               padding: "8px 16px",
//               backgroundColor: "#4caf50",
//               color: "#fff",
//               border: "none",
//               borderRadius: 5,
//               cursor: "pointer",
//             }}
//           >
//             ➕ Add Selected to Home
//           </button>

//           {results.map((text, idx) => (
//             <div
//               key={idx}
//               style={{
//                 border: "1px solid #444",
//                 padding: 10,
//                 marginBottom: 10,
//                 backgroundColor: "#1e1e2f",
//                 color: "#fff",
//                 textAlign: "left",
//                 whiteSpace: "pre-wrap",
//               }}
//             >
//               <input
//                 type="checkbox"
//                 checked={selected.includes(idx)}
//                 onChange={() => toggleSelect(idx)}
//                 style={{ marginRight: 10 }}
//               />
//               <strong>Slice {idx + 1}:</strong>
//               <pre>{text}</pre>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }



function ScreenshotOfferExtractor({ onAddToHome }) {
  const [image, setImage] = useState(null);
  const [results, setResults] = useState([]); // Each result is a string from one slice
  const [loading, setLoading] = useState(false);
  const [numSlices, setNumSlices] = useState(6);
  const [selected, setSelected] = useState([]); // Holds indices of selected OCR slices
  const [tableData, setTableData] = useState([]);
  const [ocrOffers, setOcrOffers] = useState([]);

  // Upload image
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imgUrl = URL.createObjectURL(file);
      setImage(imgUrl);
      setResults([]);
      setSelected([]);
      setTableData([]);
      setOcrOffers([]);
    }
  };

  // escape regex helper
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Improved parsing helper (keeps your output keys)
  const parseOfferText = (text) => {
    if (!text || !text.trim()) {
      return { id: "N/A", offer_name: "", payout: "N/A", payout_type: "N/A", country: "N/A" };
    }

    // Normalize common OCR artifacts
    let t = text
      .replace(/[_•—]+/g, " ")
      .replace(/[“”‘’]/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    // 1) Extract ID if it starts with digits (e.g. "6789 ...")
    let id = "N/A";
    const idMatch = t.match(/^\s*(\d{2,7})\b/);
    if (idMatch) id = idMatch[1];

    // 2) Find payout type (use global and case-insensitive)
    const payoutTypeRegex = /\b(CPA|CPL|CPS|CPM|REVSHARE|FREETRIAL|FREE TRIAL)\b/ig;
    const payoutTypeMatches = Array.from(t.matchAll(payoutTypeRegex));
    let payout_type = "";
    let payoutTypeIndex = -1;
    if (payoutTypeMatches.length > 0) {
      const m = payoutTypeMatches[payoutTypeMatches.length - 1];
      // m[1] capture group contains the type when group exists
      payout_type = (m[1] || m[0]).toUpperCase();
      payoutTypeIndex = typeof m.index === "number" ? m.index : -1;
    }

    // 3) Extract currency/payout amounts (all currencies supported: $, €, "0,65 €", etc.)
    const currencyRegex = /(\$\s?\d{1,6}(?:[.,]\d+)?|€\s?\d{1,6}(?:[.,]\d+)?|\d{1,6}(?:[.,]\d+)?\s?€)/g;
    const currencyMatches = Array.from(t.matchAll(currencyRegex));
    let payout = "N/A";
    let payoutIndex = -1;
    if (currencyMatches.length > 0) {
      if (payoutTypeIndex >= 0) {
        // pick the currency closest to the payout type
        let best = null;
        let bestDist = Infinity;
        for (const m of currencyMatches) {
          const dist = Math.abs(m.index - payoutTypeIndex);
          if (dist < bestDist) {
            bestDist = dist;
            best = m;
          }
        }
        payout = best ? best[0].replace(/\s+/g, "") : currencyMatches[currencyMatches.length - 1][0].replace(/\s+/g, "");
        payoutIndex = best ? best.index : currencyMatches[currencyMatches.length - 1].index;
      } else {
        // fallback: take the last currency found
        const last = currencyMatches[currencyMatches.length - 1];
        payout = last[0].replace(/\s+/g, "");
        payoutIndex = last.index;
      }
    }

    // 4) Offer name = substring after ID up to nearest of payout or payoutType
    let startOfferIndex = 0;
    if (id !== "N/A") {
      const idPos = t.indexOf(id);
      startOfferIndex = idPos >= 0 ? idPos + id.length : 0;
    }
    const endCandidates = [];
    if (payoutIndex >= 0) endCandidates.push(payoutIndex);
    if (payoutTypeIndex >= 0) endCandidates.push(payoutTypeIndex);
    const endOfferIndex = endCandidates.length > 0 ? Math.min(...endCandidates) : t.length;
    let offer_name = t.substring(startOfferIndex, endOfferIndex).replace(/^[\s\-\:\.\_]+|[\s\-\:\.\_]+$/g, "").trim();
    if (!offer_name) {
      // fallback to the whole text (minus id if present)
      offer_name = id !== "N/A" ? t.substring(startOfferIndex).trim() : t;
    }

    // 5) Country extraction: look for known country names first; otherwise take leading capitalized phrase from the remainder
    let remainderBase = Math.max(payoutIndex, payoutTypeIndex);
    if (remainderBase < 0) remainderBase = endOfferIndex;
    let remainder = t.substring(remainderBase).replace(/^[\s\-\:\.\_]+|[\s\-\:\.\_]+$/g, "").trim();

    const countriesList = [
      "United States",
      "United Kingdom",
      "France",
      "Germany",
      "Spain",
      "Italy",
      "Canada",
      "Australia",
      "Global",
      "UK",
      "US",
      "Netherlands",
      "Ireland",
    ];

    let country = "";
    for (const c of countriesList) {
      const idx = remainder.toLowerCase().indexOf(c.toLowerCase());
      if (idx >= 0) {
        const escapedC = escapeRegex(c);
        const m = remainder.match(new RegExp(`(New\\s+)?${escapedC}`, "i"));
        country = m ? m[0].trim() : c;
        break;
      }
    }

    if (!country) {
      // fallback: take a leading sequence of 1-4 capitalized words (likely "New United States" / "United States")
      const capMatch = remainder.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/);
      if (capMatch) country = capMatch[1].trim();
    }

    if (!country) country = "N/A";

    return {
      id: id === "N/A" ? "N/A" : id,
      offer_name: offer_name || "",
      payout: payout || "N/A",
      payout_type: payout_type || "N/A",
      country: country || "N/A",
    };
  };

  // OCR logic
  const handleOCR = async () => {
    if (!image) return;
    setLoading(true);
    const img = new Image();
    img.src = image;

    img.onload = async () => {
      const sliceHeight = img.height / numSlices;
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = sliceHeight;
      const ctx = canvas.getContext("2d");

      const slices = [];

      for (let i = 0; i < numSlices; i++) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          img,
          0,
          i * sliceHeight,
          img.width,
          sliceHeight,
          0,
          0,
          img.width,
          sliceHeight
        );
        const dataUrl = canvas.toDataURL("image/png");
        slices.push(dataUrl);
      }

      const ocrResults = [];
      const parsedData = [];

      for (let i = 0; i < slices.length; i++) {
        const result = await Tesseract.recognize(slices[i], "eng", {
          logger: (m) => console.log(`Slice ${i + 1} Progress:`, m),
        });
        const text = result.data.text.trim();
        ocrResults.push(text);
        parsedData.push(parseOfferText(text));
      }

      setResults(ocrResults);
      setOcrOffers(ocrResults); // Store OCR results for later use
      setTableData(parsedData);
      setSelected([]); // Reset selection after OCR
      console.log("OCR Results:", ocrResults);
      console.log("Parsed Table Data:", parsedData);
      alert("OCR completed! You can now select offers to add to Home.");
      setLoading(false);
    };
  };

  // Handle checkbox selection
  const toggleSelect = (index) => {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Send selected offers to parent
  const handleAddSelected = async () => {
    const selectedOffers = selected.map((idx) => ocrOffers[idx]);

    for (const ocrText of selectedOffers) {
      await fetch("http://localhost:5000/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ocrText.slice(0, 40),
          genre: "",
          rating: "",
          image: "",
          link: "",
        }),
      });
    }

    alert("Selected OCR offers have been added to games.json! Go to Home to see them.");
  };

  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <h2>📸 Image Slicer & OCR Extractor</h2>

      <input type="file" accept="image/*" onChange={handleImageUpload} />

      <div style={{ marginTop: 10 }}>
        <label style={{ color: "#ccc" }}>Number of Rows:</label>
        <input
          type="number"
          min={1}
          max={20}
          value={numSlices}
          onChange={(e) => setNumSlices(Number(e.target.value))}
          style={{ width: 60, marginLeft: 10 }}
        />
      </div>

      {image && (
        <div>
          <img
            src={image}
            alt="Uploaded"
            style={{ maxWidth: "100%", marginTop: 20 }}
          />
          <button onClick={handleOCR} style={{ marginTop: 20 }}>
            ▶️ Run OCR on Slices
          </button>
        </div>
      )}

      {loading && <p>⏳ Processing OCR...</p>}

      {tableData.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ color: "#aaa" }}>Extracted Offers:</h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: 20,
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#333", color: "#fff" }}>
                <th style={{ border: "1px solid #444", padding: 8 }}>Select</th>
                <th style={{ border: "1px solid #444", padding: 8 }}>ID</th>
                <th style={{ border: "1px solid #444", padding: 8 }}>Offer Name</th>
                <th style={{ border: "1px solid #444", padding: 8 }}>Payout</th>
                <th style={{ border: "1px solid #444", padding: 8 }}>Payout Type</th>
                <th style={{ border: "1px solid #444", padding: 8 }}>Country</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((offer, idx) => (
                <tr key={idx} style={{ backgroundColor: "#1e1e2f", color: "#fff" }}>
                  <td style={{ border: "1px solid #444", padding: 8 }}>
                    <input
                      type="checkbox"
                      checked={selected.includes(idx)}
                      onChange={() => toggleSelect(idx)}
                    />
                  </td>
                  <td style={{ border: "1px solid #444", padding: 8 }}>{offer.id}</td>
                  <td style={{ border: "1px solid #444", padding: 8 }}>{offer.offer_name}</td>
                  <td style={{ border: "1px solid #444", padding: 8 }}>{offer.payout}</td>
                  <td style={{ border: "1px solid #444", padding: 8 }}>{offer.payout_type}</td>
                  <td style={{ border: "1px solid #444", padding: 8 }}>{offer.country}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleAddSelected}
            disabled={selected.length === 0}
            style={{
              marginBottom: 10,
              padding: "8px 16px",
              backgroundColor: "#4caf50",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              cursor: "pointer",
            }}
          >
            ➕ Add Selected to Home
          </button>
        </div>
      )}
    </div>
  );
}





