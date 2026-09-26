import pg from 'pg';
import { config } from '../config.js';

export const pool = new pg.Pool({ connectionString: config.db });

export async function probarConexion() {
  const { rows } = await pool.query('select now() as ahora');
  console.log('Postgres conectado:', rows[0].ahora);
}