import React, { useEffect, useState, useRef, useCallback } from 'react';
import './home.css';

// Import Lucide React icons
import { Home, LayoutDashboard, User, LifeBuoy, Users } from 'lucide-react';

// Import individual page components
import DashboardPage from './Dashboard.jsx'; // Assuming Dashboard.jsx exists
import ProfilePage from './profile.jsx';     // Assuming profile.jsx exists
import SupportPage from './SupportPage.jsx'; // Assuming SupportPage.jsx exists
import ReferEarnPage from './refer.jsx';     // Assuming refer.jsx exists


// Gradient Definitions
const gradient1 = 'linear-gradient(to bottom right, #00C0FF, #8A2BE2, #4CAF50, #C71585)'; // Blue, Purple, Green, Dark Pink
const gradient2 = 'linear-gradient(to bottom right, #00BFFF, #32CD32, #FFD700)'; // Blue, Green, Yellow
const gradient3 = 'linear-gradient(to bottom right, #9932CC, #FF69B4, #1E90FF)'; // Purple, Pink, Blue
const gradient4 = 'linear-gradient(to bottom right, #00FF7F, #4682B4, #9370DB)'; // Green, Blue, Purple
const gradient5 = 'linear-gradient(to bottom right, #FF8C00, #4169E1, #20B2AA)'; // Orange, Blue, Green
const gradient6 = 'linear-gradient(to bottom right, #4B0082, #1E90FF)'; // Dark Purple, Blue

// Specific gradient for Your-Surveys card
const yourSurveysGradient = 'linear-gradient(to bottom, rgba(0, 255, 0, 0.4), rgba(0, 200, 255, 0.4))';


