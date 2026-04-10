import { query } from '../client';
import { RoomRow } from '../types';

function generateJoinCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const roomsRepository = {
  async createRoom(hostUserId: string, data: { scenario: string }): Promise<RoomRow> {
    const joinCode = generateJoinCode();
    const text = `
      INSERT INTO rooms (host_user_id, scenario, join_code, status, turn_number, turn_status)
      VALUES ($1, $2, $3, 'lobby', 0, 'waiting')
      RETURNING *
    `;
    const values = [hostUserId, data.scenario, joinCode];
    const res = await query<RoomRow>(text, values);
    return res.rows[0];
  },

  async findById(id: string): Promise<RoomRow | null> {
    const text = 'SELECT * FROM rooms WHERE id = $1';
    const res = await query<RoomRow>(text, [id]);
    return res.rows[0] || null;
  },

  async findByJoinCode(joinCode: string): Promise<RoomRow | null> {
    const text = 'SELECT * FROM rooms WHERE join_code = $1';
    const res = await query<RoomRow>(text, [joinCode]);
    return res.rows[0] || null;
  },

  async updateStatus(id: string, status: string): Promise<void> {
    const text = 'UPDATE rooms SET status = $2, updated_at = NOW() WHERE id = $1';
    await query(text, [id, status]);
  },

  async updateTurn(id: string, turnNumber: number, turnStatus: string, turnResolution: string): Promise<void> {
    const text = 'UPDATE rooms SET turn_number = $2, turn_status = $3, turn_resolution = $4, updated_at = NOW() WHERE id = $1';
    await query(text, [id, turnNumber, turnStatus, turnResolution]);
  }
};
