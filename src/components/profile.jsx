import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Coins, Settings, Eye, Share2, Award, Activity, Trash2, ShieldOff, Copy, CheckCircle, XCircle,
  ChevronRight, ChevronLeft, Calendar, Lock, BellRing, Users, Link, Github, Twitter, Facebook, Linkedin
} from 'lucide-react';
import './profile.css';
// Custom Notification Component
const Notification = ({ message, type, onClose }) => {
  const bgColorClass = type === 'success' ? 'notification-success' : 'notification-error';
  const icon = type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Notification disappears after 3 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={`notification-container ${bgColorClass} text-white`}
    >
      {icon}
      <span>{message}</span>
      <button onClick={onClose} className="notification-close-button">
        &times;
      </button>
    </motion.div>
  );
};

// Main App Component
const App = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('profile');

  // Dummy User Data
  const [userData, setUserData] = useState({
    avatar: 'https://placehold.co/150x150/000000/FFFFFF?text=P',
    username: 'GamerXpert2025',
    email: 'gamer.xpert@example.com',
    coinBalance: 12345,
    name: 'Alex Johnson',
    gender: 'Male',
    dob: '1995-07-10',
    profileVisibility: true,
    leaderboardParticipation: true,
    notifications: true,
    referralLink: 'https://gameplatform.com/refer/gamerxpert2025',
    referredUsersCount: 7, // New field for referred users count
    achievements: [
      { id: 1, name: 'First Win', description: 'Won your first game!', progress: 100, total: 100, earned: true },
      { id: 2, name: 'Coin Collector', description: 'Collected 10,000 coins', progress: 100, total: 100, earned: true },
      { id: 3, name: 'Social Butterfly', description: 'Shared referral link 5 times', progress: 60, total: 100, earned: false },
      { id: 4, name: 'Level Up!', description: 'Reached Level 10', progress: 20, total: 100, earned: false },
      { id: 5, name: 'Daily Login Streak', description: 'Logged in 7 days in a row', progress: 100, total: 100, earned: true },
      { id: 6, name: 'Master Strategist', description: 'Won 5 ranked matches', progress: 0, total: 100, earned: false },
    ],
    activityLog: [
      { id: 1, type: 'Coin Earned', description: 'Earned 500 coins from daily bonus', timestamp: '2025-07-09 14:30' },
      { id: 2, type: 'Game Played', description: 'Completed a match in "Galactic Conquest"', timestamp: '2025-07-09 12:15' },
      { id: 3, type: 'Achievement Unlocked', description: 'Unlocked "First Win" badge', timestamp: '2025-07-08 20:00' },
      { id: 4, type: 'Profile Update', description: 'Updated email address', timestamp: '2025-07-08 10:00' },
      { id: 5, type: 'Referral', description: 'New user joined through your referral link', timestamp: '2025-07-07 18:45' },
    ],
  });

  // State for edit modes
  const [isUsernameEditing, setIsUsernameEditing] = useState(false);
  const [isEmailEditing, setIsEmailEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(userData.username);
  const [newEmail, setNewEmail] = useState(userData.email);

  // State for password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');

  // State for account actions confirmation modals
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // State for custom notifications
  const [notification, setNotification] = useState(null);

  // Ref for avatar input
  const avatarInputRef = useRef(null);

  // Function to show custom notification
  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  // Handle avatar upload
  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData(prev => ({ ...prev, avatar: reader.result }));
        showNotification('Avatar updated successfully!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle username save
  const handleUsernameSave = () => {
    setUserData(prev => ({ ...prev, username: newUsername }));
    setIsUsernameEditing(false);
    showNotification('Username updated successfully!', 'success');
  };

  // Handle email save
  const handleEmailSave = () => {
    setUserData(prev => ({ ...prev, email: newEmail }));
    setIsEmailEditing(false);
    showNotification('Email updated successfully!', 'success');
  };

  // Handle privacy toggle
  const handleToggle = (setting) => {
    setUserData(prev => ({ ...prev, [setting]: !prev[setting] }));
    showNotification(`${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} updated!`, 'success');
  };

  // Handle copy referral link
  const copyReferralLink = () => {
    if (document.execCommand) {
      const el = document.createElement('textarea');
      el.value = userData.referralLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showNotification('Referral link copied to clipboard!', 'success');
    } else {
      console.error('Copy command not supported in this browser.');
      showNotification('Failed to copy. Please copy manually.', 'error');
    }
  };

  // Handle password change
  const handleChangePassword = () => {
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeMessage('New passwords do not match!');
      showNotification('New passwords do not match!', 'error');
      return;
    }
    if (newPassword.length < 6) { // Simple validation
      setPasswordChangeMessage('Password must be at least 6 characters long.');
      showNotification('Password must be at least 6 characters long.', 'error');
      return;
    }
    // Simulate API call
    console.log('Changing password...');
    setPasswordChangeMessage('Password changed successfully!');
    showNotification('Password changed successfully!', 'success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  // Handle account deactivation
  const handleDeactivateAccount = () => {
    console.log('Deactivating account...');
    // Simulate API call
    setShowDeactivateModal(false);
    showNotification('Account deactivated successfully!', 'success');
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    console.log('Deleting account...');
    // Simulate API call
    setShowDeleteModal(false);
    showNotification('Account deleted permanently!', 'success');
  };

  // Tab button class helper
  const getTabButtonClass = (tabName) =>
    `tab-button ${activeTab === tabName ? 'active' : ''}`;

  // Framer Motion variants for page transitions
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
  };

  return (
    <div className="min-h-screen bg-gradient text-white p-4 sm-p-8 flex items-center justify-center">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg-grid-cols-4 gap-8">
        {/* Sidebar / Tab Navigation */}
        <motion.div
          className="glass-card glossy-effect lg-col-span-1 flex flex-col space-y-4"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-center">Navigation</h2>
          <nav className="flex flex-col space-y-2">
            <motion.button
              className={getTabButtonClass('profile')}
              onClick={() => setActiveTab('profile')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <User className="mr-2" size={20} /> Profile
            </motion.button>
            <motion.button
              className={getTabButtonClass('settings')}
              onClick={() => setActiveTab('settings')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="mr-2" size={20} /> Account Settings
            </motion.button>
            <motion.button
              className={getTabButtonClass('privacy')}
              onClick={() => setActiveTab('privacy')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Eye className="mr-2" size={20} /> Privacy
            </motion.button>
            <motion.button
              className={getTabButtonClass('referrals')}
              onClick={() => setActiveTab('referrals')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="mr-2" size={20} /> Referrals
            </motion.button>
            <motion.button
              className={getTabButtonClass('achievements')}
              onClick={() => setActiveTab('achievements')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Award className="mr-2" size={20} /> Achievements
            </motion.button>
            <motion.button
              className={getTabButtonClass('activity')}
              onClick={() => setActiveTab('activity')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Activity className="mr-2" size={20} /> Activity Log
            </motion.button>
            <motion.button
              className={getTabButtonClass('account')}
              onClick={() => setActiveTab('account')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 className="mr-2" size={20} /> Account Actions
            </motion.button>
          </nav>
        </motion.div>

        {/* Main Content Area */}
        <motion.div
          className="glass-card glossy-effect lg-col-span-3"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AnimatePresence mode='wait'>
            <motion.div
              key={activeTab}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="w-full"
            >
              {/* Profile Tab Content */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-center">My Profile</h2>
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4">
                      <img
                        src={userData.avatar}
                        alt="User Avatar"
                        className="avatar-img"
                      />
                      <motion.button
                        onClick={() => avatarInputRef.current.click()}
                        className="avatar-edit-button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Settings size={18} />
                      </motion.button>
                      <input
                        type="file"
                        ref={avatarInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </div>
                    <div className="flex items-center text-3xl font-bold mb-2">
                      {isUsernameEditing ? (
                        <input
                          type="text"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          className="input-style text-center text-3xl"
                          onBlur={handleUsernameSave}
                          onKeyDown={(e) => e.key === 'Enter' && handleUsernameSave()}
                          autoFocus
                        />
                      ) : (
                        <span className="flex items-center">
                          {userData.username}
                          <motion.button
                            onClick={() => setIsUsernameEditing(true)}
                            className="ml-2 p-1 rounded-full hover-bg-white-20"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Settings size={18} />
                          </motion.button>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-lg text-gray-300 mb-6">
                      <Mail size={18} className="mr-2" />
                      {isEmailEditing ? (
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="input-style text-center text-lg"
                          onBlur={handleEmailSave}
                          onKeyDown={(e) => e.key === 'Enter' && handleEmailSave()}
                          autoFocus
                        />
                      ) : (
                        <span className="flex items-center">
                          {userData.email}
                          <motion.button
                            onClick={() => setIsEmailEditing(true)}
                            className="ml-2 p-1 rounded-full hover-bg-white-20"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Settings size={18} />
                          </motion.button>
                        </span>
                      )}
                    </div>
                    <div className="coin-balance-card">
                      <Coins size={24} className="mr-2 text-yellow-400" />
                      <span className="text-yellow-300">{userData.coinBalance} Coins</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Settings Tab Content */}
              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-center">Account Settings</h2>
                  <div className="grid grid-cols-1 md-grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-gray-300 text-sm font-bold mb-2">Full Name</label>
                      <div className="flex items-center">
                        <User size={20} className="mr-3 text-gray-400" />
                        <input
                          type="text"
                          value={userData.name}
                          onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                          className="input-style"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-bold mb-2">Gender</label>
                      <div className="flex items-center">
                        <User size={20} className="mr-3 text-gray-400" />
                        <select
                          value={userData.gender}
                          onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))}
                          className="input-style"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Non-binary">Non-binary</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                    <div className="md-col-span-2">
                      <label className="block text-gray-300 text-sm font-bold mb-2">Date of Birth</label>
                      <div className="flex items-center">
                        <Calendar size={20} className="mr-3 text-gray-400" />
                        <input
                          type="date"
                          value={userData.dob}
                          onChange={(e) => setUserData(prev => ({ ...prev, dob: e.target.value }))}
                          className="input-style"
                        />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-4 text-center">Change Password</h3>
                  <div className="space-y-4 max-w-md mx-auto">
                    <div>
                      <label className="block text-gray-300 text-sm font-bold mb-2">Current Password</label>
                      <div className="flex items-center">
                        <Lock size={20} className="mr-3 text-gray-400" />
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="input-style"
                          placeholder="Enter current password"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-bold mb-2">New Password</label>
                      <div className="flex items-center">
                        <Lock size={20} className="mr-3 text-gray-400" />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="input-style"
                          placeholder="Enter new password"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-bold mb-2">Confirm New Password</label>
                      <div className="flex items-center">
                        <Lock size={20} className="mr-3 text-gray-400" />
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="input-style"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                    {passwordChangeMessage && (
                      <p className={`text-center text-sm ${passwordChangeMessage.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
                        {passwordChangeMessage}
                      </p>
                    )}
                    <motion.button
                      onClick={handleChangePassword}
                      className="primary-button w-full"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Change Password
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Privacy Tab Content */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-center">Privacy Settings</h2>
                  <div className="space-y-6 max-w-md mx-auto">
                    <div className="flex items-center justify-between glass-card p-4 rounded-lg">
                      <div className="flex items-center">
                        <Eye size={24} className="mr-3 text-gray-400" />
                        <span className="font-semibold">Profile Visibility</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={userData.profileVisibility}
                          onChange={() => handleToggle('profileVisibility')}
                        />
                        <div className="toggle-switch-background">
                          <div className="toggle-switch-handle"></div>
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between glass-card p-4 rounded-lg">
                      <div className="flex items-center">
                        <Users size={24} className="mr-3 text-gray-400" />
                        <span className="font-semibold">Leaderboard Participation</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={userData.leaderboardParticipation}
                          onChange={() => handleToggle('leaderboardParticipation')}
                        />
                        <div className="toggle-switch-background">
                          <div className="toggle-switch-handle"></div>
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between glass-card p-4 rounded-lg">
                      <div className="flex items-center">
                        <BellRing size={24} className="mr-3 text-gray-400" />
                        <span className="font-semibold">Email Notifications</span>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={userData.notifications}
                          onChange={() => handleToggle('notifications')}
                        />
                        <div className="toggle-switch-background">
                          <div className="toggle-switch-handle"></div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Referrals Tab Content */}
              {activeTab === 'referrals' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-center">Refer & Earn</h2>
                  <div className="flex flex-col items-center space-y-6">
                    <p className="text-lg text-center mb-4">Share your unique referral link and earn coins when friends join!</p>
                    <div className="flex items-center glass-card p-3 rounded-lg w-full max-w-xl">
                      <Link size={20} className="mr-3 text-gray-400" />
                      <input
                        type="text"
                        value={userData.referralLink}
                        readOnly
                        className="flex-grow bg-transparent outline-none text-white text-sm sm-text-base"
                      />
                      <motion.button
                        onClick={copyReferralLink}
                        className="primary-button ml-3 flex items-center px-3 py-1-5"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Copy size={16} className="mr-1" /> Copy
                      </motion.button>
                    </div>

                    <div className="mt-6 text-center">
                      <p className="text-xl font-semibold">Users Referred:</p>
                      <p className="text-4xl font-bold text-yellow-300">{userData.referredUsersCount}</p>
                    </div>

                    <h3 className="text-xl font-bold mt-6 mb-4">Share on Social Media</h3>
                    <div className="flex space-x-4">
                      <motion.button
                        className="social-button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => showNotification('Sharing to Facebook (dummy action)', 'success')}
                      >
                        <Facebook size={24} />
                      </motion.button>
                      <motion.button
                        className="social-button twitter"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => showNotification('Sharing to Twitter (dummy action)', 'success')}
                      >
                        <Twitter size={24} />
                      </motion.button>
                      <motion.button
                        className="social-button linkedin"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => showNotification('Sharing to LinkedIn (dummy action)', 'success')}
                      >
                        <Linkedin size={24} />
                      </motion.button>
                      <motion.button
                        className="social-button github"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => showNotification('Sharing to GitHub (dummy action)', 'success')}
                      >
                        <Github size={24} />
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}

              {/* Achievements Tab Content */}
              {activeTab === 'achievements' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-center">My Achievements</h2>
                  <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-6">
                    {userData.achievements.map(achievement => (
                      <motion.div
                        key={achievement.id}
                        className={`glass-card achievement-card ${achievement.earned ? 'earned' : 'not-earned'}`}
                        whileHover={{ translateY: -5, boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.47)' }}
                        transition={{ duration: 0.2 }}
                      >
                        {achievement.earned ? (
                          <CheckCircle size={48} className="text-green-400 mb-3" />
                        ) : (
                          <XCircle size={48} className="text-gray-400 mb-3" />
                        )}
                        <h3 className="text-xl font-bold mb-2">{achievement.name}</h3>
                        <p className="text-gray-300 text-sm mb-4">{achievement.description}</p>
                        <div className="achievement-progress-bar">
                          <div
                            className="achievement-progress-fill"
                            style={{ width: `${achievement.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-300">{achievement.progress}% Complete</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Log Tab Content */}
              {activeTab === 'activity' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-center">Recent Activity</h2>
                  <div className="space-y-4">
                    {userData.activityLog.map(event => (
                      <motion.div
                        key={event.id}
                        className="glass-card activity-item"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: event.id * 0.05 }}
                      >
                        <div className="flex items-center">
                          {event.type === 'Coin Earned' && <Coins size={20} className="mr-3 text-yellow-400" />}
                          {event.type === 'Game Played' && <Activity size={20} className="mr-3 text-blue-400" />}
                          {event.type === 'Achievement Unlocked' && <Award size={20} className="mr-3 text-green-400" />}
                          {event.type === 'Profile Update' && <Settings size={20} className="mr-3 text-purple-400" />}
                          {event.type === 'Referral' && <Share2 size={20} className="mr-3 text-pink-400" />}
                          <div>
                            <p className="font-semibold">{event.type}</p>
                            <p className="text-gray-300 text-sm">{event.description}</p>
                          </div>
                        </div>
                        <span className="text-gray-400 text-xs">{event.timestamp}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Account Actions Tab Content */}
              {activeTab === 'account' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-center">Account Actions</h2>
                  <div className="space-y-6 max-w-md mx-auto">
                    <motion.button
                      onClick={() => setShowDeactivateModal(true)}
                      className="secondary-button w-full flex items-center justify-center"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ShieldOff size={20} className="mr-2" /> Deactivate Account
                    </motion.button>
                    <p className="text-gray-400 text-sm text-center">
                      Deactivating your account will temporarily hide your profile and progress. You can reactivate it later.
                    </p>

                    <motion.button
                      onClick={() => setShowDeleteModal(true)}
                      className="danger-button w-full flex items-center justify-center"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Trash2 size={20} className="mr-2" /> Delete Account Permanently
                    </motion.button>
                    <p className="text-gray-400 text-sm text-center">
                      Deleting your account is irreversible. All your data, achievements, and coins will be permanently removed.
                    </p>
                  </div>

                  {/* Deactivate Account Modal */}
                  <AnimatePresence>
                    {showDeactivateModal && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                      >
                        <motion.div
                          initial={{ scale: 0.9, y: 50 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.9, y: 50 }}
                          className="glass-card modal-content"
                        >
                          <h3 className="text-2xl font-bold mb-4">Confirm Deactivation</h3>
                          <p className="mb-6 text-gray-300">Are you sure you want to deactivate your account? You can reactivate it later.</p>
                          <div className="flex justify-center space-x-4">
                            <motion.button
                              onClick={() => setShowDeactivateModal(false)}
                              className="secondary-button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Cancel
                            </motion.button>
                            <motion.button
                              onClick={handleDeactivateAccount}
                              className="danger-button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Deactivate
                            </motion.button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Delete Account Modal */}
                  <AnimatePresence>
                    {showDeleteModal && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                      >
                        <motion.div
                          initial={{ scale: 0.9, y: 50 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.9, y: 50 }}
                          className="glass-card modal-content"
                        >
                          <h3 className="text-2xl font-bold mb-4">Confirm Permanent Deletion</h3>
                          <p className="mb-6 text-red-300 font-bold">This action is irreversible. All your data will be lost.</p>
                          <p className="mb-6 text-gray-300">Are you absolutely sure you want to permanently delete your account?</p>
                          <div className="flex justify-center space-x-4">
                            <motion.button
                              onClick={() => setShowDeleteModal(false)}
                              className="secondary-button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Cancel
                            </motion.button>
                            <motion.button
                              onClick={handleDeleteAccount}
                              className="danger-button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Delete Permanently
                            </motion.button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default App;
