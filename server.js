const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const dbPath = path.join(__dirname, "data", "database.db");
const db = new sqlite3.Database(dbPath);

// ساخت جدول در صورت عدم وجود
db.run(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT,
    service TEXT,
    weekday TEXT,
    hour TEXT,
    status TEXT DEFAULT 'active'
  )
`);

app.post("/api/book", (req, res) => {
  const { name, phone, service, weekday, hour } = req.body;
  const query = `INSERT INTO bookings (name, phone, service, weekday, hour) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [name, phone, service, weekday, hour], function (err) {
    if (err) return res.status(500).send({ error: err.message });
    res.send({ id: this.lastID });
  });
});

app.get("/api/bookings", (req, res) => {
  db.all(`SELECT * FROM bookings WHERE status = 'active' ORDER BY weekday, hour`, [], (err, rows) => {
    if (err) return res.status(500).send({ error: err.message });
    res.send(rows);
  });
});

app.post("/api/archive/:id", (req, res) => {
  const id = req.params.id;
  db.run(`UPDATE bookings SET status = 'archived' WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).send({ error: err.message });
    res.send({ success: true });
  });
});

app.get("/api/archive", (req, res) => {
  db.all(`SELECT * FROM bookings WHERE status = 'archived' ORDER BY weekday, hour`, [], (err, rows) => {
    if (err) return res.status(500).send({ error: err.message });
    res.send(rows);
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
