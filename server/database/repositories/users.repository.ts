import { query } from '../client';
import { UserRow } from '../types';

export const usersRepository = {
  async upsertByGoogleId(data: { googleId: string; email: string; displayName: string; avatarUrl: string | null }): Promise<UserRow> {
    const text = `
      INSERT INTO users (google_id, email, display_name, avatar_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (google_id) DO UPDATE
      SET email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          avatar_url = EXCLUDED.avatar_url,
          last_seen_at = NOW()
      RETURNING *
    `;
    const values = [data.googleId, data.email, data.displayName, data.avatarUrl];
    const res = await query<UserRow>(text, values);
    return res.rows[0];
  }
};
