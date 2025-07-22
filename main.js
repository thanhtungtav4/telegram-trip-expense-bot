const apiBase = "https://telegram-trip-expense-bot.thanhtung74119.workers.dev";

async function createTrip() {
  const name = document.getElementById("tripName").value.trim();
  const members = document.getElementById("members").value.split(',').map(x => x.trim()).filter(Boolean);

  if (!name || members.length === 0) {
    alert("Please enter a name and at least one member.");
    return;
  }

  const res = await fetch(`${apiBase}/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, members })
  });

  const json = await res.json();
  if (json.success) {
    alert("Trip created! ID: " + json.id);
    loadTrips();
  } else {
    alert("Error creating trip.");
  }
}

async function loadTrips() {
  const res = await fetch(`${apiBase}/trips`);
  const trips = await res.json();
  document.getElementById("tripList").textContent = JSON.stringify(trips, null, 2);
}

// Attach to window for button onclick
window.createTrip = createTrip;
window.loadTrips = loadTrips;

// Optionally, load trips on page load
document.addEventListener('DOMContentLoaded', loadTrips);
