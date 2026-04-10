import { query } from '../client';
import { RoomPlayerRow } from '../types';

export const playersRepository = {
  async create(data: any): Promise<RoomPlayerRow> {
    const fields = Object.keys(data);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
    const text = `
      INSERT INTO room_players (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    const res = await query<RoomPlayerRow>(text, Object.values(data));
    return res.rows[0];
  },

  async findByRoom(roomId: string): Promise<RoomPlayerRow[]> {
    const text = `
      SELECT rp.*, u.display_name, u.avatar_url
      FROM room_players rp
      JOIN users u ON u.google_id = rp.user_id
      WHERE rp.room_id = $1
    `;
    const res = await query<RoomPlayerRow>(text, [roomId]);
    return res.rows;
  },

  async findByRoomAndUser(roomId: string, userId: string): Promise<RoomPlayerRow | null> {
    const text = `
      SELECT rp.*, u.display_name, u.avatar_url
      FROM room_players rp
      JOIN users u ON u.google_id = rp.user_id
      WHERE rp.room_id = $1 AND rp.user_id = $2
    `;
    const res = await query<RoomPlayerRow>(text, [roomId, userId]);
    return res.rows[0] || null;
  },

  async updateAction(id: string, action: string, isReady: boolean): Promise<RoomPlayerRow | null> {
    const text = `
      UPDATE room_players
      SET current_action = $2, is_ready = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const res = await query<RoomPlayerRow>(text, [id, action, isReady]);
    return res.rows[0] || null;
  },

  async updateState(id: string, updates: any): Promise<RoomPlayerRow | null> {
    const fields = Object.keys(updates);
    if (fields.length === 0) return null;
    
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const text = `
      UPDATE room_players
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const res = await query<RoomPlayerRow>(text, [id, ...Object.values(updates)]);
    return res.rows[0] || null;
  }
};
