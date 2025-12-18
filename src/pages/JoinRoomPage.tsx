import React, { useState } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Divider,
} from '@mui/material';
import { ArrowBack, Login } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { meetingApi } from '../services/api';

const JoinRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomInfo, setRoomInfo] = useState<{
    roomName: string;
    createdBy: string;
  } | null>(null);

  // Pre-fill จาก URL params
  React.useEffect(() => {
    const nameFromUrl = searchParams.get('name');
    const roomIdFromUrl = searchParams.get('id');
    
    if (nameFromUrl) {
      setUserName(decodeURIComponent(nameFromUrl));
    }
    if (roomIdFromUrl) {
      setRoomId(roomIdFromUrl);
    }
  }, [searchParams]);

  const handleJoinRoom = async () => {
    if (!roomId.trim() || !userName.trim()) {
      setError('กรุณากรอก Room ID และชื่อผู้ใช้');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await meetingApi.joinRoom(roomId, userName);
      
      if (result.success) {
        setRoomInfo({
          roomName: result.roomName,
          createdBy: result.createdBy,
        });
        setSuccess(true);
      } else {
        setError(result.error || 'ไม่สามารถเข้าร่วมห้องได้');
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterMeeting = () => {
    if (roomId && userName) {
      navigate(`/meeting/${roomId}?userName=${encodeURIComponent(userName)}`);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/')}
        sx={{ mb: 3 }}
      >
        กลับหน้าหลัก
      </Button>

      <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            เข้าร่วมห้องประชุม
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            กรอก Room ID เพื่อเข้าร่วมการประชุมที่มีอยู่แล้ว
          </Typography>

          <Divider sx={{ mb: 4 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success ? (
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                พร้อมเข้าร่วมห้องประชุมแล้ว!
              </Alert>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  รายละเอียดห้อง
                </Typography>
                <Typography variant="body1">
                  <strong>ชื่อห้อง:</strong> {roomInfo?.roomName}
                </Typography>
                <Typography variant="body1">
                  <strong>ผู้สร้าง:</strong> {roomInfo?.createdBy}
                </Typography>
                <Typography variant="body1">
                  <strong>Room ID:</strong> {roomId}
                </Typography>
                <Typography variant="body1">
                  <strong>ผู้เข้าร่วม:</strong> {userName}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setSuccess(false)}
                >
                    แก้ไขข้อมูล
                </Button>
                <Button
                  variant="contained"
                  onClick={handleEnterMeeting}
                  startIcon={<Login />}
                >
                  เข้าสู่ห้องประชุม
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <TextField
                fullWidth
                label="ชื่อผู้ใช้"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                margin="normal"
                variant="outlined"
                required
                placeholder="กรุณากรอกชื่อของคุณ"
                disabled={loading}
              />

              <TextField
                fullWidth
                label="Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                margin="normal"
                variant="outlined"
                required
                placeholder="กรุณากรอก Room ID ที่ได้รับ"
                disabled={loading}
                helperText="Room ID เป็นรหัสที่ได้รับจากผู้สร้างห้อง"
              />

              <Alert severity="info" sx={{ mt: 3, mb: 3 }}>
                <Typography variant="body2">
                  • ต้องได้รับ Room ID จากผู้สร้างห้องก่อน
                  <br />
                  • ชื่อผู้ใช้จะแสดงให้ผู้เข้าร่วมคนอื่นเห็น
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/')}
                  disabled={loading}
                >
                  ยกเลิก
                </Button>
                <Button
                  variant="contained"
                  onClick={handleJoinRoom}
                  disabled={loading || !roomId.trim() || !userName.trim()}
                  startIcon={<Login />}
                >
                  {loading ? 'กำลังตรวจสอบ...' : 'เข้าร่วมห้อง'}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default JoinRoomPage;