import React, { useEffect, useState, useRef, useCallback } from 'react';
import './home.css';
import { Home, LayoutDashboard, User, LifeBuoy, Users, Gamepad, Lock, Handshake, Info, ClipboardList, Gift, X, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { auth, provider } from '../firebase';  // adjust path if needed
import { signInWithPopup } from 'firebase/auth';
import LeaderPage from './leader.jsx';
import ProfilePage from './profile.jsx';
import SupportPage from './SupportPage.jsx';
import ReferEarnPage from './refer.jsx';
import Footer from './Footer.jsx'; // adjust the path if needed

// Login/Signup Modal Component
function LoginSignupModal({ onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true); // true for login, false for signup
  
  const handleAuthAction = (e) => {
    e.preventDefault();
    // In a real application, you would handle actual login/signup logic here.
    // For this demonstration, we'll just simulate a successful login.
    console.log(isLogin ? "Simulating Login..." : "Simulating Signup...");
    setTimeout(() => {
      onLoginSuccess();
      onClose();
    }, 500); // Simulate network delay
  };
const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("Google login success", user);
    onLoginSuccess(); // Trigger your app's login flow
    onClose();        // Close the modal
  } catch (error) {
    console.error("Google login failed", error);
    // Use a custom message box instead of alert()
    const messageBox = document.createElement('div');
    messageBox.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    messageBox.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm relative">
        <h2 class="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">Error</h2>
        <p class="text-center text-gray-700 dark:text-gray-300 mb-6">Google login failed. Please try again.</p>
        <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300" onclick="this.parentNode.parentNode.remove()">OK</button>
      </div>
    `;
    document.body.appendChild(messageBox);
  }
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          {isLogin ? 'Login' : 'Sign Up'}
        </h2>
        <form onSubmit={handleAuthAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="your@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="********"
              required
            />
          </div>
          {!isLogin && (
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirm-password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="********"
                required
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center bg-white text-black font-medium border border-gray-300 rounded-md shadow-md py-2 px-4 hover:bg-gray-100"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
                alt="Google Logo"
                className="w-5 h-5 mr-2"
              />
              Continue with Google
            </button>
          </div>
                  
        </p>
      </div>
    </div>
  );
}

// Profile Detail Modal Component
function ProfileDetailModal({ onClose, userName, userBalance, userAvatar, onAddBalance, onWithdrawBalance }) {
  const canWithdraw = userBalance >= 10;

  const handleAddClick = () => {
    // Removed the automatic addition of $10.
    // In a real application, this button would trigger a payment gateway or similar.
    console.log("Add button clicked. Implement actual add money logic here.");
    onClose();
  };

  const handleWithdrawClick = () => {
    // Simulate withdrawing $10 for demonstration
    if (canWithdraw) {
      onWithdrawBalance(10);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          User Profile
        </h2>
        <div className="flex flex-col items-center space-y-4">
          <div className="user-avatar">
            <img src={userAvatar} alt="User Avatar" width={80} height={80} className="rounded-full" />
          </div>
          <span className="text-xl font-semibold text-gray-900 dark:text-white">{userName}</span>
          <div className="flex items-center space-x-2 text-lg text-gray-700 dark:text-gray-300">
            <Wallet size={20} />
            <span>Balance: ${userBalance.toFixed(2)}</span>
          </div>
          <div className="flex space-x-4 mt-4">
            <button
              onClick={handleAddClick}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md text-base hover:bg-green-600 transition-colors"
            >
              <TrendingUp size={20} className="mr-2" /> Add
            </button>
            <button
              onClick={handleWithdrawClick}
              disabled={!canWithdraw}
              className={`flex items-center px-4 py-2 rounded-md text-base transition-colors ${
                canWithdraw ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <TrendingDown size={20} className="mr-2" /> Withdraw
            </button>
          </div>
          {!canWithdraw && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              You need at least $10 to withdraw.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


// Reusable renderStars function
const renderStars = (rating) => {
  if (rating === null) return null;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  const stars = [];

  for (let i = 0; i < fullStars; i++) {
    stars.push(<span key={`full-${i}`} className="star-icon full-star">★</span>);
  }
  if (hasHalfStar) {
    stars.push(<span key="half" className="star-icon half-star">★</span>);
  }
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<span key={`empty-${i}`} className="star-icon empty-star">★</span>);
  }
  return <div className="task-card-stars">{stars}</div>;
};

// Gradient Definitions
const gradient1 = 'linear-gradient(to bottom right, #d400ffff, #00C0FF)';
const gradient2 = 'linear-gradient(to bottom right, #00BFFF, #32CD32, #FFD700)';

// Data for Offer Partners
const offerPartners = [
  { id: 'timewall', name: 'TimeWall', image: 'https://placehold.co/60x60/4CAF50/FFFFFF?text=TW', rating: 4.8, bonusPercentage: 20, backgroundImage: '/imgs.jpg' },
  { id: 'torox', name: 'Torox', image: 'https://placehold.co/60x60/00BFFF/FFFFFF?text=TRX', rating: 4.5, bonusPercentage: 20, backgroundImage: '/img2.jpg' },
  { id: 'adgatemedia', name: 'AdGateMedia', image: 'https://placehold.co/60x60/8A2BE2/FFFFFF?text=AGM', rating: 4.2, bonusPercentage: 50, backgroundImage: '/img3.jpg' },
  { id: 'mmwall', name: 'MM Wall', image: 'https://placehold.co/60x60/FFD700/FFFFFF?text=MMW', rating: 4.0, bonusPercentage: 50, backgroundImage: '/imgs.jpg' },
  { id: 'mychips', name: 'MyChips', image: 'https://placehold.co/60x60/FF69B4/FFFFFF?text=MC', rating: 4.1, bonusPercentage: 50, backgroundImage: '/img2.jpg' },
  { id: 'adscendmedia', name: 'AdscendMedia', image: 'https://placehold.co/60x60/1E90FF/FFFFFF?text=ASM', rating: 4.3, bonusPercentage: 50, backgroundImage: '/img3.jpg' },
  { id: 'revu', name: 'RevU+', image: 'https://placehold.co/60x60/00FF7F/FFFFFF?text=RU', rating: 4.6, bonusPercentage: 50, backgroundImage: '/imgs.jpg' },
  { id: 'lootably', name: 'Lootably', image: 'https://placehold.co/60x60/4682B4/FFFFFF?text=LB', rating: 4.7, bonusPercentage: 50, backgroundImage: '/img2.jpg' },
  { id: 'ayetstudios', name: 'Ayet Studios', image: 'https://placehold.co/60x60/9370DB/FFFFFF?text=AS', rating: 4.4, bonusPercentage: 50, backgroundImage: '/img3.jpg' },
  { id: 'bitlabs-offer', name: 'Bitlabs', image: 'https://placehold.co/60x60/FF8C00/FFFFFF?text=BL', rating: 4.0, bonusPercentage: 50, backgroundImage: '/imgs.jpg' },
];

// Data for the game categories
const gameCategories = [
  {
    title: 'Gaming Offers',
    isGrid: false,
    cardSize: 'large',
    gradient: gradient1,
    games: [
      { id: 1, type: 'GAME', title: 'Summer Break', genre: 'Role Playing', rating: '4.9', image: '/app.jpeg', value: '$5.62', condition: 'Reach level 50', url: 'https://www.towerofgod.com/', fullDescription: 'A popular mobile RPG based on the webtoon. Dive into the world of the Tower and challenge its floors. Earn rewards by reaching specific levels and completing story acts.', completionSteps: ['Download & Install', 'Complete Tutorial', 'Reach Level 50'] },
      { id: 2, type: 'GAME', title: 'Ever Legion', genre: 'Role Playing', rating: '4.4', image: '/ba.jpeg', value: '$3.30', condition: 'Complete Act 3', url: 'https://www.browndust2.com/', fullDescription: 'A tactical turn-based RPG with stunning anime-style graphics. Collect unique characters and build your ultimate team. This task requires completing the main story up to Act 3.', completionSteps: ['Download & Install', 'Complete Act 1', 'Complete Act 2', 'Complete Act 3'] },
      { id: 3, type: 'GAME', title: 'Colorwood Sort', genre: 'Role Playing', rating: '4.6', image: '/bes.jpeg', value: '$6.02', condition: 'Defeat Calamity', url: 'https://wutheringwaves.kurogames.com/', fullDescription: 'An open-world action RPG with a vast world to explore and challenging bosses. Master unique combat styles and uncover the mysteries of this post-apocalyptic world. Defeat the Calamity boss to earn this reward.', completionSteps: ['Download & Install', 'Reach designated area', 'Defeat Calamity Boss'] },
      { id: 4, type: 'GAME', title: 'Smash Party', genre: 'Action RPG', rating: '4.7', image: '/call.jpeg', value: '$11.59', condition: 'Unlock Inazuma', url: 'https://genshin.hoyoverse.com/', fullDescription: 'Explore the vast open world of Teyvat, solve puzzles, and engage in elemental combat. This task requires you to progress through the main story until you unlock the Inazuma region.', completionSteps: ['Download & Install', 'Complete Archon Quests', 'Unlock Inazuma Region'] },
      { id: 5, type: 'GAME', title: 'Sea Block 1010', genre: 'Turn-based RPG', rating: '4.8', image: '/civi.jpeg', value: '$3.02', condition: 'Clear Forgotten Hall', url: 'https://hsr.hoyoverse.com/', fullDescription: 'Embark on an interstellar journey aboard the Astral Express in this turn-based RPG. Strategize your team and clear the challenging Forgotten Hall content to earn your reward.', completionSteps: ['Download & Install', 'Reach Equilibrium Level 2', 'Clear Forgotten Hall Stage 1'] },
      { id: 11, type: 'GAME', title: 'Multi Dice', genre: 'Battle Royale', rating: '4.2', image: '/dead.jpeg', value: '$26.00', condition: 'Win 5 matches', url: 'https://pubgmobile.com/', fullDescription: 'Jump into intense battle royale action. Survive against 99 other players to be the last one standing. Win 5 classic matches to complete this task.', completionSteps: ['Download & Install', 'Complete 5 Classic Matches', 'Achieve 5 Wins'] },
      { id: 12, type: 'GAME', title: 'Vegas Keno by...', genre: 'Battle Royale', rating: '4.3', image: '/dia.jpeg', value: '$48.11', condition: 'Get 10 kills', url: 'https://ff.garena.com/', fullDescription: 'A fast-paced battle royale experience optimized for mobile. Land, loot, and eliminate opponents. Get a total of 10 kills across multiple matches to earn your reward.', completionSteps: ['Download & Install', 'Play Matches', 'Achieve 10 Kills'] },
    ]
  },
  {
    title: 'Other Offers',
    isGrid: false,
    cardSize: 'small',
    gradient: gradient2,
    games: [
        { id: 101, type: 'APP', title: 'Alibaba.com', genre: 'Shopping', rating: '4.0', image: '/epi.jpeg', value: '$0.21', condition: 'Register & Browse', url: '#', fullDescription: 'Sign up for Alibaba.com and browse through 5 product categories.', completionSteps: ['Register', 'Browse 5 categories'] },
        { id: 102, type: 'APP', title: 'Catalyse Resea..', genre: 'Research', rating: '4.1', image: '/fact.jpeg', value: '$0.24', condition: 'Complete 1 survey', url: '#', fullDescription: 'Complete your first survey on Catalyse Research platform.', completionSteps: ['Sign Up', 'Complete 1 survey'] },
        { id: 103, type: 'APP', title: 'Mintalise', genre: 'Health', rating: '3.8', image: '/g2.jpeg', value: '$0.04', condition: 'Install & Open', url: '#', fullDescription: 'Install the Mintalise app and open it for the first time.', completionSteps: ['Install App', 'Open App'] },
        { id: 104, type: 'APP', title: 'Vegas Keno by...', genre: 'Casino', rating: '4.2', image: '/g3.jpeg', value: '$48.11', condition: 'Reach Level 10', url: '#', fullDescription: 'Play Vegas Keno and reach level 10 to earn your reward.', completionSteps: ['Install App', 'Play Game', 'Reach Level 10'] },
    ]
  },
];

// Adjust initialTasks for Featured Surveys
const initialTasks = [
  {
    id: 't_premium',
    title: 'Premium Survey',
    shortTitle: 'Premium...',
    description: 'Exclusive high-reward survey.',
    fullDescription: 'This is a premium survey offering a higher reward for your valuable insights. It may require more detailed responses. Complete it to unlock other surveys.',
    completionSteps: ['Click "Start Survey"', 'Complete all sections', 'Submit'],
    estimatedTime: 15,
    reward: 10,
    displayValue: '$0.10',
    difficulty: 'Medium',
    type: 'surveys',
    tags: ['Premium', 'High Reward'],
    isCompleted: false,
    progress: 0,
    image: '/g4.jpeg',
    displayCondition: '2 mins',
    cardSize: 'mini-survey',
    gradient: 'linear-gradient(to bottom right, #FFD700, #FFA500)',
    isPremium: true,
    isLocked: false,
    starRating: 4.5,
  },
  {
    id: 't_available_regular',
    title: 'Complete Daily Survey',
    shortTitle: 'High-paying survey',
    description: 'Share your opinions on various topics and earn coins.',
    fullDescription: 'Participate in our daily survey. It covers a range of topics from consumer habits to social trends. Your feedback helps companies improve their products and services. Ensure you answer truthfully to qualify for the reward.',
    completionSteps: ['Click "Start Survey"', 'Answer all questions', 'Submit your responses'],
    estimatedTime: 10,
    reward: 30,
    displayValue: '$0.30',
    difficulty: 'Easy',
    type: 'surveys',
    tags: ['New', 'High Reward'],
    isCompleted: false,
    progress: 0,
    image: '/g5.jpeg',
    displayCondition: '2 mins',
    cardSize: 'mini-survey',
    gradient: 'linear-gradient(to bottom right, #00FF7F, #00BFFF)',
    isPremium: false,
    isLocked: false,
    starRating: 4.0,
  },
  ...Array.from({ length: 20 }).map((_, i) => ({
    id: `t_locked_${i + 1}`,
    title: `Locked Survey ${i + 1}`,
    shortTitle: 'High-paying survey',
    description: 'Complete an available survey to unlock.',
    fullDescription: 'This survey is currently locked. Complete any available survey to gain access to this and other locked surveys.',
    completionSteps: [],
    estimatedTime: 0,
    reward: 0,
    displayValue: `$${(Math.random() * (10 - 1) + 1).toFixed(2)}`,
    difficulty: 'Locked',
    type: 'surveys',
    tags: ['Locked'],
    isCompleted: false,
    progress: 0,
    image: `/g6.jpeg`,
    displayCondition: `${Math.floor(Math.random() * (15 - 2) + 2)} mins`,
    cardSize: 'mini-survey',
    gradient: 'linear-gradient(to bottom right, #2e4d4d, #00ffcc)',
    isPremium: false,
    isLocked: true,
    starRating: null,
  })),
];

// Task categories for the filter dropdown
const categories = [
  { id: 'all', name: 'All Tasks' },
  { id: 'surveys', name: 'Surveys' },
  { id: 'offers', name: 'Offers' },
  { id: 'games', name: 'Games' },
  { id: 'watch-videos', name: 'Watch Videos' },
];

// New LotteryModal Component
function LotteryDetailModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('prizes');
  const [timeLeft, setTimeLeft] = useState('');

  const calculateEndTime = () => {
    const now = new Date();
    const endDate = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000) + (12 * 60 * 60 * 1000) + (45 * 60 * 60 * 1000) + (53 * 1000));
    return endDate;
  };

  const [lotteryEndDate] = useState(calculateEndTime());

  useEffect(() => {
    const timerInterval = setInterval(() => {
      const now = new Date().getTime();
      const distance = lotteryEndDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timerInterval);
        setTimeLeft('Lottery Ended!');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [lotteryEndDate]);

  const lotteryDetails = {
    lotteryNumber: 12,
    totalPrize: '$35,000',
    numWinners: '2,500',
    tickets: 0,
    howItWorks: [
      {
        title: 'Enrollment',
        description: 'No extra steps—as long as you have tickets available they will be included in the next lottery.',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-check">
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="m9 11 2 2 4-4" />
          </svg>
        )
      },
      {
        title: 'Tickets',
        description: 'Every cent you earn = 1 lottery ticket.',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ticket">
            <path d="M2 9a3 3 0 0 1 0 6v-6Z" />
            <path d="M22 9a3 3 0 0 0 0 6v-6Z" />
            <path d="M13 5H6a2 2 0 0 0-2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
            <path d="M14 5h4a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2h-4" />
          </svg>
        )
      },
      {
        title: 'Ticket Multiplier',
        description: 'Completing bonus rewards increases your multiplier for this offer and applies retroactively to previous tickets. For example, 2x = 2 tickets per $0.01 earned.',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        )
      },
      {
        title: 'Random Draws & Fair Winners',
        description: 'A winner is picked at random from all tickets. More tickets = higher chances, but everyone has a shot!',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shuffle">
            <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-9.7c.8-1.1 2-1.7 3.3-1.7H22" />
            <path d="m18 21 4-4-4-4" />
            <path d="M2 6h1.4c1.3 0 2.5.6 3.3 1.7l6.1 9.7c.8 1.1 2 1.7 3.3 1.7H22" />
            <path d="m18 3 4 4-4 4" />
          </svg>
        )
      },
      {
        title: 'Prizes & Announcements',
        description: 'Winners are announced weekly via a Freecash notification and email. Prizes are awarded once the winner returns to Freecash and claims them.',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        )
      }
    ],
    prizes: [
      { rank: '1st', reward: '$10,000' },
      { rank: '2nd', reward: '$3,000' },
      { rank: '3rd', reward: '$2,000' },
      { rank: '4th - 10th', reward: '$700' },
      { rank: '11th - 100th', reward: '$100' },
      { rank: '101st - 1000th', reward: '$5' },
      { rank: '1001st - 2500th', reward: '$1' },
    ],
    previousWinners: [
      { rank: '1st', user: 'UserA', reward: '$10,000' },
      { rank: '2nd', user: 'UserB', reward: '$3,000' },
      { rank: '3rd', user: 'UserC', reward: '$2,000' },
      { rank: '4th', user: 'UserD', reward: '$700' },
    ],
  };

  return (
    <div className="lottery-modal-overlay" onClick={onClose}>
      <div className="lottery-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="lottery-modal-close-button" onClick={onClose}>&times;</button>

        <div className="lottery-header">
          <h2>Lottery #{lotteryDetails.lotteryNumber} - {timeLeft}</h2>
        </div>

        <div className="lottery-main-display">
          <div className="lottery-prize-circle">
            <span className="lottery-total-prize">{lotteryDetails.totalPrize}</span>
            <span className="lottery-winners-count">{lotteryDetails.numWinners} WINNERS</span>
          </div>
          <div className="lottery-tickets-overlay">
            <svg className="ticket-icon-large" xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="#FFD700" stroke="#B8860B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9a3 3 0 0 1 0 6v-6Z" /><path d="M22 9a3 3 0 0 0 0 6v-6Z" /><path d="M13 5H6a2 2 0 0 0-2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" /><path d="M14 5h4a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2h-4" />
            </svg>
            <svg className="ticket-icon-large" xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="#FFD700" stroke="#B8860B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9a3 3 0 0 1 0 6v-6Z" /><path d="M22 9a3 3 0 0 0 0 6v-6Z" /><path d="M13 5H6a2 2 0 0 0-2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" /><path d="M14 5h4a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2h-4" />
            </svg>
          </div>
        </div>
        <p className="lottery-ticket-info">{lotteryDetails.tickets} tickets</p>

        <div className="lottery-tabs">
          <button
            className={`lottery-tab-button ${activeTab === 'prizes' ? 'active' : ''}`}
            onClick={() => setActiveTab('prizes')}
          >
            Prizes
          </button>
          <button
            className={`lottery-tab-button ${activeTab === 'previousWinners' ? 'active' : ''}`}
            onClick={() => setActiveTab('previousWinners')}
          >
            Previous Winners
          </button>
        </div>

        <div className="lottery-tab-content">
          {activeTab === 'prizes' && (
            <table className="prizes-table">
              <thead>
                <tr>
                  <th>Picks</th>
                  <th>Rewards</th>
                </tr>
              </thead>
              <tbody>
                {lotteryDetails.prizes.map((prize, index) => (
                  <tr key={index}>
                    <td>{prize.rank}</td>
                    <td>{prize.reward}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'previousWinners' && (
            <ul className="previous-winners-list">
              {lotteryDetails.previousWinners.map((winner, index) => (
                <li key={index}>
                  <strong>{winner.rank}:</strong> {winner.user} (Won {winner.reward})
                </li>
              ))}
              {lotteryDetails.previousWinners.length === 0 && (
                <li>No previous winners yet.</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// Modal Component
function ItemDetailModal({ item, onClose, onViewLottery, handleProtectedClick }) {
  if (!item) return null;

  // Mock data for rewards to match screenshot
  const itemRewards = [
    { type: 'lottery', label: 'Complete Level 5', value: '150 Coins', tickets: '', image: 'https://placehold.co/30x30/8A2BE2/FFFFFF?text=P1' },
    { type: 'task', label: 'Newr pu tegeR', value: '150 Coins', tickets: '', image: 'https://placehold.co/30x30/4CAF50/FFFFFF?text=P2' },
    { type: 'task', label: 'Sant ora ercidatios', value: '150 Coins', tickets: '', image: 'https://placehold.co/30x30/C71585/FFFFFF?text=P3' },
    { type: 'task', label: 'Defeat 10 Enemies', value: '95 Coins', tickets: '', image: 'https://placehold.co/30x30/00C0FF/FFFFFF?text=P4' },
    { type: 'task', label: 'Yourplie cooine 10 Scoips', value: '150 Coins', tickets: '', image: 'https://placehold.co/30x30/8A2BE2/FFFFFF?text=P5' },
    { type: 'task', label: 'Defeat 10 Enemies', value: '150 Coins', tickets: '', image: 'https://placehold.co/30x30/4CAF50/FFFFFF?text=P6' },
    { type: 'task', label: 'Sourplodden yourands', value: '150 Coins', tickets: '', image: 'https://placehold.co/30x30/C71585/FFFFFF?text=P7' },
    { type: 'task', label: 'Complete', value: '150 Coins', tickets: '', image: 'https://placehold.co/30x30/00C0FF/FFFFFF?text=P8' },
    { type: 'task', label: 'Vourpuetand inntedreds', value: '150 Coins', tickets: '', image: 'https://placehold.co/30x30/8A2BE2/FFFFFF?text=P9' },
  ];

  const handleActionClick = () => {
    handleProtectedClick(() => {
      if (item.url) {
        window.open(item.url, '_blank');
      } else {
        console.log(`Starting task: ${item.title}`);
      }
      onClose();
    });
  };

  const handleViewLotteryClick = () => {
    handleProtectedClick(() => {
      onViewLottery();
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>&times;</button>

        <div className="modal-left-column">
          <h2 className="modal-title">{item.title}</h2>
          <img src={item.image} alt={item.title} className="modal-image" onError={(e) => e.target.src = 'https://placehold.co/200x120/808080/FFFFFF?text=Item'} />

          <div className="modal-action-row">
            <button className="modal-action-button play-and-earn-button" onClick={handleActionClick}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Play and Earn
            </button>
            <p className="modal-price">{item.value}</p>
          </div>
        </div>

        <div className="modal-right-column">
          <div className="modal-rewards-section">
            <h3>Rewards</h3>
            <ul className="rewards-list">
              {itemRewards.map((reward, index) => (
                <li key={index} className="reward-item">
                  <img src={reward.image} alt="reward icon" className="reward-icon" onError={(e) => e.target.src = 'https://placehold.co/30x30/808080/FFFFFF?text=P'} />
                  <span className="reward-label">{reward.label}</span>
                  <span className="reward-value">{reward.value}</span>
                  {reward.tickets && <span className="reward-tickets">{reward.tickets} tickets</span>}
                  {reward.action === 'View' && (
                    <button className="reward-view-button" onClick={handleViewLotteryClick}>View</button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="modal-description-section">
            <h3>Description</h3>
            <p>{item.fullDescription || item.description || 'No detailed description available.'}</p>
          </div>

          <div className="modal-steps-section">
            <h3>Steps</h3>
            <ul className="steps-list">
              {item.completionSteps && item.completionSteps.length > 0 ? (
                item.completionSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))
              ) : (
                <li>No specific steps provided.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Function to get SVG icon based on category ID
const getCategoryIcon = (categoryId) => {
  switch (categoryId) {
    case 'all':
      return (
        <svg xmlns="http://www.w3.org/24/24" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-grid">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <line x1="3" x2="21" y1="9" y2="9" />
          <line x1="3" x2="21" y1="15" y2="15" />
          <line x1="9" x2="9" y1="3" y2="21" />
          <line x1="15" x2="15" y1="3" y2="21" />
        </svg>
      );
    case 'surveys':
      return <ClipboardList size={24} />;
    case 'offers':
      return (
        <svg xmlns="http://www.w3.org/24/24" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gift">
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M12 8v13" />
          <path d="M19 12v9" />
          <path d="M5 12v9" />
          <path d="M10 8H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4v6Z" />
          <path d="M14 8h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-4v6Z" />
        </svg>
      );
    case 'games':
      return <img src="/icon17.png" alt="Games" style={{ width: 24, height: 24 }} />;
    case 'watch-videos':
      return (
        <svg xmlns="http://www.w3.org/24/24" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play-square">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="m10 8 6 4-6 4Z" />
        </svg>
      );
    default:
      return null;
  }
};

// Reusable Task Card Component
function TaskCard({ task, onClick, handleProtectedClick }) {
  const [isHovered, setIsHovered] = useState(false);

  const getIconSrc = (type) => {
    switch (type) {
      case 'games':
      case 'game':
        return '/icon17.png';
      case 'app':
      case 'offers':
      case 'surveys':
        return '/icon18.png';
      case 'watch-videos':
        return '/icon18.png';
      default:
        return 'https://placehold.co/24x24/808080/FFFFFF?text=I';
    }
  };

  const handleShowClick = (e) => {
    e.stopPropagation();
    handleProtectedClick(() => onClick(task));
  };

  const getButtonText = (type) => {
    switch (type) {
      case 'offers':
      case 'surveys':
      case 'watch-videos':
        return 'Start Offer';
      case 'games':
      case 'game':
      case 'app':
        return 'Play Game';
      default:
        return 'Play Now';
    }
  };

  return (
    <div
      className={`task-card task-card-${task.cardSize || 'medium'} ${isHovered ? 'hovered-blur' : ''} ${task.isLocked ? 'locked' : ''} ${task.isPremium ? 'premium' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ '--card-border-gradient': task.gradient }}
    >
      <div className="card-top-section relative">
        <img
          src={task.image}
          alt={task.title}
          className="task-icon"
          onError={(e) => e.target.src = 'https://placehold.co/40x40/808080/FFFFFF?text=I'}
        />
        {/* {task.type === 'GAME' && !task.isPremium && (
          <div className="game-icon-badge">
            <Gamepad size={14} />
            <span>GAME</span>
          </div>
        )} */}
      </div>

      <div className="task-card-details-main">
        {task.isPremium ? (
          <>
            <h3 className="task-card-title">{task.shortTitle || task.title}</h3>
            <p className="task-card-condition">{task.displayCondition}</p>
            <div className="task-card-value-and-stars">
                <p className="task-card-value">{task.displayValue}</p>
                {renderStars(task.starRating)}
            </div>
          </>
        ) : (
          <>
            <h3 className="task-card-title">{task.shortTitle || task.title}</h3>
            <div className="task-card-value-and-stars">
                <p className="task-card-value">{task.displayValue}</p>
                {renderStars(task.starRating)}
            </div>
            {!task.isLocked && <p className="task-card-condition">{task.displayCondition}</p>}
          </>
        )}
      </div>

      {isHovered && !task.isLocked && (
        <button className="show-button" onClick={handleShowClick}>
          <svg className="play-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="#00ff00ff"/>
            <polygon points="10 8 16 12 10 16 10 8" fill="#FFFFFF"/>
          </svg>
          <span>{getButtonText(task.type)}</span>
        </button>
      )}

      {task.isLocked && (
        <div className="task-locked-overlay">
          <Lock size={30} />
        </div>
      )}
    </div>
  );
}

// New Reusable Game Card Component
function GameCardComponent({ game, cardSize, gradient, handleShowButtonClick, handleProtectedClick }) {
  const [isHovered, setIsHovered] = useState(false);

  const getIconSrc = (type) => {
    switch (type) {
      case 'GAME':
        return '/icon17.png';
      case 'APP':
        return '/icon18.png';
      default:
        return 'https://placehold.co/24x24/808080/FFFFFF?text=I';
    }
  };

  const getButtonText = (type) => {
    switch (type) {
      case 'offers':
      case 'surveys':
      case 'watch-videos':
        return 'Start Offer';
      case 'games':
      case 'game':
      case 'app':
        return 'Play Now';
      default:
        return 'Play Now';
    }
  };

  const handleClick = (e) => {
    handleProtectedClick(() => handleShowButtonClick(game, e));
  };

  return (
    <div
      key={game.id}
      className={`game-card game-card-${cardSize || 'medium'} ${isHovered ? 'hovered-blur' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ '--card-border-gradient': gradient }}
    >
      <div className="card-top-section relative">
        <img src={game.image} alt={game.title} className="game-icon" onError={(e) => e.target.src = 'https://placehold.co/40x40/808080/FFFFFF?text=G'} />
        
      </div>
      {game.type === 'GAME' && (
          <div className="game-icon-badge">
            {/* <img src="/icon17.png" alt="Game" style={{ width: 15, height: 15 }} /> */}
            <span>GAME</span>
          </div>
        )}
      {/* Removed game-tag as it's not needed with the new badge */}
      {/* <div className="game-tag">
        <img src={getIconSrc(game.type)} alt={game.type} className="game-type-icon" onError={(e) => e.target.src = 'https://placehold.co/16x16/808080/FFFFFF?text=X'} />
      </div> */}
      <div className="game-details-main">
        <h3 className="game-title-overlay">{game.title}</h3>
        <p className="game-value-overlay">{game.value}</p>
        <p className="game-condition-overlay">{game.condition}</p>
      </div>
      {isHovered && (
        <button className="show-button" onClick={handleClick}>
          <svg className="play-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="transparent" />
            <polygon points="10 8 16 12 10 16 10 8" fill="#FFFFFF"/>
          </svg>
          <span>{getButtonText(game.type)}</span>
        </button>
      )}
    </div>
  );
}

// New Reusable Sidebar Category Card Component
function SidebarCategoryCard({ category, isActive, onClick, handleProtectedClick }) {
  const handleClick = () => {
    handleProtectedClick(() => onClick(category.id));
  };

  return (
    <div
      className={`sidebar-category-card ${isActive ? 'active' : ''}`}
      onClick={handleClick}
    >
      <div className="card-top-section">
        {getCategoryIcon(category.id)}
      </div>
      <div className="category-details-main">
        <h3 className="category-title">{category.name}</h3>
      </div>
    </div>
  );
}

// Partner Card Component
function PartnerCard({ partner, handleProtectedClick }) {
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    const stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${partner.id}-${i}`} className="star-icon full-star">★</span>);
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${partner.id}-${i}`} className="star-icon empty-star">★</span>);
    }
    return <div className="partner-stars">{stars}</div>;
  };

  const handleClick = () => {
    handleProtectedClick(() => {
      console.log(`Clicked on partner: ${partner.name}`);
      // Add specific partner action here if needed
    });
  };

  return (
    <div
      className={`partner-card ${partner.type === 'survey-card' ? 'survey-card-special' : ''}`}
      style={{ backgroundImage: partner.backgroundImage ? `url(${partner.backgroundImage})` : (partner.gradient ? partner.gradient : 'none') }}
      onClick={handleClick} // Make the entire card clickable
    >
      {partner.bonusPercentage && (
        <div className="partner-bonus-badge">+{partner.bonusPercentage}%</div>
      )}
      <div className="partner-logo-container">
        <img src={partner.image} alt={partner.name} className="partner-logo" onError={(e) => e.target.src = 'https://placehold.co/60x60/808080/FFFFFF?text=P'} />
      </div>
      {partner.specialText ? (
        <p className="partner-special-text">{partner.specialText}</p>
      ) : (
        <>
          <h4 className="partner-name">{partner.name}</h4>
          {renderStars(partner.rating)}
        </>
      )}
    </div>
  );
}

// Main Tasks Listing Page with Filters and Sort
function TasksListingPage({ onBack, initialCategory = 'all', handleProtectedClick }) {
  const [rewardRange, setRewardRange] = useState([0, 1000]);
  const [estimatedTime, setEstimatedTime] = useState([0, 180]);
  const [selectedTaskType, setSelectedTaskType] = useState(initialCategory);
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [sortBy, setSortBy] = useState('Newest First');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showLotteryModal, setShowLotteryModal] = useState(false);

  const filteredAndSortedTasks = useCallback(() => {
    let filtered = [];

    const allAvailableItems = [
      ...initialTasks,
      ...gameCategories.flatMap(cat => cat.games.map(game => ({
        id: `game-${game.id}`,
        title: game.title,
        description: game.genre,
        fullDescription: game.fullDescription,
        completionSteps: game.completionSteps,
        estimatedTime: 0,
        reward: parseFloat(game.value.replace('$', '')) * 10,
        difficulty: 'Medium',
        type: game.type.toLowerCase(),
        tags: [],
        isCompleted: false,
        progress: 0,
        image: game.image,
        displayCondition: game.condition,
        url: game.url,
        genre: game.genre,
        rating: game.rating,
        cardSize: game.cardSize,
        gradient: game.gradient,
      })))
    ];

    if (selectedTaskType === 'all') {
      filtered = allAvailableItems;
    } else if (selectedTaskType === 'surveys') {
      filtered = allAvailableItems.filter(item => item.type === 'surveys');
    } else if (selectedTaskType === 'offers') {
      filtered = allAvailableItems.filter(item => item.type === 'offers');
    } else if (selectedTaskType === 'games') {
      filtered = allAvailableItems.filter(item => item.type === 'games' || item.type === 'game' || item.type === 'app');
    } else if (selectedTaskType === 'watch-videos') {
      filtered = allAvailableItems.filter(item => item.type === 'watch-videos');
    }

    filtered = filtered.filter(task => task.reward >= rewardRange[0] && task.reward <= rewardRange[1]);
    filtered = filtered.filter(task => task.estimatedTime >= estimatedTime[0] && task.estimatedTime <= estimatedTime[1]);

    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(task => task.difficulty === selectedDifficulty);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'Newest First':
          return b.id.localeCompare(a.id);
        case 'Highest Reward':
          return b.reward - a.reward;
        case 'Shortest Time':
          return a.estimatedTime - b.estimatedTime;
        case 'Most Popular':
          return b.reward - a.reward;
        default:
          return 0;
      }
    });

    return filtered;
  }, [rewardRange, estimatedTime, selectedTaskType, selectedDifficulty, sortBy]);

  useEffect(() => {
    setSelectedTaskType(initialCategory);
  }, [initialCategory]);

  const handleCategoryButtonClick = (typeId) => {
    handleProtectedClick(() => setSelectedTaskType(typeId));
  };

  const handleRewardRangeChange = (e) => {
    handleProtectedClick(() => setRewardRange([parseInt(e.target.value), rewardRange[1]]));
  };

  const handleEstimatedTimeChange = (e) => {
    handleProtectedClick(() => setEstimatedTime([parseInt(e.target.value), estimatedTime[1]]));
  };

  const getHeaderTitle = () => {
    const selectedCategory = categories.find(cat => cat.id === selectedTaskType);
    return selectedCategory ? selectedCategory.name : 'All Available Tasks';
  };

  const groupedTasks = useCallback(() => {
    const tasksToDisplay = filteredAndSortedTasks();

    if (selectedTaskType !== 'all') {
      return { [selectedTaskType]: tasksToDisplay };
    }

    const groups = {};
    categories.filter(cat => cat.id !== 'all').forEach(cat => {
      const tasksInType = tasksToDisplay.filter(task => task.type === cat.id || (cat.id === 'games' && (task.type === 'game' || task.type === 'app')));
      if (tasksInType.length > 0) {
        groups[cat.id] = tasksInType;
      }
    });
    return groups;
  }, [selectedTaskType, filteredAndSortedTasks]);

  return (
    <div className="tasks-listing-page">
      <aside className="tasks-sidebar">
        <h3>Categories & Filters</h3>

        <div className="filter-group">
          <h4 className="filter-group-title">Categories</h4>
          <div className="category-buttons">
            {categories.map(category => (
              <SidebarCategoryCard
                key={category.id}
                category={category}
                isActive={selectedTaskType === category.id}
                onClick={handleCategoryButtonClick}
                handleProtectedClick={handleProtectedClick}
              />
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h4 className="filter-group-title">Filters</h4>

          <div className="filter-group">
            <h5 className="filter-group-title">Reward Range (Coins)</h5>
            <div className="range-slider-container">
              <input
                type="range"
                min="0"
                max="1000"
                value={rewardRange[0]}
                onChange={handleRewardRangeChange}
                className="range-slider"
              />
              <div className="range-values">
                <span>{rewardRange[0]}</span>
                <span>1000</span>
              </div>
            </div>
          </div>

          <div className="filter-group">
            <h5 className="filter-group-title">Estimated Time (min)</h5>
            <div className="range-slider-container">
              <input
                type="range"
                min="0"
                max="180"
                value={estimatedTime[0]}
                onChange={handleEstimatedTimeChange}
                className="range-slider"
              />
              <div className="range-values">
                <span>{estimatedTime[0]}</span>
                <span>180</span>
              </div>
            </div>
          </div>

          <div className="filter-group">
            <h5 className="filter-group-title">Difficulty</h5>
            <select
              value={selectedDifficulty}
              onChange={(e) => handleProtectedClick(() => setSelectedDifficulty(e.target.value))}
              className="filter-select"
            >
              <option value="All">All</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
        <button className="back-button" onClick={() => handleProtectedClick(onBack)}>Back to Home</button>
      </aside>

      <main className="tasks-main-content">
        <div className="sort-by-container">
          <label htmlFor="sort-by">Sort By:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => handleProtectedClick(() => setSortBy(e.target.value))}
            className="filter-select"
          >
            <option value="Newest First">Newest First</option>
            <option value="Highest Reward">Highest Reward</option>
            <option value="Shortest Time">Shortest Time</option>
            <option value="Most Popular">Most Popular</option>
          </select>
        </div>

        <h2 className="page-header">{getHeaderTitle()} ({filteredAndSortedTasks().length})</h2>
        {selectedTaskType === 'all' && (
          <p style={{ textAlign: 'center', fontSize: '1rem', color: '#bbb', marginBottom: '20px' }}>
            This section includes all types of tasks: surveys, offers, games, watch videos, and refer & earn tasks.
          </p>
        )}
        {selectedTaskType === 'surveys' && (
          <p style={{ textAlign: 'center', fontSize: '1.rem', color: '#bbb', marginBottom: '20px' }}>
            Displaying tasks for the "Surveys" category.
          </p>
        )}
        {selectedTaskType === 'offers' && (
          <p style={{ textAlign: 'center', fontSize: '1.rem', color: '#bbb', marginBottom: '20px' }}>
            Displaying tasks for the "Offers" category.
          </p>
        )}
        {selectedTaskType === 'games' && (
          <p style={{ textAlign: 'center', fontSize: '1.rem', color: '#bbb', marginBottom: '20px' }}>
            Displaying tasks for the "Games" category.
          </p>
        )}
        {selectedTaskType === 'watch-videos' && (
          <p style={{ textAlign: 'center', fontSize: '1rem', color: '#bbb', marginBottom: '20px' }}>
            Displaying tasks for the "Watch Videos" category.
          </p>
        )}

        {Object.keys(groupedTasks()).map(typeId => (
          <div key={typeId} className="task-category-section">
            <h4>{categories.find(cat => cat.id === typeId)?.name || 'Unknown Category'}</h4>
            <div className="task-cards-grid">
              {groupedTasks()[typeId].map(task => (
                <TaskCard key={task.id} task={task} onClick={setSelectedItem} handleProtectedClick={handleProtectedClick} />
              ))}
            </div>
          </div>
        ))}

        {filteredAndSortedTasks().length === 0 && (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: '1.2rem', color: '#bbb' }}>
              No tasks match your current filters.
            </p>
          )}
      </main>

      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onViewLottery={() => setShowLotteryModal(true)} handleProtectedClick={handleProtectedClick} />}
      {showLotteryModal && <LotteryDetailModal onClose={() => setShowLotteryModal(false)} />}
        <Footer />
    </div>
  );
}
const NotificationBar = () => {
  const notifications = [
    { name: "Naimasfak", amount: "0.48", platform: "POLL.FY", avatar: "https://i.pravatar.cc/40?img=1", bg: "#1E90FF" },
    { name: "Kambuh", amount: "71", platform: "AYET", avatar: "https://i.pravatar.cc/40?img=2", bg: "#20B2AA" },
    { name: "rodolf", amount: "473", platform: "ADGATE", avatar: "https://i.pravatar.cc/40?img=3", bg: "#008080" },
    { name: "gyyttrtt", amount: "225", platform: "ADGATE", avatar: "https://i.pravatar.cc/40?img=4", bg: "#00CED1" },
    { name: "exigible", amount: "262", platform: "ADGATE", avatar: "https://i.pravatar.cc/40?img=5", bg: "#32CD32" },
    { name: "exigible", amount: "225", platform: "ADGATE", avatar: "https://i.pravatar.cc/40?img=6", bg: "#32CD32" },
    { name: ".", amount: "1200", platform: "REVENUEWALL", avatar: "https://i.pravatar.cc/40?img=7", bg: "#FF8C00" },
    { name: "LTC", amount: "861", platform: "WITHDRAWAL", avatar: "https://i.pravatar.cc/40?img=8", bg: "#778899" },
    { name: "LTC", amount: "473", platform: "WITHDRAWAL", avatar: "https://i.pravatar.cc/40?img=9", bg: "#708090" },
  ];

  return (
    <div className="notification-bar">
      <div className="notification-scroll">
          {notifications.map((item, idx) => (
            <div key={idx} className="notification-card">
              <div className="notif-left">
                <img src={item.avatar} alt={item.name} className="notif-avatar" />
                <div className="notif-text">
                  <div className="notif-header">
                    <div className="notif-name">{item.name}</div>
                    <div className="notif-amount">{item.amount}</div> {/* ✅ moved right here */}
                  </div>
                  <div className="notif-tag">{item.platform}</div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

};


// Common Header Component
const CommonHeader = ({ currentPage, setCurrentPage, isLoggedIn, handleProtectedClick, toggleLoginStatus, userBalance, openProfileModal }) => {
  return (
    <header className="home-header">
      <div className="home-header-left">
        <div className="home-logo">
          <img src="/icon20.png" alt="GamePro Logo" style={{ width: '120px', height: 'auto' }} />
        </div>

        <nav className="home-nav">
          <span className={currentPage === 'home' ? 'active' : ''} onClick={() => handleProtectedClick(() => setCurrentPage('home'))}>
            <Home size={20} /> Home
          </span>
          
          <span className={currentPage === 'profile' ? 'active' : ''} onClick={() => handleProtectedClick(() => setCurrentPage('profile'))}>
            <User size={20} /> Profile
          </span>
          <span className={currentPage === 'support' ? 'active' : ''} onClick={() => handleProtectedClick(() => setCurrentPage('support'))}>
            <LifeBuoy size={20} /> Support
          </span>
          <span className={currentPage === 'refer' ? 'active' : ''} onClick={() => handleProtectedClick(() => setCurrentPage('refer'))}>
            <Users size={20} /> Refer&earn
          </span>
          <span className={currentPage === 'leader' ? 'active' : ''} onClick={() => handleProtectedClick(() => setCurrentPage('leader'))}>
            <Users size={20} /> Leaderboard
          </span>
        </nav>
      </div>

      {/* New Right Section: Balance + Username */}
      <div className="home-header-right">
        <div className="user-balance">
          <span className="balance-amount">$ {userBalance.toFixed(2)}</span>
        </div>
        <div className="user-profile" onClick={openProfileModal}> {/* Added onClick handler */}
          <div className="user-avatar">
            <img src="/icon21.png" alt="User Avatar" width={24} height={24} />
          </div>
          <span className="user-name">{isLoggedIn ? 'shivama' : 'Guest'}</span>
        </div>
        <button
          onClick={toggleLoginStatus}
          className="ml-4 px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
        >
          {isLoggedIn ? 'Logout' : 'Login / Signup'}
        </button>
       
      </div>
    </header>
  );
 

};

function HomePageContent({ setCurrentPage, currentPage, handleProtectedClick }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showLotteryModal, setShowLotteryModal] = useState(false);
  // New state to track expanded sections
  const [expandedSections, setExpandedSections] = useState({});

  const handleShowButtonClick = (item, e) => {
    e.stopPropagation();
    setSelectedItem(item);
  };

  const scrollLeft = (title) => {
    const el = document.getElementById(`carousel-${title.replace(/\s/g, '-')}`);
    if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = (title) => {
    const el = document.getElementById(`carousel-${title.replace(/\s/g, '-')}`);
    if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
  };

  useEffect(() => {
    const wrappers = document.querySelectorAll('.carousel-wrapper');
    wrappers.forEach(wrapper => {
      const carousel = wrapper.querySelector('.game-carousel, .offer-partners-grid, .featured-surveys-carousel');
      let timeout;

      const show = () => {
        wrapper.classList.add('show-scroll');
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          wrapper.classList.remove('show-scroll');
        }, 4000); // Hide after 4 seconds
      };

      if (carousel) {
        carousel.addEventListener('scroll', show);
      }

      wrapper.addEventListener('mouseenter', show);
      wrapper.addEventListener('mouseleave', () => {
        clearTimeout(timeout);
        wrapper.classList.remove('show-scroll');
      });
    });
  }, [expandedSections]); // Re-run effect if expandedSections changes

  const homePageSections = gameCategories;

  const premiumSurvey = initialTasks.find(task => task.id === 't_premium');
  const regularSurvey = initialTasks.find(task => task.id === 't_available_regular');
  const lockedSurveys = initialTasks.filter(task => task.isLocked);

  return (
     <div className="home-container">
      <main className="home-main-content">
        <NotificationBar />
        {homePageSections.map((category) => {
          const sectionId = `section-${category.title.replace(/\s/g, '-')}`;
          const isExpanded = expandedSections[category.title];
          return (
            <section key={category.title} className="game-section" id={sectionId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="section-title-with-icon">
                    {category.title === 'Gaming Offers'}
                    {category.title === 'Other Offers'}
                    {category.title}
                </h2>
                <button
                  className="view-all-button"
                  onClick={() => handleProtectedClick(() => setExpandedSections(prev => ({ ...prev, [category.title]: !prev[category.title] })))}
                >
                  {isExpanded ? 'Show Less' : 'View All'}
                </button>
              </div>
              {isExpanded ? (
                <div className={`game-cards-grid ${category.cardSize === 'small' ? 'game-cards-grid-small' : ''}`}>
                  {category.games.map(game => (
                    <div
                      key={game.id}
                      className="gradient-card-wrapper"
                      style={{
                        background: game.gradient,
                        padding: '2px',
                        borderRadius: '20px',
                        display: 'inline-block'
                      }}
                    >
                      <GameCardComponent
                        game={game}
                        cardSize={category.cardSize}
                        gradient={game.gradient || category.gradient}
                        handleShowButtonClick={handleShowButtonClick}
                        handleProtectedClick={handleProtectedClick}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="carousel-wrapper">
                  <button className="scroll-btn left" onClick={() => handleProtectedClick(() => scrollLeft(category.title))}>&lt;</button>
                  <div className="game-carousel" id={`carousel-${category.title.replace(/\s/g, '-')}`}>
                    {category.games.map(game => (
                      <div
                        key={game.id}
                        className="gradient-card-wrapper"
                        style={{
                          background: game.gradient,
                          padding: '2px',
                          borderRadius: '20px',
                          display: 'inline-block'
                        }}
                      >
                        <GameCardComponent
                          game={game}
                          cardSize={category.cardSize}
                          gradient={game.gradient || category.gradient}
                          handleShowButtonClick={handleShowButtonClick}
                          handleProtectedClick={handleProtectedClick}
                        />
                      </div>
                    ))}
                  </div>
                  <button className="scroll-btn right" onClick={() => handleProtectedClick(() => scrollRight(category.title))}>&gt;</button>
                </div>
              )}
            </section>
          );
        })}

        {/* Featured Surveys Section */}
        <section className="featured-surveys-section game-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="featured-surveys-title-with-icon">
                Featured Surveys
            </h2>
            <button
              className="view-all-button"
              onClick={() => handleProtectedClick(() => setExpandedSections(prev => ({ ...prev, 'Featured Surveys': !prev['Featured Surveys'] })))}
            >
              {expandedSections['Featured Surveys'] ? 'Show Less' : 'View All'}
            </button>
          </div>

          {expandedSections['Featured Surveys'] ? (
            <div className="task-cards-grid"> {/* Reusing task-cards-grid for surveys */}
                {premiumSurvey && (
                  <div className="gradient-card-wrapper"
                    style={{
                      background: premiumSurvey.gradient,
                      padding: '2px',
                      borderRadius: '20px',
                      display: 'inline-block'
                    }}
                  >
                    <div className="survey-card" onClick={() => handleProtectedClick(() => setSelectedItem(premiumSurvey))}>
                      <div className="survey-card-top">
                        <img
                          src={premiumSurvey.image}
                          alt={premiumSurvey.title}
                          className="survey-icon"
                          onError={(e) => e.target.src = 'https://placehold.co/40x40/808080/FFFFFF?text=I'}
                        />
                      </div>
                      <div className="survey-card-bottom">
                        <h3 className="survey-title">{premiumSurvey.shortTitle || premiumSurvey.title}</h3>
                        <p className="survey-condition">{premiumSurvey.displayCondition}</p>
                        <div className="survey-value-and-stars">
                            <p className="survey-value">{premiumSurvey.displayValue}</p>
                            {renderStars(premiumSurvey.starRating)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {regularSurvey && (
                  <div className="gradient-card-wrapper"
                    style={{
                      background: regularSurvey.gradient,
                      padding: '2px',
                      borderRadius: '20px',
                      display: 'inline-block'
                    }}
                  >
                    <div className="survey-card" onClick={() => handleProtectedClick(() => setSelectedItem(regularSurvey))}>
                      <div className="survey-card-top">
                        <img
                          src={regularSurvey.image}
                          alt={regularSurvey.title}
                          className="survey-icon"
                          onError={(e) => e.target.src = 'https://placehold.co/40x40/808080/FFFFFF?text=I'}
                        />
                      </div>
                      <div className="survey-card-bottom">
                        <h3 className="survey-title">{regularSurvey.shortTitle || regularSurvey.title}</h3>
                        <div className="survey-value-and-stars">
                            <p className="survey-value">{regularSurvey.displayValue}</p>
                            {renderStars(regularSurvey.starRating)}
                        </div>
                        <p className="survey-condition">{regularSurvey.displayCondition}</p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Locked surveys are not clickable, so no need for handleProtectedClick here */}
                {lockedSurveys.map(task => (
                  <div className="gradient-card-wrapper"
                    key={task.id}
                    style={{
                      background: task.gradient,
                      padding: '2px',
                      borderRadius: '20px',
                      display: 'inline-block'
                    }}
                  >
                    <div className="survey-card locked">
                      <div className="survey-card-top">
                        <img
                          src={task.image}
                          alt={task.title}
                          className="survey-icon"
                          onError={(e) => e.target.src = 'https://placehold.co/40x40/808080/FFFFFF?text=I'}
                        />
                      </div>
                      <div className="survey-card-bottom">
                        <h3 className="survey-title">{task.shortTitle || task.title}</h3>
                        <div className="survey-value-and-stars">
                            <p className="survey-value">{task.displayValue}</p>
                        </div>
                        <p className="survey-condition">{task.displayCondition}</p>
                      </div>
                      <div className="survey-lock-overlay">
                        <Lock size={20} />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="carousel-wrapper" style={{ position: 'relative' }}>
              <button className="scroll-btn left" onClick={() => handleProtectedClick(() => scrollLeft('Featured Surveys'))}>&lt;</button>
              <div className="featured-surveys-carousel" id="carousel-Featured-Surveys">
                {premiumSurvey && (
                  <div className="gradient-card-wrapper"
                    style={{
                      background: premiumSurvey.gradient,
                      padding: '2px',
                      borderRadius: '20px',
                      display: 'inline-block'
                    }}
                  >
                    <div className="survey-card" onClick={() => handleProtectedClick(() => setSelectedItem(premiumSurvey))}>
                      <div className="survey-card-top">
                        <img
                          src={premiumSurvey.image}
                          alt={premiumSurvey.title}
                          className="survey-icon"
                          onError={(e) => e.target.src = 'https://placehold.co/40x40/808080/FFFFFF?text=I'}
                        />
                      </div>
                      <div className="survey-card-bottom">
                        <h3 className="survey-title">{premiumSurvey.shortTitle || premiumSurvey.title}</h3>
                        <p className="survey-condition">{premiumSurvey.displayCondition}</p>
                        <div className="survey-value-and-stars">
                            <p className="survey-value">{premiumSurvey.displayValue}</p>
                            {renderStars(premiumSurvey.starRating)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {regularSurvey && (
                  <div className="gradient-card-wrapper"
                    style={{
                      background: regularSurvey.gradient,
                      padding: '2px',
                      borderRadius: '20px',
                      display: 'inline-block'
                    }}
                  >
                    <div className="survey-card" onClick={() => handleProtectedClick(() => setSelectedItem(regularSurvey))}>
                      <div className="survey-card-top">
                        <img
                          src={regularSurvey.image}
                          alt={regularSurvey.title}
                          className="survey-icon"
                          onError={(e) => e.target.src = 'https://placehold.co/40x40/808080/FFFFFF?text=I'}
                        />
                      </div>
                      <div className="survey-card-bottom">
                        <h3 className="survey-title">{regularSurvey.shortTitle || regularSurvey.title}</h3>
                        <div className="survey-value-and-stars">
                            <p className="survey-value">{regularSurvey.displayValue}</p>
                            {renderStars(regularSurvey.starRating)}
                        </div>
                        <p className="survey-condition">{regularSurvey.displayCondition}</p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Locked surveys are not clickable, so no need for handleProtectedClick here */}
                {lockedSurveys.map(task => (
                  <div className="gradient-card-wrapper"
                    key={task.id}
                    style={{
                      background: task.gradient,
                      padding: '2px',
                      borderRadius: '20px',
                      display: 'inline-block'
                    }}
                  >
                    <div className="survey-card locked">
                      <div className="survey-card-top">
                        <img
                          src={task.image}
                          alt={task.title}
                          className="survey-icon"
                          onError={(e) => e.target.src = 'https://placehold.co/40x40/808080/FFFFFF?text=I'}
                        />
                      </div>
                      <div className="survey-card-bottom">
                        <h3 className="survey-title">{task.shortTitle || task.title}</h3>
                        <div className="survey-value-and-stars">
                            <p className="survey-value">{task.displayValue}</p>
                        </div>
                        <p className="survey-condition">{task.displayCondition}</p>
                      </div>
                      <div className="survey-lock-overlay">
                        <Lock size={20} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="scroll-btn right" onClick={() => handleProtectedClick(() => scrollRight('Featured Surveys'))}>&gt;</button>

              <div className="locked-surveys-message-central">
                  <Lock size={30} />
                  <p>20 Surveys are locked</p>
                  <span>Complete your 1 available survey, to unlock all surveys</span>
              </div>
            </div>
          )}
        </section>

        {/* Offer Partners Section */}
        <section className="offer-partners-section game-section">
          <h2 className="offer-partners-title">
            
            Offer Partners
            
          </h2>
          <div className="carousel-wrapper">
            <button className="scroll-btn left" onClick={() => handleProtectedClick(() => scrollLeft('Offer Partners'))}>&lt;</button>
            <div className="offer-partners-grid" id="carousel-Offer-Partners">
              {offerPartners.map(partner => (
                <PartnerCard key={partner.id} partner={partner} handleProtectedClick={handleProtectedClick} />
              ))}
            </div>
            <button className="scroll-btn right" onClick={() => handleProtectedClick(() => scrollRight('Offer Partners'))}>&gt;</button>
          </div>
        </section>
      </main>

      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onViewLottery={() => setShowLotteryModal(true)} handleProtectedClick={handleProtectedClick} />}
      {showLotteryModal && <LotteryDetailModal onClose={() => setShowLotteryModal(false)} />}
        <Footer />
    </div>
  );
}

// This is the main App component that will be rendered.
export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Mock authentication state
  const [userBalance, setUserBalance] = useState(0); // New state for user balance
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false); // New state for profile modal

  // Function to handle clicks on protected elements
  const handleProtectedClick = (action) => {
    if (isLoggedIn) {
      action(); // If logged in, proceed with the original action
    } else {
      setShowLoginModal(true); // If not logged in, show the login modal
    }
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setUserBalance(5); // Set login bonus to $5
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserBalance(0); // Reset balance on logout
    setCurrentPage('home'); // Optionally redirect to home on logout
  };

  const toggleLoginStatus = () => {
    if (isLoggedIn) {
      handleLogout();
    } else {
      setShowLoginModal(true);
    }
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
  };

  const handleAddBalance = (amount) => {
    setUserBalance(prevBalance => prevBalance + amount);
    // In a real app, you'd integrate with a backend for actual transactions
    console.log(`Added $${amount} to balance. New balance: $${userBalance + amount}`);
  };

  const handleWithdrawBalance = (amount) => {
    if (userBalance >= amount) {
      setUserBalance(prevBalance => prevBalance - amount);
      // In a real app, you'd integrate with a backend for actual transactions
      console.log(`Withdrew $${amount} from balance. New balance: $${userBalance - amount}`);
    } else {
      console.log("Insufficient balance for withdrawal.");
    }
  };

  let content;
  if (typeof currentPage === 'object' && currentPage.name === 'tasks') {
    content = <TasksListingPage onBack={handleBackToHome} initialCategory={currentPage.category} handleProtectedClick={handleProtectedClick} />;
  } else {
    switch (currentPage) {
      case 'home':
        content = <HomePageContent setCurrentPage={setCurrentPage} currentPage={currentPage} handleProtectedClick={handleProtectedClick} />;
        break;
      
      case 'profile':
        content = <ProfilePage onBack={handleBackToHome} />;
        break;
      case 'leader':
        content = <LeaderPage onBack={handleBackToHome} />;
        break;
      case 'support':
        content = <SupportPage onBack={handleBackToHome} />;
        break;
      case 'refer':
        content = <ReferEarnPage onBack={handleBackToHome} />;
        break;
      default:
        content = <HomePageContent setCurrentPage={setCurrentPage} currentPage={currentPage} handleProtectedClick={handleProtectedClick} />;
    }
  }

  return (
    <>
      <CommonHeader
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isLoggedIn={isLoggedIn}
        handleProtectedClick={handleProtectedClick}
        toggleLoginStatus={toggleLoginStatus}
        userBalance={userBalance} // Pass userBalance to CommonHeader
        openProfileModal={() => setShowProfileModal(true)} // Pass function to open profile modal
      />
      <div className="main-content-area">
        {content}
      </div>

      {showLoginModal && (
        <LoginSignupModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {showProfileModal && isLoggedIn && ( // Only show profile modal if logged in
        <ProfileDetailModal
          onClose={() => setShowProfileModal(false)}
          userName="shivama" // Static username for now, can be dynamic
          userAvatar="/icon21.png" // Static avatar for now
          userBalance={userBalance}
          onAddBalance={handleAddBalance}
          onWithdrawBalance={handleWithdrawBalance}
        />
      )}
    </>
  );
}
