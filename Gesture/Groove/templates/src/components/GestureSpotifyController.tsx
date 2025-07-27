"use client"

// FILE LOCATION: /templates/src/components/GestureSpotifyController.tsx
// Enhanced version with professional, consistent UI design

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Camera,
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  HandMetal,
  Wifi,
  WifiOff,
  Settings,
  Info,
  CheckCircle,
  AlertCircle,
  Moon,
  Sun,
} from "lucide-react"

// Type definitions
interface SpotifyTrack {
  name: string
  artists: Array<{ name: string }>
  album?: {
    images: Array<{ url: string }>
  }
}

interface SpotifyAuthProps {
  onAuthSuccess: (token: string) => void
}

interface HandLandmark {
  x: number
  y: number
  z?: number
}

interface DetectedHand {
  landmarks: HandLandmark[]
  confidence: number
}

// MediaPipe Hand Detection using real MediaPipe library
class MediaPipeHandDetector {
  private video: HTMLVideoElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private isActive = false

  // MediaPipe components
  private hands: any = null
  private camera: any = null

  // Hand detection state
  public detectedHands: DetectedHand[] = []
  private lastGestureTime = 0
  private cooldownMs = 1000
  private gestureHistory: Array<{ gesture: string; time: number }> = []
  private currentlyPlaying = false

  // Gesture tracking
  private handPositionHistory: Array<{ x: number; y: number; time: number }> = []

  // Callbacks
  public onPlayPause: (() => void) | null = null
  public onNextTrack: (() => void) | null = null
  public onPreviousTrack: (() => void) | null = null
  public onVolumeUp: (() => void) | null = null
  public onVolumeDown: (() => void) | null = null

  setPlayState(isPlaying: boolean): void {
    this.currentlyPlaying = isPlaying
  }

