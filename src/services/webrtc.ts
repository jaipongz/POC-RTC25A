// WebRTC configuration and utility functions

// ICE Servers configuration
export const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      {
        urls: [
          'turn:uat-api-m-health.d.orisma.com:3478?transport=udp',
          'turn:uat-api-m-health.d.orisma.com:3478?transport=tcp',
          'turn:api.mnrh.app:3478?transport=udp',
          'turn:api.mnrh.app:3478?transport=tcp',
        ],
        username: 'test',
        credential: 'test',
      },
    ],
  };
  
  // Get user media (camera & microphone)
  export const getLocalMedia = async (
    constraints: MediaStreamConstraints = {
      video: true,
      audio: true,
    }
  ): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };
  
  // Get screen share media
  export const getScreenMedia = async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      return stream;
    } catch (error) {
      console.error('Error accessing screen share:', error);
      throw error;
    }
  };
  
  // Create RTCPeerConnection
  export const createPeerConnection = (): RTCPeerConnection => {
    return new RTCPeerConnection(iceServers);
  };
  
  // Handle ICE candidates
  export const setupIceCandidateHandler = (
    peerConnection: RTCPeerConnection,
    onIceCandidate: (candidate: RTCIceCandidate) => void
  ): void => {
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };
  };
  
  // Handle remote tracks
  export const setupTrackHandler = (
    peerConnection: RTCPeerConnection,
    onTrack: (stream: MediaStream) => void
  ): void => {
    peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        onTrack(event.streams[0]);
      }
    };
  };
  
  // Create and set local description
  export const createAndSetLocalDescription = async (
    peerConnection: RTCPeerConnection
  ): Promise<RTCSessionDescriptionInit> => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return offer;
  };
  
  // Set remote description
  export const setRemoteDescription = async (
    peerConnection: RTCPeerConnection,
    description: RTCSessionDescriptionInit
  ): Promise<void> => {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(description)
    );
  };
  
  // Add ICE candidate
  export const addIceCandidate = async (
    peerConnection: RTCPeerConnection,
    candidate: RTCIceCandidateInit
  ): Promise<void> => {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  };
  
  // Stop all tracks in a stream
  export const stopStream = (stream: MediaStream): void => {
    stream.getTracks().forEach((track) => track.stop());
  };
  
  // Check if WebRTC is supported
  export const isWebRTCSupported = (): boolean => {
    // Check for required APIs
    const hasMediaDevices = !!navigator.mediaDevices;
    const hasGetUserMedia = hasMediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function';
    const hasRTCPeerConnection = typeof window.RTCPeerConnection === 'function';
    
    return hasGetUserMedia && hasRTCPeerConnection;
  };
  // Get available devices
  export const getAvailableDevices = async (): Promise<{
    audioInputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
  }> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      return {
        audioInputs: devices.filter((device) => device.kind === 'audioinput'),
        videoInputs: devices.filter((device) => device.kind === 'videoinput'),
        audioOutputs: devices.filter((device) => device.kind === 'audiooutput'),
      };
    } catch (error) {
      console.error('Error enumerating devices:', error);
      return {
        audioInputs: [],
        videoInputs: [],
        audioOutputs: [],
      };
    }
  };
  
  // Check camera and microphone permissions
  export const checkMediaPermissions = async (): Promise<{
    camera: boolean;
    microphone: boolean;
  }> => {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      cameraStream.getTracks().forEach((track) => track.stop());
  
      const microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      microphoneStream.getTracks().forEach((track) => track.stop());
  
      return {
        camera: true,
        microphone: true,
      };
    } catch (error) {
      console.error('Error checking media permissions:', error);
      return {
        camera: false,
        microphone: false,
      };
    }
  };