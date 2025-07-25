export class SpotifyService {
    private static instance: SpotifyService;
    private token: string | null = null;

    private constructor() {}

    static getInstance(): SpotifyService {
        if (!SpotifyService.instance) {
            SpotifyService.instance = new SpotifyService();
        }
        return SpotifyService.instance;
    }

    setToken(token: string) {
        this.token = token;
    }

    private async makeRequest(endpoint: string, method: string = 'GET', params: any = null) {
        if (!this.token) throw new Error('No token available');

        const headers = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };

        const config: RequestInit = {
            method,
            headers
        };

        if (params && method !== 'GET') {
            config.body = JSON.stringify(params);
        }

        const response = await fetch(`https://api.spotify.com/v1${endpoint}`, config);
        
        if (!response.ok) {
            throw new Error(`Spotify API error: ${response.status}`);
        }

        return response.json();
    }

    async togglePlayback(isPlaying: boolean) {
        const endpoint = isPlaying ? '/me/player/pause' : '/me/player/play';
        await this.makeRequest(endpoint, 'PUT');
    }

    async nextTrack() {
        await this.makeRequest('/me/player/next', 'POST');
    }

    async previousTrack() {
        await this.makeRequest('/me/player/previous', 'POST');
    }

    async adjustVolume(amount: number) {
        const currentPlayback = await this.makeRequest('/me/player');
        const newVolume = Math.max(0, Math.min(100, currentPlayback.device.volume_percent + amount));
        await this.makeRequest(`/me/player/volume?volume_percent=${newVolume}`, 'PUT');
    }

    async getCurrentPlayback() {
        return this.makeRequest('/me/player');
    }
}
