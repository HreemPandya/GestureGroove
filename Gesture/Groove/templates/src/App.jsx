// FILE LOCATION: /src/App.js or /src/App.tsx
// REPLACE YOUR EXISTING APP FILE with this content

import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Instructions from './components/Instructions';
import SpotifyConnect from './components/SpotifyConnect';
import GestureSpotifyController from './components/GestureSpotifyController'; // Your new component
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home setSelectedPage={setActiveTab} />;
      case 'instructions':
        return <Instructions />;
      case 'connect-spotify':
        return (
          <SpotifyConnect 
            isConnected={isSpotifyConnected} 
            onConnect={setIsSpotifyConnected} 
          />
        );
      case 'gesture-control':
        return <GestureSpotifyController />;
      default:
        return <Home setSelectedPage={setActiveTab} />;
    }
  };

  return (
    <div className="App">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="pt-16">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;