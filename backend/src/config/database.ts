import { Pool, types } from 'pg';
import dotenv from 'dotenv';
import * as dns from 'dns';

dotenv.config();

// Override pg type parsers so DATE and TIMESTAMP columns return plain strings
// instead of JS Date objects. This prevents timezone-shift bugs where
// "2026-03-16 00:00:00" becomes "2026-03-15T18:30:00.000Z" in IST.
types.setTypeParser(1082, (val: string) => val);   // DATE → "2026-03-16"
types.setTypeParser(1114, (val: string) => val);   // TIMESTAMP WITHOUT TIME ZONE
types.setTypeParser(1184, (val: string) => val);   // TIMESTAMP WITH TIME ZONE

// Force Node.js to prefer IPv6 addresses
dns.setDefaultResultOrder('ipv6first');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text: string, params?: unknown[]) => pool.query(text, params);

export const getClient = () => pool.connect();

export default pool;