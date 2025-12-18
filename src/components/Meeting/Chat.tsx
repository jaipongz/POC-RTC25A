// src/components/Meeting/Chat.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Avatar,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Divider,
} from '@mui/material';
import { Send, Person } from '@mui/icons-material';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
}

interface ChatProps {
  messages?: Message[];
  onSendMessage?: (text: string) => void;
  currentUser?: string;
}

const Chat: React.FC<ChatProps> = ({ 
  messages = [], 
  onSendMessage, 
  currentUser = 'You' 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && onSendMessage) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Chat header */}
      <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          แชท ({messages.length})
        </Typography>
      </Box>

      {/* Messages area */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
            }}
          >
            <Person sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body2">
              เริ่มต้นการสนทนา
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%' }}>
            {messages.map((message) => (
              <React.Fragment key={message.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    flexDirection: message.isOwn ? 'row-reverse' : 'row',
                    px: 0,
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: '0.875rem',
                        bgcolor: message.isOwn ? 'primary.main' : 'secondary.main',
                      }}
                    >
                      {message.sender.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: message.isOwn ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          {message.sender} • {formatTime(message.timestamp)}
                        </Typography>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: message.isOwn
                              ? 'primary.light'
                              : 'grey.100',
                            color: message.isOwn ? 'white' : 'text.primary',
                            maxWidth: '70%',
                          }}
                        >
                          <Typography variant="body2">
                            {message.text}
                          </Typography>
                        </Paper>
                      </Box>
                    }
                    sx={{
                      textAlign: message.isOwn ? 'right' : 'left',
                      mr: message.isOwn ? 1 : 0,
                      ml: message.isOwn ? 0 : 1,
                    }}
                  />
                </ListItem>
                <Divider variant="inset" component="li" sx={{ mx: 0 }} />
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      {/* Message input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="พิมพ์ข้อความ..."
            variant="outlined"
            size="small"
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            sx={{ alignSelf: 'flex-end' }}
          >
            <Send />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          กด Enter เพื่อส่ง • Shift+Enter เพื่อขึ้นบรรทัดใหม่
        </Typography>
      </Box>
    </Box>
  );
};

export default Chat;