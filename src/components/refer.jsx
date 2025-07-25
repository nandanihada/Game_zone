import React from 'react';

// Combined CSS styles directly into a style tag for a self-contained component
const appStyles = `
/* refer.css */
.refer-container {
  background: #1a1b23;
  color: white;
  min-height: 100vh;
  padding: 40px;
  display: grid;
  grid-template-columns: 300px 1fr 350px;
  grid-template-rows: auto 1fr;
  grid-template-areas: 
    "left center right"
    "bottom-section bottom-section bottom-section";
  gap: 50px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  align-items: start;
}

/* Left Section */
.left-section {
  grid-area: left;
}

.main-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 30px 0;
  color: white;
}

.referral-code-section {
  background-color: #0b0f1a; /* dark navy instead of pure black */
  background-image: radial-gradient(circle at bottom left, #a1169a 0%, transparent 60%),
                    radial-gradient(circle at bottom right, #0f7d84 0%, transparent 60%);
  background-repeat: no-repeat;
  background-size: 80% 100%;
  background-position: bottom left, bottom right;
  
  box-shadow: 0 0 20px rgba(174, 108, 255, 0.4);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 20px 0;
  position: relative;
  z-index: 1;
  color: white;
}

.code-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
}

.refer-code-btn, .succeeded-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(0, 0, 0, 0.2);
  color: white;
}

.refer-code-btn:hover, .succeeded-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.action-buttons {
  display: flex;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.share-btn, .livestop-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.share-btn {
  background: #ec4899;
  color: white;
}

.livestop-btn {
  background: #06b6d4;
  color: white;
}

.share-btn:hover, .livestop-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Center Section */
.center-section {
  grid-area: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding-top: 80px;
}

.social-icons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.social-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.social-icon:hover {
  transform: translateY(-3px);
}

.social-icon.twitter {
  background: #ec4899;
}

.social-icon.facebook {
  background: #6366f1;
}

.social-icon.instagram {
  background: #06b6d4;
}

.social-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.notification-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ec4899;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
}

.info-text {
  text-align: center;
}

.info-text p {
  font-size: 14px;
  line-height: 1.4;
  color: #9ca3af;
  margin: 0;
  max-width: 280px;
}

/* Right Section */
.right-section {
  grid-area: right;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 60px;
}

.info-card {
  background: linear-gradient(135deg, 
    rgba(30, 41, 59, 0.8) 0%, 
    rgba(51, 65, 85, 0.9) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
  width: 100%;
  text-align: center;
}

.card-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 12px 0;
  color: white;
}

.card-description {
  font-size: 12px;
  line-height: 1.5;
  color: #9ca3af;
  margin: 0;
}

/* Bottom Section */
.bottom-section {
  grid-area: bottom-section;
  margin-top: 40px;
}

.referrals-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 20px 0;
  color: white;
  text-align: center;
}

/* Horizontal Layout for Referral Cards */
.referral-cards {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

/* Individual Referral Cards with Glassmorphism */
.referral-card {
  width: 160px;
  height: 140px;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.referral-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

/* Card Colors to Match Screenshot */
.referral-card.card-1 {
  background: linear-gradient(135deg, 
    rgba(139, 69, 19, 0.4) 0%, 
    rgba(75, 0, 130, 0.5) 50%, 
    rgba(139, 69, 19, 0.4) 100%);
  border-left: 3px solid #8b4513;
}

.referral-card.card-2 {
  background: linear-gradient(135deg, 
    rgba(0, 100, 100, 0.4) 0%, 
    rgba(0, 139, 139, 0.5) 50%, 
    rgba(0, 191, 255, 0.4) 100%);
  border-left: 3px solid #008b8b;
}

.referral-card.card-3 {
  background: linear-gradient(135deg, 
    rgba(75, 0, 130, 0.4) 0%, 
    rgba(138, 43, 226, 0.5) 50%, 
    rgba(147, 112, 219, 0.4) 100%);
  border-left: 3px solid #9370db;
}

.referral-card.card-4 {
  background: linear-gradient(135deg, 
    rgba(0, 139, 139, 0.4) 0%, 
    rgba(236, 72, 153, 0.5) 50%, 
    rgba(6, 182, 212, 0.4) 100%);
  border-right: 3px solid #ec4899;
}

.referral-card.card-5 {
  background: linear-gradient(135deg, 
    rgba(30, 41, 59, 0.5) 0%, 
    rgba(51, 65, 85, 0.6) 50%, 
    rgba(71, 85, 105, 0.5) 100%);
  border-right: 3px solid #ec4899;
}

.card-icon {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
  margin-bottom: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.card-icon svg {
  width: 16px;
  height: 16px;
  color: white;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.reward-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 4px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 400;
}

.reward-amount {
  font-size: 22px;
  font-weight: 600;
  color: white;
  margin: 0 0 auto 0;
}

.referrer-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 400;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .refer-container {
    grid-template-columns: 280px 1fr 320px;
    gap: 30px;
    padding: 30px;
  }
  
  .referral-cards {
    gap: 10px;
  }
  
  .referral-card {
    width: 150px;
    height: 130px;
  }
  
  .reward-amount {
    font-size: 20px;
  }
}

@media (max-width: 1024px) {
  .refer-container {
    grid-template-columns: 1fr;
    grid-template-areas: 
      "left"
      "center"
      "right"
      "bottom-section";
    gap: 30px;
    padding: 20px;
  }
  
  .left-section {
    max-width: 400px;
    margin: 0 auto;
  }
  
  .center-section {
    padding-top: 0;
  }
  
  .right-section {
    padding-top: 0;
    max-width: 400px;
    margin: 0 auto;
  }
  
  .main-title {
    text-align: center;
  }
  
  .referral-cards {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .main-title {
    font-size: 24px;
  }
  
  .section-title, .card-title {
    font-size: 18px;
  }
  
  .referrals-title {
    font-size: 16px;
  }
  
  .code-buttons, .action-buttons {
    flex-wrap: wrap;
  }
  
  .social-icons {
    flex-wrap: wrap;
  }
  
  .referral-cards {
    gap: 8px;
  }
  
  .referral-card {
    width: 140px;
    height: 120px;
  }
  
  .reward-amount {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .referral-cards {
    flex-direction: column;
    align-items: center;
  }
  
  .referral-card {
    width: 280px;
    height: 100px;
    flex-direction: row;
    align-items: center;
    gap: 16px;
  }
  
  .card-content {
    text-align: left;
  }
}
/* Promo Image Box */
.promo-image-box {
  margin-top: 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.promo-image-box img {
  width: 100%;
  display: block;
  border-radius: 12px;
}
`;

