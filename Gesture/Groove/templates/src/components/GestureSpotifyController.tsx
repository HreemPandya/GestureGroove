// FILE LOCATION: /src/components/GestureSpotifyController.tsx
// REPLACE THE EXISTING FILE with this corrected version

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Music, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, HandMetal, Wifi, WifiOff } from 'lucide-react';

// Type definitions
interface SpotifyTrack {
  name: string;
  artists: Array<{ name: string }>;
  album?: {
    images: Array<{ url: string }>;
  };
}

interface SpotifyAuthProps {
  onAuthSuccess: (token: string) => void;
}

// Spotify Authentication Component
const SpotifyAuth: React.FC<SpotifyAuthProps> = ({ onAuthSuccess }) => {
  const CLIENT_ID = 'd4399e2a2a2147c98d8405c27b052594';
  
  // For development: you can manually set your ngrok URL here
  // For production: uses the actual domain
  const getRedirectUri = (): string => {
    // If you're using ngrok, replace this with your ngrok URL
    const NGROK_URL = 'https://your-ngrok-url.ngrok.io'; // Replace with your actual ngrok URL
    
    // Uncomment the line below if using ngrok for development
    // return window.location.hostname === 'localhost' ? NGROK_URL : window.location.origin;
    
    // For now, using current origin (works once deployed)
    return window.location.origin;
  };
  
  const REDIRECT_URI = getRedirectUri();
  const SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing streaming';

  const handleLogin = (): void => {
    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${CLIENT_ID}&` +
      `response_type=token&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(SCOPES)}&` +
      `show_dialog=true`;
    
    console.log('Redirect URI being used:', REDIRECT_URI); // Debug log
    window.location.href = authUrl;
  };

  return (
    <div className="bg-emerald-950/50 p-8 rounded-lg border border-emerald-800 text-center">
      <Music className="h-16 w-16 text-green-400 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-white mb-4">Connect to Spotify</h2>
      <p className="text-emerald-300 mb-6">
        Connect your Spotify account to start controlling music with gestures
      </p>
      <div className="text-sm text-emerald-400 mb-4 p-3 bg-emerald-900/30 rounded">
        <p><strong>Redirect URI:</strong> {REDIRECT_URI}</p>
        <p className="text-xs mt-1">Make sure this URL is added to your Spotify app settings</p>
      </div>
      <button
        onClick={handleLogin}
        className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-semibold transition-colors"
      >
        Connect Spotify Account
      </button>
    </div>
  );
};

const GestureSpotifyController: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(50);
  const [gestureActive, setGestureActive] = useState<boolean>(false);
  const [lastGesture, setLastGesture] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<any>(null);
  const previousPositions = useRef<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const lastActionTime = useRef<number>(0);
  const animationFrame = useRef<number | null>(null);
  
  const COOLDOWN = 1000; // 1 second between gestures

  // Spotify Web API Configuration
  const CLIENT_ID = 'd4399e2a2a2147c98d8405c27b052594';
  const REDIRECT_URI = window.location.origin; // Use current domain instead of localhost
  const SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing streaming';

  // Initialize MediaPipe Hands
  useEffect(() => {
    const loadMediaPipe = async (): Promise<void> => {
      try {
        // Load MediaPipe from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js';
        script.onload = initializeHands;
        document.head.appendChild(script);
      } catch (err) {
        console.error('Failed to load MediaPipe:', err);
        setError('Failed to load hand tracking library');
      }
    };

    loadMediaPipe();
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  const initializeHands = (): void => {
    if ((window as any).Hands) {
      handsRef.current = new (window as any).Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
      });

      handsRef.current.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
      });

      handsRef.current.onResults(onHandsResults);
    }
  };

  // Check for auth token in URL on component mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const token = hash.split('&')[0].split('=')[1];
      if (token) {
        setAccessToken(token);
        setIsConnected(true);
        window.location.hash = ''; // Clean URL
        getCurrentTrack(token);
      }
    }
  }, []);

  // Spotify API calls
  const getCurrentTrack = async (token: string = accessToken || ''): Promise<void> => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.item) {
          setCurrentTrack(data.item);
          setIsPlaying(data.is_playing);
          setVolume(data.device?.volume_percent || 50);
        }
      }
    } catch (err) {
      console.error('Error getting current track:', err);
    }
  };

  const togglePlayPause = async (): Promise<void> => {
    try {
      const endpoint = isPlaying ? 'pause' : 'play';
      const response = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        setIsPlaying(!isPlaying);
        setLastGesture('Play/Pause');
      }
    } catch (err) {
      console.error('Error toggling playback:', err);
    }
  };

  const nextTrack = async (): Promise<void> => {
    try {
      await fetch('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      setLastGesture('Next Track');
      setTimeout(() => getCurrentTrack(), 500);
    } catch (err) {
      console.error('Error skipping to next track:', err);
    }
  };

  const previousTrack = async (): Promise<void> => {
    try {
      await fetch('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      setLastGesture('Previous Track');
      setTimeout(() => getCurrentTrack(), 500);
    } catch (err) {
      console.error('Error going to previous track:', err);
    }
  };

  const adjustVolume = async (newVolume: number): Promise<void> => {
    try {
      const clampedVolume = Math.max(0, Math.min(100, newVolume));
      await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${clampedVolume}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      setVolume(clampedVolume);
      setLastGesture(`Volume ${newVolume > volume ? 'Up' : 'Down'}`);
    } catch (err) {
      console.error('Error adjusting volume:', err);
    }
  };

  // Start camera and gesture recognition
  const startGestureControl = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            setGestureActive(true);
            processFrame();
          }
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please check permissions.');
    }
  };

  const stopGestureControl = (): void => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setGestureActive(false);
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
  };

  const processFrame = (): void => {
    if (gestureActive && videoRef.current && handsRef.current) {
      handsRef.current.send({ image: videoRef.current });
    }
    animationFrame.current = requestAnimationFrame(processFrame);
  };

  const onHandsResults = (results: any): void => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return;
    }

    const landmarks = results.multiHandLandmarks[0];
    detectAndHandleGesture(landmarks);
    
    // Draw landmarks on canvas
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        
        // Draw hand connections
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4], // thumb
          [0, 5], [5, 6], [6, 7], [7, 8], // index
          [0, 17], [5, 9], [9, 10], [10, 11], [11, 12], // middle
          [9, 13], [13, 14], [14, 15], [15, 16], // ring
          [13, 17], [17, 18], [18, 19], [19, 20] // pinky
        ];
        
        connections.forEach(([start, end]) => {
          const startPoint = landmarks[start];
          const endPoint = landmarks[end];
          
          ctx.beginPath();
          ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
          ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
          ctx.stroke();
        });
      }
    }
  };

  const detectAndHandleGesture = (landmarks: any[]): void => {
    const currentTime = Date.now();
    if (currentTime - lastActionTime.current < COOLDOWN) return;

    const wrist = landmarks[0];
    const thumb = landmarks[4];
    const index = landmarks[8];

    // Pinch detection (thumb and index finger close)
    const pinchDistance = Math.sqrt(
      Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2)
    );

    if (pinchDistance < 0.05) {
      togglePlayPause();
      lastActionTime.current = currentTime;
      return;
    }

    // Track wrist movement for swipe gestures
    previousPositions.current.x.push(wrist.x);
    previousPositions.current.y.push(wrist.y);

    if (previousPositions.current.x.length > 10) {
      previousPositions.current.x.shift();
      previousPositions.current.y.shift();
    }

    if (previousPositions.current.x.length === 10) {
      const xMovement = previousPositions.current.x[9] - previousPositions.current.x[0];
      const yMovement = previousPositions.current.y[0] - previousPositions.current.y[9];

      // Horizontal swipes for track control
      if (Math.abs(xMovement) > 0.15) {
        if (xMovement > 0) {
          nextTrack();
        } else {
          previousTrack();
        }
        lastActionTime.current = currentTime;
        previousPositions.current = { x: [], y: [] };
        return;
      }

      // Vertical swipes for volume control
      if (Math.abs(yMovement) > 0.15) {
        if (yMovement > 0) {
          adjustVolume(volume + 10);
        } else {
          adjustVolume(volume - 10);
        }
        lastActionTime.current = currentTime;
        previousPositions.current = { x: [], y: [] };
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <HandMetal className="h-10 w-10 text-green-400" />
            GestureGroove
          </h1>
          <p className="text-emerald-200">Control your Spotify with hand gestures</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Camera Feed */}
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover transform scale-x-[-1]"
                muted
                playsInline
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]"
              />
              {!gestureActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Camera className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex justify-center gap-4">
              {!isConnected ? (
                <div className="w-full">
                  <SpotifyAuth onAuthSuccess={(token: string) => {
                    setAccessToken(token);
                    setIsConnected(true);
                    getCurrentTrack(token);
                  }} />
                </div>
              ) : (
                <button
                  onClick={gestureActive ? stopGestureControl : startGestureControl}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                    gestureActive
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {gestureActive ? (
                    <>
                      <WifiOff className="h-5 w-5" />
                      Stop Gesture Control
                    </>
                  ) : (
                    <>
                      <Wifi className="h-5 w-5" />
                      Start Gesture Control
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Current Track */}
            {currentTrack && (
              <div className="bg-emerald-950/50 p-6 rounded-lg border border-emerald-800">
                <div className="flex items-center gap-4">
                  {currentTrack.album?.images?.[0] && (
                    <img
                      src={currentTrack.album.images[0].url}
                      alt="Album cover"
                      className="w-16 h-16 rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg truncate">
                      {currentTrack.name}
                    </h3>
                    <p className="text-emerald-300 truncate">
                      {currentTrack.artists?.map(artist => artist.name).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Manual Controls */}
            <div className="bg-emerald-950/50 p-6 rounded-lg border border-emerald-800">
              <h3 className="text-white font-semibold mb-4">Manual Controls</h3>
              <div className="flex justify-center gap-4 mb-6">
                <button
                  onClick={previousTrack}
                  className="p-3 bg-emerald-700 hover:bg-emerald-600 rounded-full text-white transition-colors"
                  disabled={!isConnected}
                >
                  <SkipBack className="h-6 w-6" />
                </button>
                <button
                  onClick={togglePlayPause}
                  className="p-4 bg-green-500 hover:bg-green-400 rounded-full text-white transition-colors"
                  disabled={!isConnected}
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </button>
                <button
                  onClick={nextTrack}
                  className="p-3 bg-emerald-700 hover:bg-emerald-600 rounded-full text-white transition-colors"
                  disabled={!isConnected}
                >
                  <SkipForward className="h-6 w-6" />
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <VolumeX className="h-5 w-5 text-emerald-300" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => adjustVolume(parseInt(e.target.value))}
                  className="flex-1 accent-green-500"
                  disabled={!isConnected}
                />
                <Volume2 className="h-5 w-5 text-emerald-300" />
                <span className="text-emerald-300 w-12">{volume}%</span>
              </div>
            </div>

            {/* Gesture Status */}
            <div className="bg-emerald-950/50 p-6 rounded-lg border border-emerald-800">
              <h3 className="text-white font-semibold mb-4">Gesture Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-emerald-300">Status:</span>
                  <span className={`font-semibold ${gestureActive ? 'text-green-400' : 'text-gray-400'}`}>
                    {gestureActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {lastGesture && (
                  <div className="flex justify-between">
                    <span className="text-emerald-300">Last Gesture:</span>
                    <span className="text-green-400 font-semibold">{lastGesture}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Gesture Guide */}
            <div className="bg-emerald-950/50 p-6 rounded-lg border border-emerald-800">
              <h3 className="text-white font-semibold mb-4">Gesture Guide</h3>
              <div className="space-y-2 text-emerald-300">
                <div className="flex justify-between">
                  <span>👌 Pinch:</span>
                  <span>Play/Pause</span>
                </div>
                <div className="flex justify-between">
                  <span>👉 Swipe Right:</span>
                  <span>Next Track</span>
                </div>
                <div className="flex justify-between">
                  <span>👈 Swipe Left:</span>
                  <span>Previous Track</span>
                </div>
                <div className="flex justify-between">
                  <span>👆 Swipe Up:</span>
                  <span>Volume Up</span>
                </div>
                <div className="flex justify-between">
                  <span>👇 Swipe Down:</span>
                  <span>Volume Down</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestureSpotifyController;