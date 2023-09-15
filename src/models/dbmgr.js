const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database("./goals.db")
exports.db = db;