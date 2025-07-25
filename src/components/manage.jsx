import React, { useState } from 'react';
import './manage.css';

const SupportPage = () => {
  const [selectedUser, setSelectedUser] = useState('Rooner');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="support-container">
      {/* Header */}
      {/* <div className="header">
        <div className="header-left">
          <div className="hamburger-menu">
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
          </div>
          <h1 className="header-title">Support</h1>
        </div>
        <div className="header-right">
          <span className="rewards-text">Rewards</span>
          <div className="profile-avatar">
            <img src="https://via.placeholder.com/40x40/4A90E2/ffffff?text=U" alt="Profile" />
          </div>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="main-content">
        {/* Main Layout - 2x2 Grid + Sidebar */}
        <div className="main-layout">
          <div className="cards-grid">
            {/* Top Row */}
            <div className="card pink-border">
              <div className="card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#E91E63" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <h3 className="card-title">FAQ</h3>
              <p className="card-subtitle">Intvws Uss</p>
              <button className="card-button pink-button">FAQ</button>
            </div>

            <div className="card green-border">
              <div className="card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="#00BCD4" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <h3 className="card-title">Contact Us</h3>
              <p className="card-subtitle">Comnend Uss</p>
              <button className="card-button green-button">Submit a Ticket</button>
            </div>

            {/* Bottom Row */}
            <div className="card white-card">
              <div className="card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#666" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <h3 className="card-title dark-text">FAQ</h3>
              <p className="card-subtitle dark-text">Coract Us</p>
              <button className="card-button gray-button">Sotdap</button>
            </div>

            <div className="card white-card">
              <div className="card-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="#666" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <h3 className="card-title dark-text">Knowledge Base</h3>
              <p className="card-subtitle dark-text">Tnsnfend Us</p>
              <p className="card-link">Subrieq a Ticket</p>
            </div>
          </div>

          <div className="card sidebar-card">
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#2196F3" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <h3 className="card-title">Sutphors</h3>
            <p className="card-subtitle">Tnivhend Uss</p>
            <button className="card-button blue-button">Sch How</button>

            <div className="dropdown-container">
              <button 
                className="dropdown-button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span>{selectedUser}</span>
                <svg 
                  className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="none"
                >
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={() => {setSelectedUser('Rooner'); setIsDropdownOpen(false);}}>Rooner</div>
                  <div className="dropdown-item" onClick={() => {setSelectedUser('User 2'); setIsDropdownOpen(false);}}>User 2</div>
                </div>
              )}
            </div>

            <div className="sidebar-items">
              <div className="sidebar-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>Lonen Debe</span>
                <svg className="chevron-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <div className="sidebar-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>Coven Mor</span>
                <svg className="chevron-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <div className="sidebar-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>Roven Bote</span>
                <svg className="dropdown-arrow-small open" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;