// App.jsx
import React, { useState, useEffect } from 'react';
import {
  Coins, Clock, Zap, Star, Filter, SortAsc, SortDesc, CheckCircle,
  Award, Trophy, User, Gift, Play, Monitor, Search, BarChart, TrendingUp,
  ChevronDown, X, Tag
} from 'lucide-react'; // Using lucide-react for icons
import './task.css';
// Mock Data
// ✅ Navbar Component
const Navbar = () => (
  <nav className="navbar">
    <ul className="navbar-links">
      <li><a href="/home">Home</a></li>
      <li><a href="/Dashboard">Dashboard</a></li>
      <li><a href="/profile">Profile</a></li>
      <li><a href="/SupportPage">Support</a></li>
      <li><a href="/refer">Refer&earn</a></li>
    </ul>
  </nav>
);

const categories = [
  { id: 'all', name: 'All', icon: Search },
  { id: 'surveys', name: 'Surveys', icon: BarChart },
  { id: 'offers', name: 'Offers', icon: Gift },
  { id: 'games', name: 'Games', icon: Play },
  { id: 'watch-videos', name: 'Watch Videos', icon: Monitor },
  { id: 'refer-earn', name: 'Refer & Earn', icon: User },
];

const initialTasks = [
  {
    id: 't1',
    title: 'Complete Daily Survey',
    description: 'Share your opinions on various topics and earn coins.',
    fullDescription: 'Participate in our daily survey. It covers a range of topics from consumer habits to social trends. Your feedback helps companies improve their products and services. Ensure you answer truthfully to qualify for the reward.',
    completionSteps: ['Click "Start Survey"', 'Answer all questions', 'Submit your responses'],
    estimatedTime: 10, // minutes
    reward: 150, // coins
    difficulty: 'Easy',
    type: 'surveys',
    tags: ['New', 'High Reward'],
    isCompleted: false,
    progress: 0,
  },
  {
    id: 't2',
    title: 'Play "Coin Rush" Game',
    description: 'Reach level 5 in our new arcade game.',
    fullDescription: 'Download and play "Coin Rush" on your mobile device. Reach level 5 to earn the full reward. Make sure to link your account to track progress. Fun and challenging!',
    completionSteps: ['Download Game', 'Install & Launch', 'Link Account', 'Reach Level 5'],
    estimatedTime: 25,
    reward: 300,
    difficulty: 'Medium',
    type: 'games',
    tags: ['Limited Time'],
    isCompleted: false,
    progress: 0,
  },
  {
    id: 't3',
    title: 'Watch 3 Product Review Videos',
    description: 'View short videos and answer a quick question.',
    fullDescription: 'Watch three short product review videos (approx. 2-3 minutes each). After each video, a simple multiple-choice question will appear to confirm your engagement. Complete all three to earn your coins.',
    completionSteps: ['Watch Video 1', 'Answer Question 1', 'Watch Video 2', 'Answer Question 2', 'Watch Video 3', 'Answer Question 3'],
    estimatedTime: 15,
    reward: 100,
    difficulty: 'Easy',
    type: 'watch-videos',
    tags: [],
    isCompleted: false,
    progress: 0,
  },
  {
    id: 't4',
    title: 'Sign Up for Newsletter Offer',
    description: 'Subscribe to a partner newsletter for exclusive deals.',
    fullDescription: 'Sign up for our partner\'s daily newsletter. You must confirm your subscription via email to qualify. You can unsubscribe at any time after receiving your reward.',
    completionSteps: ['Click "Sign Up"', 'Enter Email', 'Confirm Subscription via Email'],
    estimatedTime: 5,
    reward: 80,
    difficulty: 'Easy',
    type: 'offers',
    tags: [],
    isCompleted: true, // Example of a completed task
    progress: 100,
  },
  {
    id: 't5',
    title: 'Refer a Friend (First Deposit)',
    description: 'Invite a friend who makes their first deposit.',
    fullDescription: 'Share your unique referral link with friends. When a friend signs up using your link and makes their first qualifying deposit, you earn a substantial bonus. There\'s no limit to how many friends you can refer!',
    completionSteps: ['Share Referral Link', 'Friend Signs Up', 'Friend Makes First Deposit'],
    estimatedTime: 60, // Ongoing
    reward: 1000,
    difficulty: 'Hard',
    type: 'refer-earn',
    tags: ['High Reward', 'Popular'],
    isCompleted: false,
    progress: 0,
  },
  {
    id: 't6',
    title: 'Complete Advanced Market Research',
    description: 'In-depth survey on consumer electronics.',
    fullDescription: 'A detailed market research survey focusing on consumer electronics. This survey requires more time and thought but offers a higher reward. Your responses will be used to shape future product development.',
    completionSteps: ['Click "Start Survey"', 'Complete all sections', 'Submit'],
    estimatedTime: 30,
    reward: 400,
    difficulty: 'Medium',
    type: 'surveys',
    tags: ['High Reward'],
    isCompleted: false,
    progress: 0,
  },
  {
    id: 't7',
    title: 'Install & Use "Fitness Tracker" App',
    description: 'Install and use the app for 3 days.',
    fullDescription: 'Download the "Fitness Tracker" app and log your activities for 3 consecutive days. Ensure the app is installed via our link to track your progress. A great way to earn while staying healthy!',
    completionSteps: ['Download App', 'Install', 'Log Activity Day 1', 'Log Activity Day 2', 'Log Activity Day 3'],
    estimatedTime: 72 * 60, // 3 days
    reward: 500,
    difficulty: 'Medium',
    type: 'offers',
    tags: ['New'],
    isCompleted: false,
    progress: 0,
  },
  {
    id: 't8',
    title: 'Watch "Gaming Highlights" Playlist',
    description: 'Watch a playlist of 5 gaming highlight videos.',
    fullDescription: 'Enjoy a curated playlist of 5 exciting gaming highlight videos. Each video is short and engaging. Complete the entire playlist to receive your reward.',
    completionSteps: ['Start Playlist', 'Watch Video 1', 'Watch Video 2', 'Watch Video 3', 'Watch Video 4', 'Watch Video 5'],
    estimatedTime: 20,
    reward: 120,
    difficulty: 'Easy',
    type: 'watch-videos',
    tags: [],
    isCompleted: false,
    progress: 0,
  },
  // New Games Added
  {
    id: 't9',
    title: 'Play PUBG MOBILE',
    description: 'Achieve a Top 10 finish in 3 classic matches.',
    fullDescription: 'Download PUBG MOBILE and complete 3 classic matches with a Top 10 finish to earn your reward. Link your game account to track progress.',
    completionSteps: ['Download PUBG MOBILE', 'Install & Launch', 'Link Account', 'Achieve Top 10 in 3 Classic Matches'],
    estimatedTime: 45,
    reward: 350,
    difficulty: 'Medium',
    type: 'games',
    tags: ['New', 'Popular'],
    isCompleted: false,
    progress: 0,
  },
  {
    id: 't10',
    title: 'Reach City Hall Level 8 in Rise of Kingdoms',
    description: 'Build your city and reach City Hall Level 8.',
    fullDescription: 'Download Rise of Kingdoms and strategically develop your city to reach City Hall Level 8. This task requires consistent play and resource management.',
    completionSteps: ['Download Rise of Kingdoms', 'Install & Launch', 'Link Account', 'Reach City Hall Level 8'],
    estimatedTime: 180, // 3 hours
    reward: 700,
    difficulty: 'Hard',
    type: 'games',
    tags: ['High Reward'],
    isCompleted: false,
    progress: 0,
  },
  {
    id: 't11',
    title: 'Win 5 Matches in 8 Ball Pool',
    description: 'Show off your skills and win 5 matches.',
    fullDescription: 'Download 8 Ball Pool and win 5 standard matches. Your wins will be automatically tracked once your account is linked.',
    completionSteps: ['Download 8 Ball Pool', 'Install & Launch', 'Link Account', 'Win 5 Matches'],
    estimatedTime: 30,
    reward: 200,
    difficulty: 'Easy',
    type: 'games',
    tags: [],
    isCompleted: false,
    progress: 0,
  },
  {
    id: 't12',
    title: 'Collect 1000 Coins in Subway Surfers',
    description: 'Run, dodge, and collect coins in Subway Surfers.',
    fullDescription: 'Play Subway Surfers and collect a total of 1000 coins across multiple runs. Link your game account to ensure coin collection is tracked.',
    completionSteps: ['Download Subway Surfers', 'Install & Launch', 'Link Account', 'Collect 1000 Coins'],
    estimatedTime: 20,
    reward: 150,
    difficulty: 'Easy',
    type: 'games',
    tags: [],
    isCompleted: false,
    progress: 0,
  },
  {
    id: 't13',
    title: 'Watch 5 Episodes on OSN',
    description: 'Stream any 5 episodes from OSN.',
    fullDescription: 'Subscribe to OSN (if not already) and watch any 5 full episodes of shows or movies available on the platform. Ensure your viewing is tracked by linking your account.',
    completionSteps: ['Subscribe/Login to OSN', 'Link Account', 'Watch 5 Episodes'],
    estimatedTime: 250, // Approx 5 episodes * 50 min/episode
    reward: 600,
    difficulty: 'Medium',
    type: 'watch-videos',
    tags: ['High Reward'],
    isCompleted: false,
    progress: 0,
  },
  {
    id: 't14',
    title: 'Play PUBG PC (3 Matches)',
    description: 'Complete 3 matches in PUBG PC.',
    fullDescription: 'Play 3 full matches of PUBG PC. This task focuses on participation, regardless of your in-game performance. Ensure your Steam/game account is linked.',
    completionSteps: ['Launch PUBG PC', 'Link Account', 'Complete 3 Matches'],
    estimatedTime: 90,
    reward: 450,
    difficulty: 'Medium',
    type: 'games',
    tags: [],
    isCompleted: false,
    progress: 0,
  },
];

