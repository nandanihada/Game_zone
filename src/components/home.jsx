// ✅ Updated Home.jsx with all requested fixes
// - Card spacing
// - Removed animations
// - Transparent scroll buttons
// - Auto-hide scroll buttons

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';

const gameCategories = [
  {
    title: 'Featured Games',
    games: [
      { id: 1, title: 'Tower of God: New WORLD', genre: 'Role Playing', rating: '4.9', image: 'https://placehold.co/220x150/000000/FFFFFF?text=Tower+of+God' },
      { id: 2, title: 'BrownDust2 - Adventure RPG', genre: 'Role Playing', rating: '4.4', image: 'https://placehold.co/220x150/000000/FFFFFF?text=BrownDust2' },
      { id: 3, title: 'Wuthering Waves - To Septimont', genre: 'Role Playing', rating: '4.6', image: 'https://placehold.co/220x150/000000/FFFFFF?text=Wuthering+Waves' },
      { id: 4, title: 'Genshin Impact', genre: 'Action RPG', rating: '4.7', image: 'https://placehold.co/220x150/000000/FFFFFF?text=Genshin+Impact' },
      { id: 5, title: 'Honkai Star Rail', genre: 'Turn-based RPG', rating: '4.8', image: 'https://placehold.co/220x150/000000/FFFFFF?text=Honkai+Star+Rail' },
      { id: 11, title: 'PUBG Mobile', genre: 'Battle Royale', rating: '4.2', image: 'https://placehold.co/220x150/000000/FFFFFF?text=PUBG+Mobile' },
      { id: 12, title: 'Free Fire MAX', genre: 'Battle Royale', rating: '4.3', image: 'https://placehold.co/220x150/000000/FFFFFF?text=Free+Fire+MAX' },
    ]
  },
  {
    title: 'Play your favorites on the big screen',
    games: [
      { id: 6, title: 'Gems of War - Match 3 RPG', genre: 'Puzzle - Role Playing', rating: '4.0', image: 'https://placehold.co/220x150/000000/FFFFFF?text=Gems+of+War' },
      { id: 7, title: 'Airline Manager - 2025', genre: 'Simulation - Tycoon', rating: '4.1', image: 'https://placehold.co/220x150/000000/FFFFFF?text=Airline+Manager' },
      { id: 8, title: 'WGT Golf', genre: 'Sports - Golf', rating: '3.6', image: 'https://placehold.co/220x150/000000/FFFFFF?text=WGT+Golf' },
      { id: 9, title: 'Call of Duty: Mobile', genre: 'Action - Shooter', rating: '4.5', image: 'https://placehold.co/220x150/000000/FFFFFF?text=Call+of+Duty' },
      { id: 10, title: 'Asphalt 9: Legends', genre: 'Racing - Arcade', rating: '4.6', image: 'https://placehold.co/220x150/000000/FFFFFF?text=Asphalt+9' },
      { id: 13, title: 'Minecraft', genre: 'Sandbox', rating: '4.6', image: 'https://placehold.co/220x150/000000/FFFFFF?text=Minecraft' },
      { id: 14, title: 'Roblox', genre: 'Adventure', rating: '4.4', image: 'https://placehold.co/220x150/000000/FFFFFF?text=Roblox' },
    ]
  },
  {
    title: 'New Releases',
    games: [
      { id: 15, title: 'Apex Legends Mobile', genre: 'Battle Royale', rating: '4.0', image: 'https://placehold.co/220x150/000000/FFFFFF?text=Apex+Legends' },
      { id: 16, title: 'Diablo Immortal', genre: 'Action RPG', rating: '3.9', image: 'https://placehold.co/220x150/000000/FFFFFF?text=Diablo+Immortal' },
      { id: 17, title: 'Valorant Mobile', genre: 'Tactical Shooter', rating: '4.1', image: 'https://placehold.co/220x150/000000/FFFFFF?text=Valorant+Mobile' },
      { id: 18, title: 'Wild Rift', genre: 'MOBA', rating: '4.5', image: 'https://placehold.co/220x150/000000/FFFFFF?text=Wild+Rift' },
    ]
  },
  {
    title: 'Action Packed Adventures',
    games: [
      { id: 19, title: 'Grand Theft Auto: San Andreas', genre: 'Action-Adventure', rating: '4.7', image: 'https://placehold.co/220x150/000000/FFFFFF?text=GTA+San+Andreas' },
      { id: 20, title: 'Max Payne Mobile', genre: 'Action-Shooter', rating: '4.3', image: 'https://placehold.co/220x150/000000/FFFFFF?text=Max+Payne' },
      { id: 21, title: 'Dead Trigger 2', genre: 'FPS', rating: '4.2', image: 'https://placehold.co/220x150/000000/FFFFFF?text=Dead+Trigger+2' },
    ]
  }
];

