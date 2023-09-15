const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database("./chuj.db")
exports.db = db;