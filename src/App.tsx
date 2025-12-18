import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Header from './components/Layout/Header';

// Lazy load pages
const HomePage = React.lazy(() => import('./pages/HomePage'));
const CreateRoomPage = React.lazy(() => import('./pages/CreateRoomPage'));
const MeetingRoomPage = React.lazy(() => import('./pages/MeetingRoomPage'));

const App: React.FC = () => {
  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <Suspense
          fallback={
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
              }}
            >
              <CircularProgress />
            </Box>
          }
        >
          <Routes>
            {/* <Route path="/" element={<HomePage />} /> */}
            <Route path="/" element={<CreateRoomPage />} />
            <Route path="/join-room" element={<CreateRoomPage />} />
            <Route path="/meeting/:roomId" element={<MeetingRoomPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Box>
    </Router>
  );
};

export default App;