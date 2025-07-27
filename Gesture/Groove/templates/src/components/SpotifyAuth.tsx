import React, { useEffect, useState } from 'react';

const SPOTIFY_CLIENT_ID = 'd4399e2a2a2147c98d8405c27b052594';
const REDIRECT_URI = 'https://oauth.pstmn.io/v1/browser-callback';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'streaming',
  'user-read-email',
  'user-read-private'
] as const;

interface SpotifyAuthProps {
  onAuthSuccess: (token: string | null) => void;
}

const SpotifyAuth: React.FC<SpotifyAuthProps> = ({ onAuthSuccess }) => {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash
      .substring(1)
      .split('&')
      .reduce<Record<string, string>>((initial, item) => {
        if (item) {
          const parts = item.split('=');
          initial[parts[0]] = decodeURIComponent(parts[1]);
        }
        return initial;
      }, {});

    window.location.hash = '';

    if (hash.access_token) {
      localStorage.setItem('spotify_token', hash.access_token);
      validateToken(hash.access_token);
    } else {
      const storedToken = localStorage.getItem('spotify_token');
      if (storedToken) {
        validateToken(storedToken);
      }
    }
  }, []);

  const validateToken = async (tokenToValidate: string) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Token validation failed');
      }
      
      const data = await response.json();
      setToken(tokenToValidate);
      onAuthSuccess(tokenToValidate);
      setError(null);
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('spotify_token');
      setError('Failed to connect to Spotify. Please try again.');
      setToken(null);
    }
  };

  const handleLogin = () => {
    const scope = SCOPES.join(' ');
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'token',
      redirect_uri: REDIRECT_URI,
      scope: scope,
      show_dialog: 'true'
    });
    
    window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('spotify_token');
    onAuthSuccess(null);
  };

  return (
    <div className="text-center">
      {error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}
      {!token ? (
        <button
          onClick={handleLogin}
          className="bg-green-500 text-white px-6 py-3 rounded-full font-bold hover:bg-green-600 transition-colors"
        >
          Connect to Spotify
        </button>
      ) : (
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-6 py-3 rounded-full font-bold hover:bg-red-600 transition-colors"
        >
          Disconnect from Spotify
        </button>
      )}
    </div>
  );
};

export default SpotifyAuth;
