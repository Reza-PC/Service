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
    address TEXT,
    service TEXT,
    weekday TEXT,
    hour TEXT,
    status TEXT DEFAULT 'active'
  )
`);

// ثبت نوبت جدید
app.post("/api/book", (req, res) => {
  const { name, phone, address, service, weekday, hour } = req.body;

  if (!name || !phone || !address || !service || !weekday || !hour) {
    return res.status(400).send({ error: "تمامی فیلدها الزامی هستند" });
  }

  // بررسی تکراری نبودن نام یا آدرس
  const checkQuery = `SELECT * FROM bookings WHERE (name = ? OR address = ?) AND status = 'active'`;
  db.get(checkQuery, [name, address], (err, row) => {
    if (err) return res.status(500).send({ error: err.message });

    if (row) {
      return res.status(409).send({ error: "کاربر قبلاً نوبت ثبت کرده است" });
    }

    // ثبت در پایگاه داده
    const insertQuery = `INSERT INTO bookings (name, phone, address, service, weekday, hour) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(insertQuery, [name, phone, address, service, weekday, hour], function (err) {
      if (err) return res.status(500).send({ error: err.message });
      res.send({ id: this.lastID });
    });
  });
});

// دریافت نوبت‌های فعال
app.get("/api/bookings", (req, res) => {
  db.all(`SELECT * FROM bookings WHERE status = 'active' ORDER BY weekday, hour`, [], (err, rows) => {
    if (err) return res.status(500).send({ error: err.message });
    res.send(rows);
  });
});

// آرشیو کردن نوبت
app.post("/api/archive/:id", (req, res) => {
  const id = req.params.id;
  db.run(`UPDATE bookings SET status = 'archived' WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).send({ error: err.message });
    res.send({ success: true });
  });
});

// دریافت نوبت‌های آرشیوی
app.get("/api/archive", (req, res) => {
  db.all(`SELECT * FROM bookings WHERE status = 'archived' ORDER BY weekday, hour`, [], (err, rows) => {
    if (err) return res.status(500).send({ error: err.message });
    res.send(rows);
  });
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