const mockUserStats = {
  totalCoinsEarned: 12500,
  numberOfTasksCompleted: 42,
  highestRewardEarnedTask: 'Refer a Friend (First Deposit)',
  currentLevel: 7,
};

const mockLeaderboard = [
  { id: 'u1', name: 'GamerPro', coins: 5000 },
  { id: 'u2', name: 'CoinMaster', coins: 4800 },
  { id: 'u3', name: 'TaskNinja', coins: 4500 },
  { id: 'u4', name: 'EarnKing', coins: 4200 },
  { id: 'u5', name: 'RewardHunter', coins: 3900 },
];

const mockAchievements = [
  { id: 'a1', title: 'First Task Completed', description: 'Complete your very first task!', icon: Award, unlocked: true },
  { id: 'a2', title: '500 Coins Earned', description: 'Reach 500 total coins.', icon: Coins, unlocked: true },
  { id: 'a3', title: 'Game Enthusiast', description: 'Complete 5 game tasks.', icon: Play, unlocked: false },
  { id: 'a4', title: 'Survey Savvy', description: 'Complete 10 survey tasks.', icon: BarChart, unlocked: false },
  { id: 'a5', title: 'Daily Streak Pro', description: 'Complete tasks for 7 consecutive days.', icon: Zap, unlocked: false },
];