export default function Home() {
  const navigate = useNavigate();

  // Persist UTM params in localStorage on first load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    utmKeys.forEach(key => {
      const value = urlParams.get(key);
      if (value) {
        localStorage.setItem(key, value);
      }
    });
  }, []);

  // Fetch games from backend
  const [games, setGames] = useState([]);
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/games');
        const data = await res.json();
        setGames(data);
      } catch (err) {}
    };
    fetchGames();
  }, []);

  const handleDeleteGame = async (id) => {
    await fetch(`http://localhost:5000/api/games/${id}`, { method: 'DELETE' });
    setGames(games => games.filter(g => g.id !== id));
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
    });
  }, []);

  const handlePlay = async (game) => {
    // Get UTM params from localStorage (fallback to URL)
    const urlParams = new URLSearchParams(window.location.search);
    const utm_source = localStorage.getItem('utm_source') || urlParams.get('utm_source');
    const utm_medium = localStorage.getItem('utm_medium') || urlParams.get('utm_medium');
    const utm_campaign = localStorage.getItem('utm_campaign') || urlParams.get('utm_campaign');
    const utm_term = localStorage.getItem('utm_term') || urlParams.get('utm_term');
    const utm_content = localStorage.getItem('utm_content') || urlParams.get('utm_content');
    // User agent and referrer
    const userAgent = navigator.userAgent;
    const referrer = document.referrer;
    // Any other details you want
    const extra = {}; // e.g., screen size, language, etc.

    // Send to backend
    await fetch('http://localhost:5000/api/play-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: game.id,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        userAgent,
        referrer,
        extra
      })
    });

    // Redirect to masked link
    window.open(`http://localhost:5000/go/${game.id}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="home-logo">GamePro</div>
        <nav className="home-nav">
          <span className="active">Home</span>
          <span onClick={() => navigate('/dashboard')}>Dashboard</span>
          <span onClick={() => navigate('/profile')}>Profile</span>
          <span onClick={() => navigate('/Supportpage')}>Support</span>
          <span onClick={() => navigate('/refer')}>refer&earn</span>
        </nav>
        <div className="home-search">
          <input type="text" placeholder="Search for games and apps" />
          <button>Search</button>
        </div>
      </header>

      <main className="home-main-content">
        {/* Custom games from backend */}
        {games.length > 0 && (
          <section className="game-section" id="custom-games">
            <h2>Submitted Games</h2>
            <div className="carousel-wrapper">
              <div className="game-carousel" id="carousel-custom-games">
                {games.map(game => (
                  <div key={game.id} className="game-card">
                    <img
                      src={game.image}
                      alt={game.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/220x150/CCCCCC/000000?text=Image+Error';
                      }}
                    />
                    <h3>{game.title}</h3>
                    <p>{game.genre}</p>
                    <p>Rating: {game.rating} ⭐</p>
                    <a href={`http://localhost:5000/go/${game.id}`} target="_blank" rel="noopener noreferrer">
                    <button className="play-button" onClick={() => handlePlay(game)}>Play</button>
                    </a>
                    <button className="delete-button" style={{ marginTop: 8, background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }} onClick={() => handleDeleteGame(game.id)}>Delete</button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        {/* Existing categories */}
        {gameCategories.map((category, index) => {
          const sectionId = `section-${index + 1}`;
          return (
            <section key={category.title} className="game-section" id={sectionId}>
              <h2>{category.title}</h2>
              <div className="carousel-wrapper">
                <button className="scroll-btn left" onClick={() => scrollLeft(category.title)}>&lt;</button>
                <div className="game-carousel" id={`carousel-${category.title}`}>
                  {category.games.map(game => (
                    <div key={game.id} className="game-card">
                      <img
                        src={game.image}
                        alt={game.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/220x150/CCCCCC/000000?text=Image+Error';
                        }}
                      />
                      <h3>{game.title}</h3>
                      <p>{game.genre}</p>
                      <p>Rating: {game.rating} ⭐</p>
                      <button className="play-button" onClick={() => handlePlay(game)}>Play</button>
                    </div>
                  ))}
                </div>
                <button className="scroll-btn right" onClick={() => scrollRight(category.title)}>&gt;</button>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}