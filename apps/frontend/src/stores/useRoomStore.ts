import { create } from 'zustand';
import type { Room, RoomSummary, Player } from '@rhythm-game/shared';

interface RoomState {
  rooms: RoomSummary[];
  currentRoom: Room | null;
  setRooms: (rooms: RoomSummary[]) => void;
  setCurrentRoom: (room: Room | null) => void;
  updateRoom: (room: Room) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (odId: string) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  currentRoom: null,
  setRooms: (rooms) => set({ rooms }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  updateRoom: (room) => set({ currentRoom: room }),
  addPlayer: (player) =>
    set((state) => {
      if (!state.currentRoom) return state;
      return {
        currentRoom: {
          ...state.currentRoom,
          players: {
            ...state.currentRoom.players,
            [player.odId]: player,
          },
        },
      };
    }),
  removePlayer: (odId) =>
    set((state) => {
      if (!state.currentRoom) return state;
      const { [odId]: _, ...remainingPlayers } = state.currentRoom.players;
      return {
        currentRoom: {
          ...state.currentRoom,
          players: remainingPlayers,
        },
      };
    }),
}));
