// آدرس API اگر پروژه روی همان سرور است، خالی بگذار
const API_BASE = "https://service-jnkf.onrender.com";

// بارگذاری نوبت‌ها از سرور
async function loadBookings() {
  try {
    const res = await fetch(`${API_BASE}/api/bookings`);
    const bookings = await res.json();
    const grouped = {};

    // گروه‌بندی نوبت‌ها بر اساس روز هفته
    bookings.forEach(b => {
      if (!grouped[b.weekday]) grouped[b.weekday] = [];
      grouped[b.weekday].push(b);
    });

    const container = document.getElementById("bookingList");
    container.innerHTML = "";

    Object.keys(grouped).forEach(day => {
      const section = document.createElement("div");
      section.innerHTML = `<h2>${day}</h2>`;

      grouped[day].forEach(b => {
        const row = document.createElement("div");
        row.innerHTML = `
          <span><strong>${b.hour}</strong> - ${b.name} - ${b.phone} - ${b.service} - ${b.address}</span>
          <button onclick="archiveBooking(${b.id})">بایگانی</button>
        `;
        section.appendChild(row);
      });

      container.appendChild(section);
    });

  } catch (err) {
    console.error("خطا در دریافت نوبت‌ها:", err);
  }
}

// بایگانی یک نوبت خاص
async function archiveBooking(id) {
  try {
    const res = await fetch(`${API_BASE}/api/archive/${id}`, {
      method: "POST",
    });
    if (res.ok) {
      loadBookings();
    } else {
      alert("خطا در بایگانی نوبت");
    }
  } catch (err) {
    console.error("خطا در بایگانی:", err);
    alert("خطا در ارتباط با سرور");
  }
}

// دکمه رفتن به صفحه بایگانی و صفحه ثبت مشتری
document.getElementById("archiveBtn").addEventListener("click", () => {
  window.location.href = "archive.html";
});

document.getElementById("bookingBtn").addEventListener("click", () => {
  window.location.href = "index.html";
});

// اجرای اولیه
loadBookings();
