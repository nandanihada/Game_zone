import React, { useState } from 'react';

export default function ReferAndEarn() {
  const [copyStatus, setCopyStatus] = useState('Copy');
  const [referStatus, setReferStatus] = useState('Refer Now');
  const [isReferring, setIsReferring] = useState(false);

  const copyToClipboard = async () => {
    const url = "https://example.com/ref";
    
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus('Copied!');
      
      setTimeout(() => {
        setCopyStatus('Copy');
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopyStatus('Copied!');
        
        setTimeout(() => {
          setCopyStatus('Copy');
        }, 2000);
      } catch (error) {
        alert('Failed to copy URL. Please copy manually: ' + url);
      }
      
      document.body.removeChild(textArea);
    }
  };

  const handleReferNow = () => {
    if (isReferring) return;
    
    setIsReferring(true);
    setReferStatus('Processing...');
    
    setTimeout(() => {
      setReferStatus('Referral Sent!');
      
      setTimeout(() => {
        setReferStatus('Refer Now');
        setIsReferring(false);
      }, 3000);
    }, 1500);
  };

  const styles = {
    body: {
      background: 'linear-gradient(135deg, #0a1428 0%, #1a2847 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      margin: 0,
    },
    
    referContainer: {
      width: '380px',
      background: 'linear-gradient(145deg, #1a2847 0%, #0f1a2e 100%)',
      borderRadius: '24px',
      padding: '40px 30px',
      position: 'relative',
      overflow: 'hidden',
    },
    
    borderBefore: {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: '24px',
      padding: '2px',
      background: `linear-gradient(
        180deg,
        rgba(138, 43, 226, 0.25) 0%,
        rgba(138, 43, 226, 0.55) 15%,
        rgba(138, 43, 226, 0.6) 25%,
        rgba(0, 191, 255, 0.6) 40%,
        rgba(0, 191, 255, 0.85) 75%,
        rgba(0, 191, 255, 0.9) 100%
      )`,
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      maskComposite: 'exclude',
      zIndex: 1,
    },
    
    borderAfter: {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: '24px',
      padding: '2px',
      background: `radial-gradient(
        ellipse at center,
        transparent 40%,
        rgba(138, 43, 226, 0.4) 70%,
        transparent 100%
      )`,
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      maskComposite: 'exclude',
      zIndex: 1,
    },
    
    content: {
      position: 'relative',
      zIndex: 3,
      textAlign: 'center',
    },
    
    icon: {
      marginBottom: '25px',
    },
    
    title: {
      fontSize: '32px',
      fontWeight: 800,
      color: '#00e5ff',
      marginBottom: '35px',
      letterSpacing: '1px',
      textShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
    },
    
    urlContainer: {
      background: 'rgba(15, 26, 46, 0.8)',
      border: '1.5px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '18px 20px',
      marginBottom: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backdropFilter: 'blur(10px)',
    },
    
    urlText: {
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: 700,
      letterSpacing: '0.3px',
    },
    
    copyBtn: {
      background: copyStatus === 'Copied!' ? 'rgba(0, 229, 255, 0.3)' : 'rgba(0, 229, 255, 0.15)',
      border: '1px solid rgba(0, 229, 255, 0.3)',
      color: '#00e5ff',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    
    description: {
      color: '#ffffff',
      fontSize: '20px',
      fontWeight: 700,
      lineHeight: 1.4,
      marginBottom: '35px',
      opacity: 1,
    },
    
    referBtn: {
      background: isReferring && referStatus === 'Processing...' 
        ? 'linear-gradient(135deg, #1a4a7a 0%, #0f2344 100%)'
        : isReferring && referStatus === 'Referral Sent!'
        ? 'linear-gradient(135deg, #1a7a4a 0%, #0f4423 100%)'
        : 'linear-gradient(135deg, #1e3a5f 0%, #0f2344 100%)',
      border: '1.5px solid rgba(0, 229, 255, 0.4)',
      color: '#ffffff',
      padding: '18px 40px',
      borderRadius: '16px',
      fontSize: '18px',
      fontWeight: 700,
      cursor: isReferring ? 'not-allowed' : 'pointer',
      width: '100%',
      marginBottom: '30px',
      transition: 'all 0.3s ease',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    },
    
    responseTime: {
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: 700,
      lineHeight: 1.3,
      opacity: 0.9,
    },
  };

  return (
    <div style={styles.body}>
      <div style={styles.referContainer}>
        {/* Border gradients */}
        <div style={styles.borderBefore}></div>
        <div style={styles.borderAfter}></div>
        
        <div style={styles.content}>
          <div style={styles.icon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
              <circle cx="9" cy="7" r="4" fill="white"/>
              <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="white" strokeWidth="2" fill="none"/>
              <path d="m16 3.13a4 4 0 0 1 0 7.75" stroke="white" strokeWidth="2" fill="none"/>
              <path d="M21 21v-2a4 4 0 0 0-3-3.85" stroke="white" strokeWidth="2" fill="none"/>
            </svg>
          </div>

          <h1 style={styles.title}>REFER & EARN</h1>

          <div style={styles.urlContainer}>
            <span style={styles.urlText}>https://example.com/ref</span>
            <button 
              style={styles.copyBtn}
              onClick={copyToClipboard}
              onMouseEnter={(e) => {
                if (copyStatus === 'Copy') {
                  e.target.style.background = 'rgba(0, 229, 255, 0.25)';
                  e.target.style.borderColor = 'rgba(0, 229, 255, 0.5)';
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (copyStatus === 'Copy') {
                  e.target.style.background = 'rgba(0, 229, 255, 0.15)';
                  e.target.style.borderColor = 'rgba(0, 229, 255, 0.3)';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {copyStatus}
            </button>
          </div>

          <div style={styles.description}>
            Earn $5 for each friend<br />
            who completes a task!
          </div>

          <button 
            style={styles.referBtn}
            onClick={handleReferNow}
            disabled={isReferring}
            onMouseEnter={(e) => {
              if (!isReferring) {
                e.target.style.background = 'linear-gradient(135deg, #2a4a7a 0%, #1a2f54 100%)';
                e.target.style.borderColor = 'rgba(0, 229, 255, 0.6)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isReferring) {
                e.target.style.background = 'linear-gradient(135deg, #1e3a5f 0%, #0f2344 100%)';
                e.target.style.borderColor = 'rgba(0, 229, 255, 0.4)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
              }
            }}
          >
            {referStatus}
          </button>

          <div style={styles.responseTime}>
            Average response time: under<br />
            1 hour
          </div>
        </div>
      </div>
    </div>
  );
}