  async init(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): Promise<boolean> {
    this.video = videoElement
    this.canvas = canvasElement
    this.ctx = this.canvas.getContext("2d")

    if (!this.ctx) {
      console.error("Failed to get canvas context")
      return false
    }

    try {
      // Clean up any existing instances first
      if (this.hands) {
        this.hands.close()
        this.hands = null
      }
      if (this.camera) {
        this.camera.stop()
        this.camera = null
      }

      // Import MediaPipe dynamically
      const { Hands } = await import("@mediapipe/hands")
      const { Camera } = await import("@mediapipe/camera_utils")

      // Initialize MediaPipe Hands
      this.hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        },
      })

      this.hands.setOptions({
        maxNumHands: 1, // Only detect one hand for better performance
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      })

      this.hands.onResults((results: any) => this.onResults(results))

      // Initialize camera
      this.camera = new Camera(this.video, {
        onFrame: async () => {
          if (this.isActive && this.hands) {
            await this.hands.send({ image: this.video })
          }
        },
        width: 640,
        height: 480,
      })

      console.log("✅ MediaPipe hand detector initialized")
      return true
    } catch (error) {
      console.error("Failed to load MediaPipe:", error)
      return false
    }
  }

  private onResults(results: any): void {
    if (!this.ctx || !this.canvas) return

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Convert MediaPipe results to our format
    this.detectedHands = []

    if (results.multiHandLandmarks) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i]

        // Convert MediaPipe landmarks to our format
        const convertedLandmarks: HandLandmark[] = landmarks.map((lm: any) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z || 0,
        }))

        this.detectedHands.push({
          landmarks: convertedLandmarks,
          confidence: 0.9, // MediaPipe provides high confidence
        })
      }
    }

    // Process gestures if hands detected
    if (this.detectedHands.length > 0) {
      this.processGestures(this.detectedHands[0])
    }

    // Draw hand overlay with sage green color
    this.drawHandOverlay(results)
  }

  start(): boolean {
    this.isActive = true
    if (this.camera) {
      this.camera.start()
    }
    console.log("🎯 MediaPipe hand detection started")
    return true
  }

  stop(): void {
    this.isActive = false

    // Properly cleanup MediaPipe components
    if (this.camera) {
      try {
        this.camera.stop()
      } catch (error) {
        console.warn("Error stopping camera:", error)
      }
      this.camera = null
    }

    if (this.hands) {
      try {
        this.hands.close()
      } catch (error) {
        console.warn("Error closing hands:", error)
      }
      this.hands = null
    }

    this.handPositionHistory = []
    this.gestureHistory = []
    this.detectedHands = []

    console.log("⏹️ MediaPipe hand detection stopped and cleaned up")
  }

  private processGestures(hand: DetectedHand): void {
    const now = Date.now()

    // Track hand movement for swipe detection
    const wrist = hand.landmarks[0]
    this.handPositionHistory.push({
      x: wrist.x,
      y: wrist.y,
      time: now,
    })

    // Keep only recent history
    this.handPositionHistory = this.handPositionHistory.filter((pos) => now - pos.time < 1000)

    // Detect swipe gestures first
    const swipeDetected = this.detectSwipeGesturesMediaPipe()

    // Only detect static gestures if no swipe detected recently
    if (!swipeDetected && now - this.lastGestureTime > 800) {
      this.detectStaticGestures()
    }
  }

  private detectStaticGestures(): void {
    if (this.detectedHands.length === 0) return

    const hand = this.detectedHands[0]
    if (!hand.landmarks || hand.landmarks.length < 21) return

    // Only detect pinch gesture for play/pause
    const gesture = this.detectPinchGesture(hand.landmarks)

    if (gesture) {
      console.log(`🎵 Gesture detected: ${gesture}`)
      this.executeGesture(gesture)
    }
  }

  private detectPinchGesture(landmarks: HandLandmark[]): string | null {
    const frameWidth = this.canvas?.width || 640
    const frameHeight = this.canvas?.height || 480

    // Key landmarks for pinch
    const thumb_tip = landmarks[4]
    const index_tip = landmarks[8]

    // PINCH GESTURE for Play/Pause (thumb + index touching)
    const thumb_index_distance = Math.sqrt(
      Math.pow((thumb_tip.x - index_tip.x) * frameWidth, 2) + Math.pow((thumb_tip.y - index_tip.y) * frameHeight, 2),
    )

    console.log(`Pinch distance: ${thumb_index_distance.toFixed(1)}px`)

    if (thumb_index_distance < 40) {
      return "pinch_play_pause"
    }

    return null
  }

  private detectSwipeGesturesMediaPipe(): boolean {
    if (this.handPositionHistory.length < 5) return false

    const frameWidth = this.canvas?.width || 640
    const frameHeight = this.canvas?.height || 480

    const recent = this.handPositionHistory.slice(-5)
    const startPos = recent[0]
    const endPos = recent[recent.length - 1]

    const startX = startPos.x * frameWidth
    const startY = startPos.y * frameHeight
    const endX = endPos.x * frameWidth
    const endY = endPos.y * frameHeight

    const xMotion = endX - startX
    const yMotion = startY - endY

    const minSwipeDistance = 60 // Increase threshold for more reliable detection

    // Horizontal swipes (left/right)
    if (Math.abs(xMotion) > minSwipeDistance && Math.abs(xMotion) > Math.abs(yMotion)) {
      if (xMotion > 0) {
        this.executeGesture("swipe_right")
        this.handPositionHistory = []
        return true
      } else {
        this.executeGesture("swipe_left")
        this.handPositionHistory = []
        return true
      }
    }

    // Vertical swipes (up/down)
    if (Math.abs(yMotion) > minSwipeDistance && Math.abs(yMotion) > Math.abs(xMotion)) {
      if (yMotion > 0) {
        this.executeGesture("swipe_up")
        this.handPositionHistory = []
        return true
      } else {
        this.executeGesture("swipe_down")
        this.handPositionHistory = []
        return true
      }
    }

    return false
  }

  private executeGesture(gesture: string): void {
    const now = Date.now()
    const cooldown = 800 // Consistent cooldown for all gestures

    if (now - this.lastGestureTime < cooldown) return

    this.lastGestureTime = now
    this.gestureHistory.push({ gesture, time: now })

    console.log(`🎵 Gesture executed: ${gesture}`)

    switch (gesture) {
      case "pinch_play_pause":
        const action = this.currentlyPlaying ? "PAUSE" : "PLAY"
        console.log(`🤏 PINCH detected - ${action}`)
        if (this.onPlayPause) this.onPlayPause()
        break
      case "swipe_right":
        console.log("👉 Swipe right - Next Track")
        if (this.onNextTrack) this.onNextTrack()
        break
      case "swipe_left":
        console.log("👈 Swipe left - Previous Track")
        if (this.onPreviousTrack) this.onPreviousTrack()
        break
      case "swipe_up":
        console.log("☝️ Swipe up - Volume Up")
        if (this.onVolumeUp) this.onVolumeUp()
        break
      case "swipe_down":
        console.log("👇 Swipe down - Volume Down")
        if (this.onVolumeDown) this.onVolumeDown()
        break
    }
  }

  private drawHandOverlay(results: any): void {
    if (!this.ctx || !this.canvas) return

    // Simple hand drawing with sage green color
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        this.drawSimpleHandLandmarks(landmarks)
        this.drawSimpleHandConnections(landmarks)
      }
    }
  }

  private drawSimpleHandLandmarks(landmarks: any[]): void {
    if (!this.ctx || !this.canvas) return

    // Use sage green color for hand landmarks
    this.ctx.fillStyle = "#10B981"

    for (const landmark of landmarks) {
      const x = landmark.x * this.canvas.width
      const y = landmark.y * this.canvas.height

      this.ctx.beginPath()
      this.ctx.arc(x, y, 4, 0, 2 * Math.PI)
      this.ctx.fill()
    }
  }

  private drawSimpleHandConnections(landmarks: any[]): void {
    if (!this.ctx || !this.canvas) return

    // Use sage green color for hand connections
    this.ctx.strokeStyle = "#10B981"
    this.ctx.lineWidth = 2

    // Hand connections (MediaPipe standard)
    const connections = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4], // Thumb
      [0, 5],
      [5, 6],
      [6, 7],
      [7, 8], // Index
      [0, 9],
      [9, 10],
      [10, 11],
      [11, 12], // Middle
      [0, 13],
      [13, 14],
      [14, 15],
      [15, 16], // Ring
      [0, 17],
      [17, 18],
      [18, 19],
      [19, 20], // Pinky
      [5, 9],
      [9, 13],
      [13, 17], // Palm
    ]

    for (const [start, end] of connections) {
      if (start < landmarks.length && end < landmarks.length) {
        const startPoint = landmarks[start]
        const endPoint = landmarks[end]

        this.ctx.beginPath()
        this.ctx.moveTo(startPoint.x * this.canvas.width, startPoint.y * this.canvas.height)
        this.ctx.lineTo(endPoint.x * this.canvas.width, endPoint.y * this.canvas.height)
        this.ctx.stroke()
      }
    }
  }

  setCallbacks(callbacks: {
    onPlayPause?: () => void
    onNextTrack?: () => void
    onPreviousTrack?: () => void
    onVolumeUp?: () => void
    onVolumeDown?: () => void
  }): void {
    this.onPlayPause = callbacks.onPlayPause || null
    this.onNextTrack = callbacks.onNextTrack || null
    this.onPreviousTrack = callbacks.onPreviousTrack || null
    this.onVolumeUp = callbacks.onVolumeUp || null
    this.onVolumeDown = callbacks.onVolumeDown || null
  }
}


