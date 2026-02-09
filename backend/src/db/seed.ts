import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  const client = await pool.connect();

  try {
    console.log('Starting database seeding...');

    const seedFile = path.join(__dirname, 'seeds', 'seed.sql');
    const sql = fs.readFileSync(seedFile, 'utf-8');

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('Database seeded successfully!');
    console.log('\n========================================');
    console.log('Sample Credentials:');
    console.log('========================================');
    console.log('\nADMIN DASHBOARD:');
    console.log('  Email: admin@conference.com');
    console.log('  Password: password123');
    console.log('\nATTENDEE PWA:');
    console.log('  Email: john.doe@company.com');
    console.log('  Password: password123');
    console.log('\nOther attendees (same password):');
    console.log('  - jane.smith@company.com (Backend team)');
    console.log('  - bob.wilson@company.com (DevOps team)');
    console.log('  - sarah.jones@company.com (Marketing)');
    console.log('  - mike.brown@company.com (Content team)');
    console.log('  - lisa.white@company.com (Sales)');
    console.log('  - emma.davis@company.com (HR)');
    console.log('========================================\n');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