// Data for the game categories, now including 'url' for external navigation and 'cardSize' and 'gradient'
const gameCategories = [
  {
    title: 'Featured Games',
    isGrid: true,
    cardSize: 'large',
    gradient: gradient1,
    games: [
      { id: 1, type: 'GAME', title: 'Tower of God', genre: 'Role Playing', rating: '4.9', image: '/image/car.jpeg', value: '$20.00', condition: 'Reach level 50', url: 'https://www.towerofgod.com/', fullDescription: 'A popular mobile RPG based on the webtoon. Dive into the world of the Tower and challenge its floors. Earn rewards by reaching specific levels and completing story acts.', completionSteps: ['Download & Install', 'Complete Tutorial', 'Reach Level 50'] },
      { id: 2, type: 'GAME', title: 'BrownDust2', genre: 'Role Playing', rating: '4.4', image: '/image/bro.jpeg', value: '$15.00', condition: 'Complete Act 3', url: 'https://www.browndust2.com/', fullDescription: 'A tactical turn-based RPG with stunning anime-style graphics. Collect unique characters and build your ultimate team. This task requires completing the main story up to Act 3.', completionSteps: ['Download & Install', 'Complete Act 1', 'Complete Act 2', 'Complete Act 3'] },
      { id: 3, type: 'GAME', title: 'wuthering waaves', genre: 'Role Playing', rating: '4.6', image: '/image/wav.jpeg', value: '$25.00', condition: 'Defeat Calamity', url: 'https://wutheringwaves.kurogames.com/', fullDescription: 'An open-world action RPG with a vast world to explore and challenging bosses. Master unique combat styles and uncover the mysteries of this post-apocalyptic world. Defeat the Calamity boss to earn this reward.', completionSteps: ['Download & Install', 'Reach designated area', 'Defeat Calamity Boss'] },
      { id: 4, type: 'GAME', title: 'Genshin Impact', genre: 'Action RPG', rating: '4.7', image: '/image/li.jpeg', value: '$30.00', condition: 'Unlock Inazuma', url: 'https://genshin.hoyoverse.com/', fullDescription: 'Explore the vast open world of Teyvat, solve puzzles, and engage in elemental combat. This task requires you to progress through the main story until you unlock the Inazuma region.', completionSteps: ['Download & Install', 'Complete Archon Quests', 'Unlock Inazuma Region'] },
      { id: 5, type: 'GAME', title: 'Honkai Star Rail', genre: 'Turn-based RPG', rating: '4.8', image: '/image/tu.jpeg', value: '$22.00', condition: 'Clear Forgotten Hall', url: 'https://hsr.hoyoverse.com/', fullDescription: 'Embark on an interstellar journey aboard the Astral Express in this turn-based RPG. Strategize your team and clear the challenging Forgotten Hall content to earn your reward.', completionSteps: ['Download & Install', 'Reach Equilibrium Level 2', 'Clear Forgotten Hall Stage 1'] },
      { id: 11, type: 'GAME', title: 'PUBG Mobile', genre: 'Battle Royale', rating: '4.2', image: '/image/ba.jpeg', value: '$10.00', condition: 'Win 5 matches', url: 'https://pubgmobile.com/', fullDescription: 'Jump into intense battle royale action. Survive against 99 other players to be the last one standing. Win 5 classic matches to complete this task.', completionSteps: ['Download & Install', 'Complete 5 Classic Matches', 'Achieve 5 Wins'] },
      { id: 12, type: 'GAME', title: 'Free Fire MAX', genre: 'Battle Royale', rating: '4.3', image: '/image/fr.jpeg', value: '$8.00', condition: 'Get 10 kills', url: 'https://ff.garena.com/', fullDescription: 'A fast-paced battle royale experience optimized for mobile. Land, loot, and eliminate opponents. Get a total of 10 kills across multiple matches to earn your reward.', completionSteps: ['Download & Install', 'Play Matches', 'Achieve 10 Kills'] },
    ]
  },
  {
    title: 'Play your favorites on the big screen',
    isGrid: true,
    cardSize: 'small',
    gradient: gradient1,
    games: [
      { id: 6, type: 'GAME', title: 'Gems of War', genre: 'Puzzle - RPG', rating: '4.0', image: '/war.jpeg', value: '$12.00', condition: 'Collect 100 gems', url: 'https://www.gemsofwar.com/', fullDescription: 'A unique puzzle RPG where you match gems to cast spells and defeat enemies. Collect 100 gems in total to complete this task.', completionSteps: ['Download & Install', 'Play Game', 'Collect 100 Gems'] },
      { id: 7, type: 'APP', title: 'Airline Manager', genre: 'Simulation', rating: '4.1', image: '/air.jpeg', value: '$18.00', condition: 'Own 5 airlines', url: 'https://www.airlines-manager.com/', fullDescription: 'Build and manage your own airline empire. Purchase planes, create routes, and expand your network. Own 5 active airlines to complete this task.', completionSteps: ['Download & Install', 'Create Airline', 'Purchase 5 Airlines'] },
      { id: 8, type: 'GAME', title: 'WGT Golf', genre: 'Sports', rating: '3.6', image: '/wd.jpeg', value: '$7.00', condition: 'Score -5', url: 'https://www.wgt.com/', fullDescription: 'Experience realistic golf on famous courses. Improve your swing and sink those putts. Achieve a score of -5 or better in a single round to earn your reward.', completionSteps: ['Download & Install', 'Play a Round', 'Achieve Score of -5 or better'] },
      { id: 9, type: 'GAME', title: 'Call of Duty', genre: 'Action - Shooter', rating: '4.5', image: '/call.jpeg', value: '$20.00', condition: 'Reach Prestige 1', url: 'https://www.callofduty.com/', fullDescription: 'Engage in fast-paced multiplayer combat or thrilling campaign missions. Level up your rank and reach Prestige 1 to complete this task.', completionSteps: ['Download & Install', 'Play Multiplayer/Campaign', 'Reach Prestige 1'] },
      { id: 10, type: 'GAME', title: 'Asphalt 9', genre: 'Racing - Arcade', rating: '4.6', image: '/bes.jpeg', value: '$14.00', condition: 'Win 10 races', url: 'https://asphaltlegends.com/', fullDescription: 'Experience high-octane arcade racing with stunning graphics. Collect and upgrade dream cars. Win 10 races in any game mode to earn your reward.', completionSteps: ['Download & Install', 'Participate in Races', 'Win 10 Races'] },
      { id: 13, type: 'GAME', title: 'Minecraft', genre: 'Sandbox', rating: '4.6', image: '/mini.jpeg', value: '$28.00', condition: 'Build a castle', url: 'https://www.minecraft.net/', fullDescription: 'Unleash your creativity in a blocky, procedurally generated world. Build anything you can imagine. Construct a substantial castle to complete this task.', completionSteps: ['Download & Install', 'Gather Resources', 'Build a Castle'] },
      { id: 14, type: 'APP', title: 'Roblox', genre: 'Adventure', rating: '4.4', image: '/rob.jpeg', value: '$10.00', condition: 'Play 5 games', url: 'https://www.roblox.com/', fullDescription: 'Discover millions of immersive 3D experiences created by a global community. Play 5 different games within the Roblox platform to earn your reward.', completionSteps: ['Download & Install', 'Launch App', 'Play 5 Different Games'] },
    ]
  },
  {
    title: 'New Releases',
    isGrid: true,
    cardSize: 'large',
    gradient: gradient1,
    games: [
      { id: 15, type: 'GAME', title: 'Apex Legends', genre: 'Battle Royale', rating: '4.0', image: '/app.jpeg', value: '$16.00', condition: 'Get 3 wins', url: 'https://www.ea.com/games/apex-legends', fullDescription: 'A squad-based battle royale game with unique legends and abilities. Coordinate with your team to be the last squad standing. Secure 3 wins to complete this task.', completionSteps: ['Download & Install', 'Play Battle Royale', 'Achieve 3 Wins'] },
      { id: 16, type: 'GAME', title: 'Diablo Immortal', genre: 'Action RPG', rating: '3.9', image: '/dia.jpeg', value: '$22.00', condition: 'Clear Dungeon 5', url: 'https://diabloimmortal.blizzard.com/', fullDescription: 'An action RPG set in the Diablo universe. Explore dark dungeons, collect loot, and battle hordes of demons. Clear any Dungeon 5 times to earn your reward.', completionSteps: ['Download & Install', 'Reach Level 30', 'Clear any Dungeon 5 times'] },
      { id: 17, type: 'GAME', title: 'Valorant Mobile', genre: 'Tactical Shooter', rating: '4.1', image: '/val.jpeg', value: '$13.00', condition: 'Win 7 rounds', url: 'https://playvalorant.com/', fullDescription: 'A 5v5 character-based tactical shooter. Master unique agent abilities and precise gunplay. Win 7 rounds across multiple matches to complete this task.', completionSteps: ['Download & Install', 'Play Matches', 'Win 7 Rounds'] },
      { id: 18, type: 'GAME', title: 'Wild Rift', genre: 'MOBA', rating: '4.5', image: '/lea.jpeg', value: '$19.00', condition: 'Achieve Gold Rank', url: 'https://wildrift.leagueoflegends.com/', fullDescription: 'The mobile version of League of Legends. Team up with friends, choose your champion, and destroy the enemy Nexus. Achieve Gold Rank in ranked play to earn this reward.', completionSteps: ['Download & Install', 'Play Ranked Games', 'Achieve Gold Rank'] },
    ]
  },
  {
    title: 'Action Packed Adventures',
    isGrid: true,
    cardSize: 'medium',
    gradient: gradient1,
    games: [
      { id: 19, type: 'GAME', title: 'GTA: San Andreas', genre: 'Action-Adventure', rating: '4.7', image: '/gta.jpeg', value: '$25.00', condition: 'Complete 5 missions', url: '#', fullDescription: 'Return to Grove Street and explore the vast open world of San Andreas. Complete 5 main story missions to earn your reward.', completionSteps: ['Download & Install', 'Start New Game', 'Complete 5 Story Missions'] },
      { id: 20, type: 'GAME', title: 'Max Payne Mobile', genre: 'Action-Shooter', rating: '4.3', image: '/max.jpeg', value: '$11.00', condition: 'Clear Chapter 3', url: '#', fullDescription: 'Experience the classic neo-noir action shooter on mobile. Dive into bullet time and uncover a dark conspiracy. Clear Chapter 3 of the main story to complete this task.', completionSteps: ['Download & Install', 'Start New Game', 'Clear Chapter 3'] },
      { id: 21, type: 'GAME', title: 'Dead Trigger 2', genre: 'FPS', rating: '4.2', image: '/dead.jpeg', value: '$9.00', condition: 'Survive 10 waves', url: '#', fullDescription: 'A first-person zombie shooter with intense action. Survive waves of undead and complete objectives. Survive 10 waves in any survival mission to earn your reward.', completionSteps: ['Download & Install', 'Play Survival Mission', 'Survive 10 Waves'] },
    ]
  },
  // New sections with different gradient combinations and sizes
  {
    title: 'Strategy & Simulation',
    isGrid: true,
    cardSize: 'xl',
    gradient: gradient2, // Blue, Green, Yellow
    games: [
      { id: 22, type: 'GAME', title: 'Age of Empires', genre: 'RTS', rating: '4.0', image: '/age.jpeg', value: '$18.00', condition: 'Win 3 skirmishes', url: '#', fullDescription: 'Build your empire and conquer your enemies in this classic real-time strategy game. Win 3 skirmish matches against AI to complete this task.', completionSteps: ['Download & Install', 'Complete Tutorial', 'Win 3 Skirmish Matches'] },
      { id: 23, type: 'GAME', title: 'Civilization VI', genre: 'Strategy', rating: '4.5', image: '/civi.jpeg', value: '$35.00', condition: 'Achieve Science Victory', url: '#', fullDescription: 'Lead your civilization from the Stone Age to the Information Age. Achieve a Science Victory in a standard game to earn this reward.', completionSteps: ['Download & Install', 'Start New Game', 'Achieve Science Victory'] },
      { id: 24, type: 'GAME', title: 'Factorio', genre: 'Simulation', rating: '4.8', image: '/fact.jpeg', value: '$40.00', condition: 'Launch a rocket', url: '#', fullDescription: 'Build and maintain factories, automate production, and defend against alien creatures. Launch a rocket to complete the game and earn your reward.', completionSteps: ['Download & Install', 'Build Factory', 'Launch Rocket'] },
      { id: 25, type: 'GAME', title: 'Cities: Skylines', genre: 'Simulation', rating: '4.3', image: '/epi.jpeg', value: '$28.00', condition: 'Reach 50k population', url: '#', fullDescription: 'Design and manage your own city. Build infrastructure, manage services, and grow your population to 50,000 citizens.', completionSteps: ['Download & Install', 'Build City', 'Reach 50,000 Population'] },
    ]
  },
  {
    title: 'Casual & Puzzle Fun',
    isGrid: true,
    cardSize: 'small',
    gradient: gradient3, // Purple, Pink, Blue
    games: [
      { id: 26, type: 'GAME', title: 'Candy Crush Saga', genre: 'Puzzle', rating: '4.6', image: '/g2.jpeg', value: '$5.00', condition: 'Clear Level 50', url: '#', fullDescription: 'Match candies and solve puzzles across hundreds of levels. Clear level 50 to earn your reward.', completionSteps: ['Download & Install', 'Play Game', 'Clear Level 50'] },
      { id: 27, type: 'GAME', title: 'Tetris Blitz', genre: 'Puzzle', rating: '4.2', image: '/g3.jpeg', value: '$4.00', condition: 'Score 100k', url: '#', fullDescription: 'Experience the classic block-stacking puzzle game with a modern twist. Achieve a score of 100,000 points in one game.', completionSteps: ['Download & Install', 'Play Game', 'Score 100,000 Points'] },
      { id: 28, type: 'GAME', title: 'Among Us', genre: 'Social Deduction', rating: '4.1', image: '/g4.jpeg', value: '$7.00', condition: 'Win 5 games', url: '#', fullDescription: 'Work together to complete tasks, but beware of the Impostor among you. Win 5 games as either Crewmate or Impostor.', completionSteps: ['Download & Install', 'Play Games', 'Win 5 Games'] },
      { id: 29, type: 'GAME', title: 'Subway Surfers', genre: 'Endless Runner', rating: '4.4', image: '/g5.jpeg', value: '$6.00', condition: 'Collect 5000 coins', url: '#', fullDescription: 'Dash as fast as you can, dodge trains, and collect coins in this endless runner game. Collect 5000 coins in total.', completionSteps: ['Download & Install', 'Play Game', 'Collect 5000 Coins'] },
    ]
  },
  {
    title: 'Immersive Worlds',
    isGrid: true,
    cardSize: 'medium',
    gradient: gradient4, // Green, Blue, Purple
    games: [
      { id: 30, type: 'GAME', title: 'The Elder Scrolls: Blades', genre: 'RPG', rating: '3.8', image: '/g6.jpeg', value: '$25.00', condition: 'Clear 10 Abyss levels', url: '#', fullDescription: 'Become the ultimate warrior, explore dungeons, and rebuild your town in this Elder Scrolls adventure. Clear 10 levels in the Abyss mode.', completionSteps: ['Download & Install', 'Complete Tutorial', 'Clear 10 Abyss Levels'] },
      { id: 31, type: 'GAME', title: 'Cyberpunk 2077 Mobile', genre: 'Action RPG', rating: '4.0', image: '/g7.jpeg', value: '$30.00', condition: 'Complete Act 1', url: '#', fullDescription: 'Explore the vast, neon-drenched Night City in this open-world action RPG. Complete Act 1 of the main story.', completionSteps: ['Download & Install', 'Create Character', 'Complete Act 1'] },
      { id: 32, type: 'GAME', title: 'Red Dead Redemption Mobile', genre: 'Action-Adventure', rating: '4.5', image: '/g8.jpeg', value: '$35.00', condition: 'Complete 5 stranger missions', url: '#', fullDescription: 'Experience the epic Western adventure on your mobile device. Complete 5 stranger missions across the open world.', completionSteps: ['Download & Install', 'Start New Game', 'Complete 5 Stranger Missions'] },
      { id: 33, type: 'GAME', title: 'Genshin Impact', genre: 'Action RPG', rating: '4.7', image: '/g9.jpeg', value: '$30.00', condition: 'Unlock Inazuma', url: 'https://genshin.hoyoverse.com/', fullDescription: 'Explore the vast open world of Teyvat, solve puzzles, and engage in elemental combat. This task requires you to progress through the main story until you unlock the Inazuma region.', completionSteps: ['Download & Install', 'Complete Archon Quests', 'Unlock Inazuma Region'] },
    ]
  },
  {
    title: 'Dark & Mysterious', // New section title
    isGrid: true,
    cardSize: 'large',
    gradient: gradient6, // Dark Purple, Blue
    games: [
      { id: 34, type: 'GAME', title: 'Limbo', genre: 'Puzzle-Platformer', rating: '4.6', image: '/g11.jpeg', value: '$10.00', condition: 'Complete the game', url: '#', fullDescription: 'A dark and atmospheric puzzle-platformer. Navigate a dangerous world to find your sister. Complete the entire game to earn your reward.', completionSteps: ['Download & Install', 'Play through levels', 'Complete the game'] },
      { id: 35, type: 'GAME', title: 'Inside', genre: 'Puzzle-Platformer', rating: '4.7', image: '/g12.jpeg', value: '$12.00', condition: 'Find all secrets', url: '#', fullDescription: 'From the creators of Limbo, a haunting and visually stunning puzzle-platformer. Discover all hidden secrets to earn this reward.', completionSteps: ['Download & Install', 'Play through levels', 'Find all secrets'] },
      { id: 36, type: 'GAME', title: 'Little Nightmares', genre: 'Horror-Platformer', rating: '4.5', image: '/g13.jpeg', value: '$15.00', condition: 'Escape The Maw', url: '#', fullDescription: 'A creepy and atmospheric puzzle-platformer where you play as Six, a small girl trapped in a mysterious vessel. Escape The Maw to complete the task.', completionSteps: ['Download & Install', 'Play through chapters', 'Escape The Maw'] },
      { id: 37, type: 'GAME', title: 'Amnesia: The Dark Descent', genre: 'Horror', rating: '4.2', image: '/g14.jpeg', value: '$20.00', condition: 'Reach the Inner Sanctum', url: '#', fullDescription: 'A first-person survival horror game focused on exploration and puzzle-solving. Navigate a terrifying castle and reach the Inner Sanctum.', completionSteps: ['Download & Install', 'Explore Castle', 'Reach Inner Sanctum'] },
    ]
  }
];

