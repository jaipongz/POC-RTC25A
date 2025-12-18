import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Container,
    Grid,
    Box,
    Typography,
    Alert,
    Snackbar,
    Drawer,
    IconButton,
    useTheme,
    useMediaQuery,
    Chip,
    Avatar,
    Button,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material';
import {
    Menu as MenuIcon,
    People,
    Chat,
    Settings,
    ExpandMore,
    ExpandLess,
} from '@mui/icons-material';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

import VideoPlayer from '../components/Meeting/VideoPlayer';
import Controls from '../components/Meeting/Controls';
import Participants from '../components/Meeting/Participants';
import Loader from '../components/Common/Loader';

import { signalRService } from '../services/signalr';
import { meetingApi } from '../services/api';

interface Participant {
    id: string;
    name: string;
    isMuted: boolean;
    isVideoEnabled: boolean;
    isScreenSharing: boolean;
    connectionId: string;
    isYou?: boolean;
}

const MeetingRoomPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' | 'info' } | null>(null);

    // Modal state
    const [showNameModal, setShowNameModal] = useState(false);
    const [nameInput, setNameInput] = useState('');
    const [nameInputError, setNameInputError] = useState('');

    // User info
    const [userName, setUserName] = useState('');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isLocalStreamReady, setIsLocalStreamReady] = useState(false);
    const localStreamRef = useRef<MediaStream | null>(null);

    // Meeting state
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isAudioOn, setIsAudioOn] = useState(true);

    const [isLeaving, setIsLeaving] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

    // UI state
    const [showParticipants, setShowParticipants] = useState(!isMobile);
    const [showChat, setShowChat] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Refs
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const remoteStreams = useRef<Map<string, MediaStream>>(new Map());
    const isMountedRef = useRef(true);
    const cleanupCalledRef = useRef(false);
    const initializationRef = useRef<Promise<void> | null>(null);
    const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingEventsRef = useRef<Array<{ event: string, data: any, callback?: Function }>>([]);
    const localAudioTrackRef = useRef<MediaStreamTrack | null>(null);
    const localVideoTrackRef = useRef<MediaStreamTrack | null>(null);
    const isTogglingRef = useRef(false);

    // ตรวจสอบชื่อผู้ใช้เมื่อ component mount
    useEffect(() => {
        const initUser = async () => {
            try {
                const nameFromUrl = searchParams.get('userName');
                
                if (nameFromUrl) {
                    // ถ้ามีชื่อจาก URL ให้ decode และใช้
                    const decodedName = decodeURIComponent(nameFromUrl);
                    setUserName(decodedName);
                    setNameInput(decodedName);
                    console.log('✅ Using name from URL:', decodedName);
                } else {
                    // ถ้าไม่มีชื่อจาก URL ให้แสดง modal กรอกชื่อ
                    console.log('⚠️ No userName in URL, showing name modal');
                    setShowNameModal(true);
                }
            } catch (err) {
                console.error('Error initializing user:', err);
                setShowNameModal(true);
            }
        };

        initUser();
    }, [searchParams]);

    // ส่วนที่ต้องแก้ใน useEffect initialization
    useEffect(() => {
        // ถ้ายังไม่มีชื่อผู้ใช้ ไม่ต้องเริ่มการประชุม
        if (!userName || showNameModal) {
            return;
        }

        isMountedRef.current = true;
        cleanupCalledRef.current = false;

        const initMeeting = async () => {
            if (initializationRef.current) {
                await initializationRef.current;
                return;
            }

            const initPromise = (async () => {
                try {
                    setIsConnecting(true);
                    setLoading(true);

                    if (!roomId) {
                        navigate('/');
                        return;
                    }

                    const roomCheck = await meetingApi.joinRoom(roomId, userName);
                    if (!roomCheck.success) {
                        setError('ไม่พบห้องประชุมนี้');
                        setLoading(false);
                        return;
                    }

                    // ขอ local stream ก่อน
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true,
                    });
                    setLocalStream(stream);
                    localStreamRef.current = stream;  // ← อัปเดต ref ด้วย
                    const audioTracks = stream.getAudioTracks();
                    const videoTracks = stream.getVideoTracks();
                    if (audioTracks.length > 0) localAudioTrackRef.current = audioTracks[0];
                    if (videoTracks.length > 0) localVideoTrackRef.current = videoTracks[0];

                    setIsLocalStreamReady(true);
                    console.log('✅ Local stream ready:', stream.id, stream.active);

                    const connected = await signalRService.start();
                    if (!connected) {
                        setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
                        setLoading(false);
                        return;
                    }

                    registerSignalREvents();
                    await signalRService.joinRoom(roomId, userName);

                    setLoading(false);
                    setIsConnecting(false);
                } catch (err: any) {
                    setError(err.message || 'เกิดข้อผิดพลาด');
                    setLoading(false);
                    setIsConnecting(false);
                }
            })();

            initializationRef.current = initPromise;
            await initPromise;
        };

        initMeeting();

        const cleanupTimer = setTimeout(() => {
            if (!isMountedRef.current && !cleanupCalledRef.current) {
                safeCleanup(false);
            }
        }, 100);

        return () => {
            isMountedRef.current = false;
            clearTimeout(cleanupTimer);
        };
    }, [roomId, userName, navigate, showNameModal]);

    // ✅ Modal handlers
    const handleNameSubmit = () => {
        if (!nameInput.trim()) {
            setNameInputError('กรุณากรอกชื่อผู้ใช้');
            return;
        }

        if (nameInput.length < 2) {
            setNameInputError('ชื่อผู้ใช้ต้องมีอย่างน้อย 2 ตัวอักษร');
            return;
        }

        if (nameInput.length > 20) {
            setNameInputError('ชื่อผู้ใช้ต้องไม่เกิน 20 ตัวอักษร');
            return;
        }

        // ตั้งชื่อผู้ใช้และปิด modal
        setUserName(nameInput.trim());
        setShowNameModal(false);
        setNameInputError('');
        
        // อัปเดต URL ด้วยชื่อใหม่ (optional)
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('userName', encodeURIComponent(nameInput.trim()));
        window.history.replaceState({}, '', newUrl.toString());
        
        console.log('✅ User name set:', nameInput.trim());
    };

    const handleCancelName = () => {
        // ถ้ายกเลิกให้กลับไปหน้าแรก
        navigate('/');
    };

    const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNameInput(e.target.value);
        if (nameInputError) {
            setNameInputError('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleNameSubmit();
        }
    };

    // ✅ Function to wait for local stream
    const waitForLocalStream = useCallback(async (): Promise<MediaStream> => {
        return new Promise((resolve, reject) => {
            const currentStream = localStreamRef.current;
            if (currentStream && currentStream.active) {
                resolve(currentStream);
                return;
            }
            if (localStream && localStream.active) {
                resolve(localStream);
                return;
            }

            let attempts = 0;
            const maxAttempts = 30;

            const checkStream = () => {
                attempts++;

                if (localStream && localStream.active) {
                    console.log(`✅ Local stream ready after ${attempts} attempts`);
                    resolve(localStream);
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Timeout waiting for local stream'));
                } else {
                    setTimeout(checkStream, 100);
                }
            };

            checkStream();
        });
    }, [localStream]);

    // ✅ Function to process pending events
    const processPendingEvents = useCallback(async () => {
        if (pendingEventsRef.current.length === 0) return;

        console.log(`🔄 Processing ${pendingEventsRef.current.length} pending events`);

        const eventsToProcess = [...pendingEventsRef.current];
        pendingEventsRef.current = [];

        for (const pending of eventsToProcess) {
            console.log(`📨 Processing pending event: ${pending.event}`);

            try {
                // รอให้ local stream พร้อมก่อน
                await waitForLocalStream();

                if (pending.event === 'RoomInfo') {
                    await handleRoomInfo(pending.data);
                } else if (pending.event === 'ExistingUser') {
                    await handleExistingUser(pending.data);
                } else if (pending.event === 'NewUserJoined') {
                    await handleNewUserJoined(pending.data);
                }

                if (pending.callback) {
                    pending.callback();
                }
            } catch (err) {
                console.error(`❌ Error processing pending event ${pending.event}:`, err);
            }
        }
    }, [waitForLocalStream]);

    // ✅ Safe cleanup function
    const safeCleanup = useCallback(async (isLeavingManually: boolean = false) => {
        if (cleanupCalledRef.current) {
            console.log('🧹 Cleanup already called, skipping');
            return;
        }

        cleanupCalledRef.current = true;
        console.log('🧹 Starting safe cleanup...');

        try {
            // 1. หยุด peer connections
            peerConnections.current.forEach((pc, key) => {
                try {
                    pc.close();
                    console.log(`✅ Closed peer connection: ${key}`);
                } catch (err) {
                    console.warn(`⚠️ Error closing peer connection ${key}:`, err);
                }
            });
            peerConnections.current.clear();
            remoteStreams.current.clear();

            // 2. หยุด local stream
            if (localStream) {
                try {
                    localStream.getTracks().forEach(track => {
                        track.stop();
                        track.enabled = false;
                    });
                    console.log('✅ Stopped local stream');
                } catch (err) {
                    console.warn('⚠️ Error stopping local stream:', err);
                }
            }

            // 3. Clear pending events
            pendingEventsRef.current = [];

            // 4. Disconnect SignalR เฉพาะเมื่อจำเป็น
            if (isLeavingManually) {
                console.log('🔌 Disconnecting SignalR (manual leave)...');
                await signalRService.leaveRoom();
                await signalRService.safeDisconnect();
            } else if (signalRService.isConnectionReady()) {
                console.log('🔌 Disconnecting SignalR (component unmount)...');
                await signalRService.leaveRoom();
                await signalRService.safeDisconnect();
            } else {
                console.log('⚠️ SignalR not ready, skipping disconnect');
            }

            console.log('✅ Cleanup completed');
        } catch (err) {
            console.error('❌ Error during cleanup:', err);
        } finally {
            if (cleanupTimeoutRef.current) {
                clearTimeout(cleanupTimeoutRef.current);
            }
        }
    }, [localStream]);

    // ✅ Individual event handlers
    const handleRoomInfo = useCallback(async (data: any) => {
        console.log('🏠 Handling RoomInfo', data);

        const others = data.allUsers.filter((u: any) => !u.isSelf);

        // สร้าง participants
        setParticipants(prev => {
            const newParticipants = others.filter(
                (u: any) => !prev.some(p => p.connectionId === u.connectionId)
            ).map((u: any) => ({
                id: u.connectionId,
                name: u.userName,
                connectionId: u.connectionId,
                isMuted: false,
                isVideoEnabled: true,
                isScreenSharing: false,
            }));

            return [...prev, ...newParticipants];
        });

        // สร้าง peer connections กับทุกคนที่อยู่ในห้อง
        console.log(`🔗 Creating connections to ${others.length} existing users`);

        for (const user of others) {
            if (!peerConnections.current.has(user.connectionId)) {
                console.log(`🔗 Creating connection to ${user.UserName} (${user.connectionId})`);
                await createPeerConnection(user.connectionId, user.UserName, false);

                // รอเล็กน้อยระหว่างการสร้างแต่ละ connection
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
    }, []);

    const handleExistingUser = useCallback(async (data: any) => {
        console.log('👥 Handling ExistingUser', data);

        setParticipants(prev => {
            if (prev.some(p => p.connectionId === data.connectionId)) {
                return prev;
            }

            return [
                ...prev,
                {
                    id: data.connectionId,
                    name: data.userName,
                    connectionId: data.connectionId,
                    isMuted: false,
                    isVideoEnabled: true,
                    isScreenSharing: false,
                }
            ];
        });

        if (!peerConnections.current.has(data.connectionId)) {
            console.log('🔗 Creating connection for ExistingUser', data.connectionId);
            await createPeerConnection(data.connectionId, data.userName, false);
        }
    }, []);

    const handleNewUserJoined = useCallback(async (data: any) => {
        console.log('👤 Handling NewUserJoined', data);

        // ตรวจสอบว่าไม่มี participant ซ้ำ
        setParticipants(prev => {
            if (prev.some(p => p.connectionId === data.connectionId)) {
                return prev;
            }

            return [
                ...prev,
                {
                    id: data.connectionId,
                    name: data.userName,
                    connectionId: data.connectionId,
                    isMuted: false,
                    isVideoEnabled: true,
                    isScreenSharing: false,
                }
            ];
        });

        // 🔥 คนเก่าเป็นฝ่าย create offer
        if (!peerConnections.current.has(data.connectionId)) {
            console.log('🎯 Creating connection with offer for NewUserJoined', data.connectionId);
            await createPeerConnection(data.connectionId, data.userName, true);
        }
    }, []);

    // ✅ Register SignalR events with pending queue
    const registerSignalREvents = () => {
        // =====================================================
        // 🏠 เข้าห้องครั้งแรก (สำคัญที่สุด)
        // =====================================================

        signalRService.on('RoomInfo', (data) => {
            // ใช้ ref แทน state
            const currentStream = localStreamRef.current;

            if (!currentStream || !currentStream.active) {
                console.log('⏳ RoomInfo received but stream not ready, queuing...');
                pendingEventsRef.current.push({ event: 'RoomInfo', data });
                return;
            }

            handleRoomInfo(data);
        });

        // =====================================================
        // 👥 server ส่ง user เก่ามาให้ caller
        // =====================================================
        signalRService.on('ExistingUser', (data) => {
            console.log('👥 ExistingUser received');

            const currentStream = localStreamRef.current;

            if (!currentStream || !currentStream.active) {
                console.log('⏳ ExistingUser received but stream not ready, queuing...');
                pendingEventsRef.current.push({ event: 'ExistingUser', data });
                return;
            }

            handleExistingUser(data);
        });

        // =====================================================
        // 👤 มีคนใหม่เข้าห้อง (ฝั่ง "คนเก่า")
        // =====================================================
        signalRService.on('NewUserJoined', (data) => {
            console.log('👤 NewUserJoined received');

            const currentStream = localStreamRef.current;

            if (!currentStream || !currentStream.active) {
                console.log('⏳ NewUserJoined received but stream not ready, queuing...');
                pendingEventsRef.current.push({ event: 'NewUserJoined', data });
                return;
            }

            handleNewUserJoined(data);
        });

        // =====================================================
        // 🚪 ออกจากห้อง
        // =====================================================
        signalRService.on('UserLeft', (data) => {
            console.log('🚪 UserLeft', data);

            setSnackbar({ message: `${data.userName} ออกจากห้อง`, severity: 'info' });

            removePeerConnection(data.connectionId);

            setParticipants(prev =>
                prev.filter(p => p.connectionId !== data.connectionId)
            );
        });

        // =====================================================
        // 🤝 WebRTC Signaling
        // =====================================================
        signalRService.on('ReceiveOffer', async (data) => {
            console.log('📩 ReceiveOffer from', data.fromConnectionId);

            const currentStream = localStreamRef.current;

            if (!currentStream || !currentStream.active) {
                console.log('⏳ Offer received but stream not ready, waiting...');
                await waitForLocalStream();
            }

            await handleOffer(data.fromConnectionId, data.offer);
        });

        signalRService.on('ReceiveAnswer', async (data) => {
            console.log('📩 ReceiveAnswer from', data.fromConnectionId);
            await handleAnswer(data.fromConnectionId, data.answer);
        });

        signalRService.on('ReceiveIceCandidate', async (data) => {
            console.log('🧊 ReceiveIceCandidate from', data.fromConnectionId);
            await handleIceCandidate(data.fromConnectionId, data.candidate);
        });

        // =====================================================
        // 🔇 / 📺 State change
        // =====================================================
        signalRService.on('UserMuteChanged', (data) => {
            console.log('🔇 UserMuteChanged', data);

            setParticipants(prev =>
                prev.map(p =>
                    p.name === data.userName ? { ...p, isMuted: data.isMuted } : p
                )
            );
        });

        signalRService.on('UserScreenSharing', (data) => {
            console.log('🖥️ UserScreenSharing', data);

            setParticipants(prev =>
                prev.map(p =>
                    p.connectionId === data.connectionId
                        ? { ...p, isScreenSharing: data.isSharing }
                        : p
                )
            );
        });

        // =====================================================
        // ❌ Error
        // =====================================================
        signalRService.on('Error', (message) => {
            console.error('❌ SignalR Error', message);
            setSnackbar({ message, severity: 'error' });
        });
    };

const getColumns = (count: number, isMobile: boolean) => {
    if (isMobile) return 1;

    if (count <= 1) return 1;
    if (count <= 2) return 2;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    if (count <= 9) return 3;

    return 4; // max
};



    // ✅ Effect to process pending events when local stream is ready
    useEffect(() => {
        if (localStream && localStream.active) {
            console.log('✅ Local stream is ready, processing pending events...');
            processPendingEvents();
        }
    }, [localStream, processPendingEvents]);

    // ✅ WebRTC Functions
    const createPeerConnection = async (
        targetConnectionId: string,
        userName: string,
        shouldCreateOffer: boolean
    ) => {
        console.log(
            `🎯 createPeerConnection -> ${targetConnectionId} | offer=${shouldCreateOffer}`
        );

        try {
            // 🔥 รอจนกว่า local stream จะพร้อม
            let streamToUse = localStream;
            if (!streamToUse || !streamToUse.active) {
                console.log('⏳ Waiting for local stream...');
                streamToUse = await waitForLocalStream();
            }

            if (!streamToUse) {
                console.error('❌ Cannot create peer connection: No local stream');
                return;
            }

            // ตรวจสอบ tracks
            const audioTracks = streamToUse.getAudioTracks();
            const videoTracks = streamToUse.getVideoTracks();

            console.log('📊 Audio tracks:', audioTracks.length, audioTracks[0]?.readyState);
            console.log('📊 Video tracks:', videoTracks.length, videoTracks[0]?.readyState);

            const config = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ],
            };

            const peerConnection = new RTCPeerConnection(config);


            // Add local tracks
            try {
                // ตรวจสอบว่ามี sender อยู่แล้วหรือไม่
                const existingSenders = peerConnection.getSenders();
                const existingAudioSender = existingSenders.find(s =>
                    s.track && s.track.kind === 'audio'
                );
                const existingVideoSender = existingSenders.find(s =>
                    s.track && s.track.kind === 'video'
                );

                // เพิ่มเฉพาะ track ที่ยังไม่มี sender
                streamToUse.getTracks().forEach(track => {
                    if (track.readyState === 'live') {
                        // ถ้าเป็น audio track และยังไม่มี audio sender
                        if (track.kind === 'audio' && !existingAudioSender) {
                            peerConnection.addTrack(track, streamToUse!);
                            console.log(`✅ Added ${track.kind} track to peer ${targetConnectionId}`);
                        }
                        // ถ้าเป็น video track และยังไม่มี video sender
                        else if (track.kind === 'video' && !existingVideoSender) {
                            peerConnection.addTrack(track, streamToUse!);
                            console.log(`✅ Added ${track.kind} track to peer ${targetConnectionId}`);
                        } else {
                            console.log(`⚠️ ${track.kind} track already exists for peer ${targetConnectionId}`);
                        }
                    }
                });
            } catch (err) {
                console.error('❌ Error adding tracks:', err);
            }



            // ICE candidate handling
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('🧊 ICE candidate for', targetConnectionId);
                    signalRService.sendIceCandidate(
                        targetConnectionId,
                        event.candidate.toJSON()
                    );
                } else {
                    console.log('✅ All ICE candidates sent for', targetConnectionId);
                }
            };

            // Remote track handling
            peerConnection.ontrack = (event) => {
                console.log('🎥 ontrack from', targetConnectionId);
                console.log('🎥 Track kinds:', event.streams[0]?.getTracks().map(t => t.kind));

                if (event.streams && event.streams[0]) {
                    remoteStreams.current.set(targetConnectionId, event.streams[0]);

                    // Force UI update
                    setParticipants(prev =>
                        prev.map(p =>
                            p.connectionId === targetConnectionId
                                ? { ...p, isVideoEnabled: true }
                                : p
                        )
                    );
                }
            };

            // Debug logging
            peerConnection.onconnectionstatechange = () => {
                console.log(`🔗 ${targetConnectionId} connection state:`, peerConnection.connectionState);
            };

            peerConnection.onsignalingstatechange = () => {
                console.log(`🔗 ${targetConnectionId} signaling state:`, peerConnection.signalingState);
            };

            peerConnection.oniceconnectionstatechange = () => {
                console.log(`🔗 ${targetConnectionId} ICE state:`, peerConnection.iceConnectionState);

                // ถ้า ICE สำเร็จ ให้ดึง stream อีกครั้ง
                if (peerConnection.iceConnectionState === 'connected' ||
                    peerConnection.iceConnectionState === 'completed') {
                    setTimeout(() => {
                        const receivers = peerConnection.getReceivers();
                        receivers.forEach(receiver => {
                            if (receiver.track) {
                                console.log(`🎥 Receiver track: ${receiver.track.kind} - ${receiver.track.readyState}`);
                            }
                        });
                    }, 500);
                }
            };

            peerConnection.onicegatheringstatechange = () => {
                console.log(`🔗 ${targetConnectionId} ICE gathering state:`, peerConnection.iceGatheringState);
            };

            peerConnections.current.set(targetConnectionId, peerConnection);

            // 🔥 create offer เฉพาะคนที่ "ควรทำ"
            if (shouldCreateOffer) {
                try {
                    console.log('📝 Creating offer for', targetConnectionId);

                    // ✅ แก้ไขตรงนี้: ใช้ RTCOfferOptions ที่ถูกต้อง
                    const offerOptions: RTCOfferOptions = {
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true,
                        // voiceActivityDetection ไม่ใช่ property ที่ถูกต้องของ RTCOfferOptions
                        // ให้ใช้ `voiceActivityDetection: false` ที่ระดับ track แทน
                    };

                    const offer = await peerConnection.createOffer(offerOptions);

                    console.log('📝 Offer created:', offer.type);

                    await peerConnection.setLocalDescription(offer);
                    console.log('✅ Local description set');

                    console.log('📤 Sending offer to', targetConnectionId);
                    await signalRService.sendOffer(targetConnectionId, offer);
                    console.log('✅ Offer sent');

                } catch (err) {
                    console.error('❌ Error creating/sending offer:', err);
                }
            }

            console.log(`✅ Peer connection created for ${targetConnectionId}`);
        } catch (err) {
            console.error('❌ createPeerConnection error:', err);
        }
    };

    const handleOffer = async (fromConnectionId: string, offer: any) => {
        console.log('📥 handleOffer from:', fromConnectionId);

        // รอให้ local stream พร้อม
        if (!localStream || !localStream.active) {
            console.log('⏳ Waiting for local stream before handling offer...');
            await waitForLocalStream();
        }

        let pc = peerConnections.current.get(fromConnectionId);

        if (!pc) {
            console.log('📞 Creating new peer connection for offer');
            await createPeerConnection(fromConnectionId, '', false);
            pc = peerConnections.current.get(fromConnectionId);

            // รอให้ connection พร้อม
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!pc) {
            console.error('❌ Failed to get peer connection');
            return;
        }

        try {
            // ตรวจสอบ state
            console.log('📊 Current signaling state:', pc.signalingState);

            // ถ้า state ไม่ใช่ stable ให้รอ
            if (pc.signalingState !== 'stable') {
                console.log('⏳ Signaling not stable, waiting...');
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Set remote description
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('✅ Remote description set');

            // Create and send answer
            // ✅ แก้ไขตรงนี้: ใช้ RTCAnswerOptions ที่ถูกต้อง
            const answerOptions: RTCAnswerOptions = {
                // voiceActivityDetection ไม่ใช่ property ที่ถูกต้องของ RTCAnswerOptions
            };

            const answer = await pc.createAnswer(answerOptions);

            await pc.setLocalDescription(answer);
            console.log('✅ Local description set');

            await signalRService.sendAnswer(fromConnectionId, answer);
            console.log('📤 Answer sent to', fromConnectionId);

        } catch (error) {
            console.error('❌ Error in handleOffer:', error);
        }
    };

    const handleAnswer = async (fromConnectionId: string, answer: any) => {
        const pc = peerConnections.current.get(fromConnectionId);
        if (!pc) {
            console.error('❌ No peer connection for answer');
            return;
        }

        console.log('📥 handleAnswer', fromConnectionId, 'state:', pc.signalingState);

        if (pc.signalingState !== 'have-local-offer') {
            console.warn('⚠️ Ignore answer, wrong state:', pc.signalingState);
            return;
        }

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('✅ Remote description set for answer');
        } catch (err) {
            console.error('❌ Error setting remote description:', err);
        }
    };

    const handleIceCandidate = async (fromConnectionId: string, candidate: any) => {
        const pc = peerConnections.current.get(fromConnectionId);
        if (!pc) {
            console.warn('⚠️ No peer connection for ICE candidate');
            return;
        }

        console.log('🧊 ICE from', fromConnectionId);

        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('✅ ICE candidate added');
        } catch (err) {
            console.error('❌ addIceCandidate failed', err);
        }
    };

    const removePeerConnection = (connectionId: string) => {
        const peerConnection = peerConnections.current.get(connectionId);
        if (peerConnection) {
            peerConnection.close();
            peerConnections.current.delete(connectionId);
            remoteStreams.current.delete(connectionId);
            console.log(`✅ Removed peer connection: ${connectionId}`);
        }
        setParticipants(prev => prev.filter(p => p.connectionId !== connectionId));
    };

    // Control handlers
    const handleToggleVideo = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length === 0) return;
        
        // อ่านค่าจาก track ปัจจุบัน (แทน state)
        const currentTrack = videoTracks[0];
        const shouldEnable = !currentTrack.enabled;
        
        // อัปเดตทุก video track
        videoTracks.forEach(track => {
            console.log('TRACK ->>',track);
            
            if (track.readyState === 'live') {
                track.enabled = shouldEnable;
            }
        });
        
        // อัปเดต state สำหรับ UI
        setIsVideoEnabled(shouldEnable);
        
        console.log(`📹 Video ${shouldEnable ? 'enabled' : 'disabled'}`);
    }, []); // ไม่ต้องมี dependency เพราะใช้ ref
    
    const handleToggleMute = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) return;
        
        // ใช้ functional update
        setIsMuted(prev => {
            const newMuteState = !prev;
            
            // อัปเดต track (enabled = ไม่ mute)
            audioTracks.forEach(track => {
                console.log('TRACK ->>',track);

                if (track.readyState === 'live') {
                    track.enabled = !newMuteState;
                }
            });
            
            // Notify server
            signalRService.toggleMute(newMuteState);
            
            console.log(`🎤 ${newMuteState ? 'Muted' : 'Unmuted'}`);
            return newMuteState;
        });
    }, []);


    const handleToggleScreenShare = async () => {
        try {
            if (!isScreenSharing) {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                });

                const videoTrack = screenStream.getVideoTracks()[0];
                peerConnections.current.forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(videoTrack);
                    }
                });

                setIsScreenSharing(true);
                screenStream.getTracks()[0].onended = () => {
                    handleToggleScreenShare();
                };
            } else {
                if (localStream) {
                    const videoTrack = localStream.getVideoTracks()[0];
                    peerConnections.current.forEach(pc => {
                        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                        if (sender && videoTrack) {
                            sender.replaceTrack(videoTrack);
                        }
                    });
                }
                setIsScreenSharing(false);
            }

            await signalRService.shareScreen(!isScreenSharing);
        } catch (err) {
            console.error('Error sharing screen:', err);
        }
    };

    const handleToggleRecording = () => {
        setIsRecording(!isRecording);
    };

    const handleToggleAudio = () => {
        setIsAudioOn(!isAudioOn);
    };

    const handleLeaveRoom = async () => {
        if (isLeaving) {
            console.log('⚠️ Already leaving, skipping');
            return;
        }

        setIsLeaving(true);
        console.log('🚪 User initiated leave room');

        try {
            // Perform cleanup
            await safeCleanup(true);

            // Wait a bit before navigation
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log('🏠 Navigating home...');
            navigate('/');

        } catch (err) {
            console.error('❌ Error leaving room:', err);
            navigate('/');
        }
    };

    const handleBackButton = () => {
        setShowLeaveConfirm(true);
    };

    const confirmLeave = async () => {
        setShowLeaveConfirm(false);
        await handleLeaveRoom();
    };

    const cancelLeave = () => {
        setShowLeaveConfirm(false);
    };

    const handleSettingsClick = () => {
        setSnackbar({ message: 'หน้าตั้งค่าจะเปิดในอนาคต', severity: 'info' });
    };

    // Handle page unload
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!isLeaving) {
                console.log('⚠️ Page unloading, performing cleanup...');
                event.preventDefault();
                event.returnValue = 'คุณกำลังออกจากห้องประชุม';
                return event.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isLeaving]);

    // Prevent back button
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (!isLeaving) {
                console.log('🔙 Back button pressed');
                event.preventDefault();
                handleBackButton();
                window.history.pushState(null, '', window.location.href);
            }
        };

        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isLeaving]);

    // ถ้ายังไม่มีการตั้งชื่อ ให้แสดง modal
    if (showNameModal) {
        return (
            <Dialog 
                open={showNameModal} 
                onClose={handleCancelName}
                maxWidth="sm"
                fullWidth
                disableEscapeKeyDown
            >
                <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                        กรุณากรอกชื่อผู้ใช้
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        ห้อง: {roomId}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ pb: 2 }}>
                    <TextField
                        autoFocus
                        fullWidth
                        label="ชื่อผู้ใช้"
                        value={nameInput}
                        onChange={handleNameInputChange}
                        onKeyPress={handleKeyPress}
                        error={!!nameInputError}
                        helperText={nameInputError || "กรอกชื่อที่ใช้ในห้องประชุม"}
                        variant="outlined"
                        sx={{ mt: 2 }}
                        placeholder="เช่น: ฐิติพงศ์, ภัทรภร, ธนกฤต"
                        inputProps={{
                            maxLength: 20
                        }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        ชื่อนี้จะแสดงให้ผู้เข้าร่วมประชุมคนอื่นเห็น
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={handleCancelName} variant="outlined" color="inherit">
                        ยกเลิก
                    </Button>
                    <Button 
                        onClick={handleNameSubmit} 
                        variant="contained" 
                        color="primary"
                        disabled={!nameInput.trim()}
                    >
                        เข้าร่วมประชุม
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    if (loading || isConnecting) {
        return (
            <Box sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <CircularProgress size={60} sx={{ mb: 3 }} />
                <Typography variant="h6" gutterBottom>
                    {isConnecting ? 'กำลังเชื่อมต่อกับเซิร์ฟเวอร์...' : 'กำลังเตรียมห้องประชุม...'}
                </Typography>
                {isConnecting && (
                    <Typography variant="body2" color="text.secondary">
                        กรุณารอสักครู่...
                    </Typography>
                )}
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
                <Button
                    variant="contained"
                    onClick={() => {
                        safeCleanup(false).finally(() => {
                            navigate('/');
                        });
                    }}
                >
                    กลับหน้าหลัก
                </Button>
            </Container>
        );
    }

    const localParticipant: Participant = {
        id: 'local',
        name: userName,
        isMuted,
        isVideoEnabled,
        isScreenSharing,
        connectionId: signalRService.getConnectionId() || '',
        isYou: true,
    };

    
    

    const allParticipants = [localParticipant, ...participants];
    const columns = getColumns(allParticipants.length, isMobile);
    const gridSize = Math.floor(12 / columns);

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box
                sx={{
                    p: 2,
                    backgroundColor: 'background.paper',
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {isMobile && (
                        <IconButton onClick={() => setDrawerOpen(true)}>
                            <MenuIcon />
                        </IconButton>
                    )}

                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {roomId}
                    </Typography>

                    <Chip
                        label={`${allParticipants.length} คน`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        icon={<Avatar sx={{ width: 20, height: 20, fontSize: '0.75rem' }}>  {(userName?.charAt(0) ?? '?')}
                        </Avatar>}
                        label={userName}
                        size="small"
                        variant="outlined"
                    />

                    {!isMobile && (
                        <>
                            <IconButton
                                onClick={() => setShowParticipants(!showParticipants)}
                                color={showParticipants ? 'primary' : 'default'}
                            >
                                <People />
                            </IconButton>
                            <IconButton
                                onClick={() => setShowChat(!showChat)}
                                color={showChat ? 'primary' : 'default'}
                            >
                                <Chat />
                            </IconButton>
                        </>
                    )}
                </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
                    <Grid
                        container
                        spacing={2}
                        justifyContent="center"
                        alignItems="center"
                    >
                        {allParticipants.map((participant) => (
                            <Grid
                                item
                                key={participant.id}
                                xs={12}
                                sm={gridSize}
                            >
                                <Box
                                    sx={{
                                        width: '100%',
                                        aspectRatio: '16 / 9',
                                        backgroundColor: 'black',
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <VideoPlayer
                                        stream={
                                            participant.id === 'local'
                                                ? localStream
                                                : remoteStreams.current.get(participant.connectionId) || null
                                        }
                                        name={participant.name}
                                        isMuted={participant.isMuted}
                                        isVideoEnabled={participant.isVideoEnabled}
                                        isScreenSharing={participant.isScreenSharing}
                                        isLocal={participant.id === 'local'}
                                        size={allParticipants.length <= 1 ? 'large' : 'medium'}
                                    />
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {!isMobile && showParticipants && (
                    <Box
                        sx={{
                            width: 320,
                            borderLeft: 1,
                            borderColor: 'divider',
                            p: 2,
                            overflow: 'auto',
                        }}
                    >
                        <Participants participants={allParticipants} />
                    </Box>
                )}
            </Box>

            {/* <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
                    <Grid container spacing={2} justifyContent="center">
                        {allParticipants.map((participant) => (
                            <Grid
                                item
                                xs={isSmallMobile ? 12 : 6}
                                sm={4}
                                md={participants.length <= 2 ? 6 : 4}
                                lg={participants.length <= 1 ? 6 : participants.length <= 4 ? 4 : 3}
                                key={participant.id}
                            >
                                <VideoPlayer
                                    stream={participant.id === 'local' ? localStream : remoteStreams.current.get(participant.connectionId) || null}
                                    name={participant.name}
                                    isMuted={participant.isMuted}
                                    isVideoEnabled={participant.isVideoEnabled}
                                    isScreenSharing={participant.isScreenSharing}
                                    isLocal={participant.id === 'local'}
                                    size={participants.length <= 1 ? 'large' : 'medium'}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {!isMobile && showParticipants && (
                    <Box
                        sx={{
                            width: 320,
                            borderLeft: 1,
                            borderColor: 'divider',
                            p: 2,
                            overflow: 'auto',
                        }}
                    >
                        <Participants participants={allParticipants} />
                    </Box>
                )}
            </Box> */}

            {/* Controls */}
            <Box sx={{ borderTop: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
                <Controls
                    isMuted={isMuted}
                    isVideoEnabled={isVideoEnabled}
                    isScreenSharing={isScreenSharing}
                    isRecording={isRecording}
                    isAudioOn={isAudioOn}
                    onToggleMute={handleToggleMute}
                    onToggleVideo={handleToggleVideo}
                    onToggleScreenShare={handleToggleScreenShare}
                    onToggleRecording={handleToggleRecording}
                    onToggleAudio={handleToggleAudio}
                    onLeaveRoom={handleBackButton}
                    onSettingsClick={handleSettingsClick}
                />
            </Box>

            {/* Leave Confirmation Dialog */}
            {showLeaveConfirm && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                    }}
                >
                    <Box sx={{
                        p: 4,
                        backgroundColor: 'background.paper',
                        borderRadius: 2,
                        maxWidth: 400,
                        width: '100%',
                        mx: 2
                    }}>
                        <Typography variant="h6" gutterBottom>
                            ออกจากห้องประชุม
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3 }}>
                            คุณแน่ใจว่าต้องการออกจากห้องประชุมนี้หรือไม่?
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button onClick={cancelLeave} variant="outlined">
                                ยกเลิก
                            </Button>
                            <Button
                                onClick={confirmLeave}
                                variant="contained"
                                color="error"
                                disabled={isLeaving}
                            >
                                {isLeaving ? 'กำลังออก...' : 'ออก'}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Drawer for Mobile */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: { width: 280 },
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Participants participants={allParticipants} />
                </Box>
            </Drawer>

            {/* Snackbar for notifications */}
            <Snackbar
                open={!!snackbar}
                autoHideDuration={3000}
                onClose={() => setSnackbar(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar(null)}
                    severity={snackbar?.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar?.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default MeetingRoomPage;