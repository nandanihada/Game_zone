import React, { useState, useEffect, useRef } from 'react';
// Removed the import for './style.css' as CSS will be embedded directly.
import './SupportPage.css';
/* global __app_id, __firebase_config */

// Define global variables for Firebase configuration (not used for AI chat, but kept for other potential Firebase features if re-added)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? initialAuthToken : null;

// FAQ Item Component for reusability and managing individual state
const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [feedback, setFeedback] = useState(null); // null, 'yes', or 'no'

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        setFeedback(null); // Reset feedback when toggling
    };

    const handleFeedback = (type) => {
        setFeedback(type);
        // In a real application, you would send this feedback to your backend
        console.log(`Feedback for "${question}": ${type}`);
    };

    return (
        <div className="faq-item">
            <div className="faq-header" onClick={toggleOpen}>
                <h3 className="faq-question">
                    <span className="icon">❓</span> Q: {question}
                </h3>
                <svg
                    className={`faq-toggle-icon ${isOpen ? 'open' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </div>
            {isOpen && (
                <div className="faq-answer-container">
                    <p className="faq-answer">A: {answer}</p>
                    <div className="faq-feedback-section">
                        Was this helpful?
                        <button
                            onClick={() => handleFeedback('yes')}
                            className={`feedback-button ${feedback === 'yes' ? 'yes' : 'default yes-hover'}`}
                        >
                            Yes
                        </button>
                        <button
                            onClick={() => handleFeedback('no')}
                            className={`feedback-button ${feedback === 'no' ? 'no' : 'default no-hover'}`}
                        >
                            No
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ChatModal Component for AI Chat
const ChatModal = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false); // State to show typing indicator
    const messagesEndRef = useRef(null); // Ref for scrolling to the latest message

    // Scroll to the bottom of the chat when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Initial welcome message from AI
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Personalized welcome message (placeholder for username)
            setMessages([{ sender: 'ai', text: 'Hello there! How can I assist you with your gaming queries today?' }]);
        }
        scrollToBottom();
    }, [isOpen, messages.length]);

    // Handle sending a new message to the AI
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        const userMessage = { sender: 'user', text: newMessage };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setNewMessage('');
        setIsTyping(true); // Show typing indicator

        // Prepare chat history for the AI model
        let chatHistory = messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
        chatHistory.push({ role: 'user', parts: [{ text: newMessage }] });

        try {
            const payload = { contents: chatHistory };
            const apiKey = ""; // Leave as-is, Canvas will provide it
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const aiResponseText = result.candidates[0].content.parts[0].text;
                setMessages((prevMessages) => [...prevMessages, { sender: 'ai', text: aiResponseText }]);
            } else {
                setMessages((prevMessages) => [...prevMessages, { sender: 'ai', text: 'Sorry, I could not generate a response at this time.' }]);
                console.error("Unexpected API response structure:", result);
            }
        } catch (error) {
            console.error("Error communicating with AI:", error);
            setMessages((prevMessages) => [...prevMessages, { sender: 'ai', text: 'An error occurred while connecting to the AI. Please try again later.' }]);
        } finally {
            setIsTyping(false); // Hide typing indicator
            scrollToBottom(); // Scroll to bottom after AI response
        }
    };

    if (!isOpen) return null;

    return (
        <div className="chat-modal-overlay">
            <div className="chat-modal-content">
                {/* Chat Header */}
                <div className="chat-header">
                    <h2 className="chat-header-title">AI Chat Support</h2>
                    <button
                        onClick={onClose}
                        className="chat-close-button"
                    >
                        &times;
                    </button>
                </div>

                {/* Messages Display Area */}
                <div className="messages-display-area custom-scrollbar">
                    {messages.map((msg, index) => (
                        <div
                            key={index} // Using index as key for now, better to use unique IDs if messages were persistent
                            className={`message-row ${msg.sender === 'user' ? 'user' : 'ai'}`}
                        >
                            <div className={`message-bubble ${msg.sender === 'user' ? 'user' : 'ai'}`}>
                                <strong className="message-sender">
                                    {msg.sender === 'user' ? 'You' : 'AI Assistant'}
                                </strong>
                                <p className="message-text">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="typing-indicator">
                            <div className="message-bubble ai">
                                <strong className="message-sender">AI Assistant</strong>
                                <p className="message-text">Typing...</p>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} /> {/* Empty div for scrolling */}
                </div>

                {/* Message Input Form */}
                <form onSubmit={handleSendMessage} className="message-input-form">
                    <div className="message-input-flex">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Ask your question..."
                            className="message-input-field"
                            required
                            disabled={isTyping} // Disable input while AI is typing
                        />
                        <button
                            type="submit"
                            className="message-send-button"
                            disabled={isTyping} // Disable button while AI is typing
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// Main App component
const SupportPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('General Inquiry'); // New state for message type
    const [showChat, setShowChat] = useState(false);
    const [faqSearchTerm, setFaqSearchTerm] = useState(''); // New state for FAQ search

    // Handle form submission (for demonstration purposes)
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', { email, messageType, message }); // Log messageType as well
        // Replaced alert with a custom message box for better UX
        // In a real app, you'd send this to a backend
        const submissionMessage = `Your inquiry of type "${messageType}" has been submitted! We will get back to you soon.`;
        // You could implement a small modal or toast notification here
        alert(submissionMessage); // Using alert for simplicity as per original, but a custom modal is better.
        setEmail('');
        setMessage('');
        setMessageType('General Inquiry'); // Reset message type
    };

    const faqs = [
        {
            question: "How can I withdraw my money?",
            answer: "To withdraw your money, navigate to the 'Wallet' or 'Cashout' section in your profile. Select your preferred withdrawal method and follow the instructions to complete the transaction."
        },
        {
            question: "How much time will it take for rewards to convert into money?",
            answer: "The conversion time for rewards to money can vary depending on the reward type and processing times. Please refer to the specific reward program terms for detailed information."
        },
        {
            question: "How do I earn coins?",
            answer: "You can earn coins by participating in various in-game activities, completing challenges, winning matches, and through special events. Check the 'Earn Coins' section for more details."
        },
        {
            question: "What is the conversion rate between coins and money?",
            answer: "The conversion rate between coins and money is subject to change and can be found in the 'Wallet' or 'Exchange' section of your account. Please check there for the most current rates."
        },
        {
            question: "Is my account secure?",
            answer: "We use industry-standard encryption and security protocols to protect your account and personal information. We recommend using a strong, unique password and enabling two-factor authentication for added security."
        },
        {
            question: "How do I update my profile information?",
            answer: "You can update your profile information by visiting the 'Account Settings' section in your dashboard. From there, you can edit your personal details, payment methods, and notification preferences."
        }
    ];

    // Filtered FAQs based on search term
    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(faqSearchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(faqSearchTerm.toLowerCase())
    );

    const popularArticles = [
        { title: "Troubleshooting Game Lag", url: "#" },
        { title: "Understanding Coin Rewards", url: "#" },
        { title: "Setting Up Your Gaming Profile", url: "#" },
    ];

    return (
        <div className="support-page-container">
            {/* Embed CSS directly within the component */}
            <style>
                {`
                /* General Body and Container Styles */
                .support-page-container {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding-top: 2rem;
                    padding-bottom: 2rem;
                    padding-left: 1rem;
                    padding-right: 1rem;
                    background-color: #1a202c; /* Equivalent to bg-gray-900 */
                    color: #f7fafc; /* Equivalent to text-gray-100 */
                }

                @media (min-width: 640px) {
                    .support-page-container {
                        padding-left: 1.5rem;
                        padding-right: 1.5rem;
                    }
                }

                @media (min-width: 1024px) {
                    .support-page-container {
                        padding-left: 2rem;
                        padding-right: 2rem;
                    }
                }

                .main-content-wrapper {
                    max-width: 56rem; /* Equivalent to max-w-4xl */
                    width: 100%;
                    background-color: #2d3748; /* Equivalent to bg-gray-800 */
                    padding: 2rem;
                    border-radius: 0.75rem; /* Equivalent to rounded-xl */
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); /* Equivalent to shadow-2xl */
                    border: 1px solid #4a5568; /* Equivalent to border border-gray-700 */
                    position: relative;
                }

                /* Header Styles */
                .header-section {
                    text-align: center;
                    margin-bottom: 3rem; /* Equivalent to mb-12 */
                }

                .header-title {
                    font-size: 3rem; /* Equivalent to text-5xl */
                    font-weight: 800; /* Equivalent to font-extrabold */
                    color: #fff; /* Equivalent to text-white */
                    filter: drop-shadow(0 10px 8px rgba(0, 0, 0, 0.04)) drop-shadow(0 4px 3px rgba(0, 0, 0, 0.1)); /* Equivalent to drop-shadow-lg */
                    margin-bottom: 1rem; /* Equivalent to mb-4 */
                }

                .header-subtitle {
                    font-size: 1.25rem; /* Equivalent to text-xl */
                    color: #a0aec0; /* Equivalent to text-gray-400 */
                }

                /* Popular Articles Section */
                .popular-articles-section {
                    margin-bottom: 3rem; /* Equivalent to mb-12 */
                }

                .popular-articles-title {
                    font-size: 2.25rem; /* Equivalent to text-4xl */
                    font-weight: 700; /* Equivalent to font-bold */
                    color: #fff; /* Equivalent to text-white */
                    margin-bottom: 2rem; /* Equivalent to mb-8 */
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .popular-articles-title .icon {
                    margin-right: 0.75rem; /* Equivalent to mr-3 */
                    color: #f6e05e; /* Equivalent to text-yellow-400 */
                    font-size: 1.5rem; /* Equivalent to text-2xl */
                }

                .articles-grid {
                    display: grid;
                    grid-template-columns: repeat(1, minmax(0, 1fr));
                    gap: 1.5rem; /* Equivalent to gap-6 */
                }

                @media (min-width: 768px) {
                    .articles-grid {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                    }
                }

                .article-card {
                    background-color: #4a5568; /* Equivalent to bg-gray-700 */
                    padding: 1.25rem; /* Equivalent to p-5 */
                    border-radius: 0.5rem; /* Equivalent to rounded-lg */
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* Equivalent to shadow-md */
                    text-align: center;
                    display: block;
                    transition: all 0.3s ease-in-out; /* Equivalent to transition-all duration-300 */
                }

                .article-card:hover {
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* Equivalent to hover:shadow-xl */
                    transform: scale(1.05); /* Equivalent to hover:scale-105 */
                }

                .article-card-title {
                    font-size: 1.125rem; /* Equivalent to text-lg */
                    font-weight: 600; /* Equivalent to font-semibold */
                    color: #90cdf4; /* Equivalent to text-blue-300 */
                    margin-bottom: 0.5rem; /* Equivalent to mb-2 */
                }

                .article-card-link {
                    color: #a0aec0; /* Equivalent to text-gray-400 */
                    font-size: 0.875rem; /* Equivalent to text-sm */
                }

                /* FAQs Section */
                .faqs-section {
                    margin-bottom: 3rem; /* Equivalent to mb-12 */
                }

                .faqs-title {
                    font-size: 2.25rem; /* Equivalent to text-4xl */
                    font-weight: 700; /* Equivalent to font-bold */
                    color: #fff; /* Equivalent to text-white */
                    margin-bottom: 2rem; /* Equivalent to mb-8 */
                    text-align: center;
                }

                .faq-search-bar-container {
                    margin-bottom: 1.5rem; /* Equivalent to mb-6 */
                }

                .faq-search-input {
                    width: 100%;
                    padding: 0.875rem 1.25rem; /* Equivalent to px-5 py-3 */
                    border-radius: 0.5rem; /* Equivalent to rounded-lg */
                    background-color: #1a202c; /* Equivalent to bg-gray-900 */
                    border: 1px solid #4a5568; /* Equivalent to border border-gray-600 */
                    color: #fff; /* Equivalent to text-white */
                    /* placeholder-color: #a0aec0; Equivalent to placeholder-gray-500 */
                    outline: none;
                    transition: all 0.2s ease-in-out; /* Equivalent to transition duration-200 */
                }

                .faq-search-input:focus {
                    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5); /* Equivalent to focus:ring-2 focus:ring-blue-500 */
                    border-color: transparent; /* Equivalent to focus:border-transparent */
                }

                .faqs-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem; /* Equivalent to space-y-6 */
                }

                .no-faqs-message {
                    text-align: center;
                    color: #a0aec0; /* Equivalent to text-gray-400 */
                }

                /* FAQ Item Component Styles */
                .faq-item {
                    background-color: #4a5568; /* Equivalent to bg-gray-700 */
                    padding: 1.5rem; /* Equivalent to p-6 */
                    border-radius: 0.5rem; /* Equivalent to rounded-lg */
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* Equivalent to shadow-md */
                    transition: box-shadow 0.3s ease-in-out; /* Equivalent to transition-shadow duration-300 */
                    cursor: pointer;
                }

                .faq-item:hover {
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* Equivalent to hover:shadow-xl */
                }

                .faq-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .faq-question {
                    font-size: 1.25rem; /* Equivalent to text-xl */
                    font-weight: 600; /* Equivalent to font-semibold */
                    color: #90cdf4; /* Equivalent to text-blue-300 */
                    display: flex;
                    align-items: center;
                }

                .faq-question .icon {
                    margin-right: 0.75rem; /* Equivalent to mr-3 */
                    font-size: 1.5rem; /* Equivalent to text-2xl */
                }

                .faq-toggle-icon {
                    width: 1.5rem; /* Equivalent to w-6 */
                    height: 1.5rem; /* Equivalent to h-6 */
                    color: #a0aec0; /* Equivalent to text-gray-400 */
                    transform: rotate(0deg);
                    transition: transform 0.3s ease-in-out; /* Equivalent to transition-transform duration-300 */
                }

                .faq-toggle-icon.open {
                    transform: rotate(180deg);
                }

                .faq-answer-container {
                    margin-top: 0.5rem; /* Equivalent to mt-2 */
                    transition: all 0.3s ease-in-out; /* Equivalent to transition-all duration-300 ease-in-out */
                }

                .faq-answer {
                    color: #d1d5db; /* Equivalent to text-gray-300 */
                }

                .faq-feedback-section {
                    margin-top: 1rem; /* Equivalent to mt-4 */
                    font-size: 0.875rem; /* Equivalent to text-sm */
                    color: #a0aec0; /* Equivalent to text-gray-400 */
                    display: flex;
                    align-items: center;
                }

                .feedback-button {
                    margin-left: 0.75rem; /* Equivalent to ml-3 */
                    padding: 0.25rem 0.75rem; /* Equivalent to px-3 py-1 */
                    border-radius: 9999px; /* Equivalent to rounded-full */
                    color: #fff; /* Equivalent to text-white */
                    transition: background-color 0.2s ease-in-out; /* Equivalent to transition-colors duration-200 */
                }

                .feedback-button.yes {
                    background-color: #38a169; /* Equivalent to bg-green-600 */
                }

                .feedback-button.no {
                    background-color: #e53e3e; /* Equivalent to bg-red-600 */
                }

                .feedback-button.default {
                    background-color: #4a5568; /* Equivalent to bg-gray-600 */
                }

                .feedback-button.default:hover.yes-hover {
                    background-color: #48bb78; /* Equivalent to hover:bg-green-500 */
                }

                .feedback-button.default:hover.no-hover {
                    background-color: #f56565; /* Equivalent to hover:bg-red-500 */
                }


                /* Contact Form Section */
                .contact-form-section {
                    margin-bottom: 3rem; /* Equivalent to mb-12 */
                }

                .contact-form-title {
                    font-size: 2.25rem; /* Equivalent to text-4xl */
                    font-weight: 700; /* Equivalent to font-bold */
                    color: #fff; /* Equivalent to text-white */
                    margin-bottom: 2rem; /* Equivalent to mb-8 */
                    text-align: center;
                }

                .contact-form {
                    background-color: #4a5568; /* Equivalent to bg-gray-700 */
                    padding: 2rem;
                    border-radius: 0.5rem; /* Equivalent to rounded-lg */
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* Equivalent to shadow-md */
                    transition: box-shadow 0.3s ease-in-out; /* Equivalent to transition-shadow duration-300 */
                }

                .contact-form:hover {
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* Equivalent to hover:shadow-xl */
                }

                .form-group {
                    margin-bottom: 1.5rem; /* Equivalent to mb-6 */
                }

                .form-label {
                    display: block;
                    color: #d1d5db; /* Equivalent to text-gray-300 */
                    font-size: 1.125rem; /* Equivalent to text-lg */
                    font-weight: 500; /* Equivalent to font-medium */
                    margin-bottom: 0.5rem; /* Equivalent to mb-2 */
                }

                .form-input,
                .form-select,
                .form-textarea {
                    width: 100%;
                    padding: 0.875rem 1.25rem; /* Equivalent to px-5 py-3 */
                    border-radius: 0.5rem; /* Equivalent to rounded-lg */
                    background-color: #1a202c; /* Equivalent to bg-gray-900 */
                    border: 1px solid #4a5568; /* Equivalent to border border-gray-600 */
                    color: #fff; /* Equivalent to text-white */
                    /* placeholder-color: #a0aec0; Equivalent to placeholder-gray-500 */
                    outline: none;
                    transition: all 0.2s ease-in-out; /* Equivalent to transition duration-200 */
                }

                .form-input:focus,
                .form-select:focus,
                .form-textarea:focus {
                    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5); /* Equivalent to focus:ring-2 focus:ring-blue-500 */
                    border-color: transparent; /* Equivalent to focus:border-transparent */
                }

                .submit-button {
                    width: 100%;
                    background: linear-gradient(to right, #3182ce, #805ad5); /* Equivalent to bg-gradient-to-r from-blue-600 to-purple-600 */
                    color: #fff; /* Equivalent to text-white */
                    font-weight: 700; /* Equivalent to font-bold */
                    padding-top: 0.75rem; /* Equivalent to py-3 */
                    padding-bottom: 0.75rem;
                    padding-left: 1.5rem; /* Equivalent to px-6 */
                    padding-right: 1.5rem;
                    border-radius: 0.5rem; /* Equivalent to rounded-lg */
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* Equivalent to shadow-lg */
                    transition: all 0.3s ease-in-out; /* Equivalent to transition duration-300 */
                    transform: scale(1);
                    outline: none;
                }

                .submit-button:hover {
                    background: linear-gradient(to right, #2b6cb0, #6b46c1); /* Equivalent to hover:from-blue-700 hover:to-purple-700 */
                    transform: scale(1.05); /* Equivalent to hover:scale-105 */
                }

                .submit-button:focus {
                    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5), 0 0 0 4px rgba(66, 153, 225, 0.25); /* Equivalent to focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 */
                }

                .response-time-text {
                    text-align: center;
                    color: #a0aec0; /* Equivalent to text-gray-400 */
                    font-size: 0.875rem; /* Equivalent to text-sm */
                    margin-top: 0.75rem; /* Equivalent to mt-3 */
                }

                .still-facing-problem-link-container {
                    text-align: center;
                    margin-top: 1rem; /* Equivalent to mt-4 */
                }

                .still-facing-problem-link {
                    color: #63b3ed; /* Equivalent to text-blue-400 */
                    font-weight: 600; /* Equivalent to font-semibold */
                    font-size: 1rem; /* Equivalent to text-md */
                    transition: color 0.2s ease-in-out; /* Equivalent to transition duration-200 */
                }

                .still-facing-problem-link:hover {
                    color: #90cdf4; /* Equivalent to hover:text-blue-200 */
                }

                /* Footer Links */
                .footer-links {
                    text-align: center;
                    margin-top: 3rem; /* Equivalent to mt-12 */
                    display: flex;
                    justify-content: center;
                    gap: 1.5rem; /* Equivalent to space-x-6 */
                }

                .footer-link {
                    font-weight: 600; /* Equivalent to font-semibold */
                    font-size: 1.125rem; /* Equivalent to text-lg */
                    transition: color 0.2s ease-in-out; /* Equivalent to transition duration-200 */
                }

                .footer-link.home {
                    color: #63b3ed; /* Equivalent to text-blue-400 */
                }

                .footer-link.home:hover {
                    color: #90cdf4; /* Equivalent to hover:text-blue-200 */
                }

                .footer-link.community {
                    color: #a78bfa; /* Equivalent to text-purple-400 */
                }

                .footer-link.community:hover {
                    color: #d6bcfa; /* Equivalent to hover:text-purple-200 */
                }

                /* AI Chat Widget */
                .ai-chat-widget {
                    position: fixed;
                    bottom: 2rem; /* Equivalent to bottom-8 */
                    right: 2rem; /* Equivalent to right-8 */
                    z-index: 50;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                }

                .ai-chat-prompt {
                    color: #d1d5db; /* Equivalent to text-gray-300 */
                    font-size: 0.875rem; /* Equivalent to text-sm */
                    margin-bottom: 0.5rem; /* Equivalent to mb-2 */
                    margin-right: 0.75rem; /* Equivalent to mr-3 */
                }

                .ai-chat-button {
                    background-color: #38a169; /* Equivalent to bg-green-600 */
                    color: #fff; /* Equivalent to text-white */
                    padding: 1rem; /* Equivalent to p-4 */
                    border-radius: 9999px; /* Equivalent to rounded-full */
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* Equivalent to shadow-lg */
                    transition: all 0.3s ease-in-out; /* Equivalent to transition-colors duration-300 */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.125rem; /* Equivalent to text-lg */
                    font-weight: 700; /* Equivalent to font-bold */
                    transform: scale(1);
                }

                .ai-chat-button:hover {
                    background-color: #2f855a; /* Equivalent to hover:bg-green-700 */
                    transform: scale(1.1); /* Equivalent to hover:scale-110 */
                }

                .ai-chat-button .icon {
                    height: 1.5rem; /* Equivalent to h-6 */
                    width: 1.5rem; /* Equivalent to w-6 */
                    margin-right: 0.5rem; /* Equivalent to mr-2 */
                }

                /* Chat Modal Styles */
                .chat-modal-overlay {
                    position: fixed;
                    inset: 0; /* Equivalent to inset-0 */
                    background-color: rgba(0, 0, 0, 0.75); /* Equivalent to bg-black bg-opacity-75 */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 50;
                    padding: 1rem; /* Equivalent to p-4 */
                }

                .chat-modal-content {
                    background-color: #2d3748; /* Equivalent to bg-gray-800 */
                    border-radius: 0.5rem; /* Equivalent to rounded-lg */
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); /* Equivalent to shadow-2xl */
                    width: 100%;
                    max-width: 28rem; /* Equivalent to max-w-md */
                    height: 80vh; /* Equivalent to h-[80vh] */
                    display: flex;
                    flex-direction: column;
                    border: 1px solid #4a5568; /* Equivalent to border border-gray-700 */
                }

                .chat-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem; /* Equivalent to p-4 */
                    border-bottom: 1px solid #4a5568; /* Equivalent to border-b border-gray-700 */
                    background-color: #4a5568; /* Equivalent to bg-gray-700 */
                    border-top-left-radius: 0.5rem; /* Equivalent to rounded-t-lg */
                    border-top-right-radius: 0.5rem;
                }

                .chat-header-title {
                    font-size: 1.5rem; /* Equivalent to text-2xl */
                    font-weight: 700; /* Equivalent to font-bold */
                    color: #fff; /* Equivalent to text-white */
                }

                .chat-close-button {
                    color: #a0aec0; /* Equivalent to text-gray-400 */
                    transition: color 0.2s ease-in-out; /* Equivalent to transition-colors duration-200 */
                    font-size: 1.875rem; /* Equivalent to text-3xl */
                    font-weight: 600; /* Equivalent to font-semibold */
                }

                .chat-close-button:hover {
                    color: #fff; /* Equivalent to hover:text-white */
                }

                .messages-display-area {
                    flex: 1; /* Equivalent to flex-1 */
                    overflow-y: auto;
                    padding: 1rem; /* Equivalent to p-4 */
                    display: flex;
                    flex-direction: column;
                    gap: 1rem; /* Equivalent to space-y-4 */
                }

                /* Custom Scrollbar for Chat Messages */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #2d3748; /* Equivalent to bg-gray-800 */
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #63b3ed; /* Equivalent to text-blue-400 */
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #4299e1; /* darker blue */
                }

                .message-row {
                    display: flex;
                }

                .message-row.user {
                    justify-content: flex-end;
                }

                .message-row.ai {
                    justify-content: flex-start;
                }

                .message-bubble {
                    max-width: 80%; /* Equivalent to max-w-[80%] */
                    padding: 0.75rem; /* Equivalent to p-3 */
                    border-radius: 0.5rem; /* Equivalent to rounded-lg */
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* Equivalent to shadow-md */
                    color: #fff; /* Equivalent to text-white */
                }

                .message-bubble.user {
                    background-color: #3182ce; /* Equivalent to bg-blue-600 */
                    border-bottom-right-radius: 0; /* Equivalent to rounded-br-none */
                }

                .message-bubble.ai {
                    background-color: #4a5568; /* Equivalent to bg-gray-600 */
                    border-bottom-left-radius: 0; /* Equivalent to rounded-bl-none */
                }

                .message-sender {
                    display: block;
                    font-size: 0.875rem; /* Equivalent to text-sm */
                    margin-bottom: 0.25rem; /* Equivalent to mb-1 */
                    opacity: 0.8;
                }

                .message-text {
                    font-size: 1rem; /* Equivalent to text-base */
                    word-break: break-word; /* Equivalent to break-words */
                }

                /* Typing Indicator */
                .typing-indicator {
                    display: flex;
                    justify-content: flex-start;
                }

                .typing-indicator .message-bubble {
                    background-color: #4a5568; /* Equivalent to bg-gray-600 */
                    border-bottom-left-radius: 0; /* Equivalent to rounded-bl-none */
                }

                /* Message Input Form */
                .message-input-form {
                    padding: 1rem; /* Equivalent to p-4 */
                    border-top: 1px solid #4a5568; /* Equivalent to border-t border-gray-700 */
                    background-color: #4a5568; /* Equivalent to bg-gray-700 */
                    border-bottom-left-radius: 0.5rem; /* Equivalent to rounded-b-lg */
                    border-bottom-right-radius: 0.5rem;
                }

                .message-input-flex {
                    display: flex;
                    gap: 0.75rem; /* Equivalent to space-x-3 */
                }

                .message-input-field {
                    flex: 1; /* Equivalent to flex-1 */
                    padding: 0.5rem 1rem; /* Equivalent to px-4 py-2 */
                    border-radius: 0.5rem; /* Equivalent to rounded-lg */
                    background-color: #1a202c; /* Equivalent to bg-gray-900 */
                    border: 1px solid #4a5568; /* Equivalent to border border-gray-600 */
                    color: #fff; /* Equivalent to text-white */
                    /* placeholder-color: #a0aec0; Equivalent to placeholder-gray-400 */
                    outline: none;
                    transition: all 0.2s ease-in-out;
                }

                .message-input-field:focus {
                    box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5); /* Equivalent to focus:ring-2 focus:ring-blue-500 */
                }

                .message-send-button {
                    background-color: #3182ce; /* Equivalent to bg-blue-600 */
                    color: #fff; /* Equivalent to text-white */
                    padding: 0.75rem; /* Equivalent to p-3 */
                    border-radius: 0.5rem; /* Equivalent to rounded-lg */
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* Equivalent to shadow-md */
                    transition: background-color 0.2s ease-in-out; /* Equivalent to transition-colors duration-200 */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .message-send-button:hover {
                    background-color: #2b6cb0; /* Equivalent to hover:bg-blue-700 */
                }

                .message-send-button .icon {
                    height: 1.5rem; /* Equivalent to h-6 */
                    width: 1.5rem; /* Equivalent to w-6 */
                }
                `}
            </style>
            {/* Main Container */}
            <div className="main-content-wrapper">

                {/* Header Section */}
                <header className="header-section">
                    <h1 className="header-title">Support Center</h1>
                    <p className="header-subtitle">Your ultimate guide to smooth gaming.</p>
                </header>

                {/* Popular Articles Section */}
                <section className="popular-articles-section">
                    <h2 className="popular-articles-title">
                        <span className="icon">🔥</span> Popular Articles
                    </h2>
                    <div className="articles-grid">
                        {popularArticles.map((article, index) => (
                            <a
                                key={index}
                                href={article.url}
                                className="article-card"
                            >
                                <h3 className="article-card-title">{article.title}</h3>
                                <p className="article-card-link">Read more &rarr;</p>
                            </a>
                        ))}
                    </div>
                </section>

                {/* FAQs Section */}
                <section className="faqs-section">
                    <h2 className="faqs-title">Frequently Asked Questions</h2>
                    {/* FAQ Search Bar */}
                    <div className="faq-search-bar-container">
                        <input
                            type="text"
                            placeholder="Search FAQs..."
                            value={faqSearchTerm}
                            onChange={(e) => setFaqSearchTerm(e.target.value)}
                            className="faq-search-input"
                        />
                    </div>
                    <div className="faqs-list">
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq, index) => (
                                <FAQItem key={index} question={faq.question} answer={faq.answer} />
                            ))
                        ) : (
                            <p className="no-faqs-message">No FAQs found matching your search.</p>
                        )}
                    </div>
                </section>

                {/* Contact Form Section */}
                <section className="contact-form-section">
                    <h2 className="contact-form-title">Contact Us</h2>
                    <form onSubmit={handleSubmit} className="contact-form">
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Your Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input"
                                required
                            />
                        </div>

                        {/* New Dropdown for Message Type */}
                        <div className="form-group">
                            <label htmlFor="messageType" className="form-label">What type of message would you like to send us?</label>
                            <select
                                id="messageType"
                                name="messageType"
                                value={messageType}
                                onChange={(e) => setMessageType(e.target.value)}
                                className="form-select"
                                required
                            >
                                <option value="General Inquiry">General Inquiry</option>
                                <option value="Feedback/Suggestion">Feedback/Suggestion</option>
                                <option value="Report a Problem">Report a Problem</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="message" className="form-label">Your Message</label>
                            <textarea
                                id="message"
                                name="message"
                                rows="6"
                                placeholder="Describe your issue or inquiry here..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="form-textarea"
                                required
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="submit-button"
                        >
                            Submit Inquiry
                        </button>
                        {/* Estimated Response Time */}
                        <p className="response-time-text">Typical response time: 1-2 business days.</p>
                        {/* New link for "Still facing problem?" */}
                        <div className="still-facing-problem-link-container">
                            <a
                                href="https://forms.gle/F8U99FtBZzcTsBGt8"
                                target="_blank" // Opens in a new tab
                                rel="noopener noreferrer" // Security best practice for target="_blank"
                                className="still-facing-problem-link"
                            >
                                Still facing problem?
                            </a>
                        </div>
                    </form>
                </section>

                {/* Back to Home Link and Community Link */}
                <div className="footer-links">
                    <a href="#" className="footer-link home">
                        &larr; Back to Home
                    </a>
                    <a href="#" className="footer-link community">
                        Join Our Community Forum &rarr;
                    </a>
                </div>
            </div>

            {/* AI Chat Widget (Floating bottom-right) */}
            <div className="ai-chat-widget">
                <p className="ai-chat-prompt">Need instant help? Chat with our AI assistant!</p>
                <button
                    className="ai-chat-button"
                    onClick={() => setShowChat(true)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    AI Chat
                </button>
            </div>

            {/* Chat Modal Component */}
            {showChat && (
                <ChatModal
                    isOpen={showChat}
                    onClose={() => setShowChat(false)}
                />
            )}
        </div>
    );
};

export default SupportPage;
