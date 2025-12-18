export interface Room {
    id: string;
    name: string;
    createdBy: string;
    createdAt: Date;
    participants: string[];
    isRecording: boolean;
  }
  
  export interface Participant {
    id: string;
    name: string;
    isMuted: boolean;
    isVideoEnabled: boolean;
    isScreenSharing: boolean;
    connectionId: string;
  }
  
  export interface CreateRoomRequest {
    roomName: string;
    userName: string;
  }
  
  export interface JoinRoomRequest {
    roomId: string;
    userName: string;
  }
  
  export interface MeetingConfig {
    stunServers: string[];
    turnServers: string[];
  }
  
  export interface PeerConnection {
    peerConnection: RTCPeerConnection;
    remoteStream: MediaStream;
  }