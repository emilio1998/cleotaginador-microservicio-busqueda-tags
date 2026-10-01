import { createPool } from 'mysql2/promise';
const env = process.env;

export const pool = createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE
});