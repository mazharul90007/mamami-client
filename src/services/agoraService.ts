import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack,
  UID 
} from 'agora-rtc-sdk-ng';

export class AgoraService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private isInitialized = false;

  constructor() {
    // Initialize Agora client
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  }

  async initialize(appId: string): Promise<void> {
    if (this.isInitialized) {
      console.log('Agora client already initialized');
      return;
    }

    try {
      console.log('Initializing Agora client with appId:', appId);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Agora client:', error);
      throw error;
    }
  }

  async joinChannel(
    appId: string,
    channelName: string,
    token: string,
    uid: string
  ): Promise<void> {
    if (!this.client) {
      throw new Error('Agora client not initialized');
    }

    try {
      console.log('Joining Agora channel:', { channelName, uid });
      
      // Join the channel
      await this.client.join(appId, channelName, token, uid);
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

  async leaveChannel(): Promise<void> {
    if (!this.client) {
      console.log('No Agora client to leave');
      return;
    }

    try {
      console.log('Leaving Agora channel');
      
      // Stop and close local audio track
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
        console.log('Local audio track stopped and closed');
      }

      // Leave the channel
      await this.client.leave();
      console.log('Successfully left Agora channel');
      
    } catch (error) {
      console.error('Failed to leave Agora channel:', error);
      throw error;
    }
  }

  async muteAudio(muted: boolean): Promise<void> {
    if (!this.localAudioTrack) {
      console.log('No local audio track to mute/unmute');
      return;
    }

    try {
      if (muted) {
        this.localAudioTrack.setEnabled(false);
        console.log('Audio muted');
      } else {
        this.localAudioTrack.setEnabled(true);
        console.log('Audio unmuted');
      }
    } catch (error) {
      console.error('Failed to mute/unmute audio:', error);
      throw error;
    }
  }

  isAudioMuted(): boolean {
    return this.localAudioTrack ? !this.localAudioTrack.enabled : false;
  }

  getConnectionState(): string {
    return this.client ? this.client.connectionState : 'DISCONNECTED';
  }

  destroy(): void {
    if (this.localAudioTrack) {
      this.localAudioTrack.stop();
      this.localAudioTrack.close();
      this.localAudioTrack = null;
    }
    
    if (this.client) {
      this.client.removeAllListeners();
      this.client = null;
    }
    
    this.isInitialized = false;
    console.log('Agora service destroyed');
  }
}

export default new AgoraService(); 