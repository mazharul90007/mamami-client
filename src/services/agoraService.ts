import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  IMicrophoneAudioTrack
} from 'agora-rtc-sdk-ng';

export class AgoraService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private isInitialized = false;
  private appId: string;

  constructor() {
    // Get Agora App ID from environment
    this.appId = process.env.REACT_APP_AGORA_APP_ID || '';
    if (!this.appId) {
      console.warn('⚠️ REACT_APP_AGORA_APP_ID not found in environment variables');
    }
    
    // Initialize Agora client
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  }

  // Sanitize channel name to meet Agora requirements
  private sanitizeChannelName(channelName: string): string {
    // Remove any invalid characters and keep only allowed ones
    let sanitized = channelName.replace(/[^a-zA-Z0-9\s!#$%&()+\-:;<=.>?@[\]^_{|}~,]/g, '');
    
    // Replace spaces with hyphens
    sanitized = sanitized.replace(/\s+/g, '-');
    
    // Truncate to 64 characters if too long
    if (sanitized.length > 64) {
      sanitized = sanitized.substring(0, 64);
    }
    
    // Ensure it's not empty
    if (!sanitized) {
      sanitized = 'call-' + Date.now().toString(36);
    }
    
    console.log('🔧 Original channel name:', channelName);
    console.log('🔧 Sanitized channel name:', sanitized);
    
    return sanitized;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Agora client already initialized');
      return;
    }

    if (!this.appId) {
      throw new Error('Agora App ID not configured. Please set REACT_APP_AGORA_APP_ID in your .env file');
    }

    try {
      console.log('Initializing Agora client with appId:', this.appId);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Agora client:', error);
      throw error;
    }
  }

  async joinChannel(
    channelName: string,
    token: string,
    uid: string
  ): Promise<void> {
    if (!this.client) {
      throw new Error('Agora client not initialized');
    }

    if (!this.appId) {
      throw new Error('Agora App ID not configured');
    }

    // Sanitize the channel name
    const sanitizedChannelName = this.sanitizeChannelName(channelName);

    try {
      console.log('Joining Agora channel:', { 
        originalChannelName: channelName,
        sanitizedChannelName, 
        uid, 
        appId: this.appId 
      });
      
      // Join the channel with sanitized name
      await this.client.join(this.appId, sanitizedChannelName, token, uid);
      console.log('Successfully joined Agora channel');

      // Create and publish local audio track
      await this.createAndPublishLocalAudio();
      
      // Set up event listeners
      this.setupEventListeners();
      
    } catch (error) {
      console.error('Failed to join Agora channel:', error);
      throw error;
    }
  }

  private async createAndPublishLocalAudio(): Promise<void> {
    if (!this.client) return;

    try {
      // Create local audio track
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      console.log('Local audio track created');

      // Publish local audio track
      await this.client.publish(this.localAudioTrack);
      console.log('Local audio track published');
    } catch (error) {
      console.error('Failed to create/publish local audio:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.client) return;

    // User published event (when remote user joins)
    this.client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      console.log('Remote user published:', user.uid, mediaType);
      
      if (mediaType === 'audio') {
        // Subscribe to remote audio
        await this.client!.subscribe(user, mediaType);
        console.log('Subscribed to remote audio from:', user.uid);
        
        // Play remote audio
        user.audioTrack?.play();
        console.log('Playing remote audio from:', user.uid);
      }
    });

    // User unpublished event (when remote user leaves)
    this.client.on('user-unpublished', (user: IAgoraRTCRemoteUser) => {
      console.log('Remote user unpublished:', user.uid);
    });

    // User joined event
    this.client.on('user-joined', (user: IAgoraRTCRemoteUser) => {
      console.log('Remote user joined:', user.uid);
    });

    // User left event
    this.client.on('user-left', (user: IAgoraRTCRemoteUser) => {
      console.log('Remote user left:', user.uid);
    });

    // Connection state change
    this.client.on('connection-state-change', (curState: string, prevState: string) => {
      console.log('Connection state changed from', prevState, 'to', curState);
    });
  }

  // Public methods for audio control
  muteAudio(muted: boolean): void {
    if (this.localAudioTrack) {
      this.localAudioTrack.setEnabled(!muted);
      console.log(`Audio ${muted ? 'muted' : 'unmuted'}`);
    }
  }

  isAudioMuted(): boolean {
    return this.localAudioTrack ? !this.localAudioTrack.enabled : false;
  }

  getLocalAudioTrack(): IMicrophoneAudioTrack | null {
    return this.localAudioTrack;
  }

  async leaveChannel(): Promise<void> {
    if (this.client) {
      try {
        // Unpublish local audio track
        if (this.localAudioTrack) {
          await this.client.unpublish(this.localAudioTrack);
          this.localAudioTrack.close();
          this.localAudioTrack = null;
        }

        // Leave the channel
        await this.client.leave();
        console.log('Successfully left Agora channel');
      } catch (error) {
        console.error('Error leaving Agora channel:', error);
        throw error;
      }
    }
  }

  // Cleanup method
  cleanup(): void {
    if (this.localAudioTrack) {
      this.localAudioTrack.close();
      this.localAudioTrack = null;
    }
    this.isInitialized = false;
  }
}

const agoraService = new AgoraService();
export default agoraService; 