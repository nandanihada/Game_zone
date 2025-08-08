import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 px-4 mt-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left: Logo and CTA */}
        <div className="text-center md:text-left">
          <img src="/icon20.png" alt="Logo" className="w-20 mx-auto md:mx-0 mb-2" />
          <p className="mt-2 text-sm">Join and earn by playing games & surveys!</p>
          <button className="mt-3 bg-blue-600 hover:bg-blue-700 px-10 py-3 rounded-md text-base font-medium">
            Join Now
          </button>

        </div>

        {/* Middle: Links */}
        <div className="text-center md:text-left">
          <h3 className="text-lg font-semibold mb-2">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/Terms.pdf" className="hover:underline">Terms of Service</a></li>
            <li><a href="/Privacy.pdf" className="hover:underline">Privacy Policy</a></li>
            <li><a href="/Copyright.pdf" className="hover:underline">Copyright</a></li>
          </ul>
        </div>

        {/* Right: Social & Awards */}
        <div className="text-center md:text-left">
          <h3 className="text-lg font-semibold mb-2">Connect with Us</h3>
          <div className="flex flex-col items-center md:items-start space-y-2">
            <a href="#" className="flex items-center space-x-2 hover:text-blue-400">
              <img src="https://www.svgrepo.com/show/157006/linkedin.svg" alt="Twitter" className="w-5 h-5" />
              <span>LinkedIn</span>
            </a>
            <a href="#" className="flex items-center space-x-2 hover:text-pink-400">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/1200px-Instagram_icon.png?20200512141346" alt="Instagram" className="w-5 h-5" />
              <span>Instagram</span>
            </a>
          </div>

          <h4 className="text-md font-semibold mt-4 mb-1">Awards</h4>
          <p className="text-sm">🏆 Best Gaming Rewards Platform 2025</p>
        </div>
      </div>

      {/* Bottom copyright */}
      <div className="mt-8 border-t border-gray-700 pt-4 text-center text-sm">
        © {new Date().getFullYear()} GamePro. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
