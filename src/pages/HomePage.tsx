import React, { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  Alert,
  CardActions,
  Avatar,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  VideoCall,
  Group,
  Settings,
  ArrowForward,
  Security,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [roomName, setRoomName] = useState('');
  
  const theme = useTheme();

  const handleCreateRoom = () => {
    if (!roomName.trim() || !userName.trim()) {
      alert('กรุณากรอกชื่อห้องและชื่อผู้ใช้');
      return;
    }
    navigate(`/create-room?name=${encodeURIComponent(userName)}&roomName=${encodeURIComponent(roomName)}`);
  };

  const handleJoinRoom = () => {
    if (!roomId.trim() || !userName.trim()) {
      alert('กรุณากรอก Room ID และชื่อผู้ใช้');
      return;
    }
    navigate(`/join-room?id=${roomId}&name=${encodeURIComponent(userName)}`);
  };

  const features = [
    {
      icon: <VideoCall sx={{ fontSize: 40 }} />,
      title: 'วิดีโอคุณภาพสูง',
      description: 'สนทนาด้วยวิดีโอความคมชัดสูงแบบเรียลไทม์',
      color: 'primary.main',
    },
    {
      icon: <Group sx={{ fontSize: 40 }} />,
      title: 'หลายผู้ใช้',
      description: 'รองรับการประชุมแบบหลายคนพร้อมกัน',
      color: 'secondary.main',
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'ปลอดภัย',
      description: 'การเข้ารหัสแบบ end-to-end',
      color: 'success.main',
    },
    {
      icon: <Settings sx={{ fontSize: 40 }} />,
      title: 'ครบครัน',
      description: 'แชร์หน้าจอ, บันทึก, ปิด/เปิดไมค์',
      color: 'warning.main',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box
        sx={{
          textAlign: 'center',
          mb: 6,
          animation: 'fadeIn 0.8s ease-out',
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            mb: 2,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          WebRTC Meeting POC
        </Typography>
        
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          ระบบประชุมออนไลน์แบบเรียลไทม์ด้วยเทคโนโลยีล่าสุด
        </Typography>

        <Chip
          label="Demo Version"
          color="primary"
          variant="outlined"
          sx={{ fontSize: '1rem', py: 2, px: 3 }}
        />
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Create Room */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={3}
            sx={{
              height: '100%',
              borderRadius: 3,
              overflow: 'hidden',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    mr: 2,
                    width: 56,
                    height: 56,
                  }}
                >
                  <VideoCall />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    สร้างห้องใหม่
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    จัดการประชุมของคุณเอง
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="ชื่อผู้ใช้"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  placeholder="กรุณากรอกชื่อของคุณ"
                />
                <TextField
                  fullWidth
                  label="ชื่อห้องประชุม"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  placeholder="เช่น: Meeting with Team"
                />
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                ระบบจะสร้าง Room ID ให้อัตโนมัติเมื่อคุณสร้างห้อง
              </Alert>

              <CardActions sx={{ p: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={handleCreateRoom}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    borderRadius: 2,
                  }}
                >
                  สร้างห้องประชุม
                </Button>
              </CardActions>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Join Room */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={3}
            sx={{
              height: '100%',
              borderRadius: 3,
              overflow: 'hidden',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: 'secondary.main',
                    mr: 2,
                    width: 56,
                    height: 56,
                  }}
                >
                  <Group />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    เข้าร่วมห้อง
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    เข้าร่วมการประชุมที่มีอยู่แล้ว
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="ชื่อผู้ใช้"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  placeholder="กรุณากรอกชื่อของคุณ"
                />
                <TextField
                  fullWidth
                  label="Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  placeholder="กรุณากรอก Room ID"
                />
              </Box>

              <Alert severity="warning" sx={{ mb: 3 }}>
                ต้องได้รับ Room ID จากผู้สร้างห้องก่อน
              </Alert>

              <CardActions sx={{ p: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={handleJoinRoom}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    borderRadius: 2,
                  }}
                >
                  เข้าร่วมห้องประชุม
                </Button>
              </CardActions>
            </CardContent>
          </Card>
        </Grid>

        {/* Features Section */}
        <Grid item xs={12}>
          <Typography variant="h4" sx={{ mb: 4, textAlign: 'center', fontWeight: 600 }}>
            คุณสมบัติหลัก
          </Typography>
          
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    borderRadius: 3,
                    height: '100%',
                    transition: 'all 0.3s',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      color: feature.color,
                      mb: 2,
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HomePage;