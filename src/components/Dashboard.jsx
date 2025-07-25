import React, { useEffect, useState } from 'react';
import ReactJson from 'react-json-view';
import './Dashboard.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // Import Recharts components

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from "axios"; // Import useNavigate and useLocation
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
        response = await fetch(sendUrl, { method: 'GET' });
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

        const defaultData = {
          coins: 0,
          balance: 0,
          totalEarnings: 0,
          pendingRewards: 0,
          completedTasks: 0,
          weeklyGoal: 10,
          level: 1,
          // Removed totalGamesPlayed and achievementsUnlocked from default data
        };

        if (docSnap.exists()) {
          const fetchedData = docSnap.data();
          // Merge fetched data with default data to ensure all keys exist
          setUserData({ ...defaultData, ...fetchedData });
        } else {
          console.log('No user data found! Creating default data.');
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
    // Removed totalGamesPlayed and achievementsUnlocked from destructuring
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
    } else if (view === 'dash') {
      navigate('/dash'); 
    } else if (view === 'earn') {
      navigate('/earn'); 
    } else if (view === 'manage') {
      navigate('/manage'); 
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
    } else if (view === 'ab-test-history') { // New view for A/B test history
      setCurrentView('ab-test-history');
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

  // Function to send postback
  const handlePostbackSend = async (e) => {
    e.preventDefault();
    setPostbackLoading(true);
    setPostbackResponse(null);
    try {
      let response, text, data;
      if (postbackMethod === 'GET') {
        response = await fetch(previewUrl, { method: 'GET' });
        text = await response.text();
      } else {
        response = await fetch(postbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postPayload),
        });
        text = await response.text();
      }
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
      setPostbackResponse({ status: response.status, data });
    } catch (err) {
      setPostbackResponse({ error: err.message });
    }
    setPostbackLoading(false);
  };

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
                <strong><img src="/icon1.png" alt="Coins" style={{ width: 25, height: 25, marginRight: 8, verticalAlign: 'middle' }} /> Coins</strong>
                <span>{coins}</span>
              </div>
              <div className="stat-box">
                <strong><img src="/icon2.png" alt="Balance" style={{ width: 25, height: 25, marginRight: 8, verticalAlign: 'middle' }} /> Balance</strong>
                <span>₹{balance}</span>
              </div>
              <div className="stat-box">
                <strong><img src="/icon3.png" alt="Total Earnings" style={{ width: 25, height: 25, marginRight: 8, verticalAlign: 'middle' }} /> Total Earnings</strong>
                <span>₹{totalEarnings}</span>
              </div>
              <div className="stat-box">
                <strong><img src="/icon4.png" alt="Pending Rewards" style={{ width: 25, height: 25, marginRight: 8, verticalAlign: 'middle' }} /> Pending Rewards</strong>
                <span>₹{pendingRewards}</span>
              </div>
              <div className="stat-box">
                <strong><img src="/icon5.png" alt="Tasks Completed" style={{ width: 25, height: 25, marginRight: 8, verticalAlign: 'middle' }} /> Tasks Completed</strong>
                <span>{completedTasks}</span>
              </div>
              {/* Removed "Total Games Played" and "Achievements Unlocked" stat boxes */}
              <div className="stat-box">
                <strong><img src="/icon6.png" alt="Level" style={{ width: 25, height: 25, marginRight: 8, verticalAlign: 'middle' }} /> Level</strong>
                <span>{level}</span>
              </div>
            </div>

            <div className="progress-section">
              <h2><img src="/icon7.png" alt="Weekly Goal" style={{ width: 25, height: 25, marginRight: 8, verticalAlign: 'middle' }} /> Weekly Goal Progress</h2>
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
              <label>Rating:<input name="rating" value={gameForm.rating} onChange={e => setGameForm({ ...gameForm, rating: e.target.value })} required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} /></label>
              <label>Image Link:<input name="image" value={gameForm.image} onChange={e => setGameForm({ ...gameForm, image: e.target.value })} required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} /></label>
              <label>Final Link:<input name="link" value={gameForm.link} onChange={e => setGameForm({ ...gameForm, link: e.target.value })} required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} /></label>
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
      case 'email-config':
        return (
          <div style={{ maxWidth: 600, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>Email Configuration</h2>
            <EmailConfigSection setCurrentView={setCurrentView} /> {/* Pass setCurrentView */}
          </div>
        );
      case 'ab-test-history': // New case for A/B Test History
        return (
          <div style={{ maxWidth: 800, margin: '2rem auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
            <h2>A/B Test History</h2>
            <ABTestHistorySection />
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
          <li className={currentView === 'email-config' ? 'active' : ''} onClick={() => handleNavigationClick('email-config')}>
            Email Config
          </li>
          <li className={currentView === 'ab-test-history' ? 'active' : ''} onClick={() => handleNavigationClick('ab-test-history')}>
            A/B Test History
          </li>
          <li className={currentView === 'domain-checker' ? 'active' : ''} onClick={() => handleNavigationClick('domain-checker')}>
            Domain Checker
          </li>
          <li className={currentView === 'bulk-scheduling' ? 'active' : ''} onClick={() => handleNavigationClick('bulk-scheduling')}>
            Bulk Scheduling
          </li>
          <li className={location.pathname === '/manage' ? 'active' : ''} onClick={() => handleNavigationClick('manage')}>
            management
          </li>
          <li className={location.pathname === '/earn' ? 'active' : ''} onClick={() => handleNavigationClick('earn')}>
            refer&earn
          </li>
          <li className={location.pathname === '/dash' ? 'active' : ''} onClick={() => handleNavigationClick('dash')}>
            Dash
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
                          <button onClick={() => document.execCommand('copy', false, k.key)} style={{ marginLeft: 6, color: '#1976d2', border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Copy</button>
                          <button onClick={() => handleEdit(k.key, k.name)} style={{ marginLeft: 6, color: '#1976d2', border: 'none', background: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Edit</button>
                        </>
                      )}
                    </td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{k.key}</td>
                    <td style={{ padding: '8px' }}>{new Date(k.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '8px' }}>{usage} / 10</td>
                    <td style={{ padding: '8px' }}>
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

function ApiFetcherSection() {
  const [url, setUrl] = React.useState('http://localhost:5000/api/public/games');
  const [method, setMethod] = React.useState('GET');
  const [headers, setHeaders] = React.useState([{ key: 'x-api-key', value: '' }]);
  const [params, setParams] = React.useState([]); // <-- new
  const [body, setBody] = React.useState('');
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [selected, setSelected] = React.useState([]);
  const [corsError, setCorsError] = React.useState(false);
  const [detailsIdx, setDetailsIdx] = React.useState(null); // for modal
  const [sortCol, setSortCol] = React.useState(null);
  const [sortDir, setSortDir] = React.useState('asc');
  const [filters, setFilters] = React.useState({});
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [useCorsProxy, setUseCorsProxy] = React.useState(false);
  const [viewMode, setViewMode] = React.useState('table'); // 'table', 'pretty', 'raw'

  // --- Data normalization for nested structures ---
  function normalizeData(raw) {
    // If raw is null, undefined, or an empty object, return an empty array.
    if (!raw || (typeof raw === 'object' && Object.keys(raw).length === 0)) {
      return [];
    }
    // If raw is a primitive (string, number, boolean), wrap it in an array.
    if (typeof raw !== 'object') {
      return [raw];
    }

    let obj = raw;
    // Drill down if 'response' or 'data' properties exist
    if (obj.response && typeof obj.response === 'object' && obj.response !== null) {
      obj = obj.response;
    }
    if (obj.data && typeof obj.data === 'object' && obj.data !== null) {
      obj = obj.data;
    }

    // If it's already an array, return it.
    if (Array.isArray(obj)) {
      return obj;
    }

    // If it's an object whose values are all objects (array-like, e.g., { "0": {...}, "1": {...} })
    // and it's not an array itself.
    if (
      typeof obj === 'object' &&
      !Array.isArray(obj) &&
      Object.values(obj).length > 0 &&
      Object.values(obj).every(v => typeof v === 'object' && v !== null)
    ) {
      let arr = Object.values(obj);
      // If all values are objects with a single property, extract that property
      if (arr.every(x => x && typeof x === 'object' && Object.keys(x).length === 1)) {
        arr = arr.map(x => x[Object.keys(x)[0]]);
      }
      // If the result is an array of strings, try to parse as JSON
      if (arr.every(x => typeof x === 'string')) {
        try {
          arr = arr.map(x => JSON.parse(x));
        } catch (e) {
          // If parsing fails, leave as is
          console.warn("Failed to parse string array to JSON in normalizeData:", e);
        }
      }
      return arr;
    }

    // If it's a non-empty object that doesn't fit the above patterns, treat it as a single item array.
    return [obj];
  }

  // Move isArray/type here so all functions can use them
  // Use normalized data for all rendering
  const normalizedData = React.useMemo(() => normalizeData(data), [data]);
  let isArray = Array.isArray(normalizedData);
  let type = '';
  if (isArray && normalizedData && normalizedData.length > 0) {
    if (normalizedData[0].title && normalizedData[0].image) type = 'game';
    else if (normalizedData[0].receivedAt && normalizedData[0].ip) type = 'postback';
    else if (normalizedData[0].userId && normalizedData[0].level !== undefined) type = 'user';
  }

  const methodOptions = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  // Parameter handlers
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
      // Remove protocol for double-proxy safety
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
      } else {
        setData(result);
        // Save fetch to backend
        fetch('http://localhost:5000/api/fetch-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: finalUrl,
            method,
            headers: fetchHeaders,
            params,
            body: options.body,
            response: result,
            status: res.status,
            timestamp: new Date().toISOString()
          })
        });
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setCorsError(true);
        setError('CORS error: This API does not allow cross-origin requests.');
      } else {
        setError('Failed to fetch');
      }
    }
    setLoading(false);
  };

  const handleSelect = (idx) => {
    setSelected(sel => sel.includes(idx) ? sel.filter(i => i !== idx) : [...sel, idx]);
  };

  // Filtering and sorting logic
  const getFilteredSortedData = () => {
    if (!isArray || !normalizedData) return [];
    let filtered = normalizedData;
    // Filtering
    Object.entries(filters).forEach(([col, val]) => {
      if (val) {
        filtered = filtered.filter(item =>
          (item[col] !== undefined && String(item[col]).toLowerCase().includes(val.toLowerCase()))
        );
      }
    });
    // Sorting
    if (sortCol) {
      filtered = [...filtered].sort((a, b) => {
        if (a[sortCol] === undefined) return 1;
        if (b[sortCol] === undefined) return -1;
        if (typeof a[sortCol] === 'number' && typeof b[sortCol] === 'number') {
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
  // Pagination logic
  const totalRows = filteredSortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const pagedData = filteredSortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const handlePageChange = (newPage) => {
    setPage(Math.max(1, Math.min(totalPages, newPage)));
  };
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  };

  // Card renderers (same as before)
  const renderGameCard = (game, idx) => (
    <div key={idx} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, margin: 8, width: 220, background: '#fafbfc', boxShadow: '0 2px 8px #eee' }}>
      <img src={game.image} alt={game.title} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }} />
      <div style={{ fontWeight: 'bold', fontSize: 18 }}>{game.title}</div>
      <div style={{ color: '#555', margin: '4px 0' }}>{game.genre}</div>
      <div style={{ color: '#888', fontSize: 14 }}>Rating: {game.rating}</div>
      <a href={`http://localhost:5000/go/${game.id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', fontWeight: 'bold', textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>Play</a>
    </div>
  );
  const renderPostbackCard = (pb, idx) => (
    <div key={idx} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, margin: 8, width: 320, background: '#fafbfc', boxShadow: '0 2px 8px #eee' }}>
      <div><strong>Received At:</strong> {pb.receivedAt}</div>
      <div><strong>IP:</strong> {pb.ip}</div>
      <div><strong>Headers:</strong> <pre style={{ background: '#f6f6f6', padding: 6, borderRadius: 4 }}>{JSON.stringify(pb.headers, null, 2)}</pre></div>
      <div><strong>Body:</strong> <pre style={{ background: '#f6f6f6', padding: 6, borderRadius: 4 }}>{JSON.stringify(pb.body, null, 2)}</pre></div>
    </div>
  );
  const renderUserCard = (user, idx) => (
    <div key={idx} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, margin: 8, width: 220, background: '#fafbfc', boxShadow: '0 2px 8px #eee' }}>
      <div style={{ fontWeight: 'bold', fontSize: 18 }}>User: {user.userId}</div>
      <div style={{ color: '#555', margin: '4px 0' }}>Level: {user.level}</div>
      <div style={{ color: '#888', fontSize: 14 }}>Coins: {user.coins}</div>
      <div style={{ color: '#888', fontSize: 14 }}>Completed Tasks: {user.completedTasks}</div>
    </div>
  );

  // Universal renderTable for any JSON data
  const renderTable = () => {
    if (!normalizedData) return null;

    let rows = [];
    let columns = [];

    // Array of primitives
    if (Array.isArray(normalizedData) && normalizedData.length > 0 && typeof normalizedData[0] !== 'object') {
      rows = normalizedData.map(val => ({ value: val }));
      columns = [{ key: 'value', label: 'Value' }];
    }
    // Array of objects (possibly with different keys)
    else if (Array.isArray(normalizedData) && normalizedData.length > 0 && typeof normalizedData[0] === 'object') {
      const unwrapped = normalizedData.map(obj => obj && obj.Offer).filter(Boolean);
      const visibleKeys = ['id', 'name', 'description', 'payout_type', 'expiration_date', 'actions'];
      columns = visibleKeys.map(k => ({ key: k, label: k.replace(/_/g, ' ').toUpperCase() }));
      rows = unwrapped;
      
    }
    
    // Single object
    else if (normalizedData && typeof normalizedData === 'object' && !Array.isArray(normalizedData)) {
      columns = Object.keys(normalizedData).map(k => ({ key: k, label: k }));
      rows = [normalizedData];
    } else {
      return <div>No tabular data to display.</div>;
    }

    // After determining columns, add Preview Link column if not present
    if (!columns.some(c => c.key === 'preview_link')) {
      columns.push({ key: 'preview_link', label: 'Preview Link' });
    }

    return (
      <div style={{ overflowX: 'auto', marginTop: 18 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#181a20', color: '#fff', borderRadius: 10, fontFamily: 'Montserrat, Arial, sans-serif', fontSize: 14, boxShadow: '0 2px 8px #222' }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{
                    padding: '7px 6px',
                    borderBottom: '2px solid #23263a',
                    textAlign: 'left',
                    background: '#23263a',
                    fontWeight: 700,
                    fontSize: 15,
                    letterSpacing: 0.3,
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((item, idx) => (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid #23263a',
                  background: idx % 2 === 0 ? '#23263a' : '#181a20',
                  transition: 'background 0.2s',
                  minHeight: 28,
                  height: 32,
                }}
              >
                {columns.map(col => {
                  if (col.key === 'actions') {
                    return (
                      <td key={col.key} style={{ padding: 4 }}>
                        <button
                          onClick={() => setDetailsIdx(idx)}
                          style={{ background: '#2196f3', color: '#fff', border: 'none', borderRadius: 5, padding: '2px 10px', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 4px #0002', transition: 'background 0.2s' }}
                          title="View details"
                        >
                          View
                        </button>
                      </td>
                    );
                  }
                  if (col.key === 'preview_link') {
                    // Try to find a link or preview_url property
                    const link = (item && (item.link || item.preview_url)) || null;
                    const id = item && (item.id || item.offer_id || item._id);
                    if (link && id) {
                      return (
                        <td key={col.key} style={{ padding: 4 }}>
                          <a href={`http://localhost:5000/go/${id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', fontWeight: 600, textDecoration: 'underline' }}>Preview</a>
                        </td>
                      );
                    } else {
                      return <td key={col.key} style={{ padding: 4, color: '#888', textAlign: 'center', fontStyle: 'italic', fontSize: 13 }}>—</td>;
                    }
                  }
                  const value = item ? item[col.key] : undefined;
                  if (value === null || value === undefined || value === '') {
                    return <td key={col.key} style={{ padding: 4, color: '#888', textAlign: 'center', fontStyle: 'italic', fontSize: 13 }}>—</td>;
                  }
                  if (typeof value === 'object') {
                    return <td key={col.key} style={{ padding: 4, color: '#90caf9', fontSize: 13 }}>{JSON.stringify(value)}</td>;
                  }
                  return <td key={col.key} style={{ padding: 4, color: '#fff', fontSize: 13 }}>{String(value)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {/* Details Modal */}
        {detailsIdx !== null && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000a', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDetailsIdx(null)}>
            <div style={{ background: '#23263a', color: '#fff', borderRadius: 10, padding: 32, minWidth: 400, maxWidth: 600, boxShadow: '0 4px 32px #0008', position: 'relative' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setDetailsIdx(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}>&times;</button>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Details</h3>
              <ReactJson src={rows[detailsIdx]} name={false} collapsed={1} enableClipboard={true} displayDataTypes={false} theme="monokai" style={{ background: 'none', fontSize: 15, borderRadius: 8, padding: 12, maxHeight: 400, overflow: 'auto' }} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <label style={{ flex: 1 }}>
            URL:
            <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.example.com/data" style={{ marginLeft: 8, padding: 6, borderRadius: 4, width: '100%' }} />
          </label>
          <label>
            Method:
            <select value={method} onChange={e => setMethod(e.target.value)} style={{ marginLeft: 8, padding: 6, borderRadius: 4 }}>
              {methodOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', marginLeft: 12 }}>
            <input type="checkbox" checked={useCorsProxy} onChange={e => setUseCorsProxy(e.target.checked)} style={{ marginRight: 6 }} />
            Use CORS Proxy
          </label>
          <button onClick={handleFetch} disabled={loading} style={{ padding: '8px 18px', borderRadius: 4, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 'bold' }}>{loading ? 'Fetching...' : 'Fetch'}</button>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ flex: 2 }}>
            <strong>Headers:</strong>
            {headers.map((h, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                <input type="text" value={h.key} onChange={e => handleHeaderChange(idx, 'key', e.target.value)} placeholder="Header name" style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 120 }} />
                <input type="text" value={h.value} onChange={e => handleHeaderChange(idx, 'value', e.target.value)} placeholder="Header value" style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 220 }} />
                <button onClick={() => handleRemoveHeader(idx)} style={{ color: 'red', border: 'none', background: 'none', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}>×</button>
              </div>
            ))}
            <button type="button" onClick={handleAddHeader} style={{ marginTop: 4 }}>+ Add Header</button>
          </div>
        </div>
        <div style={{ background: '#f6f6f6', borderRadius: 6, padding: 12, marginBottom: 8 }}>
          <strong>Parameters:</strong>
          {params.map((p, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <input type="text" value={p.key} onChange={e => handleParamChange(idx, 'key', e.target.value)} placeholder="Param name" style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 120 }} />
              <input type="text" value={p.value} onChange={e => handleParamChange(idx, 'value', e.target.value)} placeholder="Param value" style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', width: 220 }} />
              <button onClick={() => handleRemoveParam(idx)} style={{ color: 'red', border: 'none', background: 'none', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}>×</button>
            </div>
          ))}
          <button type="button" onClick={handleAddParam} style={{ marginTop: 4 }}>+ Add Parameter</button>
        </div>
        {['POST', 'PUT', 'PATCH'].includes(method) && (
          <div style={{ flex: 3 }}>
            <strong>Body (JSON or text):</strong>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', marginTop: 4 }} placeholder='{"key": "value"}' />
          </div>
        )}
      </div>
      {corsError && (
        <div style={{ color: 'red', marginBottom: 12 }}>
          <strong>CORS Error:</strong> This API does not allow cross-origin requests. You can use a CORS proxy like <a href="https://cors-anywhere.herokuapp.com/" target="_blank" rel="noopener noreferrer">cors-anywhere</a> for testing, or run your own proxy server.
        </div>
      )}
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      {/* View toggle - now always visible if data exists */}
      {data && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <button onClick={() => setViewMode('table')} style={{ background: viewMode === 'table' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Table View</button>
          <button onClick={() => setViewMode('pretty')} style={{ background: viewMode === 'pretty' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Pretty View</button>
          <button onClick={() => setViewMode('raw')} style={{ background: viewMode === 'raw' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Raw JSON</button>
        </div>
      )}
      {/* {data && viewMode === 'table' && renderTable()} */}
      {/* {data && viewMode === 'pretty' && renderPrettyCards()}
      {data && viewMode === 'raw' && renderRawJson()} */}
      {Array.isArray(normalizedData) && selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 18 }}>
          {selected.map(idx => {
            if (type === 'game') return renderGameCard(normalizedData[idx], idx);
            if (type === 'postback') return renderPostbackCard(normalizedData[idx], idx);
            if (type === 'user') return renderUserCard(normalizedData[idx], idx);
            return (
              <div key={idx} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, margin: 8, width: 220, background: '#fafbfc', boxShadow: '0 2px 8px #eee' }}>
                <pre style={{ fontSize: 13 }}>{typeof normalizedData[idx] === 'object' ? JSON.stringify(normalizedData[idx], null, 2) : String(normalizedData[idx])}</pre>
              </div>
            );
          })}
        </div>
      )}
      {!Array.isArray(normalizedData) && normalizedData && typeof normalizedData === 'object' && (
        <div style={{ marginTop: 18 }}>
          <strong>Response:</strong>
          <pre style={{ background: '#eee', padding: 12, borderRadius: 6 }}>{typeof normalizedData === 'object' ? JSON.stringify(normalizedData, null, 2) : String(normalizedData)}</pre>
        </div>
      )}
      {/* Summary bar */}
      {normalizedData && (
        <div style={{
          background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)',
          color: '#fff',
          borderRadius: 12,
          padding: '18px 28px',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 12px #2224',
          fontSize: 20,
          fontWeight: 500,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span role="img" aria-label="offers" style={{ fontSize: 28 }}>🔎</span>
            <span>
              {type === 'game' ? 'Offers Found' : type === 'postback' ? 'Postbacks Found' : type === 'user' ? 'Users Found' : 'Items Found'}
            </span>
            <span style={{ fontSize: 15, fontWeight: 400, marginLeft: 10, color: '#e0e0e0' }}>
              {Array.isArray(normalizedData) ? (filteredSortedData.length === 1 ? '1 item' : `${filteredSortedData.length} items`) : '1 item'} (View: {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)})
            </span>
          </div>
          <div style={{ background: '#fff', color: '#333', borderRadius: 20, padding: '6px 18px', fontWeight: 700, fontSize: 18, boxShadow: '0 1px 4px #0002' }}>
            {Array.isArray(normalizedData) ? filteredSortedData.length : 1}
          </div>
        </div>
      )}
      {data && (
        <div style={{
          background: '#23263a',
          color: '#fff',
          borderRadius: 12,
          padding: '24px 32px',
          margin: '24px 0',
          boxShadow: '0 2px 12px #2224',
          fontFamily: 'Montserrat, Arial, sans-serif',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 18, marginRight: 16 }}>Response</span>
              <span style={{ background: '#1976d2', color: '#fff', borderRadius: 8, padding: '4px 12px', fontWeight: 600, fontSize: 14, marginRight: 8 }}>
                {error ? 'Error' : 'Success'}
              </span>
              <span style={{ color: '#aaa', fontSize: 13 }}>
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div>
              <button
                onClick={() => document.execCommand('copy', false, JSON.stringify(data, null, 2))}
                style={{
                  background: '#1976d2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 18px',
                  fontWeight: 'bold',
                  marginRight: 8,
                  cursor: 'pointer'
                }}
              >
                Copy JSON
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
                style={{
                  background: '#444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 18px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Export JSON
              </button>
            </div>
          </div>
          {/* Tabs for Table, Pretty, Raw */}
          {/* <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <button onClick={() => setViewMode('table')} style={{ background: viewMode === 'table' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Table View</button>
            <button onClick={() => setViewMode('pretty')} style={{ background: viewMode === 'pretty' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Pretty View</button>
            <button onClick={() => setViewMode('raw')} style={{ background: viewMode === 'raw' ? '#1976d2' : '#23263a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Raw JSON</button>
          </div> */}
          {/* Render the selected view */}
          {viewMode === 'table' && renderTable()}
          {viewMode === 'pretty' && (
            <div style={{ margin: '32px auto', maxWidth: 900, background: '#181a20', borderRadius: 14, boxShadow: '0 2px 12px #2224', padding: 28 }}>
              <ReactJson src={normalizedData} name={false} collapsed={2} enableClipboard={true} displayDataTypes={false} theme="monokai" style={{ background: 'none', fontSize: 16, borderRadius: 8, padding: 12 }} />
            </div>
          )}
          {viewMode === 'raw' && (
            <div style={{ margin: '32px auto', maxWidth: 900, background: '#181a20', borderRadius: 14, boxShadow: '0 2px 12px #2224', padding: 28 }}>
              <strong style={{ color: '#fff', fontSize: 18 }}>Raw JSON Response:</strong>
              <ReactJson src={data} name={false} collapsed={1} enableClipboard={true} displayDataTypes={false} theme="monokai" style={{ background: 'none', fontSize: 16, borderRadius: 8, padding: 12, marginTop: 10 }} />
            </div>
          )}
        </div>
      )}
      
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
            <th style={{ padding: 8 }}>Referrer</th>
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
              <td style={{ padding: 8 }}>{r.referrer}</td>
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

  return (
    <div className="our-offer-page">
      <h2 style={{ textAlign: "center", margin: "2rem 0" }}>Our Offers</h2>
      {loading ? (
        <p>Loading...</p>
      ) : offers.length === 0 ? (
        <p>No offers found.</p>
      ) : (
        <div className="offer-list">
          {offers.map((offer, idx) => (
            <div key={offer.id || offer.offer_id || offer._id || idx} className="offer-card">
              {offer.image && <img src={offer.image} alt={offer.title} style={{ width: 120, height: 80, objectFit: "cover" }} />}
              <h3>{offer.title || offer.id || offer.offer_id || offer._id}</h3>
              {offer.genre && <p>Genre: {offer.genre}</p>}
              {offer.rating && <p>Rating: {offer.rating}</p>}
              <a href={`http://localhost:5000/go/${offer.id || offer.offer_id || offer._id}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Masked Link
              </a>
              <br />
              {(offer.preview_url || offer.link) && (
                <a href={offer.preview_url || offer.link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  Original Preview URL
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};



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

function EmailConfigSection({ setCurrentView }) {
  const [config, setConfig] = React.useState({ host: '', port: 465, secure: true, user: '', pass: '', from: '' });
  const [to, setTo] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [offers, setOffers] = React.useState([]);
  const [selectedOffers, setSelectedOffers] = React.useState([]);
  const [showABTestForms, setShowABTestForms] = React.useState(false); // New state for A/B test forms
  const [emailA, setEmailA] = React.useState({ to: '', subject: '', body: '' });
  const [emailB, setEmailB] = React.useState({ to: '', subject: '', body: '' });
  const [abTestStatus, setAbTestStatus] = React.useState('');
  // Initialize abTestHistory from localStorage
  const [abTestHistory, setAbTestHistory] = React.useState(() => {
    try {
      const storedHistory = localStorage.getItem('abTestHistory');
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (error) {
      console.error("Failed to parse abTestHistory from localStorage", error);
      return [];
    }
  });

  // Save abTestHistory to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem('abTestHistory', JSON.stringify(abTestHistory));
    } catch (error) {
      console.error("Failed to save abTestHistory to localStorage", error);
    }
  }, [abTestHistory]);


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
      })
      .catch(() => setOffers([]));
  }, []);

  // Update body when selectedOffers changes
  React.useEffect(() => {
    if (selectedOffers.length === 0) return;
    const offersText = selectedOffers.map(offer =>
      `Offer: ${offer.title || offer.id}\nLink: http://localhost:5000/go/${offer.id || offer.offer_id || offer._id}`
    ).join('\n\n');
    setBody(offersText);
    setEmailA(prev => ({ ...prev, body: offersText }));
    setEmailB(prev => ({ ...prev, body: offersText }));
  }, [selectedOffers]);

  // Toggle offer selection
  const toggleOffer = (offer) => {
    const id = offer.id || offer.offer_id || offer._id;
    setSelectedOffers(prev => {
      if (prev.some(o => (o.id || o.offer_id || o._id) === id)) {
        return prev.filter(o => (o.id || o.offer_id || o._id) !== id);
      } else {
        return [...prev, offer];
      }
    });
  };

  // Save config
  const saveConfig = async () => {
    setStatus('');
    try {
      const res = await fetch('http://localhost:5000/api/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (res.ok) setStatus('Config saved!');
      else setStatus(data.error || 'Failed to save config');
    } catch (e) {
      setStatus('Failed to save config');
    }
  };


  // Send test email
  // Extract first name from email
 function getFirstNameFromEmail(email) {
  if (!email) return '';

  const localPart = email.split('@')[0]; // eg. sunilsivasp21
  const cleaned = localPart.replace(/[0-9]/g, '').toLowerCase(); // eg. sunilsivasp

  // List of known suffixes that1 are often attached (you can add more)
  const knownSuffixes = ['siva', 'raj', 'kumar', 'reddy', 'sp', 'dev', 'info'];

  // Remove known suffixes from the end of the string
  let name = cleaned;
  for (let suffix of knownSuffixes) {
    if (name.endsWith(suffix)) {
      name = name.slice(0, -suffix.length);
      break;
    }
  }

  // Capitalize and return
  return name.charAt(0).toUpperCase() + name.slice(1);
}


  const sendEmail = async () => {
    setSending(true);
    setStatus('');

    const firstName = getFirstNameFromEmail(to);
    const personalizedText = `heyy ${firstName},\n\n${body}`;

    try {
      const res = await fetch('http://localhost:5000/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, text: personalizedText })
      });

      const data = await res.json();
      if (res.ok) setStatus('Email sent!');
      else setStatus(data.error || 'Failed to send email');
    } catch (e) {
      setStatus('Failed to send email');
    }

    setSending(false);
  };

  // Handle A/B Test Email Send (Simulated)
  const sendABTestEmails = async () => {
    setSending(true);
    setAbTestStatus('');

    // Simulate sending to different groups
    const recipientsA = emailA.to.split(',').map(s => s.trim()).filter(Boolean);
    const recipientsB = emailB.to.split(',').map(s => s.trim()).filter(Boolean);

    const results = {
      id: Date.now(), // Unique ID for the test
      emailA: { sent: 0, failed: 0, opened: 0, notOpened: 0 },
      emailB: { sent: 0, failed: 0, opened: 0, notOpened: 0 },
      timestamp: new Date().toLocaleString(),
      subjectA: emailA.subject,
      subjectB: emailB.subject,
      totalRecipients: recipientsA.length + recipientsB.length,
    };

    // Simulate sending Email A
    for (const recipient of recipientsA) {
      const firstName = getFirstNameFromEmail(recipient);
      const personalizedText = `heyy ${firstName},\n\n${emailA.body}`;
      try {
        const res = await fetch('http://localhost:5000/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: recipient, subject: emailA.subject, text: personalizedText })
        });
        if (res.ok) {
          results.emailA.sent++;
          // Simulate open rate (e.g., 70% chance to open)
          if (Math.random() < 0.7) {
            results.emailA.opened++;
          } else {
            results.emailA.notOpened++;
          }
        } else {
          results.emailA.failed++;
        }
      } catch (e) {
        results.emailA.failed++;
      }
    }

    // Simulate sending Email B
    for (const recipient of recipientsB) {
      const firstName = getFirstNameFromEmail(recipient);
      const personalizedText = `heyy ${firstName},\n\n${emailB.body}`;
      try {
        const res = await fetch('http://localhost:5000/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: recipient, subject: emailB.subject, text: personalizedText })
        });
        if (res.ok) {
          results.emailB.sent++;
          // Simulate open rate (e.g., 60% chance to open)
          if (Math.random() < 0.6) {
            results.emailB.opened++;
          } else {
            results.emailB.notOpened++;
          }
        } else {
          results.emailB.failed++;
        }
      } catch (e) {
        results.emailB.failed++;
      }
    }

    setAbTestStatus('A/B Test emails sent. Check history for results.');
    setAbTestHistory(prev => [...prev, results]); // Add to history
    setSending(false);
  };


  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>SMTP Config</h3>
        <button onClick={() => setCurrentView('ab-test-history')} style={{ padding: '8px 16px', borderRadius: 4, background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}>
          History
        </button>
      </div>
      <input placeholder="Host" value={config.host} onChange={e => setConfig(c => ({ ...c, host: e.target.value }))} style={{ width: '100%', marginBottom: 8 }} />
      <input placeholder="Port" type="number" value={config.port} onChange={e => setConfig(c => ({ ...c, port: Number(e.target.value) }))} style={{ width: '100%', marginBottom: 8 }} />
      <label>
        <input type="checkbox" checked={config.secure} onChange={e => setConfig(c => ({ ...c, secure: e.target.checked }))} />
        Secure (SSL/TLS)
      </label>
      <input placeholder="User" value={config.user} onChange={e => setConfig(c => ({ ...c, user: e.target.value }))} style={{ width: '100%', marginBottom: 8 }} />
      <input placeholder="Password" type="password" value={config.pass} onChange={e => setConfig(c => ({ ...c, pass: e.target.value }))} style={{ width: '100%', marginBottom: 8 }} />
      <input placeholder="From Email" value={config.from} onChange={e => setConfig(c => ({ ...c, from: e.target.value }))} style={{ width: '100%', marginBottom: 8 }} />
      <button onClick={saveConfig} style={{ marginBottom: 16 }}>Save Config</button>

      <h3 style={{ marginTop: '1rem' }}>Send Email</h3>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setShowABTestForms(false)} style={{ marginRight: '0.5rem', padding: '8px 16px', borderRadius: 4, background: showABTestForms ? '#ccc' : '#28a745', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Single Email
        </button>
        <button onClick={() => setShowABTestForms(true)} style={{ padding: '8px 16px', borderRadius: 4, background: showABTestForms ? '#28a745' : '#ccc', color: '#fff', border: 'none', cursor: 'pointer' }}>
          A/B Test
        </button>
      </div>

      {!showABTestForms ? (
        <>
          <input placeholder="To Email" value={to} onChange={e => setTo(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
          <input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
          {/* Offer Picker */}
          <label style={{ fontWeight: 500, marginBottom: 4 }}>Choose Offers to Include:</label>
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: 12,
            padding: '8px 0',
            marginBottom: 12,
            borderBottom: '1px solid #eee'
          }}>
            {offers.map((offer, idx) => {
              const id = offer.id || offer.offer_id || offer._id;
              const isSelected = selectedOffers.some(o => (o.id || o.offer_id || o._id) === id);
              return (
                <button
                  key={id || idx}
                  style={{
                    minWidth: 180,
                    border: isSelected ? '2px solid #3182ce' : '1px solid #ccc',
                    borderRadius: 8,
                    background: isSelected ? '#e6f0fa' : '#fafbfc',
                    padding: 8,
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 2px 8px #3182ce33' : '0 1px 4px #eee'
                  }}
                  onClick={() => toggleOffer(offer)}
                >
                  <div style={{ fontWeight: 600 }}>{offer.title || id}</div>
                  {offer.image && <img src={offer.image} alt={offer.title} style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 6, margin: '6px 0' }} />}
                  <div style={{ fontSize: 13, color: '#555' }}>{offer.genre}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{offer.rating && `⭐ ${offer.rating}`}</div>
                </button>
              );
            })}
          </div>
          <textarea placeholder="Body" value={body} onChange={e => setBody(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
          <button onClick={sendEmail} disabled={sending}>{sending ? 'Sending...' : 'Send Email'}</button>
          {status && <div style={{ marginTop: 12, color: status.includes('fail') ? 'red' : 'green' }}>{status}</div>}
        </>
      ) : (
        // A/B Test Forms
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px', border: '1px solid #ddd', borderRadius: 8, padding: 16, background: '#f9f9f9' }}>
            <h4>Email A</h4>
            <input placeholder="To Email (comma-separated)" value={emailA.to} onChange={e => setEmailA(prev => ({ ...prev, to: e.target.value }))} style={{ width: '100%', marginBottom: 8 }} />
            <input placeholder="Subject" value={emailA.subject} onChange={e => setEmailA(prev => ({ ...prev, subject: e.target.value }))} style={{ width: '100%', marginBottom: 8 }} />
            <textarea placeholder="Body" value={emailA.body} onChange={e => setEmailA(prev => ({ ...prev, body: e.target.value }))} style={{ width: '100%', marginBottom: 8 }} />
          </div>
          <div style={{ flex: 1, minWidth: '280px', border: '1px solid #ddd', borderRadius: 8, padding: 16, background: '#f9f9f9' }}>
            <h4>Email B</h4>
            <input placeholder="To Email (comma-separated)" value={emailB.to} onChange={e => setEmailB(prev => ({ ...prev, to: e.target.value }))} style={{ width: '100%', marginBottom: 8 }} />
            <input placeholder="Subject" value={emailB.subject} onChange={e => setEmailB(prev => ({ ...prev, subject: e.target.value }))} style={{ width: '100%', marginBottom: 8 }} />
            <textarea placeholder="Body" value={emailB.body} onChange={e => setEmailB(prev => ({ ...prev, body: e.target.value }))} style={{ width: '100%', marginBottom: 8 }} />
          </div>
          <button onClick={sendABTestEmails} disabled={sending} style={{ width: '100%', padding: '10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', marginTop: '1rem' }}>
            {sending ? 'Sending A/B Test...' : 'Send A/B Test Emails'}
          </button>
          {abTestStatus && <div style={{ marginTop: 12, color: abTestStatus.includes('fail') ? 'red' : 'green' }}>{abTestStatus}</div>}
        </div>
      )}
    </div>
  );
}

function ABTestHistorySection() {
  // Retrieve history from localStorage
  const [history, setHistory] = React.useState(() => {
    try {
      const storedHistory = localStorage.getItem('abTestHistory');
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (error) {
      console.error("Failed to parse abTestHistory from localStorage", error);
      return [];
    }
  });

  const getWinner = (emailA, emailB) => {
    if (emailA.opened > emailB.opened) {
      return 'Email A';
    } else if (emailB.opened > emailA.opened) {
      return 'Email B';
    } else {
      return 'Tie';
    }
  };

  // Prepare data for the bar chart
  const chartData = history.map(test => ({
    name: `${new Date(test.timestamp).toLocaleDateString()} - ${test.subjectA.substring(0, 15)}... vs ${test.subjectB.substring(0, 15)}...`,
    'Opened A': test.emailA.opened,
    'Not Opened A': test.emailA.notOpened,
    'Opened B': test.emailB.opened,
    'Not Opened B': test.emailB.notOpened,
  }));

  return (
    <div style={{ overflowX: 'auto', padding: '20px', background: '#f8f8f8', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      {history.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#555', fontSize: '1.1em' }}>No A/B test history yet. Run some A/B tests from the Email Config section!</p>
      ) : (
        <>
          <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>A/B Test Performance Overview</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} interval={0} tick={{ fontSize: 12, fill: '#555' }} />
              <YAxis allowDecimals={false} tick={{ fill: '#555' }} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', border: 'none' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Opened A" stackId="a" fill="#4CAF50" name="Email A Opened" radius={[10, 10, 0, 0]} />
              <Bar dataKey="Not Opened A" stackId="a" fill="#FFC107" name="Email A Not Opened" radius={[0, 0, 10, 10]} />
              <Bar dataKey="Opened B" stackId="b" fill="#2196F3" name="Email B Opened" radius={[10, 10, 0, 0]} />
              <Bar dataKey="Not Opened B" stackId="b" fill="#9C27B0" name="Email B Not Opened" radius={[0, 0, 10, 10]} />
            </BarChart>
          </ResponsiveContainer>

          <h3 style={{ textAlign: 'center', marginTop: '40px', marginBottom: '20px', color: '#333' }}>Detailed A/B Test Results (Table)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <thead>
              <tr style={{ background: '#e0e0e0' }}>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #ccc' }}>Date/Time</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #ccc' }}>Email A Subject</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #ccc' }}>Email B Subject</th>
                <th style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #ccc' }}>Total Sent</th>
                <th style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #ccc' }}>Opened A</th>
                <th style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #ccc' }}>Not Opened A</th>
                <th style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #ccc' }}>Opened B</th>
                <th style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #ccc' }}>Not Opened B</th>
                <th style={{ padding: 12, textAlign: 'center', fontWeight: 'bold' }}>Winner</th>
              </tr>
            </thead>
            <tbody>
              {history.map((test) => (
                <tr key={test.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 12 }}>{test.timestamp}</td>
                  <td style={{ padding: 12 }}>{test.subjectA}</td>
                  <td style={{ padding: 12 }}>{test.subjectB}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>{test.emailA.sent + test.emailB.sent}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>{test.emailA.opened}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>{test.emailA.notOpened}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>{test.emailB.opened}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>{test.emailB.notOpened}</td>
                  <td style={{ padding: 12, textAlign: 'center', fontWeight: 'bold' }}>{getWinner(test.emailA, test.emailB)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
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
  const [error, setError] = React.useState('');

  // Fetch offers and schedules
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
    fetch('http://localhost:5000/api/schedules')
      .then(res => res.json())
      .then(setSchedules);
  }, []);

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
    for (const scheduler of schedulers) {
      if (!scheduler.url || !scheduler.startDate || !scheduler.endDate || !scheduler.startTime || !scheduler.endTime) continue;
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
    setLoading(false);
  };

  // Get schedule count for an offer
  const getScheduleCount = offerId => schedules.filter(s => String(s.offerId) === String(offerId)).length;

  return (
    <div>
      {schedulers.map((scheduler, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <input placeholder="https://example.com" value={scheduler.url} onChange={e => updateScheduler(idx, 'url', e.target.value)} style={{ flex: 2 }} />
          <input type="time" value={scheduler.startTime} onChange={e => updateScheduler(idx, 'startTime', e.target.value)} />
          <input type="time" value={scheduler.endTime} onChange={e => updateScheduler(idx, 'endTime', e.target.value)} />
          <input type="date" value={scheduler.startDate} onChange={e => updateScheduler(idx, 'startDate', e.target.value)} />
          <input type="date" value={scheduler.endDate} onChange={e => updateScheduler(idx, 'endDate', e.target.value)} />
          {schedulers.length > 1 && (
            <button onClick={() => removeScheduler(idx)} style={{ background: 'red', color: '#fff', border: 'none', borderRadius: 4, padding: '0 10px' }}>Remove</button>
          )}
        </div>
      ))}
      <button onClick={addScheduler} style={{ marginBottom: 12 }}>+ Add More Entries</button>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button onClick={applySchedule} disabled={loading || selectedIds.length === 0 || schedulers.some(s => !s.url || !s.startDate || !s.endDate || !s.startTime || !s.endTime)}>
          {loading ? 'Applying...' : 'Apply to Selected'}
        </button>
        <button onClick={selectAll} style={{ marginRight: 8 }}>Select All</button>
        <button onClick={deselectAll} style={{ marginRight: 8 }}>Deselect All</button>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 12px #2224', marginTop: 18 }}>
        <table style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0,
          background: '#181c24',
          color: '#fff',
          borderRadius: 14,
          fontFamily: 'Montserrat, Arial, sans-serif',
          fontSize: 15,
          minWidth: 900
        }}>
          <thead>
            <tr style={{
              background: '#23263a',
              position: 'sticky',
              top: 0,
              zIndex: 2
            }}>
              <th style={{ padding: 10, borderTopLeftRadius: 14 }}> </th>
              <th style={{ padding: 10 }}>Row ID</th>
              <th style={{ padding: 10 }}>Offer Name</th>
              <th style={{ padding: 10 }}>Offer ID</th>
              <th style={{ padding: 10 }}>Image</th>
              <th style={{ padding: 10 }}>Target URL</th>
              <th style={{ padding: 10, borderTopRightRadius: 14 }}>Scheduling</th>
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
                <tr key={id}
                  style={{
                    background: idx % 2 === 0 ? '#23263a' : '#181c24',
                    transition: 'background 0.2s',
                    minHeight: 38,
                    height: 44
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#2d3748'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#23263a' : '#181c24'}
                >
                  <td style={{ padding: 10 }}>
                    <input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleOffer(id)}
                      style={{
                        width: 18, height: 18, accentColor: '#3182ce', borderRadius: 6,
                        boxShadow: selectedIds.includes(id) ? '0 0 0 2px #3182ce55' : undefined,
                        transition: 'box-shadow 0.2s'
                      }} />
                  </td>
                  <td style={{ padding: 10 }}>{idx + 1}</td>
                  <td style={{ padding: 10, fontWeight: 600 }}>{offer.title || id}</td>
                  <td style={{ padding: 10 }}>{id}</td>
                  <td style={{ padding: 10 }}>
                    {offer.image
                      ? <img src={offer.image} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '50%', border: '2px solid #3182ce' }} />
                      : <span style={{ color: '#aaa', fontSize: 13 }}>No Image</span>}
                  </td>
                  <td style={{ padding: 10 }}>
                    {offer.link || offer.preview_url
                      ? <a href={offer.link || offer.preview_url} target="_blank" rel="noopener noreferrer" style={{ color: '#90cdf4', textDecoration: 'underline' }}>View</a>
                      : <span style={{ color: '#aaa', fontSize: 13 }}>No URL</span>}
                  </td>
                  <td style={{ padding: 10, position: 'relative' }}>
                    <span style={{
                      background: hasActive ? '#38a169' : '#1976d2',
                      color: '#fff',
                      borderRadius: 12,
                      padding: '4px 14px',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: 'pointer',
                      boxShadow: hasActive ? '0 2px 8px #38a16944' : undefined
                    }}
                      title={hasActive ? 'At least one schedule is active now' : 'No active schedule'}>
                      {getScheduleCount(id)} Scheduled
                      {hasActive && <span style={{ marginLeft: 8, fontSize: 13, background: '#fff', color: '#38a169', borderRadius: 8, padding: '2px 8px', fontWeight: 600 }}>Active Now</span>}
                    </span>
                    {getScheduleCount(id) > 0 && (
                      <button onClick={() => setViewOfferId(id)} style={{
                        marginLeft: 10, background: '#23263a', color: '#90cdf4', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s'
                      }}>View</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {viewOfferId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(20,24,31,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => { setViewOfferId(null); setEditScheduleId(null); setError(''); }}>
          <div style={{
            background: '#23263a', color: '#fff', borderRadius: 18, padding: 36, minWidth: 420, maxWidth: 650,
            boxShadow: '0 8px 40px #000a', position: 'relative', fontFamily: 'Montserrat, Arial, sans-serif'
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => { setViewOfferId(null); setEditScheduleId(null); setError(''); }}
              style={{
                position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#fff',
                fontSize: 28, cursor: 'pointer', fontWeight: 700, opacity: 0.7
              }} title="Close">&times;</button>
            <h2 style={{ margin: 0, marginBottom: 18, fontWeight: 700, fontSize: 26, letterSpacing: 0.5 }}>
              Schedules for Offer <span style={{ color: '#90cdf4' }}>{viewOfferId}</span>
            </h2>
            {schedules.filter(s => String(s.offerId) === String(viewOfferId)).length === 0 && (
              <div style={{ color: '#aaa', fontSize: 16, margin: '24px 0' }}>No schedules.</div>
            )}
            <table style={{
              width: '100%', fontSize: 15, marginTop: 10, borderRadius: 12, overflow: 'hidden',
              background: '#181c24', boxShadow: '0 2px 12px #2224'
            }}>
              <thead>
                <tr style={{ background: '#23263a' }}>
                  <th style={{ padding: 8 }}>URL</th>
                  <th style={{ padding: 8 }}>Start</th>
                  <th style={{ padding: 8 }}>End</th>
                  <th style={{ padding: 8 }}>Status</th>
                  <th style={{ padding: 8 }}>Actions</th>
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
                    <tr key={s.id} style={{
                      background: editScheduleId === s.id ? '#2d3748' : (idx % 2 === 0 ? '#23263a' : '#181c24'),
                      borderBottom: '1px solid #23263a'
                    }}>
                      <td style={{ padding: 8 }}>
                        {editScheduleId === s.id ? (
                          <input value={editFields.url} onChange={e => setEditFields(f => ({ ...f, url: e.target.value }))}
                            style={{ width: 140, padding: 6, borderRadius: 6, border: '1px solid #444', background: '#23263a', color: '#fff' }} />
                        ) : (
                          <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: '#90cdf4', textDecoration: 'underline' }}>{s.url}</a>
                        )}
                      </td>
                      <td style={{ padding: 8 }}>
                        {editScheduleId === s.id ? (
                          <>
                            <input type="date" value={editFields.startDate} onChange={e => setEditFields(f => ({ ...f, startDate: e.target.value }))}
                              style={{ marginRight: 4, padding: 6, borderRadius: 6, border: '1px solid #444', background: '#23263a', color: '#fff' }} />
                            <input type="time" value={editFields.startTime} onChange={e => setEditFields(f => ({ ...f, startTime: e.target.value }))}
                              style={{ padding: 6, borderRadius: 6, border: '1px solid #444', background: '#23263a', color: '#fff' }} />
                          </>
                        ) : (
                          <span>{s.startDate} <span style={{ color: '#90cdf4' }}>{s.startTime}</span></span>
                        )}
                      </td>
                      <td style={{ padding: 8 }}>
                        {editScheduleId === s.id ? (
                          <>
                            <input type="date" value={editFields.endDate} onChange={e => setEditFields(f => ({ ...f, endDate: e.target.value }))}
                              style={{ marginRight: 4, padding: 6, borderRadius: 6, border: '1px solid #444', background: '#23263a', color: '#fff' }} />
                            <input type="time" value={editFields.endTime} onChange={e => setEditFields(f => ({ ...f, endTime: e.target.value }))}
                              style={{ padding: 6, borderRadius: 6, border: '1px solid #444', background: '#23263a', color: '#fff' }} />
                          </>
                        ) : (
                          <span>{s.endDate} <span style={{ color: '#90cdf4' }}>{s.endTime}</span></span>
                        )}
                      </td>
                      <td style={{ padding: 8 }}>
                        <span style={{
                          display: 'inline-block',
                          background: isActive ? '#38a169' : '#718096',
                          color: '#fff',
                          borderRadius: 12,
                          padding: '2px 12px',
                          fontWeight: 600,
                          fontSize: 13
                        }}>
                          {isActive ? 'Active Now' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: 8 }}>
                        {editScheduleId === s.id ? (
                          <>
                            <button onClick={async () => {
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
                                setError('All fields required.');
                                return;
                              }
                              if (overlap) {
                                setError('Schedule overlaps with another.');
                                return;
                              }
                              setError('');
                              await fetch(`http://localhost:5000/api/schedules/${s.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(editFields)
                              });
                              fetch('http://localhost:5000/api/schedules')
                                .then(res => res.json())
                                .then(setSchedules);
                              setEditScheduleId(null);
                            }} style={{
                              background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 14px', marginRight: 6, fontWeight: 600, cursor: 'pointer'
                            }}>Save</button>
                            <button onClick={() => { setEditScheduleId(null); setError(''); }} style={{
                              background: '#718096', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 14px', fontWeight: 600, cursor: 'pointer'
                            }}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditScheduleId(s.id); setEditFields({ url: s.url, startDate: s.startDate, endDate: s.endDate, startTime: s.startTime, endTime: s.endTime }); }}
                              style={{
                                background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 14px', marginRight: 6, fontWeight: 600, cursor: 'pointer'
                              }} title="Edit">✏️</button>
                            <button onClick={async () => {
                              await fetch(`http://localhost:5000/api/schedules/${s.id}`, { method: 'DELETE' });
                              fetch('http://localhost:5000/api/schedules')
                                .then(res => res.json())
                                .then(setSchedules);
                            }} style={{
                              background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 14px', fontWeight: 600, cursor: 'pointer'
                            }} title="Delete">🗑️</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

