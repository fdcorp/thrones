import dotenv from 'dotenv';
dotenv.config();

export const PORT        = parseInt(process.env.PORT ?? '3001', 10);
export const JWT_SECRET  = process.env.JWT_SECRET ?? 'thrones_dev_secret_change_in_prod';
export const DB_PATH     = process.env.DB_PATH ?? './thrones.db';
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
