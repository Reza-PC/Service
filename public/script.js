document.addEventListener("DOMContentLoaded", () => {
  const bookingForm = document.getElementById("bookingForm");
  const weekdaySelect = document.getElementById("weekday");
  const hourSelect = document.getElementById("time");
  const API_BASE = "https://service-jnkf.onrender.com";
  // هر بار که روز هفته تغییر کرد، ساعت‌های رزرو شده را دریافت کن و غیر فعال کن
  weekdaySelect.addEventListener("change", async () => {
    const selectedDay = weekdaySelect.value;

    // اگر روز انتخاب نشده بود، همه ساعت‌ها را فعال کن و نمایش بده
    if (!selectedDay) {
      for (const option of hourSelect.options) {
        option.disabled = false;
        option.style.display = "block";
      }
      hourSelect.value = "";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/booked-hours?weekday=${encodeURIComponent(selectedDay)}`);
      if (!res.ok) throw new Error("خطا در دریافت ساعت‌های رزرو شده");

      const bookedHours = await res.json();

      // غیر فعال کردن ساعت‌هایی که رزرو شده‌اند
      for (const option of hourSelect.options) {
        if (option.value === "") continue; // گزینه انتخاب ساعت
        if (bookedHours.includes(option.value)) {
          option.disabled = true;
          option.style.display = "none"; // اگر میخوای فقط غیرفعال بشه، این خط رو حذف کن
        } else {
          option.disabled = false;
          option.style.display = "block";
        }
      }

      // اگر ساعت انتخاب شده فعلی غیر فعال شد، ساعت انتخاب را پاک کن
      if (hourSelect.value && bookedHours.includes(hourSelect.value)) {
        hourSelect.value = "";
      }

    } catch (error) {
      alert(error.message);
    }
  });

  // ثبت نوبت
  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      name: document.getElementById("name").value.trim(),
      phone: document.getElementById("phone").value.trim() || "ندارد",
      address: document.getElementById("address").value.trim() || "ندارد",
      service: document.getElementById("service").value.trim(),
      weekday: weekdaySelect.value,
      hour: hourSelect.value,
    };

    // ساده چک می‌کنیم همه فیلدها پر شده
    if (!data.weekday || !data.hour) {
      alert("لطفاً روز و ساعت را انتخاب کنید.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });


      if (res.ok) {
        alert("نوبت با موفقیت ثبت شد");
        bookingForm.reset();

        // ساعت‌ها رو دوباره به‌روز کن (برای غیر فعال کردن ساعت جدیداً رزرو شده)
        weekdaySelect.dispatchEvent(new Event("change"));
      } else if (res.status === 409) {
        alert("این ساعت قبلاً رزرو شده است.");
      } else {
        alert("خطا در ثبت نوبت. لطفاً دوباره تلاش کنید.");
      }
    } catch {
      alert("خطا در ارتباط با سرور");
    }
  });
});
