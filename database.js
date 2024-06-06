import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rating INT,
    overview TEXT,
    poster_url TEXT
  );
`;

const initializeDatabase = async () => {
  try {
    await pool.query(createTableQuery);
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database', err);
  } finally {
    await pool.end();
  }
};

initializeDatabase();
