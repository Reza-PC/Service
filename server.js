const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

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

// ثبت نوبت جدید
app.post("/api/book", (req, res) => {
  const { name, phone, service, weekday, hour } = req.body;

  // چک می‌کنیم آیا این ساعت در این روز قبلاً رزرو شده؟
  const checkQuery = `SELECT COUNT(*) as count FROM bookings WHERE weekday = ? AND hour = ? AND status = 'active'`;
  db.get(checkQuery, [weekday, hour], (err, row) => {
    if (err) return res.status(500).send({ error: err.message });
    if (row.count > 0) {
      return res.status(409).send({ error: "این ساعت در این روز قبلاً رزرو شده است." });
    }

    const insertQuery = `INSERT INTO bookings (name, phone, service, weekday, hour) VALUES (?, ?, ?, ?, ?)`;
    db.run(insertQuery, [name, phone, service, weekday, hour], function (err) {
      if (err) return res.status(500).send({ error: err.message });
      res.send({ id: this.lastID });
    });
  });
});

// گرفتن همه رزروهای فعال (برای مدیریت)
app.get("/api/bookings", (req, res) => {
  db.all(`SELECT * FROM bookings WHERE status = 'active' ORDER BY weekday, hour`, [], (err, rows) => {
    if (err) return res.status(500).send({ error: err.message });
    res.send(rows);
  });
});

// آرشیو کردن رزرو
app.post("/api/archive/:id", (req, res) => {
  const id = req.params.id;
  db.run(`UPDATE bookings SET status = 'archived' WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).send({ error: err.message });
    res.send({ success: true });
  });
});

// گرفتن آرشیو رزروها
app.get("/api/archive", (req, res) => {
  db.all(`SELECT * FROM bookings WHERE status = 'archived' ORDER BY weekday, hour`, [], (err, rows) => {
    if (err) return res.status(500).send({ error: err.message });
    res.send(rows);
  });
});

// ** اضافه کردن روت برای گرفتن ساعت‌های رزرو شده در یک روز مشخص **
app.get("/api/booked-hours", (req, res) => {
  const { weekday } = req.query;
  if (!weekday) return res.status(400).send({ error: "پارامتر weekday الزامی است." });

  const query = `SELECT hour FROM bookings WHERE weekday = ? AND status = 'active'`;
  db.all(query, [weekday], (err, rows) => {
    if (err) return res.status(500).send({ error: err.message });

    // استخراج ساعت‌ها به صورت آرایه
    const bookedHours = rows.map(row => row.hour);
    res.send(bookedHours);
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
