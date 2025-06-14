document.getElementById("bookingForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const data = {
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    service: document.getElementById("service").value,
    weekday: document.getElementById("weekday").value,
    hour: document.getElementById("hour").value,
  };

  const res = await fetch("/api/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (res.ok) {
    alert("نوبت با موفقیت ثبت شد");
    document.getElementById("bookingForm").reset();
  } else {
    alert("خطا در ثبت نوبت");
  }
});
