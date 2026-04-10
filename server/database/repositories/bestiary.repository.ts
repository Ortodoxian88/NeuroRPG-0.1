import { query } from '../client';
import { BestiaryRow } from '../types';

export const bestiaryRepository = {
  async create(data: any): Promise<BestiaryRow> {
    const fields = Object.keys(data);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
    const text = `
      INSERT INTO bestiary (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    const res = await query<BestiaryRow>(text, Object.values(data));
    return res.rows[0];
  },

  async search(searchTerm: string, category?: string): Promise<BestiaryRow[]> {
    let text = `
      SELECT * FROM bestiary
      WHERE (title ILIKE $1 OR content ILIKE $1)
    `;
    const values: any[] = [`%${searchTerm}%`];
    
    if (category) {
      text += ` AND category = $2`;
      values.push(category);
    }
    
    text += ` ORDER BY title ASC LIMIT 50`;
    
    const res = await query<BestiaryRow>(text, values);
    return res.rows;
  }
};