const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || ""

// Professional Spotify Authentication Component
const SpotifyAuth: React.FC<SpotifyAuthProps> = ({ onAuthSuccess }) => {

  if (!CLIENT_ID) {
  console.error("Missing VITE_SPOTIFY_CLIENT_ID environment variable")
  return (
    <div className="card text-center max-w-md mx-auto">
      <div className="text-red-600 mb-4">
        <AlertCircle className="h-12 w-12 mx-auto mb-2" />
        <h3 className="font-bold">Configuration Error</h3>
        <p className="text-sm">Spotify Client ID not configured</p>
      </div>
    </div>
  )
}

  const getRedirectUri = (): string => {
    const hostname = window.location.hostname
    const port = window.location.port

    if (hostname === "127.0.0.1" && port === "5173") {
      return "http://127.0.0.1:5173"
    }

    return window.location.origin
  }

  const REDIRECT_URI = getRedirectUri()

  const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
    const data = new TextEncoder().encode(codeVerifier)
    const digest = await window.crypto.subtle.digest("SHA-256", data)
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  }

  const generateCodeVerifier = (length = 128): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
    let result = ""
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleLogin = async (): Promise<void> => {
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    localStorage.setItem("code_verifier", codeVerifier)

    const authUrl =
      `https://accounts.spotify.com/authorize?` +
      `client_id=${CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=${encodeURIComponent("user-read-playback-state user-modify-playback-state streaming user-read-email user-read-private")}&` +
      `code_challenge_method=S256&` +
      `code_challenge=${codeChallenge}&` +
      `show_dialog=true`

    window.location.href = authUrl
  }

  return (
    <div className="text-center">
      <div className="app-icon mb-6">
        <Music className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-sage-800 mb-3">Connect to Spotify</h2>
      <p className="text-sage-600 mb-8 leading-relaxed max-w-sm mx-auto">
        Connect your Spotify account to start controlling music with intuitive hand gestures
      </p>
      <button onClick={handleLogin} className="btn-primary">
        <Music className="h-5 w-5" />
        Connect Spotify Account
      </button>
    </div>
  )
}

