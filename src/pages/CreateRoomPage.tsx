import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  ContentCopy,
  CheckCircle,
  Videocam,
  Group,
  Settings,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { meetingApi } from '../services/api';
import Loader from '../components/Common/Loader';

const steps = ['กรอกข้อมูล', 'สร้างห้อง', 'พร้อมใช้งาน'];

const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [userName, setUserName] = useState('');
  const [roomName, setRoomName] = useState('');
  
  // Room data
  const [roomData, setRoomData] = useState<{
    roomId: string;
    roomName: string;
    createdBy: string;
  } | null>(null);

  useEffect(() => {
    // Pre-fill from URL params
    const nameFromUrl = searchParams.get('name');
    const roomNameFromUrl = searchParams.get('roomName');
    
    if (nameFromUrl) {
      setUserName(decodeURIComponent(nameFromUrl));
    }
    if (roomNameFromUrl) {
      setRoomName(decodeURIComponent(roomNameFromUrl));
    }
  }, [searchParams]);

  const handleCreateRoom = async () => {
    if (!userName.trim() || !roomName.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setLoading(true);
    setError(null);
    setActiveStep(1);

    try {
      const result = await meetingApi.createRoom(roomName, userName);
      
      if (result.success) {
        setRoomData({
          roomId: result.roomId,
          roomName: result.roomName,
          createdBy: result.createdBy,
        });
        setActiveStep(2);
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการสร้างห้อง');
        setActiveStep(0);
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRoomId = () => {
    if (roomData?.roomId) {
      const link_url = process.env.REACT_APP_URL+"meeting/"+roomData.roomId;
      navigator.clipboard.writeText(link_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinMeeting = () => {
    if (roomData) {
      navigate(`/meeting/${roomData.roomId}?userName=${encodeURIComponent(userName)}`);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="ชื่อผู้ใช้"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              margin="normal"
              variant="outlined"
              required
              placeholder="กรุณากรอกชื่อของคุณ"
            />
            <TextField
              fullWidth
              label="ชื่อห้องประชุม"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              margin="normal"
              variant="outlined"
              required
              placeholder="เช่น: ประชุมทีมพัฒนา"
              helperText="ชื่อห้องจะแสดงให้ผู้เข้าร่วมเห็น"
            />
            
            <Box sx={{ mt: 4 }}>
              <Alert severity="info">
                <Typography variant="body2">
                  • ชื่อห้องควรสื่อถึงวัตถุประสงค์ของการประชุม
                  <br />
                  • ชื่อผู้ใช้จะแสดงให้ผู้เข้าร่วมคนอื่นเห็น
                </Typography>
              </Alert>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              กำลังสร้างห้องประชุม...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              กรุณารอสักครู่ ระบบกำลังเตรียมห้องประชุมใหม่
            </Typography>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              สร้างห้องประชุมสำเร็จแล้ว!
            </Alert>

            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  รายละเอียดห้องประชุม
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Videocam color="primary" />
                      <Typography variant="body1" color="primary" sx={{ fontWeight: 500 }}>
                        {roomData?.roomName}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Group color="secondary" />
                      <Typography variant="body2">
                        ผู้สร้าง: {roomData?.createdBy}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Settings color="action" />
                      <Typography variant="body2" color="text.secondary">
                        สถานะ: พร้อมใช้งาน
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Room ID (สำหรับแชร์)
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1.5,
                      backgroundColor: 'grey.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        color: 'primary.main',
                        flexGrow: 1,
                      }}
                    >
                      {roomData?.roomId}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={handleCopyRoomId}
                      color={copied ? 'success' : 'default'}
                    >
                      {copied ? <CheckCircle /> : <ContentCopy />}
                    </IconButton>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    แชร์ Room ID นี้ให้กับผู้เข้าร่วมประชุม
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Box sx={{ mt: 3 }}>
              <Alert severity="warning">
                <Typography variant="body2">
                  หมายเหตุ: ห้องประชุมนี้เป็นแบบชั่วคราวและจะหายไปเมื่อไม่มีผู้ใช้อยู่
                </Typography>
              </Alert>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading && activeStep === 1) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Loader message="กำลังสร้างห้องประชุม..." />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      

      <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            สร้างห้องประชุมใหม่
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            กรอกข้อมูลเพื่อสร้างห้องประชุมสำหรับทีมของคุณ
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {renderStepContent(activeStep)}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={() => {
                if (activeStep > 0) {
                  setActiveStep(activeStep - 1);
                } else {
                  navigate('/');
                }
              }}
              disabled={loading}
            >
              {activeStep === 0 ? 'ยกเลิก' : 'ย้อนกลับ'}
            </Button>

            {activeStep < 2 ? (
              <Button
                variant="contained"
                onClick={handleCreateRoom}
                disabled={loading || !userName.trim() || !roomName.trim()}
              >
                {activeStep === 0 ? 'สร้างห้อง' : 'กำลังดำเนินการ...'}
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleCopyRoomId}
                  startIcon={<ContentCopy />}
                >
                  คัดลอก Room ID
                </Button>
                <Button
                  variant="contained"
                  onClick={handleJoinMeeting}
                  startIcon={<Videocam />}
                >
                  เข้าสู่ห้องประชุม
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CreateRoomPage;