// Data for Survey Partners
const surveyPartners = [
  { id: 'cpax', name: 'CPX Research', image: 'https://placehold.co/60x60/228B22/FFFFFF?text=CPX', rating: 4.5, type: 'partner' },
  { id: 'bitlabs', name: 'BitLabs', image: 'https://placehold.co/60x60/1E90FF/FFFFFF?text=Bit', rating: 4.0, type: 'partner' },
  { id: 'your-surveys', name: 'Your-Surveys', image: 'https://placehold.co/60x60/8A2BE2/FFFFFF?text=Your', rating: 4.2, type: 'survey-card', specialText: 'View surveys', gradient: yourSurveysGradient },
  { id: 'inbrain', name: 'Inbrain.AI', image: 'https://placehold.co/60x60/DC143C/FFFFFF?text=Inb', rating: 3.8, type: 'partner' },
  { id: 'tapresearch', name: 'TapResearch', image: 'https://placehold.co/60x60/FF8C00/FFFFFF?text=Tap', rating: 4.1, type: 'partner' },
  { id: 'pollfish', name: 'Pollfish', image: 'https://placehold.co/60x60/FF4500/FFFFFF?text=Pol', rating: 3.9, type: 'partner' },
  { id: 'prime-surveys', name: 'Prime Surveys', image: 'https://placehold.co/60x60/4682B4/FFFFFF?text=Pri', rating: 4.3, type: 'partner' },
];


