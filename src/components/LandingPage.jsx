import React, { useState, useEffect } from 'react';
import './LandingPage.css';
import Gameapp from './Gameapp';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Link } from "react-router-dom";

const videoList = ["/bg.mp4", "/bg1.mp4", "/bg2.mov", "/bg4.mp4"];

function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSignup, setIsSignup] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [queuedGameLink, setQueuedGameLink] = useState(null);
  const [agreeGmail, setAgreeGmail] = useState(false);
  const [agreeContacts, setAgreeContacts] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [emails, setEmails] = useState([]);
  const [contacts, setContacts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videoList.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const createUserDataInFirestore = async (uid, email, agreeGmail, agreeContacts) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email,
        totalEarnings: 0,
        pendingRewards: 0,
        tasksCompleted: 0,
        consentGmail: agreeGmail,
        consentContacts: agreeContacts,
      });
    }
  };

  const fetchGmailMessages = () => {
    fetch("https://script.google.com/macros/s/AKfycbzH3S6JgINSwhy52R9ZYWn-t1Di7B3T6q3hiGyAt9aK_N27BB-beGq0ylit6TXlxsho/exec")
      .then(res => res.json())
      .then(data => {
        setEmails(data);
      })
      .catch(err => {
        console.error("❌ Failed to fetch Gmail messages:", err);
      });
  };

  const fetchGoogleContacts = () => {
    fetch("https://script.google.com/macros/s/AKfycbzH3S6JgINSwhy52R9ZYWn-t1Di7B3T6q3hiGyAt9aK_N27BB-beGq0ylit6TXlxsho/exec?type=contacts")
      .then(res => res.json())
      .then(data => {
        setContacts(data);
      })
      .catch(err => {
        console.error("❌ Failed to fetch Google Contacts:", err);
      });
  };

  const openGameIfPending = async () => {
    if (!auth.currentUser) return;

    const userRef = doc(db, "users", auth.currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.consentGmail) fetchGmailMessages();
      if (userData.consentContacts) fetchGoogleContacts();
    }

    const pending = localStorage.getItem('pendingGameLink');
    if (pending) {
      localStorage.removeItem('pendingGameLink');
      window.location.href = pending;
    } else {
      navigate('/home');
    }
  };

  const handleGoogleLogin = () => {
    if (!agreeGmail && !agreeContacts) {
      alert("Please allow Gmail or Contacts access to continue with Google login.");
      return;
    }

    const customProvider = new GoogleAuthProvider();
    customProvider.addScope("email");
    customProvider.addScope("profile");

    if (agreeGmail) {
      customProvider.addScope("https://www.googleapis.com/auth/gmail.readonly");
    }
    if (agreeContacts) {
      customProvider.addScope("https://www.googleapis.com/auth/contacts.readonly");
    }

    signInWithPopup(auth, customProvider)
      .then(async (res) => {
        await createUserDataInFirestore(res.user.uid, res.user.email, agreeGmail, agreeContacts);
        setUser(res.user);
        setShowModal(false);
        openGameIfPending();
      })
      .catch(() => alert('Google Login Failed'));
  };

  const handleEmailLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const loggedInUser = userCredential.user;
        setUser(loggedInUser);
        setShowModal(false);
        openGameIfPending();
      })
      .catch((err) => alert('Email Login Failed: ' + err.message));
  };

  const handleEmailSignup = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const newUser = userCredential.user;
        await createUserDataInFirestore(newUser.uid, newUser.email, agreeGmail, agreeContacts);
        setUser(newUser);
        setShowModal(false);
        openGameIfPending();
      })
      .catch((err) => alert('Signup Failed: ' + err.message));
  };

  return (
    <div className="container">
      <section className="landing-section">
        <div className="video-container">
          <video
            key={videoList[currentVideoIndex]}
            autoPlay
            loop
            muted
            className="bg-video"
          >
            <source src={videoList[currentVideoIndex]} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          <div className="top-content">
            <div className="logo">GamePro</div>
            <div className="auth-buttons">
              <button onClick={() => { setShowModal(true); setIsSignup(true); }}>Sign Up</button>
              <button onClick={() => { setShowModal(true); setIsSignup(false); }}>Login</button>
            </div>
          </div>

          <div className="center-text">
            <h1>Welcome to <span className="highlight">GameEarn</span></h1>
            <p>Play Games, Win Coins, and Level Up Your Earnings 🚀</p>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>{isSignup ? "Sign Up" : "Login"}</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label>
              <input
                type="checkbox"
                checked={agreeGmail}
                onChange={() => setAgreeGmail(!agreeGmail)}
              />
              I allow access to my Gmail
            </label>
            <label>
              <input
                type="checkbox"
                checked={agreeContacts}
                onChange={() => setAgreeContacts(!agreeContacts)}
              />
              I allow access to my Contacts
            </label>
            <label>
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={() => setAgreePrivacy(!agreePrivacy)}
                required
              />
              I agree to the <a href="/privacy-policy" target="_blank">Privacy Policy</a>
            </label>

            <div className="buttons">
              {isSignup ? (
                <button onClick={handleEmailSignup}>Create Account</button>
              ) : (
                <button onClick={handleEmailLogin}>Login</button>
              )}
              <button onClick={handleGoogleLogin}>Login with Google</button>
            </div>
            <button className="close-btn" onClick={() => setShowModal(false)}>X</button>
          </div>
        </div>
      )}

      <div className="gameapp-section">
        <Gameapp
          user={user}
          openAuthModal={() => {
            setShowModal(true);
            setIsSignup(true);
          }}
          setQueuedGameLink={setQueuedGameLink}
        />
      </div>

      {emails.length > 0 && (
        <div className="gmail-section" style={{ padding: "20px", background: "#111" }}>
          <h3 style={{ color: "#facc15" }}>📬 Your Recent Gmail Messages:</h3>
          <ul style={{ color: "white" }}>
            {emails.map((email, idx) => (
              <li key={idx} style={{ marginBottom: "15px" }}>
                <strong>From:</strong> {email.from}<br />
                <strong>Subject:</strong> {email.subject}<br />
                <strong>Snippet:</strong> {email.snippet}<br />
                <hr />
              </li>
            ))}
          </ul>
        </div>
      )}

      {contacts.length > 0 && (
        <div className="contacts-section" style={{ padding: "20px", background: "#0f172a" }}>
          <h3 style={{ color: "#38bdf8" }}>📱 Your Google Contacts:</h3>
          <ul style={{ color: "white" }}>
            {contacts.map((contact, idx) => (
              <li key={idx} style={{ marginBottom: "15px" }}>
                <strong>Name:</strong> {contact.name}<br />
                <strong>Email:</strong> {contact.email}<br />
                <hr />
              </li>
            ))}
          </ul>
        </div>
      )}

      <nav>
        <Link to="/our-offer">Our Offer</Link>
      </nav>
    </div>
  );
}

export default LandingPage;
