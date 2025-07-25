import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mail, Phone, MapPin, Calendar, Settings, XCircle, Camera, Upload, Send, MessageSquare, Bot, Users, Trash2, Pin, Flag, MoreVertical, Edit2, Smile, CornerUpLeft, AtSign, Search, ChevronDown, ArrowLeft } from 'lucide-react';

// Firebase imports
import { initializeApp, getApps, getApp } from 'firebase/app'; // Added getApps and getApp
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
/* global __app_id, __firebase_config, __initial_auth_token */

// Initialize Firebase (using global variables provided by the Canvas environment)
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
let app;
// Check if a Firebase app already exists to prevent duplicate initialization errors
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // If app already exists, retrieve it
}
const db = getFirestore(app);
const auth = getAuth(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Helper function to format timestamp to "X min/hr/day ago"
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const now = new Date();
  const diffSeconds = Math.floor((now - date) / 1000);

  if (diffSeconds < 60) {
    return `${diffSeconds} sec ago`;
  } else if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)} min ago`;
  } else if (diffSeconds < 86400) {
    return `${Math.floor(diffSeconds / 3600)} hr ago`;
  } else {
    return `${Math.floor(diffSeconds / 86400)} day ago`;
  }
};

// Custom Modal Component to replace alert/confirm
const ConfirmationModal = ({ message, onConfirm, onCancel, showCancel = true }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-slate-800 text-white p-6 rounded-lg shadow-2xl max-w-sm w-full relative border border-purple-500">
        <p className="text-lg mb-6 text-center">{message}</p>
        <div className="flex justify-center gap-4">
          {showCancel && (
            <button
              className="bg-slate-600 hover:bg-slate-700 text-white py-2 px-5 rounded-lg font-semibold transition-all duration-200"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-5 rounded-lg font-semibold transition-all duration-200"
            onClick={onConfirm}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// User Detail Modal Component
const UserDetailModal = ({ user, onClose }) => {
  if (!user) return null;

  const handleAvatarError = (e) => {
    e.target.onerror = null;
    e.target.src = "https://ui-avatars.com/api/?name=User&background=random&color=fff&size=120";
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-2xl max-w-md w-full relative border border-purple-600 text-center">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors hover:scale-110"
          onClick={onClose}
        >
          <XCircle size={24} />
        </button>
        <h3 className="text-2xl font-bold mb-6">User Profile</h3>
        <div className="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden border-4 border-purple-400/60 shadow-2xl">
          <img src={user.avatar} alt="User Avatar" className="w-full h-full object-cover" onError={handleAvatarError} />
        </div>
        <h4 className="text-xl font-semibold mb-2">{user.name}</h4>
        <p className="text-gray-300 mb-4">{user.role || 'N/A'}</p>
        <div className="space-y-3 text-left max-w-xs mx-auto">
          <p className="flex items-center gap-3 text-gray-200"><Mail size={16} /> {user.email || 'N/A'}</p>
          <p className="flex items-center gap-3 text-gray-200"><Phone size={16} /> {user.phone || 'N/A'}</p>
          <p className="flex items-center gap-3 text-gray-200"><MapPin size={16} /> {user.location || 'N/A'}</p>
          <p className="flex items-center gap-3 text-gray-200"><Calendar size={16} /> Joined {user.joined || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

// AI Info Modal Component
const AiInfoModal = ({ onClose, aiAvatar }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-2xl max-w-md w-full relative border border-emerald-600 text-center">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors hover:scale-110"
          onClick={onClose}
        >
          <XCircle size={24} />
        </button>
        <h3 className="text-2xl font-bold mb-6 text-emerald-400">AI Assistant Profile</h3>
        <div className="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden border-4 border-emerald-400/60 shadow-2xl">
          <img src={aiAvatar} alt="AI Avatar" className="w-full h-full object-cover" />
        </div>
        <h4 className="text-xl font-semibold mb-2">AI Assistant</h4>
        <p className="text-gray-300 mb-4">Your friendly neighborhood digital helper!</p>
        <div className="space-y-3 text-left max-w-xs mx-auto">
          <p className="flex items-center gap-3 text-gray-200">
            <Bot size={16} /> **Origin:** Born in the cloud, powered by curiosity.
          </p>
          <p className="flex items-center gap-3 text-gray-200">
            <MessageSquare size={16} /> **Favorite Activity:** Answering questions (especially the tricky ones!).
          </p>
          <p className="flex items-center gap-3 text-gray-200">
            <Smile size={16} /> **Mood:** Always optimizing for helpfulness and a good laugh.
          </p>
          <p className="flex items-center gap-3 text-gray-200">
            <Calendar size={16} /> **Birthday:** Every time a new query is posed!
          </p>
        </div>
      </div>
    </div>
  );
};


// Admin Feedback Modal Component
const AdminFeedbackModal = ({ message, onClose, onSend }) => {
  const [feedbackText, setFeedbackText] = useState('');

  const handleSend = () => {
    if (feedbackText.trim() === '') {
      // Optionally show a message to the user that feedback cannot be empty
      // For now, we'll just prevent sending empty feedback.
      return;
    }
    onSend(message, feedbackText);
    onClose();
  };

  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-slate-800 text-white p-6 rounded-lg shadow-2xl max-w-sm w-full relative border border-purple-500">
        <h3 className="text-lg font-bold mb-4 text-center">Send Feedback to Admin</h3>
        {/* Updated line for message display with fallback */}
        <p className="text-sm text-gray-300 mb-4">Regarding message: "<span className="font-semibold">{message.text?.substring(0, 50) || 'No message content available'}{message.text && message.text.length > 50 ? '...' : ''}</span>"</p>
        <textarea
          className="w-full p-2 rounded-lg bg-slate-700 border border-purple-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y mb-4 no-scrollbar"
          rows="4"
          placeholder="Type your feedback here..."
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
        ></textarea>
        <div className="flex justify-end gap-4">
          <button
            className="bg-slate-600 hover:bg-slate-700 text-white py-2 px-5 rounded-lg font-semibold transition-all duration-200"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-5 rounded-lg font-semibold transition-all duration-200"
            onClick={handleSend}
          >
            Send Feedback
          </button>
        </div>
      </div>
    </div>
  );
};

// Emoji Picker Component (for reactions and input)
const EmojiPicker = ({ onEmojiSelect, onClose, positionRef }) => {
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓',
    '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😩', '😫', '😤', '😠', '😡', '🤬', '😈', '👿',
    '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋',
    '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊',
    '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦶', '👂', '👃', '🧠', '🫀', '🫁',
    '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸', '🦠', '🧫', '🧬', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗯️', '💭',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '🧡', '💛',
    '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗯️', '💭', '🔥', '✨', '🌟', '⚡', '🌈', '☀️', '☁️', '☔',
  ];

  const pickerRef = useRef(null);
  const [pickerStyle, setPickerStyle] = useState({});
  const [isOpening, setIsOpening] = useState(true); // Flag to prevent immediate closing

  useEffect(() => {
    // Set isOpening to false after a short delay to allow the click event to complete
    const openTimeout = setTimeout(() => {
      setIsOpening(false);
    }, 250); // Increased delay to 250ms for more robust behavior

    const calculatePosition = () => {
      if (positionRef.current && pickerRef.current) {
        const rect = positionRef.current.getBoundingClientRect();
        const pickerWidth = 240; // Fixed smaller width
        const pickerHeight = 200; // Fixed smaller height

        let top = rect.top - pickerHeight - 10; // 10px above the button
        let left = rect.right - pickerWidth; // Align right edge with button's right edge

        // Adjust if picker goes off screen top
        if (top < 0) {
          top = rect.bottom + 10; // Position below the button
        }

        // Adjust if picker goes off screen left
        if (left < 0) {
          left = 0; // Align to the left edge of the viewport
        }

        // Adjust if picker goes off screen right
        if (left + pickerWidth > window.innerWidth) {
          left = window.innerWidth - pickerWidth; // Align to the right edge of the viewport
        }

        setPickerStyle({
          top: `${top}px`,
          left: `${left}px`,
          width: `${pickerWidth}px`, // Set fixed width
          height: `${pickerHeight}px`, // Set fixed height
          overflowY: 'auto', // Enable vertical scrolling
          position: 'fixed',
          zIndex: 50,
        });
      }
    };

    // Use a small timeout to ensure the picker is rendered and has dimensions
    const positionTimeout = setTimeout(calculatePosition, 50); // Small delay for initial position calculation
    window.addEventListener('resize', calculatePosition);

    return () => {
      clearTimeout(openTimeout);
      clearTimeout(positionTimeout);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [positionRef]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the picker is still in its "opening" phase, ignore the click
      if (isOpening) {
        return;
      }

      // Check if the click is outside the picker AND outside the button that opened it
      if (pickerRef.current && !pickerRef.current.contains(event.target) &&
          positionRef.current && !positionRef.current.contains(event.target)) {
        onClose();
      }
    };
    // Attach mousedown listener after a very short delay to avoid immediate closing
    const listenerTimeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0); // 0ms delay to ensure it's added after the current event loop cycle

    return () => {
      clearTimeout(listenerTimeout);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, positionRef, isOpening]); // Add isOpening to dependencies

  return (
    <div
      ref={pickerRef}
      className="bg-slate-800 rounded-lg shadow-xl p-2 grid grid-cols-8 gap-1 border border-purple-500 emoji-picker-container" // Changed background to bg-slate-800
      style={pickerStyle}
    >
      {emojis.map((emoji, index) => (
        <button
          key={index}
          className="p-1 rounded-md hover:bg-purple-600 transition-colors text-xl"
          onClick={() => onEmojiSelect(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};


// Main App component to render the ProfileCard and AIChat
function App() {
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    role: "Product Manager",
    email: "john.doe@example.com",
    phone: "+1 234 567 890",
    location: "New York, USA",
    joined: "January 2020",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  });

  return (
    // The overall background is now handled by the CSS in the style tag
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center font-sans p-4 gap-8 relative">
      <ProfileCard profileData={profileData} setProfileData={setProfileData} />
      <AIChat userProfileAvatar={profileData.avatar} userProfileName={profileData.name} />
    </div>
  );
}

const ProfileCard = ({ profileData, setProfileData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(profileData);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showModal, setShowModal] = useState(null);

  useEffect(() => {
    setEditFormData(profileData);
  }, [profileData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        const userProfileDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);
        getDoc(userProfileDocRef).then((docSnap) => {
          if (docSnap.exists()) {
            setProfileData(prev => ({ ...prev, ...docSnap.data() }));
            setEditFormData(prev => ({ ...prev, ...docSnap.data() }));
          }
        }).catch(error => console.error("Error fetching user profile:", error));
      } else {
        setCurrentUserId(null);
      }
    });
    return () => unsubscribe();
  }, [setProfileData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData(prevData => ({ ...prevData, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!currentUserId) {
      setShowModal({ message: "Please wait for authentication to complete before saving.", onConfirm: () => setShowModal(null), showCancel: false });
      return;
    }
    try {
      const userProfileDocRef = doc(db, `artifacts/${appId}/users/${currentUserId}/profile/data`);
      await setDoc(userProfileDocRef, editFormData, { merge: true });
      setProfileData(editFormData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      setShowModal({ message: "Failed to save profile. Please try again.", onConfirm: () => setShowModal(null), showCancel: false });
    }
  };

  const handleCancel = () => {
    setEditFormData(profileData);
    setIsEditing(false);
  };

  const handleAvatarError = (e) => {
    e.target.onerror = null;
    e.target.src = "https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=white&size=120";
  };

  return (
    <>
      <div className="profile-card w-96">
        <div className="profile-content px-8 py-12 text-white text-center">
          <div className="w-32 h-32 mx-auto mb-8 rounded-full overflow-hidden border-4 border-purple-400/60 shadow-2xl">
            <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" onError={handleAvatarError} />
          </div>
          <h2 className="mb-3 text-4xl font-bold text-white tracking-tight">{profileData.name}</h2>
          <p className="mb-12 text-xl text-gray-300 font-medium">{profileData.role}</p>
          <div className="space-y-6 mb-12">
            <div className="flex items-center gap-5 text-lg text-gray-200">
              <div className="w-8 h-8 rounded-lg icon-neon flex items-center justify-center shadow-lg">
                <Mail className="text-white" size={16} />
              </div>
              <span className="text-left flex-1 font-bold">{profileData.email}</span>
            </div>
            <div className="flex items-center gap-5 text-lg text-gray-200">
              <div className="w-8 h-8 rounded-lg icon-neon flex items-center justify-center shadow-lg">
                <Phone className="text-white" size={16} />
              </div>
              <span className="text-left flex-1 font-bold">{profileData.phone}</span>
            </div>
            <div className="flex items-center gap-5 text-lg text-gray-200">
              <div className="w-8 h-8 rounded-lg icon-neon flex items-center justify-center shadow-lg">
                <MapPin className="text-white" size={16} />
              </div>
              <span className="text-left flex-1 font-bold">{profileData.location}</span>
            </div>
            <div className="flex items-center gap-5 text-lg text-gray-200">
              <div className="w-8 h-8 rounded-lg icon-neon flex items-center justify-center shadow-lg">
                <Calendar className="text-white" size={16} />
              </div>
              <span className="text-left flex-1 font-bold">Joined {profileData.joined}</span>
            </div>
          </div>
          <div className="flex justify-center gap-5">
            <button
              className="bg-gradient-to-br from-purple-700/80 to-purple-800/80 hover:from-purple-600/80 hover:to-purple-700/80 text-white py-4 px-10 rounded-2xl font-semibold text-lg transition-all duration-200 ease-in-out transform hover:scale-105 shadow-lg border border-purple-600/50 flex items-center gap-3 backdrop-blur-sm"
              onClick={() => setIsEditing(true)}
            >
              <Settings size={20} className="text-gray-300" />
              Edit Profile
            </button>
            <button
              className="bg-gradient-to-br from-purple-700/80 to-purple-800/80 hover:from-purple-600/80 hover:to-purple-700/80 text-white p-4 rounded-2xl flex items-center justify-center transition-all duration-200 ease-in-out transform hover:scale-105 shadow-lg border border-purple-600/50 backdrop-blur-sm">
              <Settings size={22} className="text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-800 text-white p-8 rounded-2xl shadow-2xl max-w-md w-full relative border border-purple-600">
            <h3 className="text-2xl font-bold mb-6 text-center">Edit Profile</h3>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors hover:scale-110"
              onClick={handleCancel}
            >
              <XCircle size={24} />
            </button>
            <div className="space-y-5 no-scrollbar" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="flex flex-col items-center mb-6">
                <label htmlFor="avatar-upload" className="block text-sm font-semibold text-gray-300 mb-3">Change Avatar</label>
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-purple-400 mb-4 flex items-center justify-center bg-gray-700 shadow-lg">
                  {editFormData.avatar ? (
                    <img src={editFormData.avatar} alt="Avatar Preview" className="w-full h-full object-cover" onError={handleAvatarError} />
                  ) : (
                    <Upload size={36} className="text-gray-400" />
                  )}
                </div>
                <input
                  type="file"
                  id="avatar-upload"
                  name="avatar-upload"
                  accept="image/*"
                  capture="user"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white py-2 px-5 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                  <Camera size={18} /> Upload or Take Photo
                </label>
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-300 mb-2 text-left">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editFormData.name}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-slate-700 border border-purple-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-gray-300 mb-2 text-left">Role</label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={editFormData.role}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-slate-700 border border-purple-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2 text-left">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-slate-700 border border-purple-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-300 mb-2 text-left">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-slate-700 border border-purple-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-gray-300 mb-2 text-left">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={editFormData.location}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-slate-700 border border-purple-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label htmlFor="joined" className="block text-sm font-semibold text-gray-300 mb-2 text-left">Joined Date</label>
                <input
                  type="text"
                  id="joined"
                  name="joined"
                  value={editFormData.joined}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-slate-700 border border-purple-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-8">
              <button
                className="bg-slate-600 hover:bg-slate-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 ease-in-out transform hover:scale-105"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 ease-in-out transform hover:scale-105"
                onClick={handleSave}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// AIChat Component
const AIChat = ({ userProfileAvatar, userProfileName }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false); // New state to track auth readiness
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showModal, setShowModal] = useState(null);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [chatMode, setChatMode] = useState('group'); // Default to group chat
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false); // For emoji picker on input
  const [showReactionPicker, setShowReactionPicker] = useState(null); // messageId for reaction picker
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null); // { messageId: string, senderName: string, messageText: string }
  const [adminFeedbackMessage, setAdminFeedbackMessage] = useState(null); // Holds the message object for feedback
  const [showAiInfoModal, setShowAiInfoModal] = useState(false); // State for AI info modal
  const [showSearchInput, setShowSearchInput] = useState(false); // State for search input visibility
  const [searchTerm, setSearchTerm] = useState(''); // State for search term
  const [showLobbyDropdown, setShowLobbyDropdown] = useState(false); // State for Global Lobby dropdown

  const messagesEndRef = useRef(null);
  const dropdownRefs = useRef({});
  const reactionButtonRefs = useRef({}); // To store refs for each reaction button
  const inputEmojiButtonRef = useRef(null); // Ref for the input emoji button
  const messageInputRef = useRef(null); // Ref for the message input textarea
  const lobbyDropdownRef = useRef(null); // Ref for the Global Lobby dropdown

  // Updated AI avatar URL
  const aiAvatar = "https://static.vecteezy.com/system/resources/previews/007/388/612/non_2x/winking-robot-emoji-color-icon-happy-and-funny-chatbot-smiley-chat-bot-emoticon-artificial-conversational-entity-virtual-assistant-artificial-intelligence-isolated-illustration-vector.jpg";

  // Authentication and Firestore setup
  useEffect(() => {
    const signIn = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined') {
          await signInWithCustomToken(auth, __initial_auth_token);
          console.log("Signed in with custom token.");
        } else {
          await signInAnonymously(auth);
          console.log("Signed in anonymously.");
        }
      } catch (error) {
        console.error("Firebase authentication error during signIn:", error);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        console.log("Auth state changed: User is logged in. UID:", user.uid);
      } else {
        setCurrentUserId(null);
        console.log("Auth state changed: User is logged out.");
      }
      setIsAuthReady(true); // Set auth ready after initial check
      console.log("isAuthReady set to true.");
    });

    signIn(); // Call signIn immediately

    return () => unsubscribeAuth();
  }, []);

  // Determine which Firestore collection to use based on chatMode
  const getMessagesCollectionRef = useCallback(() => {
    return chatMode === 'ai'
      ? collection(db, `artifacts/${appId}/public/data/chat_messages_ai`)
      : collection(db, `artifacts/${appId}/public/data/chat_messages_group`);
  }, [chatMode, appId]);

  // Real-time messages from Firestore
  useEffect(() => {
    if (!currentUserId || !isAuthReady) { // Ensure auth is ready before fetching messages
      console.log("Skipping message fetch: currentUserId or isAuthReady not set.", { currentUserId, isAuthReady });
      return;
    }

    console.log("Attempting to fetch messages for currentUserId:", currentUserId);
    const messagesCollectionRef = getMessagesCollectionRef();
    const q = query(messagesCollectionRef, orderBy('timestamp'));

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort messages by server timestamp first, then by local timestamp for pending messages
      fetchedMessages.sort((a, b) => {
        const timestampA = a.timestamp?.toMillis() || a.localTimestamp || 0;
        const timestampB = b.timestamp?.toMillis() || b.localTimestamp || 0;
        return timestampA - timestampB;
      });

      setMessages(fetchedMessages);
      console.log("Messages fetched:", fetchedMessages.length);

      const foundPinned = fetchedMessages.find(msg => msg.pinned);
      setPinnedMessage(foundPinned);
    }, (error) => {
      console.error("Error fetching messages:", error);
    });

    return () => unsubscribeMessages();
  }, [currentUserId, isAuthReady, getMessagesCollectionRef]); // Add isAuthReady to dependencies

  // Real-time online users and their profiles (simplified to count only)
  useEffect(() => {
    if (!currentUserId || !isAuthReady) { // Ensure auth is ready
      console.log("Skipping online users update: currentUserId or isAuthReady not set.", { currentUserId, isAuthReady });
      return;
    }

    console.log("Starting online user presence for:", currentUserId);
    const usersOnlineCollectionRef = collection(db, `artifacts/${appId}/public/data/users_online`);
    const currentUserDocRef = doc(usersOnlineCollectionRef, currentUserId);

    const updateLastActive = async () => {
      try {
        await setDoc(currentUserDocRef, {
          userId: currentUserId,
          last_active: serverTimestamp(),
          name: userProfileName,
          avatar: userProfileAvatar,
        }, { merge: true });
        console.log("Updated last active for user:", currentUserId);
      } catch (error) {
        console.error("Error updating last active:", error);
      }
    };

    updateLastActive();
    const intervalId = setInterval(updateLastActive, 30000);

    const unsubscribeOnlineUsers = onSnapshot(usersOnlineCollectionRef, async (snapshot) => {
      const now = Date.now();
      const activeUserIds = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.last_active && (now - data.last_active.toMillis()) < 60000;
      }).map(doc => doc.id);

      const onlineUsersData = await Promise.all(
        activeUserIds.map(async (uid) => {
          const userProfileDocRef = doc(db, `artifacts/${appId}/users/${uid}/profile/data`);
          const docSnap = await getDoc(userProfileDocRef);
          if (docSnap.exists()) {
            return { id: uid, ...docSnap.data() };
          }
          return { id: uid, name: `User ${uid.substring(0, 4)}`, avatar: "https://ui-avatars.com/api/?name=User&background=random&color=fff&size=128" };
        })
      );
      setOnlineUsers(onlineUsersData);
      console.log("Online users updated:", onlineUsersData.length);
    }, (error) => {
      console.error("Error fetching online users:", error);
    });

    return () => {
      clearInterval(intervalId);
      unsubscribeOnlineUsers();
    };
  }, [currentUserId, isAuthReady, userProfileAvatar, userProfileName]);

  // Scroll to the bottom of the chat on new messages
  useEffect(() => {
    if (isChatOpen && messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messages, isChatOpen]);

  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Initial welcome message for the AI (only if no messages exist and chat is opened in AI mode)
  useEffect(() => {
    if (isChatOpen && chatMode === 'ai' && messages.length === 0 && currentUserId && isAuthReady) {
      const addWelcomeMessage = async () => {
        const welcomeMessage = {
          text: "Welcome to AI Assistant! I'm here to help you. What specific support would you like me to focus on?",
          sender: 'ai',
          senderName: 'AI Assistant',
          avatar: aiAvatar,
          timestamp: serverTimestamp(),
          userId: 'ai-bot',
          reactions: {},
        };
        try {
          await addDoc(collection(db, `artifacts/${appId}/public/data/chat_messages_ai`), welcomeMessage);
          console.log("AI welcome message added.");
        } catch (error) {
          console.error("Error adding welcome message:", error);
        }
      };
      addWelcomeMessage();
    }
  }, [isChatOpen, messages.length, currentUserId, isAuthReady, chatMode, aiAvatar]);


  const sendMessage = async () => {
    if (input.trim() === '' || !currentUserId || !isAuthReady) {
      console.warn("Cannot send message: Input empty, not authenticated, or auth not ready.", { input, currentUserId, isAuthReady });
      return;
    }

    const messageToSend = {
      text: input,
      sender: 'user',
      senderName: userProfileName,
      avatar: userProfileAvatar,
      timestamp: serverTimestamp(), // Firestore server timestamp
      localTimestamp: Date.now(), // Client-side timestamp for immediate sorting
      userId: currentUserId,
      reactions: {},
      ...(replyingTo && {
        repliedToMessageId: replyingTo.messageId,
        repliedToSenderName: replyingTo.senderName,
        repliedToMessageText: replyingTo.messageText,
      }),
    };

    setInput('');
    setReplyingTo(null);
    if (chatMode === 'ai') {
      setIsLoading(true);
    }

    try {
      const currentCollectionRef = getMessagesCollectionRef();
      await addDoc(currentCollectionRef, messageToSend);
      console.log("User message sent to Firestore.");

      if (chatMode === 'ai') {
        let chatHistory = [{ role: "user", parts: [{ text: messageToSend.text }] }];
        const payload = { contents: chatHistory };
        const apiKey = "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
          const aiResponseText = result.candidates[0].content.parts[0].text;
          const aiMessage = {
            text: aiResponseText,
            sender: 'ai',
            senderName: 'AI Assistant',
            avatar: aiAvatar,
            timestamp: serverTimestamp(),
            localTimestamp: Date.now(), // Also add local timestamp for AI messages
            userId: 'ai-bot',
            reactions: {},
          };
          await addDoc(currentCollectionRef, aiMessage);
          console.log("AI response message added to Firestore.");
        } else {
          const errorMessage = {
            text: "Sorry, I couldn't get a response from AI. Please try again.",
            sender: 'ai',
            senderName: 'AI Assistant',
            avatar: aiAvatar,
            timestamp: serverTimestamp(),
            localTimestamp: Date.now(), // Also add local timestamp for error messages
            userId: 'ai-bot',
            reactions: {},
          };
          await addDoc(currentCollectionRef, errorMessage);
          console.error("Unexpected API response structure:", result);
        }
      }
    } catch (error) {
      console.error("Error sending message or fetching AI response:", error);
      const networkErrorMessage = {
        text: "There was an error connecting. Please check your network or try again.",
        sender: 'ai',
        senderName: 'AI Assistant',
        avatar: aiAvatar,
        timestamp: serverTimestamp(),
        localTimestamp: Date.now(), // Also add local timestamp for network error messages
        userId: 'ai-bot',
        reactions: {},
      };
      const currentCollectionRef = getMessagesCollectionRef();
      await addDoc(currentCollectionRef, networkErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleDeleteMessage = (messageId, senderId) => {
    setShowModal({
      message: "Are you sure you want to delete this message?",
      onConfirm: async () => {
        if (currentUserId === senderId) {
          try {
            await deleteDoc(doc(getMessagesCollectionRef(), messageId));
            setShowModal(null);
          } catch (error) {
            console.error("Error deleting message:", error);
            setShowModal({ message: "Failed to delete message. Please try again.", onConfirm: () => setShowModal(null), showCancel: false });
          }
        } else {
          setShowModal({ message: "You can only delete your own messages.", onConfirm: () => setShowModal(null), showCancel: false });
        }
      },
      onCancel: () => setShowModal(null),
      showCancel: true
    });
  };

  const handleTogglePinMessage = async (messageId, isPinned) => {
    try {
      await updateDoc(doc(getMessagesCollectionRef(), messageId), {
        pinned: !isPinned,
      });
      setShowModal({ message: `Message ${!isPinned ? 'pinned' : 'unpinned'}!`, onConfirm: () => setShowModal(null), showCancel: false });
    } catch (error) {
      console.error("Error toggling pin:", error);
      setShowModal({ message: "Failed to toggle pin. Please try again.", onConfirm: () => setShowModal(null), showCancel: false });
    } finally {
      setActiveDropdown(null);
    }
  };

  const handleMarkAsRead = (messageId) => {
    setShowModal({ message: "Message marked as read! (This is a client-side action for now)", onConfirm: () => setShowModal(null), showCancel: false });
    setActiveDropdown(null);
  };

  const handleEditMessage = (messageId, currentText) => {
    setEditingMessageId(messageId);
    setEditingMessageText(currentText);
    setActiveDropdown(null);
  };

  const handleSaveEdit = async (messageId) => {
    if (editingMessageText.trim() === '') {
      setShowModal({ message: "Message cannot be empty.", onConfirm: () => setShowModal(null), showCancel: false });
      return;
    }
    try {
      await updateDoc(doc(getMessagesCollectionRef(), messageId), {
        text: editingMessageText,
        edited: true,
      });
      setEditingMessageId(null);
      setEditingMessageText('');
      setShowModal({ message: "Message updated successfully!", onConfirm: () => setShowModal(null), showCancel: false });
    } catch (error) {
      console.error("Error updating message:", error);
      setShowModal({ message: "Failed to update message. Please try again.", onConfirm: () => setShowModal(null), showCancel: false });
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageText('');
  };

  const handleSuggestToAdmin = (message) => {
    setAdminFeedbackMessage(message); // Open the feedback modal with the message
    setActiveDropdown(null); // Close the dropdown
  };

  const sendFeedbackToAdmin = async (message, feedback) => {
    if (!currentUserId) {
      setShowModal({ message: "Please sign in to send feedback to admin.", onConfirm: () => setShowModal(null), showCancel: false });
      return;
    }
    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/admin_feedback`), {
        feedbackMessage: feedback,
        originalMessageText: message.text, // Store original message text
        originalMessageId: message.id,
        senderId: currentUserId,
        senderName: userProfileName,
        senderAvatar: userProfileAvatar,
        timestamp: serverTimestamp(),
      });
      setShowModal({ message: "Feedback sent to admin successfully!", onConfirm: () => setShowModal(null), showCancel: false });
    } catch (error) {
      console.error("Error sending feedback to admin:", error);
      setShowModal({ message: "Failed to send feedback. Please try again.", onConfirm: () => setShowModal(null), showCancel: false });
    }
  };

  const handleEmojiReaction = async (messageId, emoji) => {
    if (!currentUserId) {
      console.error("No current user to add reaction.");
      return;
    }

    try {
      const messageRef = doc(getMessagesCollectionRef(), messageId);
      const messageSnap = await getDoc(messageRef);

      if (messageSnap.exists()) {
        const currentReactions = messageSnap.data().reactions || {};
        const userReactionsForEmoji = currentReactions[emoji] || [];

        let newReactions;
        if (userReactionsForEmoji.includes(currentUserId)) {
          // User already reacted with this emoji, remove their reaction
          newReactions = {
            ...currentReactions,
            [emoji]: userReactionsForEmoji.filter(uid => uid !== currentUserId)
          };
        } else {
          // User has not reacted with this emoji, add their reaction
          newReactions = {
            ...currentReactions,
            [emoji]: [...userReactionsForEmoji, currentUserId]
          };
        }

        // Clean up empty emoji arrays
        for (const key in newReactions) {
          if (newReactions[key].length === 0) {
            delete newReactions[key];
          }
        }

        await updateDoc(messageRef, { reactions: newReactions });
      } else {
        console.warn("Message not found for reaction:", messageId);
      }
    } catch (error) {
      console.error("Error updating emoji reaction:", error);
      setShowModal({ message: "Failed to add/remove reaction. Please try again.", onConfirm: () => setShowModal(null), showCancel: false });
    } finally {
      setShowReactionPicker(null);
      setActiveDropdown(null);
    }
  };

  const handleReplyToMessage = (message) => {
    setReplyingTo({
      messageId: message.id,
      senderName: message.senderName,
      messageText: message.text,
    });
    setActiveDropdown(null); // Close dropdown
    // Optionally, focus the input field
    // inputRef.current.focus();
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const scrollToMessage = (messageId) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-message');
      setTimeout(() => {
        element.classList.remove('highlight-message');
      }, 2000);
    }
  };

  const toggleDropdown = useCallback((messageId) => {
    setActiveDropdown(prev => (prev === messageId ? null : messageId));
    setShowReactionPicker(null);
  }, []);

  const toggleInputEmojiPicker = useCallback(() => {
    setShowInputEmojiPicker(prev => !prev);
    setShowReactionPicker(null); // Close reaction picker if input emoji picker is opened
  }, []);

  const toggleReactionPicker = useCallback((messageId) => {
    setShowReactionPicker(prev => (prev === messageId ? null : messageId));
    setActiveDropdown(null);
    setShowInputEmojiPicker(false); // Close input emoji picker if reaction picker is opened
  }, []);

  const handleInputEmojiSelect = (emoji) => {
    setInput(prev => prev + emoji);
    setShowInputEmojiPicker(false);
  };

  // New function to handle tagging a user
  const handleTagUser = (username) => {
    setInput(prev => `${prev}@${username} `); // Add "@username " to the input
    if (messageInputRef.current) {
      messageInputRef.current.focus(); // Focus the input field
    }
    setActiveDropdown(null); // Close any open dropdowns
  };


  // Close dropdowns/pickers if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && dropdownRefs.current[activeDropdown] && !dropdownRefs.current[activeDropdown].contains(event.target)) {
        setActiveDropdown(null);
      }
      // Close input emoji picker if clicked outside its container or associated button
      if (showInputEmojiPicker) {
        const inputEmojiPickerElement = document.querySelector('.emoji-picker-container'); // Assuming this class is on the picker's root div
        const inputEmojiButtonElement = inputEmojiButtonRef.current;

        // Only close if the click is outside the picker AND not on the button that opened it
        if (inputEmojiPickerElement && !inputEmojiPickerElement.contains(event.target) &&
            inputEmojiButtonElement && !inputEmojiButtonElement.contains(event.target)) {
          setShowInputEmojiPicker(false);
        }
      }
      // Close reaction picker if clicked outside its container or associated button
      if (showReactionPicker) {
        const reactionPickerElement = document.querySelector('.emoji-picker-container'); // Assuming this class is on the picker's root div
        const reactionButtonElement = reactionButtonRefs.current[showReactionPicker];

        // Only close if the click is outside the picker AND not on the button that opened it
        if (reactionPickerElement && !reactionPickerElement.contains(event.target) &&
            reactionButtonElement && !reactionButtonElement.contains(event.target)) {
          setShowReactionPicker(null);
        }
      }
      // Close lobby dropdown if clicked outside
      if (showLobbyDropdown && lobbyDropdownRef.current && !lobbyDropdownRef.current.contains(event.target)) {
        setShowLobbyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown, showInputEmojiPicker, showReactionPicker, showLobbyDropdown]);


  const handleUserAvatarClick = async (userId) => {
    if (userId === 'ai-bot') {
      setShowAiInfoModal(true);
      return;
    }
    try {
      const userProfileDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile/data`);
      const docSnap = await getDoc(userProfileDocRef);
      if (docSnap.exists()) {
        setSelectedUserDetail({ id: userId, ...docSnap.data() });
      } else {
        const onlineUserData = onlineUsers.find(u => u.id === userId);
        if (onlineUserData) {
          setSelectedUserDetail(onlineUserData);
        } else {
          setShowModal({ message: "User profile not found.", onConfirm: () => setShowModal(null), showCancel: false });
        }
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setShowModal({ message: "Failed to fetch user details.", onConfirm: () => setShowModal(null), showCancel: false });
    }
  };


  return (
    <div className="fixed bottom-8 right-8 z-50">
      {!isChatOpen ? (
        <button
          className="bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 flex items-center justify-center"
          onClick={() => setIsChatOpen(true)}
          aria-label="Open Chat"
        >
          <MessageSquare size={32} />
        </button>
      ) : (
        <div className="chat-card w-[350px] h-[calc(100vh-4rem)] flex flex-col rounded-2xl shadow-2xl border border-gray-700 overflow-hidden transition-all duration-300 ease-in-out bg-[#1A202C]"> {/* Main chat container background */}
          {/* Chat Header */}
          <div className="p-4 bg-[#0B1020] text-white font-bold text-lg rounded-t-2xl border-b border-gray-700 flex justify-between items-center shadow-lg">
            <button
              className="text-gray-300 hover:text-white transition-colors hover:scale-110 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500"
              onClick={() => setIsChatOpen(false)}
              aria-label="Close chat"
            >
              <ArrowLeft size={24} />
            </button>
            {showSearchInput ? (
              <input
                type="text"
                placeholder="Search messages..."
                className="flex-1 ml-2 p-1.5 rounded-full bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            ) : (
              <div className="relative flex items-center gap-2">
                <button
                  className="flex items-center gap-1 text-xl font-bold text-white hover:text-gray-300 transition-colors"
                  onClick={() => setShowLobbyDropdown(prev => !prev)}
                  ref={lobbyDropdownRef}
                >
                  Global Lobby <ChevronDown size={20} className="text-gray-400" />
                </button>
                {showLobbyDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-40 bg-gray-800 rounded-lg shadow-xl py-1 text-sm z-20 border border-gray-700">
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200">Option 1</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200">Option 2</button>
                  </div>
                )}
                <button
                  className="text-gray-300 hover:text-white transition-colors hover:scale-110 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                  aria-label="More options"
                >
                  <MoreVertical size={24} />
                </button>
              </div>
            )}
            <button
              className="text-gray-300 hover:text-white transition-colors hover:scale-110 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500"
              onClick={() => setShowSearchInput(prev => !prev)} // Toggle search input
              aria-label="Search"
            >
              <Search size={24} />
            </button>
          </div>

          {/* Online Users Count and Chat Mode Selection */}
          <div className="flex items-center justify-between p-3 bg-[#1A202C] border-b border-gray-700 text-gray-300">
            {/* Display online users count */}
            <span className="font-semibold text-gray-200">Online: <span className="text-emerald-400">{onlineUsers.length}</span> users</span>
            <div className="flex items-center gap-2">
              {/* Chat mode toggle with icons */}
              <button
                className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full ${chatMode === 'group' ? 'bg-[#343D4F] text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                onClick={() => setChatMode('group')}
              >
                <Users size={16} />
              </button>
              <button
                className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full ${chatMode === 'ai' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                onClick={() => setChatMode('ai')}
              >
                <Bot size={16} />
              </button>
            </div>
          </div>

          {pinnedMessage && (
            <div className="p-3 bg-gray-800 border-b border-gray-700 text-sm text-gray-100 flex items-center gap-3 shadow-inner shadow-gray-900/30">
              <Pin size={18} className="text-yellow-300 flex-shrink-0" />
              <span className="truncate">{pinnedMessage.text}</span>
            </div>
          )}

          <div className="flex-1 p-4 space-y-4 no-scrollbar chat-messages-container relative z-0">
            {/* Background gradient for chat messages container */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0B1020] to-[#1A103F] opacity-90"></div>
            <div className="absolute inset-0 bg-black/30 z-10"></div> {/* Semi-transparent dark overlay */}

            {/* Filter messages based on search term */}
            {messages.filter(msg =>
              msg.text.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((msg, index) => (
              <div
                key={msg.id || index}
                id={`message-${msg.id}`} // Add ID for scrolling to message
                className={`flex gap-3 group relative z-20 ${msg.userId === currentUserId ? 'justify-end' : 'justify-start'}`}
                onDoubleClick={() => handleReplyToMessage(msg)} // Double click to reply
              >
                {/* Avatar for receiver's messages (left side) and AI messages */}
                {(msg.userId !== currentUserId || msg.sender === 'ai') && (
                  <img
                    src={msg.sender === 'ai' ? aiAvatar : msg.avatar}
                    alt={`${msg.senderName} Avatar`}
                    className="w-10 h-10 rounded-full object-cover shadow-lg flex-shrink-0 cursor-pointer border-2 border-purple-400/60"
                    onClick={() => handleUserAvatarClick(msg.userId)}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://ui-avatars.com/api/?name=User&background=random&color=fff&size=128";
                    }}
                  />
                )}

                <div className="flex flex-col max-w-[75%]">
                  {/* Sender Name and Timestamp */}
                  <div className={`flex flex-col items-start gap-0.5 mb-1 ${msg.userId === currentUserId ? 'items-end' : 'items-start'}`}>
                    <span className="font-bold text-white text-sm">{msg.senderName}</span>
                    <span className="text-gray-400 text-xs">{formatTimestamp(msg.timestamp)}</span>
                  </div>

                  {msg.repliedToMessageId && ( // Display replied-to message snippet
                    <div
                      className="bg-gray-700 text-gray-300 text-xs p-2 rounded-lg mb-1 cursor-pointer hover:bg-gray-600 transition-colors border-l-2 border-purple-400 shadow-sm"
                      onClick={() => scrollToMessage(msg.repliedToMessageId)}
                      title={`Go to original message by ${msg.repliedToSenderName}`}
                    >
                      <span className="font-semibold">{msg.repliedToSenderName}:</span> {msg.repliedToMessageText.substring(0, 40)}{msg.repliedToMessageText.length > 40 ? '...' : ''}
                    </div>
                  )}

                  {editingMessageId === msg.id ? (
                    <div className="flex flex-col gap-2 p-3 rounded-lg shadow-lg bg-[#2A275F] text-white text-base max-w-full">
                      <textarea
                        value={editingMessageText}
                        onChange={(e) => setEditingMessageText(e.target.value)}
                        className="w-full p-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none no-scrollbar"
                        rows="3"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-600 hover:bg-gray-500 text-white text-xs py-1 px-3 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(msg.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs py-1 px-3 rounded-md transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`relative p-3 shadow-md text-base break-words message-bubble rounded-xl bg-[#2A275F] ${msg.userId === currentUserId
                        ? 'text-white'
                        : 'text-gray-200'
                      }`}
                      style={{boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4), 0 0 10px rgba(42, 39, 95, 0.6)'}} // Soft shadow and subtle glow
                    >
                      <span className="message-text flex-1">
                        {msg.text}
                        {msg.edited && <span className="text-xs text-gray-400 ml-2">(edited)</span>}
                      </span>

                      {/* Reactions display */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 absolute -bottom-3 left-0 right-0 justify-end px-2"> {/* Adjusted position */}
                          {Object.entries(msg.reactions).map(([emoji, uids]) => uids.length > 0 && (
                            <span
                              key={emoji}
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs cursor-pointer transition-all duration-200 border border-gray-600
                                ${uids.includes(currentUserId) ? 'bg-purple-500 text-white shadow-sm' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                              onClick={() => handleEmojiReaction(msg.id, emoji)}
                              title={uids.map(uid => onlineUsers.find(u => u.id === uid)?.name || `User ${uid.substring(0,4)}`).join(', ')}
                            >
                              {emoji} {uids.length}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Three dots menu and @ button */}
                      <div className="absolute top-1 right-1 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                           ref={el => dropdownRefs.current[msg.id] = el}>
                        {/* New @ button */}
                        <button
                          onClick={() => handleTagUser(msg.senderName)}
                          className="text-gray-400 hover:text-gray-200 p-1 rounded-full hover:bg-gray-800 transition-colors mr-1"
                          title={`Tag ${msg.senderName}`}
                        >
                          <AtSign size={16} />
                        </button>
                        <button
                          onClick={() => toggleDropdown(msg.id)}
                          className="text-gray-400 hover:text-gray-200 p-1 rounded-full hover:bg-gray-800 transition-colors"
                          title="More options"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {activeDropdown === msg.id && (
                          <div className="absolute right-0 top-full mt-2 w-40 bg-gray-800 rounded-lg shadow-xl py-1 text-sm z-10 border border-gray-700 text-gray-200">
                            <button
                              onClick={() => handleTogglePinMessage(msg.id, msg.pinned)}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-700"
                            >
                              <Pin size={16} /> {msg.pinned ? 'Unpin Message' : 'Pin Message'}
                            </button>
                            <button
                              onClick={() => handleMarkAsRead(msg.id)}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-700"
                            >
                              <MessageSquare size={16} /> Mark as Read
                            </button>
                            {msg.userId === currentUserId && (
                              <button
                                onClick={() => handleEditMessage(msg.id, msg.text)}
                                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-700"
                              >
                                <Edit2 size={16} /> Edit
                              </button>
                            )}
                            <button
                               onClick={() => handleReplyToMessage(msg)}
                               className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-700"
                            >
                               <CornerUpLeft size={16} /> Reply
                            </button>
                            <button
                               onClick={() => toggleReactionPicker(msg.id)} // "React" option in dropdown
                               className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-700"
                               ref={el => reactionButtonRefs.current[msg.id] = el} // Attach ref for positioning
                            >
                               <Smile size={16} /> React
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg.id, msg.userId)}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-red-400 hover:bg-red-900/20"
                            >
                              <Trash2 size={16} /> Delete
                            </button>
                            <button
                              onClick={() => handleSuggestToAdmin(msg)} // Pass the entire message object
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-yellow-400 hover:bg-yellow-900/20"
                            >
                              <Flag size={16} /> Send to Admin
                            </button>
                          </div>
                        )}
                      </div>
                      {/* EmojiPicker for reactions is now only opened via the dropdown */}
                      {showReactionPicker === msg.id && (
                        <EmojiPicker onEmojiSelect={(emoji) => handleEmojiReaction(msg.id, emoji)} onClose={() => setShowReactionPicker(null)} positionRef={reactionButtonRefs.current[msg.id]} />
                      )}
                    </div>
                  )}
                </div>

                {/* Avatar for sender's messages (right side) */}
                {msg.userId === currentUserId && (
                  <img
                    src={msg.avatar}
                    alt={`${msg.senderName} Avatar`}
                    className="w-10 h-10 rounded-full object-cover shadow-lg flex-shrink-0 cursor-pointer border-2 border-purple-400/60"
                    onClick={() => handleUserAvatarClick(msg.userId)}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://ui-avatars.com/api/?name=User&background=random&color=fff&size=128";
                    }}
                  />
                )}
              </div>
            ))}
            {/* Loading indicator for AI chat only */}
            {isLoading && chatMode === 'ai' && (
              <div className="flex justify-start items-end gap-2 relative z-20">
                <img src={aiAvatar} alt="AI Avatar" className="w-10 h-10 rounded-full object-cover shadow-lg flex-shrink-0 border-2 border-emerald-400" />
                <div className="flex flex-col max-w-[75%]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-200">AI Assistant</span>
                    <span className="text-xs text-gray-300">{currentTime}</span>
                  </div>
                  <div className="p-3 rounded-xl shadow-md bg-[#2A275F] text-gray-200" style={{boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4), 0 0 10px rgba(42, 39, 95, 0.6)'}}>
                    <div className="flex items-center">
                      <div className="dot-pulse-animation">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Reimagined based on sample */}
          <div className="p-3 border-t border-gray-700 flex items-center gap-2 bg-[#1A202C] rounded-b-2xl">
            {replyingTo && (
              <div className="absolute -top-10 left-0 right-0 bg-gray-700 p-2 rounded-t-lg flex items-center justify-between text-sm text-gray-300 border-b border-gray-600 shadow-md">
                <span>Replying to <span className="font-semibold text-purple-400">{replyingTo.senderName}</span>: {replyingTo.messageText.substring(0, 30)}{replyingTo.messageText.length > 30 ? '...' : ''}</span>
                <button onClick={handleCancelReply} className="text-gray-400 hover:text-gray-200 ml-2">
                  <XCircle size={16} />
                </button>
              </div>
            )}
            {/* User Avatar in Input */}
            <img
              src={userProfileAvatar}
              alt="Your Avatar"
              className="w-9 h-9 rounded-full object-cover shadow-md flex-shrink-0 border-2 border-purple-400/60"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://ui-avatars.com/api/?name=User&background=random&color=fff&size=128";
              }}
            />
            <textarea
              ref={messageInputRef} // Attach ref here
              className="flex-1 p-2 rounded-full bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200 resize-none no-scrollbar text-base placeholder-gray-400 shadow-inner"
              placeholder={isAuthReady ? "Type a message..." : "Connecting to chat..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              rows="1"
              style={{ minHeight: '40px', maxHeight: '90px', paddingLeft: '1rem', paddingRight: '1rem' }}
              disabled={isLoading || !isAuthReady} // Disabled based on isLoading and isAuthReady
            />
            {/* Emoji button */}
            <button
              ref={inputEmojiButtonRef}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-full transition-colors flex items-center justify-center shadow-md hover:scale-105"
              onClick={toggleInputEmojiPicker}
              title="Add emoji"
              disabled={!isAuthReady} // Also disable if auth not ready
            >
              <Smile size={20} />
            </button>
            {showInputEmojiPicker && (
              <EmojiPicker onEmojiSelect={handleInputEmojiSelect} onClose={() => setShowInputEmojiPicker(false)} positionRef={inputEmojiButtonRef} />
            )}
            {/* Send button */}
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-all duration-200 ease-in-out transform hover:scale-110 shadow-lg flex items-center justify-center"
              onClick={sendMessage}
              disabled={isLoading || input.trim() === '' || !isAuthReady} // Disabled based on isLoading, input, and isAuthReady
              title="Send message"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
      <ConfirmationModal
        message={showModal?.message}
        onConfirm={showModal?.onConfirm}
        onCancel={showModal?.onCancel}
        showCancel={showModal?.showCancel}
      />
      <UserDetailModal user={selectedUserDetail} onClose={() => setSelectedUserDetail(null)} />
      {adminFeedbackMessage && (
        <AdminFeedbackModal
          message={adminFeedbackMessage}
          onClose={() => setAdminFeedbackMessage(null)}
          onSend={sendFeedbackToAdmin}
        />
      )}
      {showAiInfoModal && (
        <AiInfoModal
          onClose={() => setShowAiInfoModal(false)}
          aiAvatar={aiAvatar}
        />
      )}
    </div>
  );
};

export default App;

/* The following CSS is directly incorporated from profile.css */
const style = document.createElement('style');
style.innerHTML = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
/* Using Inter as requested, with adjusted weights */

body {
  font-family: 'Inter', sans-serif;
  /* Smooth vertical gradient background from deep navy blue (#0B1020) to dark purple (#1A103F) */
  background: linear-gradient(to bottom, #0B1020, #1A103F);
  background-attachment: fixed;
  color: #FFFFFF; /* Default text color for body */
}

.profile-card {
  position: relative;
  padding: 2px;
  /* More vibrant gradient border */
  background: linear-gradient(180deg,
    rgba(0, 255, 255, 0.5) 0%,     /* Cyan with transparency */
    rgba(255, 0, 255, 0.7) 25%,   /* Magenta with transparency */
    rgba(255, 255, 0, 0.8) 75%,   /* Yellow with transparency */
    rgba(255, 100, 200, 0.9) 100%   /* Pinkish-purple strong */
  );
  border-radius: 28px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8); /* Stronger shadow */
}

.profile-content {
  background: linear-gradient(to bottom, #1a202c, #0f172a); /* Darker, slightly desaturated blue/gray */
  border-radius: 26px;
  position: relative;
  z-index: 1;
}

.icon-neon {
  background: linear-gradient(45deg, #0ff, #f0f); /* Neon gradient for icons */
  box-shadow: 0 0 8px rgba(0, 255, 255, 0.6), 0 0 15px rgba(255, 0, 255, 0.4); /* Neon glow */
}

/* Hide scrollbars */
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
  width: 0; /* For Chrome, Safari, and Opera */
  height: 0;
}

/* Styling for message bubble hover effects to show action buttons */
.group:hover .group-hover\\:opacity-100 {
  opacity: 1;
}

/* Dot pulse animation for loading */
.dot-pulse-animation {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: #00ffff; /* Neon cyan for dots */
  border-radius: 50%;
  animation: dotPulse 1.4s infinite ease-in-out;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

.dot:nth-child(3) {
  animation-delay: 0s;
}

@keyframes dotPulse {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Highlight message on scroll-to-reply */
.highlight-message {
  background-color: rgba(0, 255, 255, 0.3); /* Neon cyan with transparency for highlight */
  transition: background-color 0.5s ease-out;
}

/* Custom scrollbar for chat messages container */
.chat-messages-container {
  /* Background gradient from deep navy blue (#0B1020) to dark purple (#1A103F) */
  background: linear-gradient(to bottom, #0B1020, #1A103F);
  position: relative; /* Needed for z-index of children */
  overflow-y: auto; /* Ensure scrollability */
}

.chat-messages-container::-webkit-scrollbar {
  width: 8px; /* width of the scrollbar */
}

.chat-messages-container::-webkit-scrollbar-track {
  background: #2d3748; /* color of the tracking area */
  border-radius: 10px;
}

.chat-messages-container::-webkit-scrollbar-thumb {
  background-color: #8b5cf6; /* color of the scroll thumb */
  border-radius: 10px; /* roundness of the scroll thumb */
  border: 2px solid #2d3748; /* creates padding around scroll thumb */
}

.chat-messages-container::-webkit-scrollbar-thumb:hover {
  background-color: #a78bfa; /* color of the scroll thumb on hover */
}

.text-shadow-md {
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.message-bubble {
  transition: all 0.2s ease-in-out;
  /* Dark indigo background (#2A275F) */
  background-color: #2A275F;
  /* Text is bright white (#FFFFFF) or soft gray (#C9C9D9) */
  color: #FFFFFF;
  border-radius: 12px; /* Rounded rectangles */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4), 0 0 10px rgba(42, 39, 95, 0.6); /* Soft shadow and subtle glow */
}

/* Add a subtle glow on message bubbles for user's messages (removed specific bg-gradient-to-br as it's now solid) */
.message-bubble:hover {
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.7), 0 0 5px rgba(236, 72, 153, 0.7);
}

/* Input bar styling */
.chat-input-bar {
  background-color: #2A275F; /* Dark indigo for input bar */
  border-radius: 25px; /* Fully rounded */
  padding: 0.75rem 1rem; /* Adjust padding */
  box-shadow: 0 -4px 10px rgba(0,0,0,0.3); /* Soft shadow upwards */
}

.chat-input-bar textarea {
  background-color: #1A103F; /* Darker background for textarea */
  border: 1px solid #4A458A; /* Subtle border */
  color: #C9C9D9; /* Soft gray text */
  font-weight: 300; /* Light weight */
  letter-spacing: 0.5px; /* Soft letter spacing */
}

.chat-input-bar textarea::placeholder {
  color: #8A85B5; /* Lighter placeholder */
}

.chat-input-bar button {
  background-color: #6A5ACD; /* Purple button */
  box-shadow: 0 0 8px rgba(106, 90, 205, 0.5); /* Glowing effect */
}

.chat-input-bar button:hover {
  background-color: #7B68EE; /* Lighter purple on hover */
  box-shadow: 0 0 12px rgba(123, 104, 238, 0.7);
}

/* Adjustments for Discord-style spacing and padding */
.chat-card {
  padding: 0; /* Remove padding from card itself, let inner elements handle it */
  border: none; /* Remove default border */
  box-shadow: 0 10px 30px rgba(0,0,0,0.7); /* Deeper shadow for the whole card */
}

.chat-messages-container {
  padding: 1rem; /* Padding inside the message container */
}

.chat-messages-container > div { /* Individual message wrapper */
  margin-bottom: 1rem; /* Space between messages */
}

/* Adjust header and online users section background to match new gradient start */
.chat-card > div:first-child,
.chat-card > div:nth-child(2) {
  background-color: #0B1020; /* Deep navy blue */
}

/* Specific typography adjustments */
.font-sans {
  font-family: 'Inter', sans-serif; /* Ensure Inter is applied */
}

.message-text {
  font-weight: 400; /* Normal weight for readability */
  color: #C9C9D9; /* Soft gray for message text */
  line-height: 1.4; /* Improved line spacing */
  letter-spacing: 0.2px; /* Subtle letter spacing */
}

.font-bold {
  font-weight: 600; /* Slightly heavier bold for usernames */
}

.text-sm {
  font-size: 0.875rem; /* Default small size */
}

.text-xs {
  font-size: 0.75rem; /* Smaller for timestamps and tags */
  color: #8A85B5; /* Subtle light gray for timestamps/tags */
}
`;
document.head.appendChild(style);
