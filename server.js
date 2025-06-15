const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const dbPath = path.join(__dirname, 'data', 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('Database error:', err.message);
  console.log('✅ SQLite database connected.');
});

db.run(`CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  phone TEXT,
  service TEXT,
  day TEXT,
  time TEXT,
  status TEXT DEFAULT 'active'
)`);

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )
`, (err) => {
  if (err) {
    console.error("خطا در ساخت جدول کاربران:", err.message);
  } else {
    // فقط بعد از ساخت موفق جدول بررسی کن که کاربر پیش‌فرض وجود داره یا نه
    const defaultUsername = "admin";
    const defaultPassword = "5442";

    db.get("SELECT * FROM users WHERE username = ?", [defaultUsername], (err, row) => {
      if (err) {
        console.error("خطا در بررسی کاربر پیش‌فرض:", err.message);
      } else if (!row) {
        db.run("INSERT INTO users (username, password) VALUES (?, ?)", [defaultUsername, defaultPassword], (err) => {
          if (err) {
            console.error("خطا در ساخت کاربر پیش‌فرض:", err.message);
          } else {
            console.log("✅ کاربر پیش‌فرض ساخته شد.");
          }
        });
      }
    });
  }
});

app.post('/api/appointments', (req, res) => {
  const { name, phone, service, day, time } = req.body;
  db.run(
    `INSERT INTO appointments (name, phone, service, day, time) VALUES (?, ?, ?, ?, ?)`,
    [name, phone, service, day, time],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.get('/api/appointments', (req, res) => {
  db.all(`SELECT * FROM appointments WHERE status='active'`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ثبت نوبت جدید
app.post("/api/book", (req, res) => {
  const { name, phone, address, service, weekday, hour } = req.body;

  // چک می‌کنیم آیا این ساعت در این روز قبلاً رزرو شده؟
  const checkQuery = `SELECT COUNT(*) as count FROM bookings WHERE weekday = ? AND hour = ? AND status = 'active'`;
  db.get(checkQuery, [weekday, hour], (err, row) => {
    if (err) return res.status(500).send({ error: err.message });
    if (row.count > 0) {
      return res.status(409).send({ error: "این ساعت در این روز قبلاً رزرو شده است." });
    }

    const insertQuery = `INSERT INTO bookings (name, phone, address, service, weekday, hour) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(insertQuery, [name, phone, address, service, weekday, hour], function (err) {
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


app.post('/api/archive/:id', (req, res) => {
  const id = req.params.id;
  db.run(`UPDATE appointments SET status='archived' WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('/api/archived', (req, res) => {
  db.all(`SELECT * FROM appointments WHERE status='archived'`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// حذف همه نوبت‌های آرشیو شده
app.delete("/api/archive", (req, res) => {
  db.run(`DELETE FROM bookings WHERE status = 'archived'`, function(err) {
    if (err) {
      console.error("خطا در حذف آرشیو:", err.message);
      return res.status(500).send({ error: err.message });
    }
    res.send({ success: true, deletedCount: this.changes });
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

// API ورود کاربر
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
    if (err) {
      return res.status(500).send({ error: "خطا در ورود" });
    }

    if (!user) {
      return res.status(401).send({ error: "نام کاربری یا رمز عبور اشتباه است" });
    }

    res.send({ success: true });
  });
});


app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
