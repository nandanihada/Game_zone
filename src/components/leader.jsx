import React from 'react';
import { Star, User, DollarSign } from 'lucide-react';

function App() {
  const topPlayers = [
    { id: 2, name: 'Ambreen', prize: 35, position: 2, avatar: 'female', bgColor: 'bg-amber-700' },
    { id: 1, name: 'Marco', prize: 50, position: 1, avatar: 'male', bgColor: 'bg-amber-600' },
    { id: 3, name: 'Victor', prize: 17.5, position: 3, avatar: 'casual', bgColor: 'bg-amber-800' }
  ];

 
  const leaderboardData = [
    { rank: 1, player: 'Marco', earnings: 585, prize: 50 },
    { rank: 2, player: 'Ambreen', earnings: 500, prize: 35 },
    { rank: 3, player: 'Sofia', earnings: 450, prize: 10 },
    { rank: 4, player: 'Daniel', earnings: 410, prize: 8 },
    { rank: 5, player: 'Alice', earnings: 380, prize: 5 },
    { rank: 6, player: 'Emma', earnings: 350, prize: 5 },
    { rank: 8, player: 'Noah', earnings: 320, prize: 5 }
  ];

  const getPositionBorder = (position) => {
    switch (position) {
      case 1: return 'border-yellow-400 shadow-yellow-400/30';
      case 2: return 'border-gray-300 shadow-gray-300/30';
      case 3: return 'border-orange-500 shadow-orange-500/30';
      default: return 'border-yellow-400 shadow-yellow-400/30';
    }
  };

  const getPositionBg = (position) => {
    switch (position) {
      case 1: return 'bg-yellow-600';
      case 2: return 'bg-gray-500';
      case 3: return 'bg-orange-600';
      default: return 'bg-yellow-600';
    }
  };

  const renderAvatar = (avatarType, bgColor, position = null) => {
    const baseClasses = `w-16 h-16 ${bgColor} rounded-full flex items-center justify-center border-4 border-amber-400`;
    
    switch (avatarType) {
      case 'female':
      case 'female2':
        return (
          <div className="relative">
            <div className={baseClasses}>
              <div className="relative">
                {/* Female silhouette */}
                <div className="w-10 h-10 bg-amber-900 rounded-full relative">
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-amber-800 rounded-full"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-amber-800 rounded-t-full"></div>
                </div>
              </div>
            </div>
            {/* Position Badge for top 3 only */}
            {position && (
              <div className={`absolute -top-1 -right-1 w-6 h-6 ${getPositionBg(position)} rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg`}>
                {position}
              </div>
            )}
          </div>
        );
      case 'male':
      case 'male2':
        return (
          <div className="relative">
            <div className={baseClasses}>
              <div className="relative">
                {/* Male silhouette */}
                <div className="w-10 h-10 bg-amber-900 rounded-full relative">
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-amber-800 rounded-full"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-amber-800 rounded-t-full"></div>
                  <div className="absolute top-7 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-amber-800"></div>
                </div>
              </div>
            </div>
            {/* Position Badge for top 3 only */}
            {position && (
              <div className={`absolute -top-1 -right-1 w-6 h-6 ${getPositionBg(position)} rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg`}>
                {position}
              </div>
            )}
          </div>
        );
      case 'casual':
      case 'casual2':
        return (
          <div className="relative">
            <div className={baseClasses}>
              <div className="relative">
                {/* Casual avatar with hair */}
                <div className="w-10 h-10 bg-amber-900 rounded-full relative">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-amber-800 rounded-t-full"></div>
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-amber-800 rounded-full"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-amber-800 rounded-t-full"></div>
                </div>
              </div>
            </div>
            {/* Position Badge for top 3 only */}
            {position && (
              <div className={`absolute -top-1 -right-1 w-6 h-6 ${getPositionBg(position)} rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg`}>
                {position}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="relative">
            <div className={baseClasses}>
              <User className="w-10 h-10 text-white" />
            </div>
            {position && (
              <div className={`absolute -top-1 -right-1 w-6 h-6 ${getPositionBg(position)} rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg`}>
                {position}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#1a202c] text-white relative overflow-hidden"> {/* Changed background color here */}
      {/* Cosmic background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full opacity-60"></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-white rounded-full opacity-40"></div>
        <div className="absolute top-40 left-1/4 w-1 h-1 bg-white rounded-full opacity-80"></div>
        <div className="absolute bottom-40 right-1/3 w-1 h-1 bg-white rounded-full opacity-50"></div>
        <div className="absolute bottom-60 left-1/2 w-1 h-1 bg-white rounded-full opacity-70"></div>
        <div className="absolute top-60 right-10 w-2 h-2 bg-yellow-400 rounded-full opacity-60"></div>
        <div className="absolute bottom-20 left-10 w-1 h-1 bg-cyan-400 rounded-full opacity-50"></div>
      </div>

      {/* Header */}
      {/* <div className="relative z-10 flex justify-between items-center p-6">
        <div></div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center bg-yellow-600 rounded-full px-4 py-2 space-x-2">
            <DollarSign className="w-5 h-5" />
            <span className="font-bold text-lg">25</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <span className="text-xl font-semibold">victor</span>
          </div>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="relative z-10 mx-auto px-6 py-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-bold text-yellow-400 mb-6 tracking-wider">
            LEADERBOARD
          </h1>
          <div className="flex items-center justify-center space-x-3 text-cyan-400">
            <Star className="w-6 h-6" />
            <p className="text-xl font-medium tracking-wide">
              JOIN CONTEST TO CLIMB THE LEADERBOARD
            </p>
          </div>
        </div>

        {/* Top 3 Players */}
        <div className="flex justify-center items-end space-x-6 mb-16">
          {topPlayers.map((player) => (
            <div key={player.id} className="relative flex flex-col items-center">
              {/* Profile Image with Position Badge - positioned above the box */}
              <div className="relative mb-[-30px] z-10">
                {renderAvatar(player.avatar, player.bgColor, player.position)}
              </div>
              
              {/* Card */}
              <div className={`bg-gray-800/50 backdrop-blur-sm rounded-2xl pt-10 px-6 border-2 ${getPositionBorder(player.position)} shadow-2xl transition-all duration-300 hover:scale-105 w-48 ${
                player.position === 1 ? 'pb-12 h-56' : 'pb-6 h-44'
              }`}>
                {/* Player Info */}
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">{player.name}</h3>
                  <p className="text-2xl font-bold text-green-400">${player.prize}</p>
                  <p className="text-gray-400 mt-1">Prize</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="max-w-full mx-auto">
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-lg font-semibold text-gray-300">#</th>
                    <th className="px-6 py-4 text-left text-lg font-semibold text-gray-300">Player</th>
                    <th className="px-6 py-4 text-right text-lg font-semibold text-gray-300">Earnings</th>
                    <th className="px-6 py-4 text-right text-lg font-semibold text-gray-300">Prize</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((item, index) => (
                    <tr key={item.rank} className={`border-t border-gray-700/50 ${index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/10'} hover:bg-gray-700/50 transition-all duration-200`}>
                      <td className="px-6 py-4">
                        {item.rank === 1 ? (
                          <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center font-bold text-white">
                            {item.rank}
                          </div>
                        ) : (
                          <div className="text-lg font-medium text-gray-300">
                            {item.rank}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-lg font-medium text-white">{item.player}</td>
                      <td className="px-6 py-4 text-right text-lg font-semibold text-gray-300">${item.earnings}</td>
                      <td className="px-6 py-4 text-right text-lg font-bold text-green-400">${item.prize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
