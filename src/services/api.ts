import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BASE_API || 'http://localhost:5048/api/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const meetingApi = {
  // สร้างห้องใหม่
  createRoom: async (roomName: string, userName: string) => {
    const response = await api.post('/meeting/create-room', {
      roomName,
      userName,
    });
    return response.data;
  },

  // Join ห้อง
  joinRoom: async (roomId: string, userName: string) => {
    const response = await api.post('/meeting/join-room', {
      roomId,
      userName,
    });
    return response.data;
  },

  // ดึงข้อมูลห้องทั้งหมด
  getAllRooms: async () => {
    const response = await api.get('/meeting/rooms');
    return response.data;
  },

  // ดึง configuration
  getConfig: async () => {
    const response = await api.get('/meeting/config');
    return response.data;
  },
};

export default api;