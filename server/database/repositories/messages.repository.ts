import { query } from '../client';
import { MessageRow } from '../types';

export const messagesRepository = {
  async create(data: {
    room_id: string;
    user_id: string | null;
    type: string;
    content: string;
    turn_number: number;
    metadata: any;
  }): Promise<MessageRow> {
    const text = `
      INSERT INTO messages (room_id, user_id, type, content, turn_number, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [data.room_id, data.user_id, data.type, data.content, data.turn_number, data.metadata];
    const res = await query<MessageRow>(text, values);
    return res.rows[0];
  },

  async findByRoom(roomId: string, limit: number = 50, offset: number = 0): Promise<MessageRow[]> {
    const text = `
      SELECT m.*, u.display_name as user_display_name, u.avatar_url as user_avatar_url
      FROM messages m
      LEFT JOIN users u ON u.google_id = m.user_id
      WHERE m.room_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const res = await query<MessageRow>(text, [roomId, limit, offset]);
    return res.rows.reverse();
  }
};
