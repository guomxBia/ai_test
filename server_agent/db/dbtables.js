// dbtables.js
import Database from "better-sqlite3";

const db = new Database("gis.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS wells (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  );
`);

const rowCount = db.prepare("SELECT COUNT(*) as count FROM wells").get().count;
if (rowCount === 0) {
  const insert = db.prepare(
    "INSERT INTO wells (name, latitude, longitude) VALUES (?, ?, ?)"
  );
  const wells = [
    ["Well-1", 39.7392, -104.9903],
    ["Well-2", 39.7618, -105.0200],
    ["Well-3", 39.7270, -104.9500],
    ["Well-4", 39.7000, -105.0000],
    ["Well-5", 39.7800, -104.9800],
  ];
  const insertMany = db.transaction((rows) => {
    for (const [name, lat, lng] of rows) {
      insert.run(name, lat, lng);
    }
  });
  insertMany(wells);
}

export function getWells() {
  return db.prepare("SELECT id, name, latitude, longitude FROM wells").all();
}

export default db;