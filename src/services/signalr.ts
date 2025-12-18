import * as signalR from '@microsoft/signalr';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
//   private connectionUrl: string = 'http://localhost:5048/meeting-hub'; // <-- เปลี่ยนเป็น port 5048
  private connectionUrl: string = process.env.REACT_APP_BASE_ENDPOINT+'meeting-hub'; // <-- เปลี่ยนเป็น port 5048
  private isConnected: boolean = false;
  private isDisposing: boolean = false; // <-- เพิ่มตัวแปรนี้
  private connectionPromise: Promise<boolean> | null = null; // <-- เพิ่มสำหรับป้องกัน concurrent connections

  constructor() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.connectionUrl)
      .withAutomaticReconnect([0, 2000, 10000, 30000]) // Retry policy
      .configureLogging(signalR.LogLevel.Warning) // ลด log level
      .build();

    // Connection event handlers
    this.connection.onclose((error) => {
      console.log('SignalR connection closed', error);
      this.isConnected = false;
    });

    this.connection.onreconnecting((error) => {
      console.log('SignalR reconnecting', error);
      this.isConnected = false;
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected');
      this.isConnected = true;
    });
  }

  async start(): Promise<boolean> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
  
    this.connectionPromise = (async () => {
      try {
        if (
          this.connection?.state === signalR.HubConnectionState.Connected ||
          this.connection?.state === signalR.HubConnectionState.Connecting
        ) {
          return true;
        }
  
        await this.connection!.start();
        this.isConnected = true;
        console.log('SignalR Connected');
        return true;
      } catch (err) {
        console.error('SignalR start failed:', err);
        this.isConnected = false;
        return false;
      } finally {
        this.connectionPromise = null;
      }
    })();
  
    return this.connectionPromise;
  }
  
  async stop(): Promise<void> {
    if (!this.connection) return;
  
    if (
      this.connection.state === signalR.HubConnectionState.Disconnected
    ) {
      return;
    }
  
    await this.connection.stop();
    this.isConnected = false;
    console.log('SignalR Disconnected');
  }
  
  // Join room (พร้อมตรวจสอบ connection)
  async joinRoom(roomId: string, userName: string): Promise<boolean> {
    const connected = await this.start();
    if (!connected || !this.connection) return false;
  
    await this.connection.invoke('JoinRoom', roomId, userName);
    return true;
  }
  

  // Send WebRTC offer (พร้อม error handling)
  async sendOffer(targetConnectionId: string, offer: RTCSessionDescriptionInit): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
        console.log(`send offer ${targetConnectionId}`);
        
      await this.connection!.invoke('SendOffer', targetConnectionId, offer);
      return true;
    } catch (err) {
      console.error('Error sending offer:', err);
      return false;
    }
  }

  // Send WebRTC answer
  async sendAnswer(targetConnectionId: string, answer: RTCSessionDescriptionInit): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.connection!.invoke('SendAnswer', targetConnectionId, answer);
      return true;
    } catch (err) {
      console.error('Error sending answer:', err);
      return false;
    }
  }

  // Send ICE candidate
  async sendIceCandidate(targetConnectionId: string, candidate: RTCIceCandidateInit): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.connection!.invoke('SendIceCandidate', targetConnectionId, candidate);
      return true;
    } catch (err) {
      console.error('Error sending ICE candidate:', err);
      return false;
    }
  }

  // Toggle mute
  async toggleMute(isMuted: boolean): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.connection!.invoke('ToggleMute', isMuted);
      return true;
    } catch (err) {
      console.error('Error toggling mute:', err);
      return false;
    }
  }

  // Share screen
  async shareScreen(isSharing: boolean): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.connection!.invoke('ShareScreen', isSharing);
      return true;
    } catch (err) {
      console.error('Error sharing screen:', err);
      return false;
    }
  }

  // Leave room (ปลอดภัยกว่า)
  async leaveRoom(): Promise<boolean> {
    try {
      // ตรวจสอบว่ามี connection และเชื่อมต่ออยู่
      if (!this.connection || !this.isConnected) {
        console.log('Cannot leave room: SignalR not connected');
        return false;
      }

      await this.connection.invoke('LeaveRoom');
      return true;
    } catch (err) {
      console.error('Error leaving room:', err);
      return false;
    }
  }

  // Safe disconnect
  async safeDisconnect(): Promise<void> {
    try {
      await this.leaveRoom();
      await this.stop();
    } catch (err) {
      console.error('Error during safe disconnect:', err);
    } finally {
      this.isConnected = false;
    }
  }

  // Register event handlers
  on(eventName: string, callback: (...args: any[]) => void): void {
    this.connection?.on(eventName, callback);
  }

  // Get connection state
  getState(): string {
    return this.connection?.state || 'Disconnected';
  }

  // Check if connected
  isConnectionReady(): boolean {
    return this.isConnected && this.connection?.state === signalR.HubConnectionState.Connected;
  }

  // Get connection ID
  getConnectionId(): string | null {
    return this.connection?.connectionId || null;
  }
}

export const signalRService = new SignalRService();