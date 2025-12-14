import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { RoomService } from '../room/room.service';
import { UserService } from '../user/user.service';
import { AIService } from '../../services/ai.service';
import type {
  CreateRoomPayload,
  JoinRoomPayload,
  LeaveRoomPayload,
  ReadyPayload,
  AddAIPayload,
  GameStartPayload,
  SubmitRecordingPayload,
  SubmitChallengePayload,
  Note,
} from '@rhythm-game/shared';
import { GAME_CONFIG } from '@rhythm-game/shared';

interface SocketData {
  odId: string;
  nickname: string;
  roomId?: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private socketMap = new Map<string, SocketData>();

  constructor(
    private readonly gameService: GameService,
    private readonly roomService: RoomService,
    private readonly userService: UserService,
    private readonly aiService: AIService,
  ) {}

  async handleConnection(client: Socket) {
    const odId = client.handshake.auth.odId as string;
    if (!odId) {
      client.disconnect();
      return;
    }

    this.socketMap.set(client.id, { odId, nickname: '' });
    console.log(`Client connected: ${client.id} (${odId})`);

    const rooms = await this.roomService.getRoomList();
    client.emit('room:list', rooms);
  }

  async handleDisconnect(client: Socket) {
    const data = this.socketMap.get(client.id);
    if (data?.roomId) {
      await this.roomService.leaveRoom(data.roomId, data.odId);
      this.server.to(data.roomId).emit('room:playerLeft', { odId: data.odId });
    }
    this.socketMap.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('room:create')
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CreateRoomPayload,
  ) {
    const data = this.socketMap.get(client.id);
    if (!data) return;

    const user = await this.userService.getUser(data.odId);
    const nickname = user?.nickname || `Player_${data.odId.slice(0, 4)}`;

    const room = await this.roomService.createRoom(
      data.odId,
      nickname,
      payload.name,
      payload.maxPlayers,
    );

    data.roomId = room.roomId;
    data.nickname = nickname;
    client.join(room.roomId);

    client.emit('room:created', room);
    this.broadcastRoomList();
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    const data = this.socketMap.get(client.id);
    if (!data) return;

    const user = await this.userService.getUser(data.odId);
    const nickname = user?.nickname || `Player_${data.odId.slice(0, 4)}`;

    const player = await this.roomService.joinRoom(
      payload.roomId,
      data.odId,
      nickname,
    );

    if (!player) {
      client.emit('error', { code: 'JOIN_FAILED', message: '입장 실패' });
      return;
    }

    data.roomId = payload.roomId;
    data.nickname = nickname;
    client.join(payload.roomId);

    const room = await this.roomService.getRoom(payload.roomId);
    client.emit('room:updated', room);
    this.server.to(payload.roomId).emit('room:playerJoined', player);
    this.broadcastRoomList();
  }

