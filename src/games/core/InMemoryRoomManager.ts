/**
 * Generic in-memory room manager for room-based group games.
 *
 * Provides create/get/end/iterate with per-chat room limits.
 * Dead rooms (active=false) are pruned automatically on create and
 * periodically via compactChat to prevent unbounded memory growth.
 */

/** Minimum shape a room object must satisfy. */
export interface BaseRoom {
  chatId: number;
  roomId: number;
  active: boolean;
  createdAt?: number;
  recruitmentMessageId?: number;
  username?: string;
  state: {
    phase: string;
    players: { userId: number; name: string; username?: string }[];
  };
}

/** Maximum dead rooms to keep per chat before compaction triggers. */
const DEAD_ROOM_THRESHOLD = 10;

export class InMemoryRoomManager<TRoom extends BaseRoom> {
  private readonly roomsByChat = new Map<number, TRoom[]>();

  constructor(
    private readonly maxRoomsPerChat: number,
    private readonly createRoomState: (chatId: number, roomId: number) => TRoom,
  ) {}

  /** Remove inactive rooms from the list to free memory. */
  private compactChat(chatId: number): void {
    const list = this.roomsByChat.get(chatId);
    if (!list) return;
    const alive = list.filter((r) => r.active);
    if (alive.length === 0) {
      this.roomsByChat.delete(chatId);
    } else {
      this.roomsByChat.set(chatId, alive);
    }
  }

  getActiveRooms(chatId: number): TRoom[] {
    return (this.roomsByChat.get(chatId) || []).filter((room) => room.active);
  }

  getRoom(chatId: number, roomId: number): TRoom | undefined {
    return (this.roomsByChat.get(chatId) || []).find((room) => room.roomId === roomId && room.active);
  }

  createRoom(chatId: number): TRoom | null {
    // Compact dead rooms before checking capacity
    const list = this.roomsByChat.get(chatId) || [];
    const deadCount = list.filter((r) => !r.active).length;
    if (deadCount >= DEAD_ROOM_THRESHOLD) {
      this.compactChat(chatId);
    }

    const activeRooms = this.getActiveRooms(chatId);
    if (activeRooms.length >= this.maxRoomsPerChat) return null;

    const usedIds = new Set(activeRooms.map((room) => room.roomId));
    let nextId = 1;
    while (usedIds.has(nextId) && nextId <= this.maxRoomsPerChat) nextId += 1;
    if (nextId > this.maxRoomsPerChat) return null;

    const room = this.createRoomState(chatId, nextId);
    const current = this.roomsByChat.get(chatId) || [];
    this.roomsByChat.set(chatId, [...current, room]);
    return room;
  }

  endRoom(room: TRoom): void {
    room.active = false;
  }

  entries(): IterableIterator<[number, TRoom[]]> {
    return this.roomsByChat.entries();
  }
}