// Helper function to format time
const formatTime = (minutes) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} hr${remainingMinutes > 0 ? ` ${remainingMinutes} min` : ''}`;
};

// Task Card Component
const TaskCard = ({ task, onTaskClick }) => {
  const CategoryIcon = categories.find(cat => cat.id === task.type)?.icon || Tag; // Default icon
  const tagColors = {
    'New': 'tag-blue',
    'Limited Time': 'tag-red',
    'High Reward': 'tag-green',
    'Popular': 'tag-purple',
  };

  const difficultyClass = {
    'Easy': 'difficulty-easy',
    'Medium': 'difficulty-medium',
    'Hard': 'difficulty-hard',
  };

  return (
    <div
      className="task-card"
      onClick={() => onTaskClick(task)}
    >
      <div className="task-card-header">
        <h3 className="task-card-title">
          <CategoryIcon size={20} className="icon-indigo" />
          {task.title}
        </h3>
        {task.isCompleted && (
          <span className="task-completed">
            <CheckCircle size={18} /> Completed
          </span>
        )}
      </div>
      <p className="task-card-description">{task.description}</p>
      <div className="task-card-details">
        <div className="task-detail-item">
          <Clock size={16} className="icon-gray" />
          <span>{formatTime(task.estimatedTime)}</span>
        </div>
        <div className="task-detail-item task-reward">
          <Coins size={16} className="icon-yellow" />
          <span>{task.reward} Coins</span>
        </div>
        <div className={`task-difficulty ${difficultyClass[task.difficulty]}`}>
          {task.difficulty}
        </div>
      </div>
      {task.tags.length > 0 && (
        <div className="task-tags">
          {task.tags.map(tag => (
            <span key={tag} className={`task-tag ${tagColors[tag] || 'tag-default'}`}>
              {tag}
            </span>
          ))}
        </div>
      )}
      {task.progress > 0 && task.progress < 100 && (
        <div className="task-progress-bar-container">
          <div
            className="task-progress-bar"
            style={{ width: `${task.progress}%` }}
          ></div>
          <span className="task-progress-text">{task.progress}% Progress</span>
        </div>
      )}
    </div>
  );
};

// Task Preview Modal Component
const TaskPreviewModal = ({ task, onClose }) => {
  if (!task) return null;

  const CategoryIcon = categories.find(cat => cat.id === task.type)?.icon || Tag;

  const handleStartTask = () => {
    console.log(`Starting task: ${task.title} (ID: ${task.id})`);
    // In a real application, you would trigger backend logic here
    // e.g., mark task as started, navigate to task page, etc.
    onClose(); // Close the modal after "starting" the task
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button
          onClick={onClose}
          className="modal-close-button"
        >
          <X size={24} />
        </button>
        <div className="modal-header">
          <CategoryIcon size={28} className="icon-indigo" />
          <h2 className="modal-title">{task.title}</h2>
        </div>

        <div className="modal-body">
          <p className="modal-description">{task.fullDescription}</p>

          <div className="modal-details-grid">
            <div className="modal-detail-item">
              <Clock size={20} className="icon-gray" />
              <span>Estimated Time: <span className="font-semibold">{formatTime(task.estimatedTime)}</span></span>
            </div>
            <div className="modal-detail-item">
              <Coins size={20} className="icon-yellow" />
              <span>Reward: <span className="font-semibold modal-reward-text">{task.reward} Coins</span></span>
            </div>
            <div className="modal-detail-item">
              <Zap size={20} className="icon-gray" />
              <span>Difficulty: <span className="font-semibold">{task.difficulty}</span></span>
            </div>
            {task.tags.length > 0 && (
              <div className="modal-detail-item modal-tags-full-width">
                <Tag size={20} className="icon-gray" />
                <span>Tags: {task.tags.map((tag, index) => (
                  <span key={tag} className="font-semibold">
                    {tag}{index < task.tags.length - 1 ? ', ' : ''}
                  </span>
                ))}</span>
              </div>
            )}
          </div>

          <div>
            <h3 className="modal-steps-title">Completion Steps:</h3>
            <ol className="modal-steps-list">
              {task.completionSteps.map((step, index) => (
                <li key={index} className="modal-step-item">
                  <span className="modal-step-number">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Bonus Eligibility (mock) */}
          <div className="modal-bonus-info">
            <p className="font-semibold">Bonus Eligibility:</p>
            <p className="text-sm">Complete this task along with two other 'Easy' tasks today to earn an additional 50 coins bonus!</p>
          </div>
        </div>

        <div className="modal-footer">
          <button
            onClick={handleStartTask}
            className="button-primary"
          >
            Start Task
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [tasks, setTasks] = useState(initialTasks);
  const [filters, setFilters] = useState({
    rewardRange: [0, 1000],
    timeRange: [0, 60], // minutes
    taskTypes: [],
    difficulty: 'All',
    availability: 'Active',
  });
  const [sortBy, setSortBy] = useState('Newest First');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false); // For mobile filter modal

  // Filtered Tasks Logic
  const filteredTasks = tasks.filter(task => {
    // Category Filter
    if (activeCategory !== 'all' && task.type !== activeCategory) {
      return false;
    }
    // Reward Range Filter
    if (task.reward < filters.rewardRange[0] || task.reward > filters.rewardRange[1]) {
      return false;
    }
    // Time Range Filter
    if (task.estimatedTime < filters.timeRange[0] || task.estimatedTime > filters.timeRange[1]) {
      return false;
    }
    // Task Type Checkboxes Filter
    if (filters.taskTypes.length > 0 && !filters.taskTypes.includes(task.type)) {
      return false;
    }
    // Difficulty Filter
    if (filters.difficulty !== 'All' && task.difficulty !== filters.difficulty) {
      return false;
    }
    // Availability Filter
    if (filters.availability === 'Active' && task.isCompleted) {
      return false;
    }
    if (filters.availability === 'Completed' && !task.isCompleted) {
      return false;
    }
    // 'Coming Soon' is not implemented in mock data, so it will always filter out.
    return true;
  });

  // Sorted Tasks Logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'Highest Reward':
        return b.reward - a.reward;
      case 'Shortest Time':
        return a.estimatedTime - b.estimatedTime;
      case 'Most Popular':
        // Mock popularity based on reward for now
        return b.reward - a.reward;
      case 'Newest First':
      default:
        // For mock data, we'll assume higher ID means newer
        return parseInt(b.id.substring(1)) - parseInt(a.id.substring(1));
    }
  });

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleTaskTypeChange = (type) => {
    setFilters(prev => {
      const newTypes = prev.taskTypes.includes(type) ? prev.taskTypes.filter(t => t !== type) : [...prev.taskTypes, type];
      return { ...prev, taskTypes: newTypes };
    });
  };

  // Special Features Countdown (Mock)
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + 2); // 2 hours from now
    targetDate.setMinutes(targetDate.getMinutes() + 30); // 30 minutes from now
    targetDate.setSeconds(targetDate.getSeconds() + 0); // 0 seconds from now

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        setCountdown({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <Navbar /> 
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">Task Listings</h1>
          <div className="mobile-filter-button-container">
            <button onClick={() => setShowFilterModal(true)} className="mobile-filter-button">
              <Filter size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Sidebar / Filters */}
        <aside className="sidebar">
          {/* Categories */}
          <div className="sidebar-section">
            <h2 className="sidebar-section-title">Categories</h2>
            <nav className="category-nav">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`category-button ${activeCategory === category.id ? 'category-button-active' : ''}`}
                >
                  <category.icon size={20} />
                  {category.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Filters */}
          <div className="sidebar-section">
            <h2 className="sidebar-section-title">Filters</h2>

            {/* Reward Range */}
            <div className="filter-group">
              <label htmlFor="reward-range" className="filter-label">Reward Range:</label>
              <input
                type="range"
                id="reward-range"
                min="0"
                max="1000"
                value={filters.rewardRange[1]} // Using max for simplicity in single slider
                onChange={(e) => handleFilterChange('rewardRange', [0, parseInt(e.target.value)])}
                className="filter-range-input"
              />
              <div className="filter-range-display">
                <span>0 Coins</span>
                <span>{filters.rewardRange[1]} Coins</span>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="filter-group">
              <label htmlFor="time-range" className="filter-label">Estimated Time (min):</label>
              <input
                type="range"
                id="time-range"
                min="0"
                max="180" // Max 3 hours for demonstration
                value={filters.timeRange[1]}
                onChange={(e) => handleFilterChange('timeRange', [0, parseInt(e.target.value)])}
                className="filter-range-input"
              />
              <div className="filter-range-display">
                <span>0 min</span>
                <span>{filters.timeRange[1]} min</span>
              </div>
            </div>

            {/* Task Type Checkboxes */}
            <div className="filter-group">
              <label className="filter-label">Task Type:</label>
              <div className="checkbox-group">
                {categories.filter(cat => cat.id !== 'all').map(cat => (
                  <label key={cat.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      value={cat.id}
                      checked={filters.taskTypes.includes(cat.id)}
                      onChange={() => handleTaskTypeChange(cat.id)}
                      className="checkbox-input"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="filter-group">
              <label htmlFor="difficulty" className="filter-label">Difficulty:</label>
              <select
                id="difficulty"
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="filter-select"
              >
                <option value="All">All</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Availability */}
            <div className="filter-group">
              <label htmlFor="availability" className="filter-label">Availability:</label>
              <select
                id="availability"
                value={filters.availability}
                onChange={(e) => handleFilterChange('availability', e.target.value)}
                className="filter-select"
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Coming Soon">Coming Soon</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="filter-group">
              <label htmlFor="sort-by" className="filter-label">Sort By:</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="Newest First">Newest First</option>
                <option value="Highest Reward">Highest Reward</option>
                <option value="Shortest Time">Shortest Time</option>
                <option value="Most Popular">Most Popular</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Task Listings */}
        <section className="task-listings-section">
          <div className="task-listings-header">
            <h2 className="task-listings-title">Available Tasks ({sortedTasks.length})</h2>
            <div className="desktop-sort-by">
              <label htmlFor="desktop-sort-by" className="desktop-sort-label">Sort By:</label>
              <select
                id="desktop-sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="desktop-sort-select"
              >
                <option value="Newest First">Newest First</option>
                <option value="Highest Reward">Highest Reward</option>
                <option value="Shortest Time">Shortest Time</option>
                <option value="Most Popular">Most Popular</option>
              </select>
            </div>
          </div>

          <div className="task-grid">
            {sortedTasks.length > 0 ? (
              sortedTasks.map(task => (
                <TaskCard key={task.id} task={task} onTaskClick={setSelectedTask} />
              ))
            ) : (
              <p className="no-tasks-message">No tasks match your current filters.</p>
            )}
          </div>
        </section>
      </main>

      {/* Mobile Filter Modal */}
      {showFilterModal && (
        <div className="mobile-filter-modal-overlay">
          <div className="mobile-filter-modal-content">
            <div className="mobile-filter-modal-header">
              <h2 className="mobile-filter-modal-title">Filter Tasks</h2>
              <button onClick={() => setShowFilterModal(false)} className="mobile-filter-modal-close-button">
                <X size={24} />
              </button>
            </div>

            <div className="mobile-filter-modal-body">
              {/* Categories */}
              <div className="filter-group">
                <label className="filter-label">Categories:</label>
                <div className="category-nav-mobile">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`category-button-mobile ${activeCategory === category.id ? 'category-button-active' : ''}`}
                    >
                      <category.icon size={20} />
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reward Range */}
              <div className="filter-group">
                <label htmlFor="mobile-reward-range" className="filter-label">Reward Range:</label>
                <input
                  type="range"
                  id="mobile-reward-range"
                  min="0"
                  max="1000"
                  value={filters.rewardRange[1]}
                  onChange={(e) => handleFilterChange('rewardRange', [0, parseInt(e.target.value)])}
                  className="filter-range-input"
                />
                <div className="filter-range-display">
                  <span>0 Coins</span>
                  <span>{filters.rewardRange[1]} Coins</span>
                </div>
              </div>

              {/* Estimated Time */}
              <div className="filter-group">
                <label htmlFor="mobile-time-range" className="filter-label">Estimated Time (min):</label>
                <input
                  type="range"
                  id="mobile-time-range"
                  min="0"
                  max="180"
                  value={filters.timeRange[1]}
                  onChange={(e) => handleFilterChange('timeRange', [0, parseInt(e.target.value)])}
                  className="filter-range-input"
                />
                <div className="filter-range-display">
                  <span>0 min</span>
                  <span>{filters.timeRange[1]} min</span>
                </div>
              </div>

              {/* Task Type Checkboxes */}
              <div className="filter-group">
                <label className="filter-label">Task Type:</label>
                <div className="checkbox-group">
                  {categories.filter(cat => cat.id !== 'all').map(cat => (
                    <label key={cat.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        value={cat.id}
                        checked={filters.taskTypes.includes(cat.id)}
                        onChange={() => handleTaskTypeChange(cat.id)}
                        className="checkbox-input"
                      />
                      {cat.name}
                    </label>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="filter-group">
                <label htmlFor="mobile-difficulty" className="filter-label">Difficulty:</label>
                <select
                  id="mobile-difficulty"
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Availability */}
              <div className="filter-group">
                <label htmlFor="mobile-availability" className="filter-label">Availability:</label>
                <select
                  id="mobile-availability"
                  value={filters.availability}
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                  className="filter-select"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Coming Soon">Coming Soon</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="filter-group">
                <label htmlFor="mobile-sort-by" className="filter-label">Sort By:</label>
                <select
                  id="mobile-sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="Newest First">Newest First</option>
                  <option value="Highest Reward">Highest Reward</option>
                  <option value="Shortest Time">Shortest Time</option>
                  <option value="Most Popular">Most Popular</option>
                </select>
              </div>
            </div>

            <div className="mobile-filter-modal-footer">
              <button
                onClick={() => setShowFilterModal(false)}
                className="button-primary-full-width"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Preview Modal */}
      <TaskPreviewModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
};

export default App;
