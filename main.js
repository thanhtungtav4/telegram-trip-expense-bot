const form = document.getElementById('trip-form');
const tripList = document.getElementById('trip-list');
const apiBase = "https://telegram-trip-expense-bot.thanhtung74119.workers.dev";

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('trip-name').value.trim();
  const membersInput = document.getElementById('members').value.trim();
  const members = membersInput.split(',').map(m => m.trim()).filter(Boolean);

  if (!name || members.length === 0) {
    alert('Vui lòng nhập tên chuyến đi và ít nhất một thành viên.');
    return;
  }

  const res = await fetch(`${apiBase}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, members })
  });

  const json = await res.json();

  if (json.success) {
    alert('✅ Tạo chuyến đi thành công!');
    form.reset();
    loadTrips();
  } else {
    alert('❌ Lỗi khi tạo chuyến đi.');
  }
});

async function loadTrips() {
  const res = await fetch(`${apiBase}/trips`);
  const trips = await res.json();

  tripList.innerHTML = '';

  if (trips.length === 0) {
    tripList.innerHTML = '<p class="text-gray-500">Chưa có chuyến đi nào.</p>';
    return;
  }

  for (const trip of trips) {
    const div = document.createElement('div');
    div.className = 'border p-4 rounded shadow bg-gray-50';

    const date = new Date(trip.created).toLocaleString('vi-VN');

    div.innerHTML = `
      <h3 class="text-lg font-semibold text-gray-800">${trip.name}</h3>
      <p class="text-sm text-gray-600">Mã: <code>${trip.id}</code></p>
      <p class="text-sm text-gray-600">Thành viên: ${trip.members.join(', ')}</p>
      <p class="text-sm text-gray-500 mt-1">Ngày tạo: ${date}</p>
    `;

    tripList.appendChild(div);
  }
}

loadTrips();
