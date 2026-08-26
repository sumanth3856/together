import { create } from 'zustand';

export const useRoomStore = create((set) => ({
  roomState: null,
  setRoomState: (state) => set({ roomState: state }),
  
  socketId: null,
  setSocketId: (id) => set({ socketId: id }),
  
  isConnected: false,
  setIsConnected: (status) => set({ isConnected: status }),
  
  isReconnecting: false,
  setIsReconnecting: (status) => set({ isReconnecting: status }),
  
  sessionEnded: false,
  setSessionEnded: (status) => set({ sessionEnded: status }),
  
  syncedPlaybackEvent: null,
  setSyncedPlaybackEvent: (event) => set({ syncedPlaybackEvent: event }),

  updateChatHistory: (message) => set((state) => {
    if (!state.roomState) return state;
    const history = Array.isArray(state.roomState.chatHistory) ? state.roomState.chatHistory : [];
    const alreadyExists = history.some(m => m?.id === message?.id);
    if (alreadyExists) return state;
    
    const newHistory = [...history, message];
    if (newHistory.length > 100) {
      newHistory.shift();
    }
    
    return {
      roomState: {
        ...state.roomState,
        chatHistory: newHistory
      }
    };
  })
}));
