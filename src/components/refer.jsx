import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import './refer.css';
/* global __firebase_config, __initial_auth_token, __app_id */

import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
// Removed: import './App.css'; // CSS will be linked externally or inlined in index.html

// Define the main App component
const App = () => {
    // State variables for referral link, users referred, copied message visibility, user ID, and Firebase instances
    const [referralLink, setReferralLink] = useState('https://yourgame.com/refer/YOURUNIQUECODE');
    const [usersReferred, setUsersReferred] = useState(0); // Initialize with 0
    const [showCopiedMessage, setShowCopiedMessage] = useState(false);
    const [userId, setUserId] = useState('');
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false); // To track if auth state is ready

    // Effect hook for Firebase initialization and authentication
    useEffect(() => {
        const initializeFirebase = async () => {
            try {
                // Parse Firebase config from global variable, or use an empty object if not defined
                const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
                // Initialize Firebase app
                const app = initializeApp(firebaseConfig);
                // Get Firestore and Auth instances
                const firestoreDb = getFirestore(app);
                const firebaseAuth = getAuth(app);

                // Set Firebase instances to state
                setDb(firestoreDb);
                setAuth(firebaseAuth);

                // Sign in with custom token if available, otherwise sign in anonymously
                if (typeof __initial_auth_token !== 'undefined') {
                    await signInWithCustomToken(firebaseAuth, __initial_auth_token);
                } else {
                    await signInAnonymously(firebaseAuth);
                }

                // Set up authentication state change listener
                onAuthStateChanged(firebaseAuth, (user) => {
                    if (user) {
                        setUserId(user.uid); // Set user ID from authenticated user
                    } else {
                        setUserId(crypto.randomUUID()); // Generate a random UUID if no user is signed in
                        console.log("No user is signed in.");
                    }
                    setIsAuthReady(true); // Mark authentication as ready
                });
            } catch (error) {
                console.error("Error initializing Firebase:", error);
            }
        };

        initializeFirebase(); // Call the initialization function
    }, []); // Empty dependency array ensures this runs only once on component mount

    // Effect hook for fetching user data from Firestore once authentication is ready
    useEffect(() => {
        if (db && userId && isAuthReady) {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            // Construct document reference for user's referral data
            const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/referralData`, 'userReferral');

            // Set up a real-time listener for the user's referral data
            const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Update state with data from Firestore, providing default values if not present
                    setReferralLink(data.referralLink || `https://yourgame.com/refer/${userId}`);
                    setUsersReferred(data.usersReferred || 0);
                } else {
                    console.log("No referral data found for this user. Creating default.");
                    // If no document exists, create a default one
                    setDoc(userDocRef, {
                        referralLink: `https://yourgame.com/refer/${userId}`,
                        usersReferred: 0
                    }).catch(e => console.error("Error setting initial doc:", e));
                }
            }, (error) => {
                console.error("Error fetching referral data:", error);
            });

            // Clean up the listener when the component unmounts or dependencies change
            return () => unsubscribe();
        }
    }, [db, userId, isAuthReady]); // Dependencies: db, userId, and isAuthReady

    // Function to copy the referral link to the clipboard
    const copyToClipboard = () => {
        // Create a temporary textarea element to hold the link
        const el = document.createElement('textarea');
        el.value = referralLink; // Set its value to the referral link
        document.body.appendChild(el); // Append it to the body
        el.select(); // Select the text
        document.execCommand('copy'); // Execute the copy command
        document.body.removeChild(el); // Remove the temporary element

        // Show "Link Copied!" message and hide it after 2 seconds
        setShowCopiedMessage(true);
        setTimeout(() => setShowCopiedMessage(false), 2000);
    };

    // Function to share the referral link on Facebook
    const shareOnFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
    };

    // Function to share the referral link on Twitter
    const shareOnTwitter = () => {
        window.open(`https://twitter.com/intent/tweet?text=Join me in this amazing game! Use my referral link: ${encodeURIComponent(referralLink)}`, '_blank');
    };

    // Function to share the referral link on WhatsApp
    const shareOnWhatsApp = () => {
        window.open(`https://api.whatsapp.com/send?text=Join me in this amazing game! Use my referral link: ${encodeURIComponent(referralLink)}`, '_blank');
    };

    return (
        // Main container for the application
        <div className="app-container">
            {/* User ID display at the top right */}
            <div className="user-id-display">
                User ID: {userId}
            </div>

            {/* Main content area, centered */}
            <main className="main-content">
                {/* Refer & Earn card */}
                <div className="refer-earn-card">
                    <h1 className="card-title">Refer & Earn</h1>
                    <p className="card-description">
                        Share your unique referral link and earn coins when friends join!
                    </p>

                    {/* Referral Link Section */}
                    <div className="referral-link-section">
                        <label htmlFor="referral-link" className="referral-link-label">
                            Your Referral Link:
                        </label>
                        <div className="referral-link-input-group">
                            <input
                                type="text"
                                id="referral-link"
                                className="referral-link-input"
                                value={referralLink}
                                readOnly
                            />
                            <button
                                onClick={copyToClipboard}
                                className="copy-button"
                            >
                                Copy Link
                            </button>
                        </div>
                        {showCopiedMessage && (
                            <p className="copied-message">Link Copied!</p>
                        )}
                    </div>

                    {/* Users Referred Section */}
                    <div className="users-referred-section">
                        <p className="users-referred-label">Users Referred:</p>
                        <p className="users-referred-count">{usersReferred}</p>
                    </div>

                    {/* Social Share Section */}
                    <div className="social-share-section">
                        <p className="social-share-label">Share on Social Media</p>
                        <div className="social-buttons-group">
                            {/* Facebook Share Button */}
                            <button
                                onClick={shareOnFacebook}
                                className="social-button facebook-button"
                                aria-label="Share on Facebook"
                            >
                                <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33V22H12c5.523 0 10-4.477 10-10z" clipRule="evenodd" />
                                </svg>
                            </button>
                            {/* Twitter Share Button */}
                            <button
                                onClick={shareOnTwitter}
                                className="social-button twitter-button"
                                aria-label="Share on Twitter"
                            >
                                <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.007-.532A8.318 8.318 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012 10.792v.058a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                </svg>
                            </button>
                            {/* WhatsApp Share Button */}
                            <button
                                onClick={shareOnWhatsApp}
                                className="social-button whatsapp-button"
                                aria-label="Share on WhatsApp"
                            >
                                <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M12.035 2.001c-5.522 0-10 4.478-10 10 0 1.95.565 3.82 1.618 5.44L2 22l4.52-1.182c1.583.87 3.35 1.344 5.515 1.344h.001c5.522 0 10-4.478 10-10s-4.478-10-10-10zm0 1.5c4.694 0 8.5 3.806 8.5 8.5s-3.806 8.5-8.5 8.5c-1.63 0-3.17-.46-4.507-1.28l-.32-.19-3.32.868.88-3.23-.21-.33c-.92-1.45-1.42-3.1-1.42-4.82 0-4.694 3.806-8.5 8.5-8.5zm-3.315 5.52c-.18-.09-.99-.49-.14-.04.85.45 1.46 1.77 1.46 1.77s-.18.09-.44.11c-.26.02-.45.02-.64-.02-.19-.04-.45-.14-.7-.34-.25-.2-.5-.49-.7-.78-.2-.29-.4-.59-.6-1.04-.2-.45-.05-.42.1-.57.15-.15.34-.35.49-.52.15-.18.2-.29.29-.44.09-.15.05-.29-.02-.44-.07-.15-.45-1.08-.62-1.46-.17-.38-.34-.31-.49-.32-.15-.01-.32-.01-.49-.01-.17 0-.44.04-.67.23-.23.19-.87.85-.87 2.07 0 1.22.9 2.4 1.02 2.56.12.16 1.76 2.69 4.26 3.73 2.5.99 2.5.66 2.96.62.46-.04 1.2-.49 1.37-.95.17-.46.17-.85.12-.95-.05-.1-.18-.16-.38-.27z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
