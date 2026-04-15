// Uses Node.js built-in SQLite (node:sqlite) — available in Node 22.5+ / Node 24
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { DB_PATH } from '../config';

let db: DatabaseSync;

export function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');

    // Create tables
    const schema = fs.readFileSync(path.join(process.cwd(), 'src', 'db', 'schema.sql'), 'utf-8');
    db.exec(schema);

    // Migrations — add new columns to existing DBs without breaking them
    runMigration(db, 'users',  'country',                    'ALTER TABLE users ADD COLUMN country TEXT');
    runMigration(db, 'users',  'last_login',                 'ALTER TABLE users ADD COLUMN last_login DATETIME');
    runMigration(db, 'games',  'game_mode',                  "ALTER TABLE games ADD COLUMN game_mode TEXT DEFAULT 'online_casual'");

    // Ranked system (Glicko-2) — added in ranked system update
    runMigration(db, 'users',  'hidden_mmr',                 'ALTER TABLE users ADD COLUMN hidden_mmr REAL NOT NULL DEFAULT 1500');
    runMigration(db, 'users',  'rating_deviation',           'ALTER TABLE users ADD COLUMN rating_deviation REAL NOT NULL DEFAULT 350');
    runMigration(db, 'users',  'volatility',                 'ALTER TABLE users ADD COLUMN volatility REAL NOT NULL DEFAULT 0.06');
    runMigration(db, 'users',  'visible_tier',               "ALTER TABLE users ADD COLUMN visible_tier TEXT NOT NULL DEFAULT 'PEASANT'");
    runMigration(db, 'users',  'visible_division',           'ALTER TABLE users ADD COLUMN visible_division TEXT');
    runMigration(db, 'users',  'league_points',              'ALTER TABLE users ADD COLUMN league_points INTEGER NOT NULL DEFAULT 0');
    runMigration(db, 'users',  'season_number',              'ALTER TABLE users ADD COLUMN season_number INTEGER NOT NULL DEFAULT 1');
    runMigration(db, 'users',  'provisional_games_left',     'ALTER TABLE users ADD COLUMN provisional_games_left INTEGER NOT NULL DEFAULT 10');
    runMigration(db, 'users',  'total_ranked_games_played',  'ALTER TABLE users ADD COLUMN total_ranked_games_played INTEGER NOT NULL DEFAULT 0');
    runMigration(db, 'users',  'in_promotion_series',        'ALTER TABLE users ADD COLUMN in_promotion_series INTEGER NOT NULL DEFAULT 0');
    runMigration(db, 'users',  'promotion_wins',             'ALTER TABLE users ADD COLUMN promotion_wins INTEGER NOT NULL DEFAULT 0');
    runMigration(db, 'users',  'promotion_losses',           'ALTER TABLE users ADD COLUMN promotion_losses INTEGER NOT NULL DEFAULT 0');
    runMigration(db, 'games',  'mmr_change_p1',              'ALTER TABLE games ADD COLUMN mmr_change_p1 REAL');
    runMigration(db, 'games',  'mmr_change_p2',              'ALTER TABLE games ADD COLUMN mmr_change_p2 REAL');
    runMigration(db, 'games',  'lp_change_p1',               'ALTER TABLE games ADD COLUMN lp_change_p1 INTEGER');
    runMigration(db, 'games',  'lp_change_p2',               'ALTER TABLE games ADD COLUMN lp_change_p2 INTEGER');
  }
  return db;
}

function runMigration(db: DatabaseSync, table: string, column: string, sql: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some(c => c.name === column)) {
    db.exec(sql);
  }
}
