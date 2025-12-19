import { useEffect } from 'react';
import { firebaseRealtimeService } from '../services/firebaseRealtimeService';
import { useRoomStore } from '../stores/useRoomStore';

export const useFirebaseRooms = () => {
  const { setRooms } = useRoomStore();

  useEffect(() => {
    const unsubscribe = firebaseRealtimeService.subscribeToRooms((rooms) => {
      const roomSummaries = firebaseRealtimeService.convertToRoomSummaries(rooms);
      setRooms(roomSummaries);
    });

    return () => {
      unsubscribe();
    };
  }, [setRooms]);
};

export const useFirebaseRoom = (roomId: string | null) => {
  const { setCurrentRoom, updateRoom } = useRoomStore();

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = firebaseRealtimeService.subscribeToRoom(roomId, (room) => {
      if (room) {
        setCurrentRoom(room);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, setCurrentRoom, updateRoom]);
};
