import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Button,
  Chip,
  Typography,
  alpha,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  ScreenShare,
  StopScreenShare,
  CallEnd,
  FiberManualRecord,
  Stop,
  Settings,
  VolumeUp,
  VolumeOff,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';

interface ControlsProps {
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  isAudioOn: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onToggleAudio: () => void;
  onLeaveRoom: () => void;
  onSettingsClick: () => void;
}

type ControlColor = 'primary' | 'error' | 'warning' | 'default';

interface ControlItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  color: ControlColor;
  action: () => void;
  active: boolean;
  showAlways: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  isRecording,
  isAudioOn,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleRecording,
  onToggleAudio,
  onLeaveRoom,
  onSettingsClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [expanded, setExpanded] = React.useState(false);

  // Helper function to get color from theme palette
  const getColorFromTheme = (color: ControlColor) => {
    switch (color) {
      case 'primary':
        return theme.palette.primary.main;
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'default':
      default:
        return theme.palette.grey[500];
    }
  };

  const mainControls: ControlItem[] = [
    {
      id: 'mute',
      icon: isMuted ? <MicOff /> : <Mic />,
      label: isMuted ? 'ไมค์ปิด' : 'ไมค์เปิด',
      sublabel: 'ไมค์',
      color: isMuted ? 'error' : 'primary',
      action: onToggleMute,
      active: !isMuted,
      showAlways: true,
    },
    {
      id: 'video',
      icon: isVideoEnabled ? <Videocam /> : <VideocamOff />,
      label: isVideoEnabled ? 'กล้องเปิด' : 'กล้องปิด',
      sublabel: 'กล้อง',
      color: isVideoEnabled ? 'primary' : 'error',
      action: onToggleVideo,
      active: isVideoEnabled,
      showAlways: true,
    },
    {
      id: 'screen',
      icon: isScreenSharing ? <StopScreenShare /> : <ScreenShare />,
      label: isScreenSharing ? 'หยุดแชร์' : 'แชร์หน้าจอ',
      sublabel: 'แชร์หน้าจอ',
      color: isScreenSharing ? 'warning' : 'default',
      action: onToggleScreenShare,
      active: isScreenSharing,
      showAlways: false,
    },
    {
      id: 'record',
      icon: isRecording ? <Stop /> : <FiberManualRecord />,
      label: isRecording ? 'หยุดบันทึก' : 'บันทึก',
      sublabel: 'บันทึก',
      color: isRecording ? 'error' : 'default',
      action: onToggleRecording,
      active: isRecording,
      showAlways: false,
    },
    {
      id: 'audio',
      icon: isAudioOn ? <VolumeUp /> : <VolumeOff />,
      label: isAudioOn ? 'ลำโพงเปิด' : 'ลำโพงปิด',
      sublabel: 'ลำโพง',
      color: isAudioOn ? 'primary' : 'error',
      action: onToggleAudio,
      active: isAudioOn,
      showAlways: false,
    },
    {
      id: 'settings',
      icon: <Settings />,
      label: 'ตั้งค่า',
      sublabel: 'ตั้งค่า',
      color: 'default',
      action: onSettingsClick,
      active: false,
      showAlways: true,
    },
  ];

  const primaryControls = mainControls.filter(control => control.showAlways);
  const secondaryControls = mainControls.filter(control => !control.showAlways);

  const ControlButton = ({ control }: { control: ControlItem }) => {
    const colorValue = getColorFromTheme(control.color);
    
    return (
      <Tooltip title={control.label} arrow placement="top">
        <IconButton
          onClick={control.action}
          sx={{
            position: 'relative',
            width: isMobile ? 48 : 56,
            height: isMobile ? 48 : 56,
            borderRadius: '50%',
            backgroundColor: control.active 
              ? alpha(colorValue, 0.15)
              : alpha(theme.palette.grey[500], 0.08),
            border: `2px solid ${
              control.active 
                ? alpha(colorValue, 0.3)
                : 'transparent'
            }`,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: control.active 
                ? alpha(colorValue, 0.25)
                : alpha(theme.palette.grey[500], 0.15),
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 20px ${alpha(
                control.active ? colorValue : theme.palette.grey[500], 
                0.2
              )}`,
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          }}
        >
          <Box
            sx={{
              color: control.active 
                ? colorValue
                : theme.palette.text.secondary,
              transition: 'color 0.3s',
            }}
          >
            {control.icon}
          </Box>
          
          {/* Active indicator */}
          {control.active && (
            <Box
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: colorValue,
                boxShadow: `0 0 8px ${colorValue}`,
              }}
            />
          )}
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        p: isMobile ? 2 : 3,
        backgroundColor: alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: `0 -4px 30px ${alpha(theme.palette.common.black, 0.1)}`,
      }}
    >
      {/* Recording Status */}
      {isRecording && (
        <Fade in={isRecording}>
          <Chip
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FiberManualRecord sx={{ 
                  fontSize: 12, 
                  color: theme.palette.error.main,
                  animation: 'pulse 1s infinite'
                }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  กำลังบันทึกวิดีโอ...
                </Typography>
              </Box>
            }
            size="small"
            sx={{
              position: 'absolute',
              top: -28,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: alpha(theme.palette.error.main, 0.1),
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              backdropFilter: 'blur(10px)',
              fontWeight: 500,
            }}
          />
        </Fade>
      )}

      {/* Main Controls Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 2 : 3,
          width: '100%',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Left Side - Primary Controls */}
        <Box sx={{ display: 'flex', gap: isMobile ? 2 : 3 }}>
          {primaryControls.map(control => (
            <Box key={control.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ControlButton control={control} />
              {!isMobile && (
                <Typography
                  variant="caption"
                  sx={{
                    mt: 0.5,
                    fontSize: '0.7rem',
                    color: control.active 
                      ? getColorFromTheme(control.color)
                      : theme.palette.text.secondary,
                    fontWeight: 500,
                    transition: 'color 0.3s',
                  }}
                >
                  {control.sublabel}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {/* Center - Leave Button */}
        <Tooltip title="ออกจากห้องประชุม" arrow placement="top">
          <Button
            variant="contained"
            color="error"
            onClick={onLeaveRoom}
            startIcon={<CallEnd />}
            sx={{
              minWidth: isMobile ? 140 : 160,
              height: isMobile ? 48 : 56,
              borderRadius: 28,
              fontWeight: 600,
              fontSize: isMobile ? '0.9rem' : '1rem',
              textTransform: 'none',
              boxShadow: `0 4px 20px ${alpha(theme.palette.error.main, 0.3)}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: theme.palette.error.dark,
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 25px ${alpha(theme.palette.error.main, 0.4)}`,
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            }}
          >
            {isMobile ? 'ออก' : 'ออกจากห้อง'}
          </Button>
        </Tooltip>

        {/* Right Side - Secondary Controls */}
        <Box sx={{ display: 'flex', gap: isMobile ? 2 : 3 }}>
          {/* Expand/Collapse Button for Mobile */}
          {isMobile && secondaryControls.length > 0 && (
            <Tooltip title={expanded ? 'ซ่อนควบคุม' : 'แสดงควบคุมเพิ่ม'} arrow>
              <IconButton
                onClick={() => setExpanded(!expanded)}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
          )}

          {/* Secondary Controls (always visible on desktop, conditional on mobile) */}
          {(isMobile ? expanded : true) && secondaryControls.map(control => (
            <Box key={control.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ControlButton control={control} />
              {!isMobile && (
                <Typography
                  variant="caption"
                  sx={{
                    mt: 0.5,
                    fontSize: '0.7rem',
                    color: control.active 
                      ? getColorFromTheme(control.color)
                      : theme.palette.text.secondary,
                    fontWeight: 500,
                  }}
                >
                  {control.sublabel}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Mobile Labels Row */}
      {isMobile && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 3,
          width: '100%',
          overflowX: 'auto',
          py: 1,
        }}>
          {[...primaryControls, ...(expanded ? secondaryControls : [])].map(control => (
            <Typography
              key={control.id}
              variant="caption"
              sx={{
                fontSize: '0.65rem',
                color: control.active 
                  ? getColorFromTheme(control.color)
                  : theme.palette.text.secondary,
                fontWeight: 500,
                minWidth: 40,
                textAlign: 'center',
              }}
            >
              {control.sublabel}
            </Typography>
          ))}
        </Box>
      )}

      {/* Background Decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette.primary.main, 0.02)} 0%, 
            ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
      
      {/* Add pulse animation for recording */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </Box>
  );
};

export default Controls;