import React from 'react';
import './Common.css';

const GameShowcase = () => {
  const games = [
    { name: 'Ludo Royale', img: 'https://via.placeholder.com/150' },
    { name: 'Fruit Ninja', img: 'https://via.placeholder.com/150' },
    { name: 'Car Racing', img: 'https://via.placeholder.com/150' },
  ];

  return (
    <div className="grid">
      {games.map((g, i) => (
        <div className="card" key={i}>
          <img src={g.img} alt={g.name} />
          <p>{g.name}</p>
        </div>
      ))}
    </div>
  );
};

export default GameShowcase;
