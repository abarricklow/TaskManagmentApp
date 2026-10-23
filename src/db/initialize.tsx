import { type SQLiteDatabase } from 'expo-sqlite';

export async function initializeDatabase(db: SQLiteDatabase) {
  try {
    // 1. Enable Write-Ahead Logging for better performance
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // 2. Initialize your database tables
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS Category (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    INSERT OR IGNORE INTO Category (name)
    VALUES ('Personal'), ('Work'), ('School'), ('Other');

    CREATE TABLE IF NOT EXISTS Tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER,
      due_date TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (category_id)
        REFERENCES Category(id)
        ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS Plants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_name TEXT NOT NULL,
      description TEXT,
      percent_grown REAL NOT NULL DEFAULT 0
        CHECK (percent_grown >= 0 AND percent_grown <= 100)
    );
    `);

    const taskColumns = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(Tasks)'
    );
    if (!taskColumns.some((column) => column.name === 'completed')) {
        await db.execAsync(
          'ALTER TABLE Tasks ADD COLUMN completed INTEGER NOT NULL DEFAULT 0'
        );
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}
