import React, { useState, useEffect } from 'react';
import { MessageCircle, Mail, HelpCircle, Wrench as WrenchIcon, X, Send } from 'lucide-react';

export default function App() {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'support', message: 'Hello! How can I help you today?' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [emailForm, setEmailForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const supportOptions = [
    {
      id: 'live-chat',
      icon: MessageCircle,
      title: 'Live Chat',
      action: () => setActiveModal('chat')
    },
    {
      id: 'email-support',
      icon: Mail,
      title: 'Email Support',
      action: () => setActiveModal('email')
    },
    {
      id: 'help-center',
      icon: HelpCircle,
      title: 'Help Center',
      action: () => setActiveModal('help')
    },
    {
      id: 'troubleshooting',
      icon: WrenchIcon, // Changed to WrenchIcon
      title: 'Troubleshooting Guide',
      action: () => setActiveModal('troubleshooting')
    }
  ];

  const showMessageBox = (message) => {
    setConfirmationMessage(message);
    setShowConfirmation(true);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages([...chatMessages,
        { id: chatMessages.length + 1, sender: 'user', message: newMessage }
      ]);
      setNewMessage('');
      setTimeout(() => {
        setChatMessages(prev => [...prev,
          { id: prev.length + 1, sender: 'support', message: 'Thanks for your message! Let me help you with that.' }
        ]);
      }, 1000);
    }
  };

  const handleEmailSubmit = () => {
    if (emailForm.name && emailForm.email && emailForm.subject && emailForm.message) {
      showMessageBox('Thank you! Your message has been sent. We\'ll get back to you soon.');
      setEmailForm({ name: '', email: '', subject: '', message: '' });
      setActiveModal(null);
    } else {
      showMessageBox('Please fill in all fields.');
    }
  };

  const renderModal = () => {
    if (!activeModal) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-xl font-bold">
              {activeModal === 'chat' && 'Live Chat'}
              {activeModal === 'email' && 'Email Support'}
              {activeModal === 'help' && 'Help Center'}
              {activeModal === 'troubleshooting' && 'Troubleshooting Guide'}
            </h2>
            <button
              onClick={() => setActiveModal(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {activeModal === 'chat' && (
            <div>
              <div className="bg-slate-700 rounded-lg p-4 h-64 overflow-y-auto mb-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`mb-3 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-2 rounded-lg max-w-xs ${
                      msg.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-600 text-slate-100'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {activeModal === 'email' && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                value={emailForm.name}
                onChange={(e) => setEmailForm({...emailForm, name: e.target.value})}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Your Email"
                value={emailForm.email}
                onChange={(e) => setEmailForm({...emailForm, email: e.target.value})}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Your Message"
                value={emailForm.message}
                onChange={(e) => setEmailForm({...emailForm, message: e.target.value})}
                rows="4"
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleEmailSubmit}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium"
              >
                Send Message
              </button>
            </div>
          )}
          {activeModal === 'help' && (
            <div className="space-y-4">
              <div className="text-slate-300">
                <h3 className="text-white font-semibold mb-2">Frequently Asked Questions</h3>
                <div className="space-y-3">
                  <div className="bg-slate-700 rounded-lg p-3">
                    <h4 className="font-medium text-white">How do I reset my password?</h4>
                    <p className="text-sm text-slate-300 mt-1">Click on "Forgot Password" on the login page and follow the instructions.</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <h4 className="font-medium text-white">How do I update my profile?</h4>
                    <p className="text-sm text-slate-300 mt-1">Go to Settings &gt; Profile to update your information.</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <h4 className="font-medium text-white">How do I contact support?</h4>
                    <p className="text-sm text-slate-300 mt-1">Use any of the support options available in this interface.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeModal === 'troubleshooting' && (
            <div className="space-y-4">
              <div className="text-slate-300">
                <h3 className="text-white font-semibold mb-2">Common Issues & Solutions</h3>
                <div className="space-y-3">
                  <div className="bg-slate-700 rounded-lg p-3">
                    <h4 className="font-medium text-white">Page not loading</h4>
                    <p className="text-sm text-slate-300 mt-1">Try refreshing the page or clearing your browser cache.</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <h4 className="font-medium text-white">Login issues</h4>
                    <p className="text-sm text-slate-300 mt-1">Check your internet connection and verify your credentials.</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <h4 className="font-medium text-white">Feature not working</h4>
                    <p className="text-sm text-slate-300 mt-1">Try using a different browser or disable browser extensions.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderConfirmationModal = () => {
    if (!showConfirmation) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full text-center">
          <h3 className="text-white text-lg font-bold mb-4">Notification</h3>
          <p className="text-slate-300 mb-6">{confirmationMessage}</p>
          <button
            onClick={() => setShowConfirmation(false)}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg font-medium"
          >
            OK
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
    }}>
      <div className="relative w-full sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl"> {/* Adjusted max-width for responsiveness */}
        {/* Main Card with precise gradient border matching the image */}
        <div
          className="relative rounded-3xl p-8"
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            border: '2px solid transparent',
            backgroundImage: `
              linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%),
              linear-gradient(180deg, 
                rgba(139, 92, 246, 0.15) 0%,    /* Top - very low lighting purple */
                rgba(59, 130, 246, 0.3) 20%,    /* Upper area transition */
                rgba(139, 92, 246, 0.6) 40%,    /* Upper-middle - medium purple */
                rgba(59, 130, 246, 0.7) 60%,    /* Middle-sides - higher blue */
                rgba(139, 92, 246, 0.85) 80%,   /* Lower sides - high purple lighting */
                rgba(59, 130, 246, 1.0) 100%    /* Bottom - maximum blue lighting */
              )
            `,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box'
          }}
        >

          {/* Header with Support Icon and Title */}
          <div className="text-center mb-8 relative z-10">
            {/* Support Icon with Headset */}
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div
                className="w-full h-full rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #374151 0%, #4b5563 50%, #6b7280 100%)',
                  boxShadow: `
                    0 0 0 1px rgba(59, 130, 246, 0.2),
                    0 8px 16px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1)
                  `
                }}
              >
                {/* Headset SVG Icon */}
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 1C7.6 1 4 4.6 4 9v7c0 1.1.9 2 2 2h2v-8H6.5v-1c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5v1H16v8h2c1.1 0 2-.9 2-2V9c0-4.4-3.6-8-8-8z"/>
                  <path d="M7 12v4c0 .6-.4 1-1 1s-1-.4-1-1v-4c0-.6.4-1 1-1s1 .4 1 1zm12 0v4c0 .6-.4 1-1 1s-1-.4-1-1v-4c0-.6.4-1 1-1s1 .4 1 1z"/>
                  <circle cx="6" cy="19" r="1"/>
                  <circle cx="18" cy="19" r="1"/>
                  <path d="M12 20c0 .6-.4 1-1 1H9c-.6 0-1-.4-1-1s.4-1 1-1h2c.6 0 1 .4 1 1z"/>
                </svg>
              </div>
            </div>
            <h1 
              className="text-white font-bold tracking-[0.2em] mb-2"
              style={{ 
                fontSize: '28px',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
              }}
            >
              SUPPORT
            </h1>
          </div>

          {/* Support Options */}
          <div className="space-y-4 relative z-10">
            {supportOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <div
                  key={option.id}
                  className={`relative flex items-center p-5 rounded-2xl transition-all duration-300 cursor-pointer group ${
                    hoveredItem === option.id
                      ? 'transform scale-[1.02]'
                      : ''
                  }`}
                  onMouseEnter={() => setHoveredItem(option.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={option.action}
                  style={{
                    background: hoveredItem === option.id 
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(255, 255, 255, 0.03) 100%)',
                    border: hoveredItem === option.id 
                      ? '1px solid rgba(59, 130, 246, 0.3)' 
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: hoveredItem === option.id
                      ? '0 8px 25px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 20px rgba(59, 130, 246, 0.1)'
                      : '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {/*
                    Increase the size of the icon container here.
                    Changed from w-6 h-6 to w-8 h-8.
                  */}
                  <div className="w-8 h-8 mr-5 flex items-center justify-center">
                    {typeof IconComponent === 'string' ? (
                      <img 
                        src={IconComponent} 
                        alt={option.title} 
                        /*
                          Increase the size of the image icon here.
                          Changed from w-6 h-6 to w-8 h-8.
                        */
                        className={`w-8 h-8 transition-colors duration-200 ${
                          hoveredItem === option.id ? 'filter drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : ''
                        }`}
                      />
                    ) : (
                      <IconComponent
                        /*
                          Increase the size of the Lucide icon here.
                          Changed from w-6 h-6 to w-8 h-8.
                        */
                        className={`w-8 h-8 transition-colors duration-200 ${
                          hoveredItem === option.id ? 'text-blue-300' : 'text-slate-100'
                        }`}
                        strokeWidth={2}
                        style={{
                          filter: hoveredItem === option.id 
                            ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' 
                            : 'none'
                        }}
                      />
                    )}
                  </div>
                  <span 
                    className={`font-bold flex-1 transition-colors duration-200 ${
                      hoveredItem === option.id ? 'text-white' : 'text-white'
                    }`}
                    style={{ 
                      fontSize: '20px',
                      textShadow: hoveredItem === option.id 
                        ? '0 0 10px rgba(255, 255, 255, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)' 
                        : '0 1px 2px rgba(0, 0, 0, 0.5)'
                    }}
                  >
                    {option.title}
                  </span>
                  {/* Arrow indicator */}
                  <div className={`transition-opacity duration-200 ${
                    hoveredItem === option.id ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <svg
                      className="w-4 h-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-600/20 relative z-10">
            <div className="text-center">
              <p 
                className="text-green-400 font-bold"
                style={{ 
                  fontSize: '14px',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                }}
              >
                Average response time: under 1 hour
              </p>
            </div>
          </div>
        </div>
      </div>
      {renderModal()}
      {renderConfirmationModal()}
    </div>
  );
}