const GestureSpotifyController: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [volume, setVolume] = useState<number>(50)
  const [gestureActive, setGestureActive] = useState<boolean>(false)
  const [lastGesture, setLastGesture] = useState<string>("")
  const [handsDetected, setHandsDetected] = useState<number>(0)
  const [error, setError] = useState<string>("")
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectorRef = useRef<MediaPipeHandDetector | null>(null)

  // Theme toggle functionality
  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)

    if (newTheme) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  // Check for authorization code in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get("code")

    if (code) {
      exchangeCodeForToken(code)
    }
  }, [])

  const exchangeCodeForToken = async (code: string) => {
    const codeVerifier = localStorage.getItem("code_verifier")
    if (!codeVerifier) {
      setError("Missing code verifier")
      return
    }

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: window.location.origin,
          client_id: CLIENT_ID,
          code_verifier: codeVerifier,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const token = data.access_token

        setAccessToken(token)
        setIsConnected(true)
        localStorage.removeItem("code_verifier")

        window.history.replaceState({}, document.title, window.location.pathname)
        getCurrentTrack(token)
      } else {
        setError("Failed to get access token")
      }
    } catch (err) {
      console.error("Token exchange error:", err)
      setError("Failed to authenticate with Spotify")
    }
  }

  // Spotify API calls (keeping existing logic)
  const getCurrentTrack = async (token: string = accessToken || ""): Promise<void> => {
    if (!token) return

    try {
      const response = await fetch("https://api.spotify.com/v1/me/player", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) {
        setError("Spotify token expired. Please reconnect.")
        setIsConnected(false)
        setAccessToken(null)
        return
      }

      if (response.status === 204 || response.status === 202) {
        setCurrentTrack(null)
        setError("")
        return
      }

      if (response.ok) {
        const text = await response.text()
        if (text) {
          const data = JSON.parse(text)
          if (data && data.item) {
            setCurrentTrack(data.item)
            setIsPlaying(data.is_playing)
            setVolume(data.device?.volume_percent || 50)
            setError("")
          }
        }
      }
    } catch (err) {
      console.error("Error getting current track:", err)
      setError("No active Spotify device found. Please open Spotify and start playing music.")
    }
  }

  const togglePlayPause = async (): Promise<void> => {
    if (!accessToken) return

    try {
      // First, check current playback state
      const stateResponse = await fetch("https://api.spotify.com/v1/me/player", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (stateResponse.status === 204) {
        // No active device - try to start playback on any available device
        const devicesResponse = await fetch("https://api.spotify.com/v1/me/player/devices", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (devicesResponse.ok) {
          const devicesData = await devicesResponse.json()
          if (devicesData.devices.length > 0) {
            // Transfer playback to the first available device
            await fetch("https://api.spotify.com/v1/me/player", {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                device_ids: [devicesData.devices[0].id],
                play: true,
              }),
            })
            setIsPlaying(true)
            setError("")
            return
          }
        }

        setError("Please open Spotify and start playing something first!")
        return
      }

      if (stateResponse.ok) {
        const stateData = await stateResponse.json()
        const currentlyPlaying = stateData.is_playing

        // Now toggle based on actual current state
        const endpoint = currentlyPlaying ? "pause" : "play"
        const response = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (response.ok || response.status === 204) {
          setIsPlaying(!currentlyPlaying)
          setLastGesture(currentlyPlaying ? "Paused" : "Playing")
          setError("")

          // Update detector
          if (detectorRef.current) {
            detectorRef.current.setPlayState(!currentlyPlaying)
          }
        } else {
          console.error("Play/Pause failed:", response.status)
          setError("Unable to control playback. Make sure Spotify is active.")
        }
      }
    } catch (err) {
      console.error("Error in togglePlayPause:", err)
      setError("Playback control failed. Check your Spotify connection.")
    }
  }

  const nextTrack = async (): Promise<void> => {
    if (!accessToken) return

    try {
      const response = await fetch("https://api.spotify.com/v1/me/player/next", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok || response.status === 204) {
        setLastGesture("Next Track")
        setTimeout(() => getCurrentTrack(), 500)
      }
    } catch (err) {
      console.error("Error skipping to next track:", err)
    }
  }

  const previousTrack = async (): Promise<void> => {
    if (!accessToken) return

    try {
      const response = await fetch("https://api.spotify.com/v1/me/player/previous", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok || response.status === 204) {
        setLastGesture("Previous Track")
        setTimeout(() => getCurrentTrack(), 500)
      }
    } catch (err) {
      console.error("Error going to previous track:", err)
    }
  }

  const adjustVolume = async (newVolume: number): Promise<void> => {
    if (!accessToken) return

    try {
      const clampedVolume = Math.max(0, Math.min(100, newVolume))
      const response = await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${clampedVolume}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok || response.status === 204) {
        setVolume(clampedVolume)
        setLastGesture(`Volume ${newVolume > volume ? "Up" : "Down"}`)
      }
    } catch (err) {
      console.error("Error adjusting volume:", err)
    }
  }

  // Start real hand gesture control
  const startGestureControl = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      })

      if (videoRef.current && canvasRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = async () => {
          if (videoRef.current && canvasRef.current) {
            videoRef.current.play()

            // Initialize enhanced hand detector
            if (!detectorRef.current) {
              detectorRef.current = new MediaPipeHandDetector()
            }

            const success = await detectorRef.current.init(videoRef.current, canvasRef.current)

            if (success) {
              // Set up callbacks for Spotify API calls
              detectorRef.current.setCallbacks({
                onPlayPause: () => {
                  togglePlayPause()
                  setLastGesture("Hand Gesture: Play/Pause")
                },
                onNextTrack: () => {
                  nextTrack()
                  setLastGesture("Hand Gesture: Next Track")
                },
                onPreviousTrack: () => {
                  previousTrack()
                  setLastGesture("Hand Gesture: Previous Track")
                },
                onVolumeUp: () => {
                  adjustVolume(volume + 10)
                  setLastGesture("Hand Gesture: Volume Up")
                },
                onVolumeDown: () => {
                  adjustVolume(volume - 10)
                  setLastGesture("Hand Gesture: Volume Down")
                },
              })

              // Set play state AFTER callbacks are set
              detectorRef.current.setPlayState(isPlaying)
              detectorRef.current.start()
              setGestureActive(true)
              console.log("✅ Real hand gesture control started")
            } else {
              setError("Failed to initialize hand gesture detection")
            }
          }
        }
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("Could not access camera. Please check permissions.")
    }
  }

  const stopGestureControl = (): void => {
    if (detectorRef.current) {
      detectorRef.current.stop()
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }

    setGestureActive(false)
    setHandsDetected(0)
  }

  // Monitor hand detection status
  useEffect(() => {
    if (gestureActive && detectorRef.current) {
      const interval = setInterval(() => {
        if (detectorRef.current) {
          setHandsDetected(detectorRef.current.detectedHands?.length || 0)
        }
      }, 500)

      return () => clearInterval(interval)
    }
  }, [gestureActive])

  // Refresh track info periodically
  useEffect(() => {
    if (isConnected && accessToken) {
      const interval = setInterval(() => {
        getCurrentTrack()
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [isConnected, accessToken])

  // Update detector with current play state
  useEffect(() => {
    if (detectorRef.current && gestureActive) {
      detectorRef.current.setPlayState(isPlaying)
    }
  }, [isPlaying, gestureActive])

  return (
    <div className="app-container">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="theme-toggle"
        aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        <div className={`theme-toggle-icon ${isDarkMode ? "rotate" : ""}`}>
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </div>
      </button>

      <div className="container-enhanced">
        {/* Enhanced Header */}
        <div className="app-header">
          <div className="app-title">
            <div className="app-icon">
              <HandMetal className="h-8 w-8 text-white" />
            </div>
            <h1>GestureGroove Pro</h1>
          </div>
          <p className="app-subtitle">
            Control your Spotify with intuitive hand gestures - the future of music interaction
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle className="h-5 w-5 alert-icon" />
            <div className="alert-content">
              <h4>Connection Issue</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="main-grid">
          {/* Left Column - Camera & Controls */}
          <div className="left-column">
            {/* Enhanced Camera Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <h2>Hand Detection Camera</h2>
              </div>

              <div className="webcam-container">
                <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" muted playsInline />
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]" />
                {!gestureActive && (
                  <div className="webcam-placeholder">
                    <div className="webcam-placeholder-content">
                      <div className="webcam-placeholder-icon">
                        <Camera className="h-8 w-8 text-sage-300" />
                      </div>
                      <h3>Camera Ready</h3>
                      <p>Connect to Spotify and start hand tracking</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="button-container">
                {!isConnected ? (
                  <SpotifyAuth
                    onAuthSuccess={(token: string) => {
                      setAccessToken(token)
                      setIsConnected(true)
                      getCurrentTrack(token)
                    }}
                  />
                ) : (
                  <button
                    onClick={gestureActive ? stopGestureControl : startGestureControl}
                    className={`btn-primary ${
                      gestureActive
                        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                        : ""
                    }`}
                  >
                    {gestureActive ? (
                      <>
                        <WifiOff className="h-6 w-6" />
                        Stop Hand Tracking
                      </>
                    ) : (
                      <>
                        <Wifi className="h-6 w-6" />
                        Start Hand Tracking
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Gesture Controls Info */}
            {gestureActive && (
              <div className="card">
                <div className="card-header">
                  <div className="card-icon">
                    <HandMetal className="h-6 w-6 text-white" />
                  </div>
                  <h3>Active Gesture Controls</h3>
                </div>

                <div className="gesture-grid">
                  <div className="gesture-card">
                    <div className="gesture-emoji">🤏</div>
                    <div className="gesture-info">
                      <h4>Pinch Gesture</h4>
                      <p>Thumb + Index finger to play/pause</p>
                    </div>
                  </div>
                  <div className="gesture-card">
                    <div className="gesture-emoji">👉</div>
                    <div className="gesture-info">
                      <h4>Swipe Right</h4>
                      <p>Move hand right for next song</p>
                    </div>
                  </div>
                  <div className="gesture-card">
                    <div className="gesture-emoji">👈</div>
                    <div className="gesture-info">
                      <h4>Swipe Left</h4>
                      <p>Move hand left for previous song</p>
                    </div>
                  </div>
                  <div className="gesture-card">
                    <div className="gesture-emoji">☝️</div>
                    <div className="gesture-info">
                      <h4>Swipe Up</h4>
                      <p>Move hand up to increase volume</p>
                    </div>
                  </div>
                  <div className="gesture-card">
                    <div className="gesture-emoji">👇</div>
                    <div className="gesture-info">
                      <h4>Swipe Down</h4>
                      <p>Move hand down to decrease volume</p>
                    </div>
                  </div>
                </div>

                <div className="detection-status">
                  <div className={`detection-indicator ${handsDetected > 0 ? "active" : "inactive"}`}></div>
                  <span className="detection-text">
                    {handsDetected > 0 ? `${handsDetected} hand(s) actively detected` : "Waiting for hand detection..."}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Music Controls & Status */}
          <div className="right-column">
            {/* Current Track */}
            {currentTrack && (
              <div className="card">
                <div className="card-header">
                  <div className="card-icon">
                    <Music className="h-6 w-6 text-white" />
                  </div>
                  <h3>Now Playing</h3>
                </div>

                <div className="now-playing">
                  {currentTrack.album?.images?.[0] && (
                    <img
                      src={currentTrack.album.images[0].url || "/placeholder.svg"}
                      alt="Album cover"
                      className="album-art"
                    />
                  )}
                  <div className="track-info">
                    <h4 className="track-title">{currentTrack.name}</h4>
                    <p className="track-artist">{currentTrack.artists?.map((artist) => artist.name).join(", ")}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Manual Controls */}
            {isConnected && (
              <div className="card">
                <div className="card-header">
                  <div className="card-icon">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <h3>Manual Controls</h3>
                </div>

                <div className="controls-container">
                  <button onClick={previousTrack} className="btn-secondary control-btn">
                    <SkipBack className="h-6 w-6" />
                  </button>
                  <button onClick={togglePlayPause} className="btn-primary control-btn play-pause">
                    {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7" />}
                  </button>
                  <button onClick={nextTrack} className="btn-secondary control-btn">
                    <SkipForward className="h-6 w-6" />
                  </button>
                </div>

                <div className="volume-container">
                  <VolumeX className="h-6 w-6 volume-icon" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => adjustVolume(Number.parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <Volume2 className="h-6 w-6 volume-icon" />
                  <span className="volume-value">{volume}%</span>
                </div>
              </div>
            )}

            {/* Enhanced Status Panel */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon">
                  <Info className="h-6 w-6 text-white" />
                </div>
                <h3>System Status</h3>
              </div>

              <div className="status-grid">
                <div className="status-row">
                  <span className="status-label">Spotify Connection</span>
                  <div className={`status-indicator ${isConnected ? "status-connected" : "status-disconnected"}`}>
                    {isConnected ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Connected
                      </>
                    ) : (
                      "Not Connected"
                    )}
                  </div>
                </div>

                <div className="status-row">
                  <span className="status-label">Hand Tracking</span>
                  <div className={`status-indicator ${gestureActive ? "status-connected" : "status-disconnected"}`}>
                    {gestureActive ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Active
                      </>
                    ) : (
                      "Inactive"
                    )}
                  </div>
                </div>

                <div className="status-row">
                  <span className="status-label">Hands Detected</span>
                  <div className={`status-indicator ${handsDetected > 0 ? "status-connected" : "status-disconnected"}`}>
                    {handsDetected}
                  </div>
                </div>

                {lastGesture && (
                  <div className="status-row">
                    <span className="status-label">Last Action</span>
                    <div className="status-indicator status-connected">{lastGesture}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Tips Card */}
            <div className="card bg-gradient-to-br from-mint-50 to-sage-50">
              <div className="card-header">
                <div className="text-2xl">💡</div>
                <h3>Pro Tips</h3>
              </div>

              <div className="tips-list">
                <div className="tip-item">
                  <span className="tip-bullet">•</span>
                  <span className="tip-text">Ensure good lighting on your hands for optimal detection</span>
                </div>
                <div className="tip-item">
                  <span className="tip-bullet">•</span>
                  <span className="tip-text">Keep hands visible and centered in the camera frame</span>
                </div>
                <div className="tip-item">
                  <span className="tip-bullet">•</span>
                  <span className="tip-text">Make clear, deliberate gestures and hold for recognition</span>
                </div>
                <div className="tip-item">
                  <span className="tip-bullet">•</span>
                  <span className="tip-text">Avoid busy backgrounds behind your hands</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GestureSpotifyController
