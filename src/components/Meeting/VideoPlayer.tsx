import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  ScreenShare,
  Person,
  FiberManualRecord,
} from '@mui/icons-material';
import { keyframes } from '@mui/system';

interface VideoPlayerProps {
  stream: MediaStream | null;
  name: string;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isLocal?: boolean;
  size?: 'small' | 'medium' | 'large' | 'full';
}

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(25, 118, 210, 0); }
  100% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  stream,
  name,
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  isLocal = false,
  size = 'medium',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Responsive size calculation
  const getSizes = () => {
    if (isMobile) {
      return {
        small: { width: '100%', height: 150, borderRadius: '12px' },
        medium: { width: '100%', height: 180, borderRadius: '12px' },
        large: { width: '100%', height: 220, borderRadius: '16px' },
        full: { width: '100%', height: 250, borderRadius: '16px' },
      };
    }

    if (isTablet) {
      return {
        small: { width: 200, height: 150, borderRadius: '12px' },
        medium: { width: 280, height: 210, borderRadius: '16px' },
        large: { width: 360, height: 270, borderRadius: '20px' },
        full: { width: '100%', height: 300, borderRadius: '20px' },
      };
    }

    // Desktop
    return {
      small: { width: 240, height: 180, borderRadius: '12px' },
      medium: { width: 320, height: 240, borderRadius: '16px' },
      large: { width: 480, height: 360, borderRadius: '20px' },
      full: { width: '100%', height: 400, borderRadius: '24px' },
    };
  };

  const sizes = getSizes();
  const { width, height, borderRadius } = sizes[size];

  // Color based on video state
  const getStatusColor = () => {
    if (!isVideoEnabled) return theme.palette.error.main;
    if (isScreenSharing) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  // Gradient background for avatar
  const avatarGradient = () => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Get initials from name
  const getInitials = () => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <Card
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: borderRadius,
        border: isLocal ? `2px solid ${theme.palette.primary.main}` : 'none',
        boxShadow: isLocal 
          ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`
          : theme.shadows[3],
        animation: `${fadeIn} 0.5s ease-out`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: isLocal ? 'translateY(-4px)' : 'translateY(-2px)',
          boxShadow: isLocal 
            ? `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`
            : theme.shadows[6],
        },
        ...(isLocal && {
          '&::after': {
            content: '""',
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderRadius: borderRadius,
            border: `2px solid ${theme.palette.primary.main}`,
            animation: `${pulse} 2s infinite`,
            pointerEvents: 'none',
          },
        }),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video or Avatar */}
      {isVideoEnabled && stream ? (
        <Box
          component="video"
          ref={videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: isLocal ? 'scaleX(-1)' : 'none',
            backgroundColor: '#000',
            transition: 'filter 0.3s',
            filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
          }}
        />
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)'
              : 'linear-gradient(135deg, #EDF2F7 0%, #E2E8F0 100%)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: avatarGradient(),
              opacity: 0.1,
            },
          }}
        >
          <Avatar
            sx={{
              width: size === 'small' ? 60 : size === 'medium' ? 80 : 120,
              height: size === 'small' ? 60 : size === 'medium' ? 80 : 120,
              background: avatarGradient(),
              fontSize: size === 'small' ? '1.5rem' : size === 'medium' ? '2rem' : '3rem',
              fontWeight: 600,
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              zIndex: 1,
              border: `3px solid ${theme.palette.background.paper}`,
            }}
          >
            {getInitials()}
          </Avatar>
          
          {/* Animated background elements */}
          <Box
            sx={{
              position: 'absolute',
              width: '200%',
              height: '200%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
              animation: `${shimmer} 3s infinite linear`,
              opacity: 0.3,
            }}
          />
        </Box>
      )}

      {/* Status indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          zIndex: 2,
        }}
      >
        {/* Active indicator */}
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
            boxShadow: `0 0 8px ${getStatusColor()}`,
            animation: `${pulse} 2s infinite`,
          }}
        />
        
        {isLocal && (
          <Chip
            label="คุณ"
            size="small"
            color="primary"
            sx={{
              height: 22,
              fontSize: '0.65rem',
              fontWeight: 600,
              backdropFilter: 'blur(10px)',
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          />
        )}
      </Box>

      {/* Screen sharing indicator */}
      {isScreenSharing && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 2,
          }}
        >
          <Chip
            icon={<ScreenShare sx={{ fontSize: 14 }} />}
            label="กำลังแชร์หน้าจอ"
            size="small"
            color="warning"
            sx={{
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 500,
              backdropFilter: 'blur(10px)',
              backgroundColor: alpha(theme.palette.warning.main, 0.2),
              border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
            }}
          />
        </Box>
      )}

      {/* Overlay info - appears on hover or always on mobile */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          backdropFilter: 'blur(10px)',
          p: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transform: isMobile || isHovered ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 2,
        }}
      >
        {/* User info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: alpha(theme.palette.background.paper, 0.2),
              backdropFilter: 'blur(5px)',
            }}
          >
            <Person sx={{ fontSize: 18, color: 'white' }} />
          </Box>
          
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9rem',
                lineHeight: 1.2,
              }}
            >
              {name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: alpha('#fff', 0.8),
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <FiberManualRecord sx={{ fontSize: 8 }} />
              {isLocal ? 'ผู้พูด' : 'ผู้เข้าร่วม'}
            </Typography>
          </Box>
        </Box>

        {/* Status controls */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={isMuted ? "ไมโครโฟนปิด" : "ไมโครโฟนเปิด"} arrow>
            <IconButton
              size="small"
              sx={{
                color: isMuted ? theme.palette.error.main : 'white',
                backgroundColor: alpha(isMuted ? theme.palette.error.main : '#000', 0.5),
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  backgroundColor: alpha(isMuted ? theme.palette.error.main : '#000', 0.7),
                },
                width: 32,
                height: 32,
                transition: 'all 0.2s',
              }}
            >
              {isMuted ? (
                <MicOff sx={{ fontSize: 16 }} />
              ) : (
                <Mic sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title={isVideoEnabled ? "กล้องเปิด" : "กล้องปิด"} arrow>
            <IconButton
              size="small"
              sx={{
                color: isVideoEnabled ? 'white' : theme.palette.error.main,
                backgroundColor: alpha(isVideoEnabled ? '#000' : theme.palette.error.main, 0.5),
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  backgroundColor: alpha(isVideoEnabled ? '#000' : theme.palette.error.main, 0.7),
                },
                width: 32,
                height: 32,
                transition: 'all 0.2s',
              }}
            >
              {isVideoEnabled ? (
                <Videocam sx={{ fontSize: 16 }} />
              ) : (
                <VideocamOff sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Tooltip>

          {isScreenSharing && (
            <Tooltip title="กำลังแชร์หน้าจอ" arrow>
              <IconButton
                size="small"
                sx={{
                  color: theme.palette.warning.main,
                  backgroundColor: alpha(theme.palette.warning.main, 0.5),
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.warning.main, 0.7),
                  },
                  width: 32,
                  height: 32,
                  transition: 'all 0.2s',
                }}
              >
                <ScreenShare sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Glass morphism effect on corners */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 20%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 50%)`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
    </Card>
  );
};

export default VideoPlayer;