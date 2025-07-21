const API_BASE = "https://telegram-trip-expense-bot.thanhtung74119.workers.dev/"; // thay bằng domain Cloudflare Worker thật

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("trip-form");
  const tripList = document.getElementById("trip-list");

  // Load chuyến đi từ KV
  async function loadTrips() {
    tripList.innerHTML = "<p class='text-gray-500'>Đang tải...</p>";
    try {
      const res = await fetch(`${API_BASE}/trips`);
      const trips = await res.json();

      tripList.innerHTML = "";
      if (trips.length === 0) {
        tripList.innerHTML = "<p class='text-gray-500'>Chưa có chuyến đi nào.</p>";
        return;
      }

      trips.forEach((trip) => {
        const div = document.createElement("div");
        div.className = "border border-gray-200 rounded p-4";
        div.innerHTML = `
          <h3 class="font-semibold text-lg">${trip.name}</h3>
          <p class="text-sm text-gray-600">Thành viên: ${trip.members.join(", ")}</p>
        `;
        tripList.appendChild(div);
      });
    } catch (err) {
      tripList.innerHTML = "<p class='text-red-500'>Lỗi tải chuyến đi.</p>";
      console.error(err);
    }
  }

  // Gửi chuyến đi mới lên KV
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("trip-name").value.trim();
    const members = document.getElementById("members").value
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

    if (!name || members.length === 0) {
      alert("Vui lòng nhập tên chuyến đi và thành viên.");
      return;
    }

    try {
      await fetch(`${API_BASE}/trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, members }),
      });
      form.reset();
      loadTrips();
    } catch (err) {
      console.error("Lỗi tạo chuyến đi:", err);
    }
  });

  loadTrips();
});
