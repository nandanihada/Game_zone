// components/Topbar.jsx
import React from 'react';
import './Topbar.css';

function Topbar() {
  return (
    <div className="topbar">
      <span>Welcome, Sunil 👋</span>
      <div className="topbar-actions">
        <span>💰 ₹1200</span>
        <span>🔔</span>
      </div>
    </div>
  );
}
export default Topbar;
