// App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import {
  MailOpen,
  MousePointerClick,
  Mail,
  MessageSquareText,
  Ban,
  Send,
} from 'lucide-react';
/* global __app_id, __firebase_config, __initial_auth_token */

import './manage.css';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig =
  typeof __firebase_config !== 'undefined'
    ? JSON.parse(__firebase_config)
    : {};
const initialAuthToken =
  typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

function App() {
  const [activeTab, setActiveTab] = useState('campaign-analytics');
  const [userId, setUserId] = useState('Loading...');
  const [openedEmails, setOpenedEmails] = useState([]);
  const [clickedEmails, setClickedEmails] = useState([]);
  const [receivedEmails, setReceivedEmails] = useState([]);
  const [repliedEmails, setRepliedEmails] = useState([]);
  const [bouncedEmails, setBouncedEmails] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [displayedDetails, setDisplayedDetails] = useState([]);
  const [displayedDetailsTitle, setDisplayedDetailsTitle] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedCampaignName, setSelectedCampaignName] = useState('Select a Campaign');
  const [searchQuery, setSearchQuery] = useState('');
  const dbRef = useRef(null);
  const authRef = useRef(null);

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        if (Object.keys(firebaseConfig).length === 0) {
          console.error('Firebase config is missing.');
          showMessage('Firebase configuration error.', 'error');
          return;
        }
        const app = initializeApp(firebaseConfig);
        dbRef.current = getFirestore(app);
        authRef.current = getAuth(app);

        onAuthStateChanged(authRef.current, async (user) => {
          if (user) {
            setUserId(user.uid);
          } else {
            try {
              if (initialAuthToken) {
                await signInWithCustomToken(authRef.current, initialAuthToken);
              } else {
                await signInAnonymously(authRef.current);
              }
            } catch (error) {
              showMessage(`Auth failed: ${error.message}`, 'error');
            }
          }
        });
      } catch (error) {
        showMessage(`Firebase init failed: ${error.message}`, 'error');
      }
    };
    initializeFirebase();
  }, []);

  const generateDummyCampaigns = async () => {
    const publicRef = collection(dbRef.current, `artifacts/${appId}/public/data/campaigns`);
    const snapshot = await getDocs(publicRef);
    if (!snapshot.empty) return;

    const names = ['Launch', 'Newsletter', 'Promo'];
    for (let i = 0; i < names.length; i++) {
      const id = `campaign-${i + 1}`;
      const dummy = [
        { email: `a${i}@mail.com`, firstName: 'A', lastName: 'Z', type: 'received', timestamp: new Date().toISOString() },
        { email: `a${i}@mail.com`, firstName: 'A', lastName: 'Z', type: 'opened', timestamp: new Date().toISOString() },
      ];
      await setDoc(doc(publicRef, id), {
        campaignName: names[i],
        totalRecipients: dummy.length,
        interactions: dummy,
      });
    }
    showMessage('Dummy campaigns created.', 'success');
  };

  useEffect(() => {
    if (!dbRef.current || userId === 'Loading...') return;
    const publicRef = collection(dbRef.current, `artifacts/${appId}/public/data/campaigns`);
    const unsubscribe = onSnapshot(publicRef, (snap) => {
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, name: doc.data().campaignName }));
      setCampaigns(list);
      if (!selectedCampaignId && list.length > 0) {
        setSelectedCampaignId(list[0].id);
        setSelectedCampaignName(list[0].name);
      }
    });
    generateDummyCampaigns();
    return () => unsubscribe();
  }, [dbRef.current, userId]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredCampaigns(campaigns.filter(c => c.name.toLowerCase().includes(q)));
  }, [searchQuery, campaigns]);

  useEffect(() => {
    if (!dbRef.current || !selectedCampaignId) return;
    const docRef = doc(dbRef.current, `artifacts/${appId}/public/data/campaigns`, selectedCampaignId);
    const unsub = onSnapshot(docRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data().interactions || [];
      const parse = type => data
        .filter(i => i.type === type)
        .map(i => ({
          email: i.email,
          firstName: i.firstName,
          lastName: i.lastName,
          timestamp: new Date(i.timestamp).toLocaleString(),
        }));

      const opened = parse('opened');
      const clicked = parse('clicked');
      const received = parse('received');
      const replied = parse('replied');
      const bounced = parse('bounced');

      setOpenedEmails(opened);
      setClickedEmails(clicked);
      setReceivedEmails(received);
      setRepliedEmails(replied);
      setBouncedEmails(bounced);

      if (displayedDetails.length === 0 || displayedDetailsTitle === 'Who Opened') {
        setDisplayedDetails(opened);
        setDisplayedDetailsTitle('Who Opened');
      }
    });
    return () => unsub();
  }, [dbRef.current, selectedCampaignId]);

  const downloadCSV = (data, filename) => {
    if (!data.length) return showMessage('No data to download.', 'info');
    const headers = ['First Name', 'Last Name', 'Email', 'Timestamp'];
    const rows = data.map(r => [r.firstName, r.lastName, r.email, r.timestamp].join(','));
    const blob = new Blob([headers.join(',') + '\n' + rows.join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="main-app-wrapper">
      <header>
        <h1>Campaign Management Dashboard</h1>
        <p>User ID: {userId}</p>
      </header>

      <main>
        <input
          type="text"
          value={searchQuery}
          placeholder="Search..."
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          value={selectedCampaignId}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedCampaignId(id);
            const name = campaigns.find(c => c.id === id)?.name || 'Select';
            setSelectedCampaignName(name);
          }}
        >
          <option value="">Select a Campaign</option>
          {filteredCampaigns.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <section>
          <h2>{displayedDetailsTitle}</h2>
          <table>
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {displayedDetails.map((item, index) => (
                <tr key={index}>
                  <td>{item.firstName}</td>
                  <td>{item.lastName}</td>
                  <td>{item.email}</td>
                  <td>{item.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => downloadCSV(displayedDetails, displayedDetailsTitle.replace(/\s/g, '_'))}>Download CSV</button>
        </section>
      </main>

      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
    </div>
  );
}

export default App;