// Task categories for the filter dropdown
const categories = [
  { id: 'all', name: 'All Tasks' },
  { id: 'surveys', name: 'Surveys' },
  { id: 'offers', name: 'Offers' },
  { id: 'games', name: 'Games' },
  { id: 'watch-videos', name: 'Watch Videos' },
  // Removed 'Refer & Earn' category
];

// Initial tasks with images and displayCondition
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
    image: 'https://placehold.co/60x60/FF5733/FFFFFF?text=S', // Updated to medium icon
    displayCondition: 'Complete the survey', // New property for compact display
    cardSize: 'medium',
    gradient: gradient1, // Default gradient for tasks
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
    image: 'https://placehold.co/70x70/33FF57/FFFFFF?text=CR', // Updated to large icon
    displayCondition: 'Reach level 5',
    cardSize: 'xl',
    gradient: gradient1, // Default gradient for tasks
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
    image: 'https://placehold.co/60x60/3357FF/FFFFFF?text=V', // Updated to medium icon
    displayCondition: 'Watch 3 videos',
    cardSize: 'medium',
    gradient: gradient1, // Default gradient for tasks
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
    isCompleted: true,
    progress: 100,
    image: 'https://placehold.co/50x50/FF33A1/FFFFFF?text=O', // Updated to small icon
    displayCondition: 'Confirm subscription',
    cardSize: 'small',
    gradient: gradient1, // Default gradient for tasks
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
    image: 'https://placehold.co/60x60/33FFF5/FFFFFF?text=MR', // Updated to medium icon
    displayCondition: 'Complete all sections',
    cardSize: 'medium',
    gradient: gradient1, // Default gradient for tasks
  },
  {
    id: 't7',
    title: 'Install & Use "Fitness Tracker" App',
    description: 'Use the app for 3 days.',
    fullDescription: 'Download the "Fitness Tracker" app and log your activities for 3 consecutive days. Ensure the app is installed via our link to track your progress. A great way to earn while staying healthy!',
    completionSteps: ['Download App', 'Install', 'Log Activity Day 1', 'Log Activity Day 2', 'Log Activity Day 3'],
    estimatedTime: 72 * 60, // 3 days
    reward: 500,
    difficulty: 'Medium',
    type: 'offers',
    tags: ['New'],
    isCompleted: false,
    progress: 0,
    image: 'https://placehold.co/50x50/FF8C33/FFFFFF?text=FA', // Updated to small icon
    displayCondition: 'Use app for 3 days',
    cardSize: 'small',
    gradient: gradient1, // Default gradient for tasks
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
    image: 'https://placehold.co/60x60/33FF8C/FFFFFF?text=GH', // Updated to medium icon
    displayCondition: 'Watch 5 videos',
    cardSize: 'medium',
    gradient: gradient1, // Default gradient for tasks
  },
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
    image: 'https://placehold.co/70x70/FF3333/FFFFFF?text=PM', // Updated to large icon
    displayCondition: 'Top 10 in 3 matches',
    cardSize: 'small',
    gradient: gradient1, // Default gradient for tasks
  },
  {
    id: 't10',
    title: 'Reach City Hall Level 8 in Rise of Kingdoms',
    description: 'Build your city and reach City Hall Level 8.',
    fullDescription: 'Download Rise of Kingdoms and strategically develop your city to reach City Hall Level 8. This task requires consistent play and resource management.',
    completionSteps: ['Download Rise of Kingdoms', 'Install & Launch', 'Link Account', 'Reach City Hall Level 8'],
    estimatedTime: 180,
    reward: 700,
    difficulty: 'Hard',
    type: 'games',
    tags: ['High Reward'],
    isCompleted: false,
    progress: 0,
    image: 'https://placehold.co/70x70/33A1FF/FFFFFF?text=RoK', // Updated to large icon
    displayCondition: 'Reach City Hall Level 8',
    cardSize: 'medium',
    gradient: gradient1, // Default gradient for tasks
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
    image: 'https://placehold.co/60x60/FFD700/000000?text=8BP', // Updated to medium icon
    displayCondition: 'Win 5 matches',
    cardSize: 'medium',
    gradient: gradient1, // Default gradient for tasks
  },
  {
    id: 't12',
    title: 'Collect 1000 Coins in Subway Surfers',
    description: 'Run, dodge, and collect coins in Subway Surfers.',
    fullDescription: 'Play Subway Surfers and collect a total of 1000 coins across multiple runs. Link your game account to ensure coin collection is tracked.',
    completionSteps: ['Download Subway Surfers', 'Install & Launch', 'Link Account', 'Collect 1000 Coins'],
    estimatedTime: 20,
    reward: 180,
    difficulty: 'Easy',
    type: 'games',
    tags: [],
    isCompleted: false,
    progress: 0,
    image: 'https://placehold.co/50x50/8A2BE2/FFFFFF?text=SS', // Updated to small icon
    displayCondition: 'Collect 1000 coins',
    cardSize: 'small',
    gradient: gradient1, // Default gradient for tasks
  },
];

