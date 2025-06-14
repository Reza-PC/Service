document.getElementById("bookingForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const data = {
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    address: document.getElementById("address").value.trim(),
    service: document.getElementById("service").value.trim(),
    weekday: document.getElementById("weekday").value,
    hour: document.getElementById("time").value,
  };

  const res = await fetch("/api/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (res.ok) {
    alert("نوبت با موفقیت ثبت شد");
    document.getElementById("bookingForm").reset();
  } else if (res.status === 409) {
    alert("کاربری با این نام یا آدرس قبلاً نوبت ثبت کرده است.");
  } else {
    alert("خطا در ثبت نوبت. لطفاً دوباره تلاش کنید.");
  }
});
