import React from 'react';
import { Music2, LogOut } from 'lucide-react';

const SpotifyConnect = ({ isConnected, onConnect }) => {
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="bg-emerald-950/50 p-8 rounded-lg border border-emerald-800">
        <Music2 className="w-16 h-16 text-green-400 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4">
          {isConnected ? 'Connected to Spotify' : 'Connect Your Spotify Account'}
        </h2>
        
        {isConnected ? (
          <div className="space-y-4">
            <p className="text-emerald-300">Connected as Username</p>
            <button
              onClick={() => onConnect(false)}
              className="flex items-center justify-center w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-emerald-300 mb-6">
              Connect your Spotify account to control your music using hand gestures
            </p>
            <button
              onClick={() => onConnect(true)}
              className="flex items-center justify-center w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              <Music2 className="w-5 h-5 mr-2" />
              Connect with Spotify
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifyConnect;