async function loadBookings() {
  const API_BASE = "https://service-jnkf.onrender.com";
  const res = await fetch(`${API_BASE}/api/bookings`);
  const bookings = await res.json();
  const grouped = {};

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
      row.innerHTML = `${b.hour} - ${b.name} - ${b.phone} - ${b.service} 
        <button onclick="archiveBooking(${b.id})">بایگانی</button>`;
      section.appendChild(row);
    });
    container.appendChild(section);
  });
}

async function archiveBooking(id) {
  await fetch(`${API_BASE}/api/archive/${id}`, { method: "POST" });
  loadBookings();
}

loadBookings();
