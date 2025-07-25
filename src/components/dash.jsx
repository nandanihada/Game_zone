import React from 'react';

const App = () => {
  // Dummy data for the cards, mimicking the structure seen in the image
  const cardsData = [
    // Row 1
    {
      layoutType: 'small-image',
      image: 'https://images.sftcdn.net/images/t_app-icon-m/p/726ff3e6-55b7-4b6b-9183-05becc60bc05/189327238/pubg-mobile-logo', // PUBG Mobile image
      imageTitle: 'PUBG Mobile',
      imagePrice: '$79,000',
      title: 'PUBG Mobile',
      price: '$79,000',
      description: 'Reach level 20',
      task: 'Complete a task',
      company: 'Vashvoom', // Varied company name
      progress: '75%',
    },
    {
      layoutType: 'large-image',
      image: 'https://images.sftcdn.net/images/t_app-icon-m/p/726ff3e6-55b7-4b6b-9183-05becc60bc05/189327238/pubg-mobile-logo', // PUBG Mobile image
      title: 'PUBG Mobile',
      price: '$75,000',
      description: 'Reach level 20',
      task: 'Complete a task',
      company: 'GameCorp', // Varied company name
      progress: '50%',
    },
    {
      layoutType: 'small-image',
      image: 'https://images.sftcdn.net/images/t_app-icon-m/p/726ff3e6-55b7-4b6b-9183-05becc60bc05/189327238/pubg-mobile-logo', // PUBG Mobile image
      imageTitle: 'PUBG Mobile',
      imagePrice: '$75,000',
      title: 'PUBG Mobile',
      price: '$75,000',
      description: 'Reach level 20',
      task: 'Complete a task',
      company: 'Nexus Games', // Varied company name
      progress: '75%',
    },
    {
      layoutType: 'small-image',
      image: 'https://assets-prd.ignimgs.com/2022/06/13/riseofkingdoms-1655145831689.jpg', // Rose of Kingdoms image
      imageTitle: 'Rose of Kingdoms',
      imagePrice: '$10,000',
      title: 'Rose of Kingdoms',
      price: '$10,000',
      description: 'Reaplete a task',
      task: 'Downters',
      company: 'Kingdom Devs', // Varied company name
      progress: '50%',
    },
    {
      layoutType: 'small-image',
      image: 'https://images.sftcdn.net/images/t_app-icon-m/p/726ff3e6-55b7-4b6b-9183-05becc60bc05/189327238/pubg-mobile-logo', // PUBG Mobile image
      imageTitle: 'PUBG Mobile',
      imagePrice: '$80,000',
      title: 'PUBG Mobile',
      price: '$80,000',
      description: 'Complete a task',
      task: 'Downters',
      company: 'Mobile Masters', // Varied company name
      progress: '75%',
    },
    // Row 2
    {
      layoutType: 'small-image',
      image: 'https://assets-prd.ignimgs.com/2022/06/13/riseofkingdoms-1655145831689.jpg', // Rose of Kingdoms image
      imageTitle: 'Rose of Kingdoms',
      imagePrice: '$3,000',
      title: 'Rose of Kingdoms',
      price: '$3,000',
      description: 'Umroont Kinfydraon',
      task: 'Downters',
      company: 'Epic Studios', // Varied company name
      progress: '50%',
    },
    {
      layoutType: 'large-image',
      image: 'https://assets-prd.ignimgs.com/2022/06/13/riseofkingdoms-1655145831689.jpg', // Rose of Kingdoms image
      title: 'Rose of Kingdoms',
      price: '$14,000',
      description: 'Reachs level 20',
      task: 'Downters',
      company: 'Creative Labs', // Varied company name
      progress: '75%',
    },
    {
      layoutType: 'no-image', // No image
      title: 'Rose of Ringhats',
      price: '$1,000',
      description: 'Umroont Kinfydraon',
      task: 'Complete a task',
      company: 'Ringhats Inc.', // Varied company name
      progress: '50%',
    },
    {
      layoutType: 'large-image',
      image: 'https://assets-prd.ignimgs.com/2022/06/13/riseofkingdoms-1655145831689.jpg', // Rose of Kingdoms image
      title: 'Rose of Kingdoms',
      price: '$14,000',
      description: 'Reachs level 20',
      task: 'Downters',
      company: 'Global Gaming', // Varied company name
      progress: '75%',
    },
    {
      layoutType: 'small-image',
      image: 'https://images.sftcdn.net/images/t_app-icon-m/p/726ff3e6-55b7-4b6b-9183-05becc60bc05/189327238/pubg-mobile-logo', // PUBG Mobile image
      imageTitle: 'PUBG Mobile',
      imagePrice: '$18,000',
      title: 'PUBG Mobile',
      price: '$18,000',
      description: 'Remrank trimvel 20',
      task: 'Downters',
      company: 'Pro Gamers', // Varied company name
      progress: '50%',
    },
    // Row 3
    {
      layoutType: 'no-image', // No image
      title: '', // Removed title for this card as per request
      price: '$19,000',
      description: 'Remrank trimvel 20',
      task: 'Downters',
      company: 'Reward Hub', // Varied company name
      progress: '75%',
    },
    {
      layoutType: 'large-image',
      image: 'https://images.sftcdn.net/images/t_app-icon-m/p/726ff3e6-55b7-4b6b-9183-05becc60bc05/189327238/pubg-mobile-logo', // PUBG Mobile image
      title: 'PUBG Mobile',
      price: '$19,000',
      description: 'Remrank trimvel 20',
      task: 'Downters',
      company: 'Elite Play', // Varied company name
      progress: '50%',
    },
    {
      layoutType: 'small-image',
      image: 'https://www.shutterstock.com/image-vector/new-game-neon-signs-style-260nw-1880165389.jpg', // New Game image
      imageTitle: 'New Game',
      imagePrice: '$25,000',
      title: 'New Game Title',
      price: '$25,000',
      description: 'Explore new worlds',
      task: 'Discover secrets',
      company: 'Innovate Games',
      progress: '60%',
    },
    {
      layoutType: 'no-image', // Added a new card for 5 per row
      title: 'Bonus Reward',
      price: '$500',
      description: 'Claim your daily bonus',
      task: 'Login today',
      company: 'Daily Loot',
      progress: '90%',
    },
    {
      layoutType: 'large-image', // Added a new card for 5 per row
      image: 'https://i0.wp.com/gamingph.com/wp-content/uploads/2022/04/adventure-quest-gameplay.jpg?ssl=1', // Adventure Quest image
      title: 'Adventure Quest',
      price: '$30,000',
      description: 'Embark on a journey',
      task: 'Defeat the dragon',
      company: 'Quest Makers',
      progress: '40%',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex">
      {/* Main Content */}
      <main className="flex-1 p-8 w-full">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        </header>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {cardsData.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-lg flex flex-col border border-gray-700 border-opacity-50 h-[300px]"
              style={{
                borderColor: 'rgba(75, 85, 99, 0.5)',
              }}
            >
              {card.layoutType === 'small-image' && (
                <div className="p-4 flex flex-col flex-grow">
                  {/* Top row: small image and imageTitle/imagePrice */}
                  <div className="flex items-center mb-2">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-10 h-10 object-contain rounded-md mr-4 flex-shrink-0"
                      onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/40x40/6b7280/ffffff?text=Game"; }}
                    />
                    <div className="flex flex-col flex-grow">
                      <h3 className="text-gray-900 text-md font-semibold">{card.imageTitle}</h3>
                      <span className="text-blue-600 text-sm font-bold">{card.imagePrice}</span>
                    </div>
                  </div>

                  {/* Main title and price */}
                  {card.title && ( // Conditionally render title if it exists
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-gray-900 text-lg font-semibold">{card.title}</h3>
                      <span className="text-blue-600 font-bold text-xl">{card.price}</span>
                    </div>
                  )}
                  {/* Description, Task, Company/Progress */}
                  <p className="text-gray-700 text-sm mb-1">{card.description}</p>
                  <p className="text-gray-500 text-xs mb-4">{card.task}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-gray-700 text-sm">{card.company}</span>
                    <div className="w-16 h-4 bg-gray-300 rounded-full flex items-end overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: card.progress }}></div>
                    </div>
                  </div>
                </div>
              )}

              {card.layoutType === 'large-image' && (
                <>
                  {/* Large image that extends to the edges and covers half the box */}
                  <div className="relative w-full h-[150px] overflow-hidden rounded-t-lg">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/300x150/6b7280/ffffff?text=Image+Error"; }}
                    />
                  </div>
                  {/* Content below the large image, with padding */}
                  <div className="p-4 flex flex-col flex-grow">
                    {/* Main title and price for large image cards */}
                    {card.title && ( // Conditionally render title if it exists
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-gray-900 text-lg font-semibold">{card.title}</h3>
                        <span className="text-blue-600 font-bold text-xl">{card.price}</span>
                      </div>
                    )}
                    {/* Description, Task, Company/Progress */}
                    <p className="text-gray-700 text-sm mb-1">{card.description}</p>
                    <p className="text-gray-500 text-xs mb-4">{card.task}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-gray-700 text-sm">{card.company}</span>
                      <div className="w-16 h-4 bg-gray-300 rounded-full flex items-end overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: card.progress }}></div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {card.layoutType === 'no-image' && (
                <div className="p-4 flex flex-col flex-grow">
                  {/* Main title and price */}
                  {card.title && ( // Conditionally render title if it exists
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-gray-900 text-lg font-semibold">{card.title}</h3>
                      <span className="text-blue-600 font-bold text-xl">{card.price}</span>
                    </div>
                  )}
                  {/* Description, Task, Company/Progress */}
                  <p className="text-gray-700 text-sm mb-1">{card.description}</p>
                  <p className="text-gray-500 text-xs mb-4">{card.task}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-gray-700 text-sm">{card.company}</span>
                    <div className="w-16 h-4 bg-gray-300 rounded-full flex items-end overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: card.progress }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
