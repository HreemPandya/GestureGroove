import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Instructions from "./components/Instructions";
import SpotifyConnect from "./components/SpotifyConnect";
import WebcamFeed from "./components/WebcamFeed";

const App = () => {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Home setSelectedPage={setActiveTab} />;
      case "instructions":
        return <Instructions />;
      case "connect-spotify":
        return <SpotifyConnect />;
      case "gesture-control":
        return <WebcamFeed />;
      default:
        return <Home setSelectedPage={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="container mx-auto pt-20 px-4">{renderContent()}</main>
      <footer className="mt-auto py-6 text-center text-green-300">
        <p>Built with React and MediaPipe Hands | GestureGroove &copy; 2025</p>
      </footer>
    </div>
  );
};

export default App;