  @SubscribeMessage('room:leave')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LeaveRoomPayload,
  ) {
    const data = this.socketMap.get(client.id);
    if (!data) return;

    await this.roomService.leaveRoom(payload.roomId, data.odId);

    client.leave(payload.roomId);
    data.roomId = undefined;

    this.server.to(payload.roomId).emit('room:playerLeft', { odId: data.odId });
    this.broadcastRoomList();
  }

  @SubscribeMessage('room:ready')
  async handleReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ReadyPayload,
  ) {
    const data = this.socketMap.get(client.id);
    if (!data) return;

    await this.roomService.setReady(payload.roomId, data.odId, payload.isReady);

    const room = await this.roomService.getRoom(payload.roomId);
    this.server.to(payload.roomId).emit('room:updated', room);
  }

  @SubscribeMessage('room:addAI')
  async handleAddAI(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AddAIPayload,
  ) {
    const data = this.socketMap.get(client.id);
    if (!data) return;

    const room = await this.roomService.getRoom(payload.roomId);
    if (!room || room.hostId !== data.odId) {
      client.emit('error', { code: 'NOT_HOST', message: '방장만 AI 추가 가능' });
      return;
    }

    if (Object.keys(room.players).length >= room.maxPlayers) {
      client.emit('error', { code: 'ROOM_FULL', message: '방이 가득 찼습니다' });
      return;
    }

    const aiPlayer = this.aiService.createAIPlayer(payload.difficulty);
    await this.roomService.addAIPlayer(payload.roomId, aiPlayer);

    const updatedRoom = await this.roomService.getRoom(payload.roomId);
    this.server.to(payload.roomId).emit('room:updated', updatedRoom);
    this.server.to(payload.roomId).emit('room:playerJoined', aiPlayer);
    this.broadcastRoomList();
  }

  @SubscribeMessage('game:start')
  async handleGameStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: GameStartPayload,
  ) {
    const data = this.socketMap.get(client.id);
    if (!data) return;

    const room = await this.roomService.getRoom(payload.roomId);
    if (!room || room.hostId !== data.odId) {
      client.emit('error', { code: 'NOT_HOST', message: '방장만 시작 가능' });
      return;
    }

    const gameState = await this.gameService.startGame(payload.roomId);
    if (!gameState) return;

    const updatedRoom = await this.roomService.getRoom(payload.roomId);
    this.server.to(payload.roomId).emit('room:updated', updatedRoom);

    this.server.to(payload.roomId).emit('game:phaseChanged', {
      phase: 'idle',
      questionerId: gameState.questionerId,
    });

    setTimeout(() => this.startRecording(payload.roomId), GAME_CONFIG.IDLE_TIME_MS);
  }

  private async startRecording(roomId: string) {
    const room = await this.roomService.getRoom(roomId);
    if (!room || !room.gameState) return;

    const questionerId = room.gameState.questionerId;
    const questioner = room.players[questionerId];

    const endTime = await this.gameService.startRecordingPhase(roomId);

    this.server.to(roomId).emit('game:phaseChanged', {
      phase: 'recording',
      endTime,
    });

    if (questioner?.isAI) {
      setTimeout(async () => {
        const aiNotes = this.aiService.generateMelody();
        await this.gameService.submitRecording(roomId, aiNotes);
        this.server.to(roomId).emit('game:questionReady', { notes: aiNotes });
      }, 1000);
    }

    setTimeout(
      () => this.startListening(roomId),
      GAME_CONFIG.RECORDING_TIME_MS,
    );
  }

  private async startListening(roomId: string) {
    const question = await this.gameService.getQuestion(roomId);
    if (!question) {
      this.startChallenge(roomId);
      return;
    }

    const endTime = await this.gameService.startListeningPhase(roomId);

    this.server.to(roomId).emit('game:phaseChanged', {
      phase: 'listening',
      endTime,
    });

    this.server.to(roomId).emit('game:playQuestion', {
      notes: question.notes,
    });

    setTimeout(
      () => this.startChallenge(roomId),
      GAME_CONFIG.LISTENING_TIME_MS,
    );
  }

  @SubscribeMessage('game:submitRecording')
  async handleSubmitRecording(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SubmitRecordingPayload,
  ) {
    const data = this.socketMap.get(client.id);
    if (!data) return;

    await this.gameService.submitRecording(payload.roomId, payload.notes);

    this.server.to(payload.roomId).emit('game:questionReady', {
      notes: payload.notes,
    });
  }

  private async startChallenge(roomId: string) {
    const room = await this.roomService.getRoom(roomId);
    if (!room || !room.gameState) return;

    const endTime = await this.gameService.startChallengePhase(roomId);

    this.server.to(roomId).emit('game:phaseChanged', {
      phase: 'challenging',
      endTime,
    });

    const question = await this.gameService.getQuestion(roomId);
    if (question) {
      const questionerId = room.gameState.questionerId;
      const aiChallengers = Object.values(room.players).filter(
        (p) => p.isAI && p.odId !== questionerId,
      );

      for (const ai of aiChallengers) {
        const delay = 2000 + Math.random() * 5000;
        setTimeout(async () => {
          const aiChallenge = this.aiService.generateLosingChallenge(question.notes);
          await this.gameService.submitChallenge(roomId, ai.odId, aiChallenge);
        }, delay);
      }
    }

    setTimeout(() => this.judgeRound(roomId), GAME_CONFIG.CHALLENGE_TIME_MS);
  }

  @SubscribeMessage('game:submitChallenge')
  async handleSubmitChallenge(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SubmitChallengePayload,
  ) {
    const data = this.socketMap.get(client.id);
    if (!data) return;

    await this.gameService.submitChallenge(
      payload.roomId,
      data.odId,
      payload.notes,
    );
  }

  private async judgeRound(roomId: string) {
    const result = await this.gameService.judgeRound(roomId);
    if (!result) return;

    await this.gameService.showResult(roomId);

    this.server.to(roomId).emit('game:phaseChanged', { phase: 'result' });
    this.server.to(roomId).emit('game:roundResult', result);

    const room = await this.roomService.getRoom(roomId);
    this.server.to(roomId).emit('room:updated', room);

    setTimeout(() => this.nextRoundOrEnd(roomId), GAME_CONFIG.RESULT_TIME_MS);
  }

  private async nextRoundOrEnd(roomId: string) {
    const hasNext = await this.gameService.nextRound(roomId);

    if (hasNext) {
      const room = await this.roomService.getRoom(roomId);
      if (room?.gameState) {
        this.server.to(roomId).emit('game:phaseChanged', {
          phase: 'idle',
          questionerId: room.gameState.questionerId,
        });

        setTimeout(
          () => this.startRecording(roomId),
          GAME_CONFIG.IDLE_TIME_MS,
        );
      }
    } else {
      const finalResult = await this.gameService.endGame(roomId);
      if (finalResult) {
        this.server.to(roomId).emit('game:finalResult', finalResult);
      }
      this.broadcastRoomList();
    }
  }

  private async broadcastRoomList() {
    const rooms = await this.roomService.getRoomList();
    this.server.emit('room:list', rooms);
  }
}
