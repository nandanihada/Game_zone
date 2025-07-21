// ✅ UPDATED Gameapp Component with Neon UI (hover-only button)
import React, { useEffect } from 'react';
import { auth } from '../firebase';

const Gameapp = ({ user, openAuthModal, setQueuedGameLink }) => {
  const rewards = [
    {
      id: 1,
      title: "PUBG MOBILE",
      amount: "$10.00",
      task: "Reach level 20",
      type: "GAME",
      imageUrl: "https://images.ctfassets.net/vfkpgemp7ek3/1104843306/ef4338ea8a96a113ff97e85f13e2e9c5/pubg-mobile-hits-3-billion-lifetime-revenue.jpg",
      gameLink: "https://store.steampowered.com/app/578080/PUBG_BATTLEGROUNDS/",
      progress: 65
    },
    {
      id: 2,
      title: "Rise of Kingdoms",
      amount: "$150.00",
      task: "Reach level 11",
      type: "GAME",
      imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQn4Q3qKx7R-KcuttnjXeRbbUMbIBCan13RSg&s",
      gameLink: "https://rok.lilith.com/",
      progress: 80
    },
    {
      id: 3,
      title: "8 Ball Pool",
      amount: "$90.00",
      task: "Complete a task",
      type: "GAME",
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/9/96/Eight_Ball_Rack_2005_SeanMcClean.jpg",
      gameLink: "https://www.miniclip.com/games/8-ball-pool/",
      progress: 50
    },
    {
      id: 4,
      title: "Subway Surfers",
      amount: "$50.00",
      task: "Reach level 35",
      type: "APP",
      imageUrl: "https://i.pinimg.com/736x/5e/06/06/5e0606fa24129d51e2fda7608e9b079a.jpg",
      gameLink: "https://poki.com/en/g/subway-surfers",
      progress: 65
    },
    {
      id: 5,
      title: "OSN",
      amount: "$10.00",
      task: "Complete a task",
      type: "APP",
      imageUrl: "https://www.marketjs.com/case-study/osn-on-the-run-html5-game-for-a-tv-network/image3.jpg",
      gameLink: "https://osn.com/",
      progress: 50
    },
    {
      id: 6,
      title: "PUBG PC",
      amount: "$100.00",
      task: "Reach level 25",
      type: "GAME",
      imageUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/578080/1ab55ce84484630645bdb49b383ebaee5412391b/ss_1ab55ce84484630645bdb49b383ebaee5412391b.1920x1080.jpg?t=1746590920",
      gameLink: "https://www.pubg.com/",
      progress: 75
    }
  ];

  useEffect(() => {
    const pending = localStorage.getItem('pendingGameLink');
    const justSignedIn = sessionStorage.getItem('justSignedIn');

    if (user && pending && justSignedIn) {
      setTimeout(() => {
        window.open(pending, '_blank', 'noopener,noreferrer');
        localStorage.removeItem('pendingGameLink');
        sessionStorage.removeItem('justSignedIn');
      }, 300);
    }
  }, [user]);

  const handleStartPlaying = (game) => {
    if (!user) {
      localStorage.setItem('pendingGameLink', game.gameLink);
      sessionStorage.setItem('justSignedIn', 'true');
      setQueuedGameLink(game.gameLink);
      openAuthModal();
      return;
    }
    window.open(game.gameLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="rewards-section">
      <h1 className="rewards-title">REWARDS</h1>
      {user && (
        <div className="welcome-message">
          Welcome, <span>{user.displayName || user.email}</span>
        </div>
      )}

      <div className="neon-rewards-grid">
        {rewards.map((reward) => (
          <div key={reward.id} className="neon-reward-card">
            <div className="neon-card-header">
              <img src={reward.imageUrl} alt={reward.title} className="neon-game-icon" />
              <span className={`neon-tag ${reward.type.toLowerCase()}`}>{reward.type}</span>
            </div>

            <div className="neon-card-body">
              <h3>{reward.title}</h3>
              <p className="neon-amount">{reward.amount}</p>
              <p className="neon-task">{reward.task}</p>
            </div>

            <div className="hover-overlay">
              <button className="neon-play-button" onClick={() => handleStartPlaying(reward)}>
                Start Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gameapp;