const App = () => {
  return (
    <div className="refer-container">
      <style>{appStyles}</style> {/* Injecting styles directly */}
      {/* Left Section */}
      <div className="left-section">
        <h1 className="main-title">Refer and Earn</h1>
        
        <div className="referral-code-section">
          <h2 className="section-title">Referal Code</h2>
          
          <div className="code-buttons">
            <button className="refer-code-btn">Refer Code</button>
            <button className="succeeded-btn">Succented</button>
          </div>
          
          <div className="action-buttons">
            <button className="share-btn">Share</button>
            <button className="livestop-btn">livestop</button>
          </div>
        </div>
      </div>

      {/* Center Section */}
      <div className="center-section">
        <div className="social-icons">
          <div className="social-icon twitter">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </div>
          <div className="social-icon facebook">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <div className="social-icon instagram">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <div className="notification-badge">✓</div>
          </div>
        </div>
        
        <div className="info-text">
          <p>How Refer and Earn Program become stoic ate planet program.</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="right-section">
        <div className="info-card">
          <h3 className="card-title">Refer and Earn</h3>
          <p className="card-description">
            The referrals find your value added value to the value 
            commissioning/maximizable of this they displayed from 
            the lintegra expensive features.
          </p>
        </div>
      </div>

      {/* Bottom Section - Successful Referrals */}
      <div className="bottom-section">
        <h3 className="referrals-title">Successful referrals</h3>
        
        <div className="referral-cards">
          <div className="referral-card card-1">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="card-content">
              <p className="reward-label">Referral Reward</p>
              <p className="reward-amount">$12000</p>
              <p className="referrer-label">Referrer</p>
            </div>
          </div>
          
          <div className="referral-card card-2">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
            </div>
            <div className="card-content">
              <p className="reward-label">Your Hour</p>
              <p className="reward-amount">$10000</p>
              <p className="referrer-label">Referrer</p>
            </div>
          </div>
          
          <div className="referral-card card-3">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="card-content">
              <p className="reward-label">Referral Reward</p>
              <p className="reward-amount">$12000</p>
              <p className="referrer-label">Referrer</p>
            </div>
          </div>
          
          <div className="referral-card card-4">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="card-content">
              <p className="reward-label">Referral Reward</p>
              <p className="reward-amount">$1000</p>
              <p className="referrer-label">Referrer</p>
            </div>
          </div>
          
          <div className="referral-card card-5">
            <div className="card-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="card-content">
              <p className="reward-label">Referral Reward</p>
              <p className="reward-amount">$330</p>
              <p className="referrer-label">Referrer</p>
            </div>
          </div>

        </div>
      </div>
      <div className="promo-image-box">
        <img src="https://i.postimg.cc/W1c1BT7v/banner.png" alt="Promo Banner" />
      </div>
    </div>
  );
};

export default App;
