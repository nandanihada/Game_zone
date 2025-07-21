// components/Sidebar.jsx
import React from 'react';
import './Sidebar.css';

function Sidebar() {
  return (
    <div className="sidebar">
      <h2>GamePro</h2>
      <ul>
        <li>🏠 Dashboard</li>
        <li>🎮 Games</li>
        <li>💼 Offers</li>
        <li>👤 Profile</li>
        <li>🚪 Logout</li>
      </ul>
    </div>
  );
}
export default Sidebar;
