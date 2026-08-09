import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import initSqlJs, { Database as SqlJsDatabase, SqlValue } from 'sql.js';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db!: SqlJsDatabase;
  private dbPath: string;

  constructor() {
    this.dbPath = process.env.DB_PATH || './data/crawler.db';
  }

  async onModuleInit() {
    const SQL = await initSqlJs();
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }

    this.run('PRAGMA journal_mode=WAL;');
    this.run('PRAGMA foreign_keys=ON;');
    this.initializeSchema();
    this.save();
  }

  onModuleDestroy() {
    this.save();
    if (this.db) {
      this.db.close();
    }
  }

  private initializeSchema() {
    this.run(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        url TEXT UNIQUE,
        last_crawled_at TEXT
      )
    `);

    this.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        fb_post_id TEXT,
        author_name TEXT,
        content TEXT,
        comment_inner_text TEXT,
        post_text TEXT,
        post_url TEXT,
        crawled_at TEXT
      )
    `);

    this.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        fb_comment_id TEXT UNIQUE,
        author_name TEXT,
        comment_text TEXT,
        created_at TEXT
      )
    `);

    this.run(`
      CREATE TABLE IF NOT EXISTS analysis_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        analysis_text TEXT,
        created_at TEXT
      )
    `);

    // Add content/comment_inner_text columns if not exists (for existing databases)
    try {
      this.run('ALTER TABLE posts ADD COLUMN content TEXT');
    } catch {
      // Column already exists
    }
    try {
      this.run('ALTER TABLE posts ADD COLUMN comment_inner_text TEXT');
    } catch {
      // Column already exists
    }
  }

  /**
   * Execute a query that returns rows (SELECT).
   */
  query(sql: string, params?: Record<string, SqlValue>): Record<string, unknown>[] {
    const stmt = this.db.prepare(sql);
    if (params) {
      stmt.bind(params);
    }
    const rows: Record<string, unknown>[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  /**
   * Execute a single row query (SELECT).
   */
  queryOne(sql: string, params?: Record<string, SqlValue>): Record<string, unknown> | null {
    const rows = this.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Execute a write statement (INSERT, UPDATE, DELETE).
   * Returns info about the executed statement.
   */
  run(sql: string, params?: Record<string, SqlValue>): { changes: number; lastInsertRowid: number } {
    if (params) {
      this.db.run(sql, params);
    } else {
      this.db.run(sql);
    }
    return {
      changes: this.db.getRowsModified(),
      lastInsertRowid: (this.db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0] as number) ?? 0,
    };
  }

  /**
   * Save (persist) the database to disk.
   */
  save() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }
}
