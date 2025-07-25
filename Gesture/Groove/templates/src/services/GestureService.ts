import { Camera } from '@mediapipe/camera_utils';
import { Hands, Results } from '@mediapipe/hands';

export type GestureType = 'play/pause' | 'next' | 'previous' | 'volume-up' | 'volume-down' | null;

export interface GestureHandler {
    onGestureDetected: (gesture: GestureType) => void;
    onError: (error: string) => void;
}

export class GestureService {
    private hands: Hands | null = null;
    private camera: Camera | null = null;
    private previousPositions: { x: number[]; y: number[] } = { x: [], y: [] };
    private lastActionTime: number = 0;
    private readonly COOLDOWN = 1000;
    private readonly SWIPE_THRESHOLD = 0.2;
    private readonly PINCH_THRESHOLD = 0.1;

    constructor(private handler: GestureHandler) {}

    async initialize(videoElement: HTMLVideoElement) {
        try {
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
                }
            });

            await this.hands.initialize();

            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 0,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.hands.onResults(this.handleResults.bind(this));

            this.camera = new Camera(videoElement, {
                onFrame: async () => {
                    if (this.hands && videoElement.readyState === 4) {
                        await this.hands.send({ image: videoElement });
                    }
                },
                width: 640,
                height: 480
            });

            await this.camera.start();
        } catch (error) {
            this.handler.onError('Failed to initialize hand tracking');
            console.error(error);
        }
    }

    private handleResults(results: Results) {
        if (!results.multiHandLandmarks?.length) return;

        const currentTime = Date.now();
        if (currentTime - this.lastActionTime < this.COOLDOWN) return;

        const landmarks = results.multiHandLandmarks[0];
        const gesture = this.detectGesture(landmarks);

        if (gesture) {
            this.handler.onGestureDetected(gesture);
            this.lastActionTime = currentTime;
        }
    }

    private detectGesture(landmarks: any): GestureType {
        const wrist = landmarks[0];
        const thumb = landmarks[4];
        const index = landmarks[8];

        // Update position history
        this.previousPositions.x.push(wrist.x);
        this.previousPositions.y.push(wrist.y);
        if (this.previousPositions.x.length > 5) {
            this.previousPositions.x.shift();
            this.previousPositions.y.shift();
        }

        // Detect pinch
        const pinchDistance = Math.hypot(thumb.x - index.x, thumb.y - index.y);
        if (pinchDistance < this.PINCH_THRESHOLD) {
            return 'play/pause';
        }

        // Detect horizontal swipe
        const xMotion = this.previousPositions.x[this.previousPositions.x.length - 1] -
                       this.previousPositions.x[0];
        if (Math.abs(xMotion) > this.SWIPE_THRESHOLD) {
            return xMotion > 0 ? 'next' : 'previous';
        }

        // Detect vertical swipe
        const yMotion = this.previousPositions.y[this.previousPositions.y.length - 1] -
                       this.previousPositions.y[0];
        if (Math.abs(yMotion) > this.SWIPE_THRESHOLD) {
            return yMotion < 0 ? 'volume-up' : 'volume-down';
        }

        return null;
    }

    cleanup() {
        if (this.camera) {
            this.camera.stop();
        }
        if (this.hands) {
            this.hands.close();
        }
    }
}