// New LotteryDetailModal Component
function LotteryDetailModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('prizes');
  const [howItWorksExpanded, setHowItWorksExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  // Define the target end date for the lottery (e.g., 5 days from now)
  // For demonstration, let's set it to 5 days, 12 hours, 45 minutes, and 53 seconds from when the component loads
  const calculateEndTime = () => {
    const now = new Date();
    const endDate = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000) + (12 * 60 * 60 * 1000) + (45 * 60 * 1000) + (53 * 1000));
    return endDate;
  };

  const [lotteryEndDate] = useState(calculateEndTime()); // Store the calculated end date

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
      const minutes = Math.floor((distance % (1000 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timerInterval);
  }, [lotteryEndDate]); // Re-run effect if lotteryEndDate changes (though it's stable here)

  // Static/Mock data for the weekly lottery details
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
          <h2>Lottery #{lotteryDetails.lotteryNumber} - {timeLeft}</h2> {/* Use timeLeft here */}
        </div>

        <div className="lottery-main-display">
          <div className="lottery-prize-circle">
            <span className="lottery-total-prize">{lotteryDetails.totalPrize}</span>
            <span className="lottery-winners-count">{lotteryDetails.numWinners} WINNERS</span>
          </div>
          {/* Ticket icons - using inline SVG for simplicity */}
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

        {/* How It Works Section */}


        {/* Tabs for Prizes and Previous Winners */}
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
function ItemDetailModal({ item, onClose, onViewLottery }) { // Added onViewLottery prop
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
    if (item.url) {
      window.open(item.url, '_blank');
    } else {
      // For tasks without a direct URL, simulate completion or show a message
      console.log(`Starting task: ${item.title}`);
    }
    onClose(); // Close modal after action
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
                    <button className="reward-view-button" onClick={onViewLottery}>View</button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Keeping description and steps sections, but they will be below rewards and scrollable */}
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
      return (
        <svg xmlns="http://www.w3.org/24/24" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-list">
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M12 11h4" />
          <path d="M12 16h4" />
          <path d="M8 11h.01" />
          <path d="M8 16h.01" />
        </svg>
      );
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
      return (
        <svg xmlns="http://www.w3.org/24/24" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gamepad-2">
          <path d="M6 12H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M18 12h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
          <path d="M12 18V6" />
          <path d="M12 18h6a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H12" />
          <path d="M12 18H6a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h6" />
          <path d="M12 6h.01" />
          <path d="M12 12h.01" />
        </svg>
      );
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
function TaskCard({ task, onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  const getIconSrc = (type) => {
    switch (type) {
      case 'games':
      case 'game':
        return '/icon17.png'; // Game icon
      case 'app':
      case 'offers': // Assuming offers and surveys might also use app icon if they are app-based
      case 'surveys':
        return '/icon18.png'; // App icon
      case 'watch-videos':
        return '/icon18.png'; // Assuming videos are part of an app experience
      default:
        return 'https://placehold.co/24x24/808080/FFFFFF?text=I'; // Default placeholder
    }
  };

  const handleShowClick = (e) => {
    e.stopPropagation(); // Prevent the card's hover/leave from being immediately re-triggered
    onClick(task);
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
      className={`task-card task-card-${task.cardSize || 'medium'} ${isHovered ? 'hovered-blur' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ '--card-border-gradient': task.gradient }} // Apply gradient via CSS variable
    >
      <div className="card-top-section">
        <img src={task.image} alt={task.title} className="task-icon" onError={(e) => e.target.src = 'https://placehold.co/40x40/808080/FFFFFF?text=I'} />
      </div>
      {/* Replaced text tag with image icon */}
      <div className="task-tag">
        <img src={getIconSrc(task.type)} alt={task.type} className="task-type-icon" onError={(e) => e.target.src = 'https://placehold.co/16x16/808080/FFFFFF?text=X'} />
      </div>
      <div className="task-card-details-main">
        <h3 className="task-card-title">{task.title}</h3>
        {/* Convert reward coins to a dollar value for display, e.g., 100 coins = $1.00 */}
        <p className="task-card-value">${(task.reward / 10).toFixed(2)}</p>
        <p className="task-card-condition">{task.displayCondition}</p>
      </div>

      {isHovered && (
        <button className="show-button" onClick={handleShowClick}>
          <svg className="play-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="#00ff00ff"/> {/* Green circle background */}
            <polygon points="10 8 16 12 10 16 10 8" fill="#FFFFFF"/> {/* White play triangle */}
          </svg>
          <span>{getButtonText(task.type)}</span>
        </button>
      )}
    </div>
  );
}

// New Reusable Game Card Component
function GameCardComponent({ game, cardSize, gradient, handleShowButtonClick }) {
  const [isHovered, setIsHovered] = useState(false);

  const getIconSrc = (type) => {
    switch (type) {
      case 'GAME':
        return '/icon17.png'; // Game icon
      case 'APP':
        return '/icon18.png'; // App icon
      default:
        return 'https://placehold.co/24x24/808080/FFFFFF?text=I'; // Default placeholder
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

  return (
    <div
      key={game.id}
      className={`game-card game-card-${cardSize || 'medium'} ${isHovered ? 'hovered-blur' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ '--card-border-gradient': gradient }} // Apply gradient via CSS variable
    >
      <div className="card-top-section">
        <img src={game.image} alt={game.title} className="game-icon" onError={(e) => e.target.src = 'https://placehold.co/40x40/808080/FFFFFF?text=G'} />
      </div>
      {/* Replaced text tag with image icon */}
      <div className="game-tag">
        <img src={getIconSrc(game.type)} alt={game.type} className="game-type-icon" onError={(e) => e.target.src = 'https://placehold.co/16x16/808080/FFFFFF?text=X'} />
      </div>
      <div className="game-details-main">
        <h3 className="game-title-overlay">{game.title}</h3>
        <p className="game-value-overlay">{game.value}</p>
        <p className="game-condition-overlay">{game.condition}</p>
      </div>
      {isHovered && (
        <button className="show-button" onClick={(e) => handleShowButtonClick(game, e)}>
          <svg className="play-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="transparent" /> {/* Green circle background */}
            <polygon points="10 8 16 12 10 16 10 8" fill="#FFFFFF"/> {/* White play triangle */}
          </svg>
          <span>{getButtonText(game.type)}</span>
        </button>
      )}
    </div>
  );
}


// New Reusable Sidebar Category Card Component
function SidebarCategoryCard({ category, isActive, onClick }) {
  return (
    <div
      className={`sidebar-category-card ${isActive ? 'active' : ''}`}
      onClick={() => onClick(category.id)}
    >
      <div className="card-top-section">
        {getCategoryIcon(category.id)} {/* Render SVG icon */}
      </div>
      <div className="category-details-main">
        <h3 className="category-title">{category.name}</h3>
      </div>
    </div>
  );
}

// New Survey Partner Card Component
function SurveyPartnerCard({ partner }) {
  // Function to render star ratings
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars; // Assuming a max of 5 stars
    const stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="star-icon full-star">★</span>);
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star-icon empty-star">★</span>);
    }
    return <div className="partner-stars">{stars}</div>;
  };

  return (
    <div className={`survey-partner-card ${partner.type === 'survey-card' ? 'survey-card-special' : ''}`}
         style={partner.gradient ? { background: partner.gradient } : {}}>
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
function TasksListingPage({ onBack, initialCategory = 'all' }) {
  const [rewardRange, setRewardRange] = useState([0, 1000]); // Max reward in initialTasks is 1000
  const [estimatedTime, setEstimatedTime] = useState([0, 180]); // Max time is 180 mins (3 hours)
  const [selectedTaskType, setSelectedTaskType] = useState(initialCategory); // Changed to single selection
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [sortBy, setSortBy] = useState('Newest First');
  const [selectedItem, setSelectedItem] = useState(null); // State for modal item
  const [showLotteryModal, setShowLotteryModal] = useState(false); // State for lottery modal

  // Filtered and sorted tasks
  const filteredAndSortedTasks = useCallback(() => {
    let filtered = [];

    // Combine initialTasks and gameCategories for filtering
    const allAvailableItems = [
      ...initialTasks,
      ...gameCategories.flatMap(cat => cat.games.map(game => ({
        id: `game-${game.id}`,
        title: game.title,
        description: game.genre,
        fullDescription: game.fullDescription,
        completionSteps: game.completionSteps,
        estimatedTime: 0, // Placeholder
        reward: parseFloat(game.value.replace('$', '')) * 10,
        difficulty: 'Medium', // Placeholder
        type: game.type.toLowerCase(),
        tags: [],
        isCompleted: false,
        progress: 0,
        image: game.image,
        displayCondition: game.condition,
        url: game.url,
        genre: game.genre,
        rating: game.rating,
        cardSize: game.cardSize, // Inherit cardSize from gameCategories
        gradient: game.gradient, // Inherit gradient from gameCategories
      })))
    ];

    // Filter by Task Type (single selection)
    if (selectedTaskType === 'all') {
      filtered = allAvailableItems;
    } else if (selectedTaskType === 'surveys') {
      // "Surveys" category shows actual survey tasks
      filtered = allAvailableItems.filter(item => item.type === 'surveys');
    } else if (selectedTaskType === 'offers') {
      // "Offers" category shows actual offer tasks
      filtered = allAvailableItems.filter(item => item.type === 'offers');
    } else if (selectedTaskType === 'games') {
      // "Games" category shows actual game tasks AND games from gameCategories
      filtered = allAvailableItems.filter(item => item.type === 'games' || item.type === 'game' || item.type === 'app');
    } else if (selectedTaskType === 'watch-videos') {
      // "Watch Videos" category shows actual video tasks
      filtered = allAvailableItems.filter(item => item.type === 'watch-videos');
    }


    // Filter by Reward Range
    filtered = filtered.filter(task => task.reward >= rewardRange[0] && task.reward <= rewardRange[1]);

    // Filter by Estimated Time
    filtered = filtered.filter(task => task.estimatedTime >= estimatedTime[0] && task.estimatedTime <= estimatedTime[1]);

    // Filter by Difficulty
    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(task => task.difficulty === selectedDifficulty);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'Newest First':
          return b.id.localeCompare(a.id); // Assuming higher ID means newer for mock data
        case 'Highest Reward':
          return b.reward - a.reward;
        case 'Shortest Time':
          return a.estimatedTime - b.estimatedTime;
        case 'Most Popular':
          return b.reward - a.reward; // Using reward as proxy for popularity
        default:
          return 0;
      }
    });

    return filtered;
  }, [rewardRange, estimatedTime, selectedTaskType, selectedDifficulty, sortBy]);

  useEffect(() => {
    // When initialCategory changes, update selectedTaskType
    setSelectedTaskType(initialCategory);
  }, [initialCategory]);

  const handleCategoryButtonClick = (typeId) => {
    setSelectedTaskType(typeId);
  };

  const handleRewardRangeChange = (e) => {
    setRewardRange([parseInt(e.target.value), rewardRange[1]]);
  };

  const handleEstimatedTimeChange = (e) => {
    setEstimatedTime([parseInt(e.target.value), estimatedTime[1]]);
  };

  const maxReward = Math.max(...initialTasks.map(task => task.reward));
  const maxTime = Math.max(...initialTasks.map(task => task.estimatedTime));

  // Determine the title for the header based on selected filters
  const getHeaderTitle = () => {
    const selectedCategory = categories.find(cat => cat.id === selectedTaskType);
    return selectedCategory ? selectedCategory.name : 'All Available Tasks';
  };

  // Group tasks by type for display when 'All Tasks' is selected
  const groupedTasks = useCallback(() => {
    const tasksToDisplay = filteredAndSortedTasks(); // Use the already filtered and sorted list

    if (selectedTaskType !== 'all') {
      // If a specific category is selected, just return the filtered tasks directly
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

        {/* Categories (single selection buttons) */}
        <div className="filter-group">
          <h4 className="filter-group-title">Categories</h4>
          <div className="category-buttons">
            {categories.map(category => (
              <SidebarCategoryCard
                key={category.id}
                category={category}
                isActive={selectedTaskType === category.id}
                onClick={handleCategoryButtonClick}
              />
            ))}
          </div>
        </div>

        {/* Filters Section */}
        <div className="filter-group">
          <h4 className="filter-group-title">Filters</h4>

          {/* Reward Range Filter */}
          <div className="filter-group">
            <h5 className="filter-group-title">Reward Range (Coins)</h5>
            <div className="range-slider-container">
              <input
                type="range"
                min="0"
                max={maxReward}
                value={rewardRange[0]}
                onChange={handleRewardRangeChange}
                className="range-slider"
              />
              <div className="range-values">
                <span>{rewardRange[0]}</span>
                <span>{maxReward}</span>
              </div>
            </div>
          </div>

          {/* Estimated Time Filter */}
          <div className="filter-group">
            <h5 className="filter-group-title">Estimated Time (min)</h5>
            <div className="range-slider-container">
              <input
                type="range"
                min="0"
                max={maxTime}
                value={estimatedTime[0]}
                onChange={handleEstimatedTimeChange}
                className="range-slider"
              />
              <div className="range-values">
                <span>{estimatedTime[0]}</span>
                <span>{maxTime}</span>
              </div>
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="filter-group">
            <h5 className="filter-group-title">Difficulty</h5>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="filter-select"
            >
              <option value="All">All</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
        <button className="back-button" onClick={onBack}>Back to Home</button>
      </aside>

      <main className="tasks-main-content">
        <div className="sort-by-container">
          <label htmlFor="sort-by">Sort By:</label>
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

        <h2 className="page-header">{getHeaderTitle()} ({filteredAndSortedTasks().length})</h2>
        {selectedTaskType === 'all' && (
          <p style={{ textAlign: 'center', fontSize: '1rem', color: '#bbb', marginBottom: '20px' }}>
            This section includes all types of tasks: surveys, offers, games, watch videos, and refer & earn tasks.
          </p>
        )}
        {selectedTaskType === 'surveys' && (
          <p style={{ textAlign: 'center', fontSize: '1rem', color: '#bbb', marginBottom: '20px' }}>
            Displaying tasks for the "Surveys" category.
          </p>
        )}
        {selectedTaskType === 'offers' && (
          <p style={{ textAlign: 'center', fontSize: '1rem', color: '#bbb', marginBottom: '20px' }}>
            Displaying tasks for the "Offers" category.
          </p>
        )}
        {selectedTaskType === 'games' && (
          <p style={{ textAlign: 'center', fontSize: '1rem', color: '#bbb', marginBottom: '20px' }}>
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
                <TaskCard key={task.id} task={task} onClick={setSelectedItem} />
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

      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onViewLottery={() => setShowLotteryModal(true)} />}
      {showLotteryModal && <LotteryDetailModal onClose={() => setShowLotteryModal(false)} />}
    </div>
  );
}

// Common Header Component
const CommonHeader = ({ currentPage, setCurrentPage }) => {
  return (
    <header className="home-header">
      <div className="home-logo">GamePro</div>
      <nav className="home-nav">
        <span className={currentPage === 'home' ? 'active' : ''} onClick={() => setCurrentPage('home')}>
          <Home size={20} /> Home
        </span>
        <span className={currentPage === 'dashboard' ? 'active' : ''} onClick={() => setCurrentPage('dashboard')}>
          <LayoutDashboard size={20} /> Dashboard
        </span>
        <span className={currentPage === 'profile' ? 'active' : ''} onClick={() => setCurrentPage('profile')}>
          <User size={20} /> Profile
        </span>
        <span className={currentPage === 'support' ? 'active' : ''} onClick={() => setCurrentPage('support')}>
          <LifeBuoy size={20} /> Support
        </span>
        <span className={currentPage === 'refer' ? 'active' : ''} onClick={() => setCurrentPage('refer')}>
          <Users size={20} /> Refer & Earn
        </span>
      </nav>
      {/* Search bar and dropdown are specific to HomePageContent, so they are NOT in CommonHeader */}
    </header>
  );
};

function HomePageContent({ setCurrentPage, currentPage }) { // Added currentPage prop
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [selectedItem, setSelectedItem] = useState(null); // State for modal item
  const [showLotteryModal, setShowLotteryModal] = useState(false); // State for lottery modal

  // Modified handleCardClick to be triggered by the "Show" button
  const handleShowButtonClick = (game, e) => {
    e.stopPropagation(); // Prevent the card's hover/leave from being immediately re-triggered
    setSelectedItem(game);
  };

  const scrollLeft = (title) => {
    const el = document.getElementById(`carousel-${title}`);
    if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = (title) => {
    const el = document.getElementById(`carousel-${title}`);
    if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
  };

  useEffect(() => {
    const wrappers = document.querySelectorAll('.carousel-wrapper');
    wrappers.forEach(wrapper => {
      const carousel = wrapper.querySelector('.game-carousel');
      let timeout;

      const show = () => {
        wrapper.classList.add('show-scroll');
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          wrapper.classList.remove('show-scroll');
        }, 5000);
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
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleFilterCategoryClick = (categoryId) => {
    setCurrentPage({ name: 'tasks', category: categoryId }); // Pass category as part of state
    setShowFilterDropdown(false);
  };


  return (
    <div className="home-container">
      {/* Removed the header from here, it's now in CommonHeader */}
      <div className="home-search-and-filter-area"> {/* New wrapper for search/filter */}
        <div className="home-search">
          <input type="text" placeholder="Search for games and apps" />
          <button>Search</button>
        </div>
        <div className={`dropdown-container ${showFilterDropdown ? 'open' : ''}`} ref={dropdownRef}>
          <button onClick={() => setShowFilterDropdown(!showFilterDropdown)}>Filter by Category</button>
          {showFilterDropdown && (
            <div className="dropdown-menu">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleFilterCategoryClick(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="home-main-content">
        {gameCategories.map((category, index) => {
          const sectionId = `section-${index + 1}`;

          return (
            <section key={category.title} className="game-section" id={sectionId}>
              <h2>{category.title}</h2>
              {category.isGrid ? (
                // Render as a grid if isGrid is true
                <div className="game-grid-layout">
                  {category.games.map(game => (
                    <GameCardComponent
                      key={game.id}
                      game={game}
                      cardSize={category.cardSize}
                      gradient={category.gradient}
                      handleShowButtonClick={handleShowButtonClick}
                    />
                  ))}
                </div>
              ) : (
                // Render as a carousel if isGrid is false
                <div className="carousel-wrapper">
                  <button className="scroll-btn left" onClick={() => scrollLeft(category.title)}>&lt;</button>
                  <div className="game-carousel" id={`carousel-${category.title}`}>
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
    gradient={category.gradient}
    handleShowButtonClick={handleShowButtonClick}
  />
</div>

                    ))}
                  </div>
                  <button className="scroll-btn right" onClick={() => scrollRight(category.title)}>&gt;</button>
                </div>
              )}
            </section>
          );
        })}

        {/* New Survey Partners Section */}
        <section className="survey-partners-section">
          <h2 className="survey-partners-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-list">
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="M12 11h4" />
              <path d="M12 16h4" />
              <path d="M8 11h.01" />
              <path d="M8 16h.01" />
            </svg>
            Survey Partners
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </h2>
          <div className="survey-partners-grid">
            {surveyPartners.map(partner => (
              <SurveyPartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </section>

      </main>

      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onViewLottery={() => setShowLotteryModal(true)} />}
      {showLotteryModal && <LotteryDetailModal onClose={() => setShowLotteryModal(false)} />}
    </div>
  );
}

// This is the main App component that will be rendered.
export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  // No longer need taskFilterCategory state here as it's passed directly to TasksListingPage

  const handleBackToHome = () => {
    setCurrentPage('home');
  };

  // Render different components based on currentPage state
  let content;
  if (typeof currentPage === 'object' && currentPage.name === 'tasks') {
    content = <TasksListingPage onBack={handleBackToHome} initialCategory={currentPage.category} />;
  } else {
    switch (currentPage) {
      case 'home':
        content = <HomePageContent setCurrentPage={setCurrentPage} currentPage={currentPage} />; // Pass currentPage
        break;
      case 'dashboard':
        content = <DashboardPage onBack={handleBackToHome} />;
        break;
      case 'profile':
        content = <ProfilePage onBack={handleBackToHome} />;
        break;
      case 'support':
        content = <SupportPage onBack={handleBackToHome} />;
        break;
      case 'refer': // Added case for Refer & Earn page
        content = <ReferEarnPage onBack={handleBackToHome} />;
        break;
      default:
        content = <HomePageContent setCurrentPage={setCurrentPage} currentPage={currentPage} />; // Pass currentPage
    }
  }

  return (
    <>
      {/* Common Header is now here, outside the conditional content rendering */}
      <CommonHeader currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="main-content-area"> {/* Optional: Add a wrapper for main content below header */}
        {content}
      </div>
    </>
  );
}
