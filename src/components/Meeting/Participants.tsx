// components/Meeting/Participants.tsx
import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
} from '@mui/icons-material';

interface Participant {
  id: string;
  name: string;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isYou?: boolean;
}

interface ParticipantsProps {
  participants: Participant[];
}

const Participants: React.FC<ParticipantsProps> = ({ participants }) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        ผู้เข้าร่วม ({participants.length})
      </Typography>
      
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {participants.map((participant) => (
          <ListItem
            key={participant.id}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              py: 1.5,
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                {participant.name?.charAt(0) || '?'}
              </Avatar>
            </ListItemIcon>
            
            <ListItemText
              primary={
                <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography 
                    component="span" 
                    variant="body1" 
                    sx={{ fontWeight: 600 }}
                  >
                    {participant.name}
                  </Typography>
                  {participant.isYou && (
                    <Chip 
                      label="คุณ" 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.75rem' }}
                    />
                  )}
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Chip 
                    icon={participant.isMuted ? <MicOff /> : <Mic />}
                    label={participant.isMuted ? "ปิดเสียง" : "เปิดเสียง"} 
                    size="small" 
                    variant="outlined"
                    color={participant.isMuted ? "error" : "success"}
                    sx={{ height: 24 }}
                  />
                  <Chip 
                    icon={participant.isVideoEnabled ? <Videocam /> : <VideocamOff />}
                    label={participant.isVideoEnabled ? "เปิดกล้อง" : "ปิดกล้อง"} 
                    size="small" 
                    variant="outlined"
                    color={participant.isVideoEnabled ? "success" : "error"}
                    sx={{ height: 24 }}
                  />
                </Box>
              }
              sx={{ m: 0 }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Participants;