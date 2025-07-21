import React, { useState, useEffect } from 'react';
import './App.css';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, provider } from './firebase';

const videos = ['/bg.mp4', '/bg1.mp4','/bg2.mov']; // Background videos

// Main App component
const App = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSignup, setIsSignup] = useState(true);
  const [currentVideo, setCurrentVideo] = useState(0);
  
  // Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  // Cycle videos every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideo((prev) => (prev + 1) % videos.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Authentication handlers
  const handleGoogleLogin = () => {
    signInWithPopup(auth, provider)
      .catch(() => alert('Google Login Failed'));
  };

  const handleEmailLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .catch((err) => alert('Email Login Failed: ' + err.message));
  };

  const handleEmailSignup = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .catch((err) => alert('Signup Failed: ' + err.message));
  };

  // Main content when authenticated
  if (user) {
    return <MainContent />;
  }

  // Login page when not authenticated
  return (
    <div className="app-container">
      {/* Background Video */}
      <video 
        key={videos[currentVideo]} 
        autoPlay 
        loop 
        muted 
        className="background-video"
      >
        <source src={videos[currentVideo]} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Top Bar */}
      <div className="top-bar">
        <div className="logo-container">
          <h1 className="logo">GamePro</h1>
        </div>
        <div className="auth-buttons">
          <button 
            className="auth-btn signup-btn" 
            onClick={() => { setShowModal(true); setIsSignup(true); }}
          >
            Sign Up
          </button>
          <button 
            className="auth-btn login-btn" 
            onClick={() => { setShowModal(true); setIsSignup(false); }}
          >
            Login
          </button>
        </div>
      </div>

      {/* Welcome Text */}
      <div className="welcome-container">
        <h1 className="welcome-title">Welcome to GameEarn</h1>
        <p className="welcome-subtitle">
          Play Games, Win Coins, and Level Up Your Earnings 🚀
        </p>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{isSignup ? "Sign Up" : "Login"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>X</button>
            </div>
            <div className="modal-body">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="modal-input"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="modal-input"
              />
              <div className="modal-actions">
                <button
                  className="auth-submit-btn"
                  onClick={isSignup ? handleEmailSignup : handleEmailLogin}
                >
                  {isSignup ? "Create Account" : "Login"}
                </button>
                <button className="google-auth-btn" onClick={handleGoogleLogin}>
                  Login with Google
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main content component (appears after authentication)
const MainContent = () => {
  const [messageBoxVisible, setMessageBoxVisible] = useState(false);
  const [messageBoxText, setMessageBoxText] = useState('');
  const [gameImage, setGameImage] = useState('');
  const [coinsImage, setCoinsImage] = useState('');
  const [moneyImage, setMoneyImage] = useState('');
  const [loadingImages, setLoadingImages] = useState(true);

  // Function to handle offer clicks
  const handleOfferClick = (offerName, offerUrl) => {
    if (offerUrl) {
      window.open(offerUrl, '_blank');
    } else {
      setMessageBoxText(`No URL available for: ${offerName}`);
      setMessageBoxVisible(true);
    }
  };

  // Close message box
  const closeMessageBox = () => {
    setMessageBoxVisible(false);
  };

  // Generate image using API
  const generateImage = async (prompt) => {
    try {
      const payload = { 
        instances: { prompt: prompt }, 
        parameters: { "sampleCount": 1 } 
      };
      const apiKey = "AIzaSyAXUluR3zaI5ha-bHBSB9ofqt6C6X3iLeg"; // Add your API key here
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API call failed: ${errorText}`);

        return null;
      }

      const result = await response.json();
      if (result.predictions?.[0]?.bytesBase64Encoded) {
        return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
      }
      return null;
    } catch (error) {
      console.error("Error generating image:", error);
      return null;
    }
  };

  // Generate images on component mount
  useEffect(() => {
    const fetchImages = async () => {
      setLoadingImages(true);
      const img1 = await generateImage("high quality premium image of a mobile phone screen displaying a rewards interface with various game and app offers like PUBG Mobile, Rise of Kingdoms, OSN, 8 Ball Pool, Subway Surfers, and a generic app, vibrant colors, clean UI, modern digital art, smooth animation feel");
      const img2 = await generateImage("high quality premium image of golden coins cascading into a digital wallet, dynamic motion blur, bright glow, secure and rewarding feel, digital illustration");
      const img3 = await generateImage("high quality premium image of a seamless transition from digital coins to a stack of crisp banknotes, flowing energy, secure transaction, financial growth concept, modern digital art");

      if (img1) setGameImage(img1);
      if (img2) setCoinsImage(img2);
      if (img3) setMoneyImage(img3);
      setLoadingImages(false);
    };

    fetchImages();
  }, []);

  // Offer data
  const gamingOffers = [
    { name: 'Water Color Sort', price: '$14.41', image: 'https://placehold.co/150x150/4a5568/ffffff?text=Game+1', url: 'https://www.example.com/water-color-sort', spent: '$0.50', got: '$1.00', bonusOffers: '2x points on next play' },
    { name: 'Grand Hotel Mania', price: '$5.89', image: 'https://placehold.co/150x150/4a5568/ffffff?text=Game+2', url: 'https://www.example.com/grand-hotel-mania', spent: '$1.20', got: '$2.50', bonusOffers: 'Free in-game currency' },
    { name: 'Colorwood Sort', price: '$6.02', image: 'https://placehold.co/150x150/4a5568/ffffff?text=Game+3', url: 'https://www.example.com/colorwood-sort', spent: '$0.75', got: '$1.50', bonusOffers: 'Exclusive level access' },
    { name: 'Multi Color Water', price: '$17.81', image: 'https://placehold.co/150x150/4a5568/ffffff?text=Game+4', url: 'https://www.example.com/multi-color-water', spent: '$2.00', got: '$4.00', bonusOffers: 'Bonus daily rewards' },
    { name: 'North Tower', price: '$3.73', image: 'https://placehold.co/150x150/4a5568/ffffff?text=Game+5', url: 'https://www.example.com/north-tower', spent: '$0.99', got: '$1.99', bonusOffers: 'Unlock new characters' },
  ];

  const otherOffers = [
    { name: 'Vegas Keno By', price: '$49.11', image: 'https://placehold.co/150x150/4a5568/ffffff?text=Offer+1', url: 'https://www.example.com/vegas-keno', spent: '$5.00', got: '$10.00', bonusOffers: '50% off next purchase' },
    { name: 'Alibaba.com - Other', price: '$0.21', image: 'https://placehold.co/150x150/4a5568/ffffff?text=Offer+2', url: 'https://www.alibaba.com', spent: '$0.10', got: '$0.20', bonusOffers: 'Extra discount on bulk' },
    { name: 'Mintorise', price: '$0.04', image: 'https://placehold.co/150x150/4a5568/ffffff?text=Offer+3', url: 'https://www.example.com/mintorise', spent: '$0.02', got: '$0.05', bonusOffers: 'First month free' },
    { name: 'Catalyse Research', price: '$0.34', image: 'https://placehold.co/150x150/4a5568/ffffff?text=Offer+4', url: 'https://www.example.com/catalyse-research', spent: '$0.15', got: '$0.30', bonusOffers: 'Access to premium reports' },
    { name: 'Another Offer', price: '$0.50', image: 'https://placehold.co/150x150/4a5568/ffffff?text=Offer+5', url: 'https://www.example.com/another-offer', spent: '$0.25', got: '$0.75', bonusOffers: 'Limited time bonus' },
  ];

  // OfferBox component
  const OfferBox = ({ name, price, image, url, spent, got, bonusOffers }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        className="relative bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => handleOfferClick(name, url)}
      >
        <div className="relative w-full h-32 sm:h-40 flex items-center justify-center p-2">
          <img src={image} alt={name} className="w-full h-full object-cover rounded-md" />
        </div>
        <div className="p-3 text-center">
          <h3 className="text-sm font-semibold text-white truncate">{name}</h3>
          <p className="text-green-400 text-xs mt-1">{price}</p>
        </div>

        {/* Hover details */}
        {isHovered && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex flex-col items-center justify-center p-2 rounded-lg text-white text-center transition-opacity duration-300 opacity-100">
            <p className="text-sm font-semibold mb-1">Spent: {spent}</p>
            <p className="text-sm font-semibold mb-2">Got: {got}</p>
            {bonusOffers && <p className="text-xs mb-3">{bonusOffers}</p>}
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-md shadow-md transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation();
                handleOfferClick(name, url);
              }}
            >
              View Offer
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-gray-900 text-gray-100" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale { animation: fadeInScale 0.5s ease-out forwards; }
        
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-left { animation: slideInFromLeft 0.7s ease-out forwards; }
      `}</style>
      
      <div className="container mx-auto py-8">
        {/* Gaming Offers */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Gaming Offers</h2>
            <a href="#" className="text-blue-400 hover:underline">View All</a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
            {gamingOffers.map((offer, index) => (
              <OfferBox key={index} {...offer} />
            ))}
          </div>
        </div>

        {/* Other Offers */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Other Offers</h2>
            <a href="#" className="text-blue-400 hover:underline">View All</a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
            {otherOffers.map((offer, index) => (
              <OfferBox key={index} {...offer} />
            ))}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center">
              {loadingImages ? (
                <div className="text-blue-400 text-5xl mb-4 animate-pulse">...</div>
              ) : (
                <img
                  src={gameImage}
                  alt="Choose Game"
                  className="w-24 h-24 object-contain mb-4 rounded-md animate-slide-in-left transform transition-transform duration-300 hover:scale-105"
                  style={{ animationDelay: '0.1s' }}
                  onError={(e) => e.target.src = "https://placehold.co/96x96/4a5568/ffffff?text=Image+Error"}
                />
              )}
              <h3 className="text-xl font-semibold text-white mb-2">1. Choose Your Game</h3>
              <p className="text-gray-300 text-sm">
                Browse through our wide selection of exciting games and offers. Pick one that suits your interest and start playing!
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center">
              {loadingImages ? (
                <div className="text-yellow-400 text-5xl mb-4 animate-pulse">...</div>
              ) : (
                <img
                  src={coinsImage}
                  alt="Earn Coins"
                  className="w-24 h-24 object-contain mb-4 rounded-md animate-fade-in-scale"
                  style={{ animationDelay: '0.2s' }}
                />
              )}
              <h3 className="text-xl font-semibold text-white mb-2">2. Earn Coins</h3>
              <p className="text-gray-300 text-sm">
                Play games, complete tasks, or engage with offers to accumulate valuable in-app coins. The more you play, the more you earn!
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center">
              {loadingImages ? (
                <div className="text-green-400 text-5xl mb-4 animate-pulse">...</div>
              ) : (
                <img
                  src={moneyImage}
                  alt="Convert to Money"
                  className="w-24 h-24 object-contain mb-4 rounded-md animate-fade-in-scale"
                  style={{ animationDelay: '0.3s' }}
                />
              )}
              <h3 className="text-xl font-semibold text-white mb-2">3. Convert to Money</h3>
              <p className="text-gray-300 text-sm">
                Once you've collected enough coins, easily convert them into real money or exciting rewards directly to your preferred payment method.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Why Trust Our Platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center">
              <div className="text-green-500 text-5xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-white mb-2">Secure Transactions</h3>
              <p className="text-gray-300 text-sm">
                Your earnings and personal data are protected with industry-leading encryption and security protocols.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center">
              <div className="text-blue-400 text-5xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-2">Transparent Earnings</h3>
              <p className="text-gray-300 text-sm">
                Track your progress and earnings in real-time with clear and concise reports. No hidden fees or surprises.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center">
              <div className="text-purple-400 text-5xl mb-4">📞</div>
              <h3 className="text-xl font-semibold text-white mb-2">24/7 Dedicated Support</h3>
              <p className="text-gray-300 text-sm">
                Our friendly support team is always here to help you with any questions or issues, anytime, anywhere.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Box */}
      {messageBoxVisible && (
        <div className="message-box" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          <p>{messageBoxText}</p>
          <button onClick={closeMessageBox}>OK</button>
        </div>
      )}
    </div>
  );
};

export default App;