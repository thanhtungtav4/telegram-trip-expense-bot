import indexHtml from './index.html';

const corsHeaders = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

const jsonResponse = (data, status = 200) => 
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });

const errorResponse = (message, status = 400) => 
  jsonResponse({ success: false, error: message }, status);

class TripService {
  constructor(kvBinding) {
    this.kv = kvBinding;
  }

  async listTrips() {
    const list = await this.kv.list({ prefix: "trip:" });
    const trips = [];
    for (const key of list.keys) {
      const trip = await this.kv.get(key.name, { type: "json" });
      if (trip) trips.push(trip);
    }
    return trips;
  }

  async getTrip(id) {
    return await this.kv.get(`trip:${id}`, { type: "json" });
  }

  async createTrip({ name, members }) {
    if (!name || !Array.isArray(members)) throw new Error("Invalid payload");
    const id = crypto.randomUUID();
    const trip = { id, name, members, expenses: [], created: Date.now() };
    await this.kv.put(`trip:${id}`, JSON.stringify(trip));
    return { id, ...trip };
  }

  async addMembers(id, newMembers) {
    const trip = await this.getTrip(id);
    if (!trip) throw new Error("Trip not found");
    trip.members = [...new Set([...trip.members, ...newMembers])];
    await this.kv.put(`trip:${id}`, JSON.stringify(trip));
    return trip;
  }

  async addExpense(id, { payer, amount, beneficiaries, description = "" }) {
    if (!payer || !amount || !Array.isArray(beneficiaries))
      throw new Error("Invalid expense payload");
    const trip = await this.getTrip(id);
    if (!trip) throw new Error("Trip not found");
    trip.expenses.push({
      payer, description, amount: parseFloat(amount), beneficiaries, time: Date.now()
    });
    await this.kv.put(`trip:${id}`, JSON.stringify(trip));
    return trip;
  }

  async getTripDetails(id) {
    const trip = await this.getTrip(id);
    if (!trip) throw new Error("Trip not found");
    const table = trip.expenses.map(exp => ({
      payer: exp.payer, amount: exp.amount, description: exp.description,
      beneficiaries: exp.beneficiaries, time: exp.time,
    }));
    const summary = {};
    trip.members.forEach(m => summary[m] = { paid: 0, owes: 0 });
    trip.expenses.forEach(exp => {
      summary[exp.payer].paid += exp.amount;
      const share = exp.amount / exp.beneficiaries.length;
      exp.beneficiaries.forEach(b => summary[b].owes += share);
    });
    return { table, summary };
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const tripService = new TripService(env.KV_BINDING);
    try {
      if (request.method === "OPTIONS")
        return new Response(null, { status: 204, headers: corsHeaders() });
      if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
        return new Response(indexHtml, {
          headers: { 'Content-Type': 'text/html', ...corsHeaders() },
        });
      }
      if (request.method === "GET" && url.pathname === "/trips")
        return jsonResponse(await tripService.listTrips());
      if (request.method === "POST" && url.pathname === "/trips") {
        const data = await request.json();
        const created = await tripService.createTrip(data);
        return jsonResponse({ success: true, id: created.id });
      }
      if (request.method === "POST" && /^\/trips\/[^/]+\/members$/.test(url.pathname)) {
        const tripId = url.pathname.split("/")[2];
        const { members } = await request.json();
        await tripService.addMembers(tripId, members);
        return jsonResponse({ success: true });
      }
      if (request.method === "POST" && /^\/trips\/[^/]+\/expenses$/.test(url.pathname)) {
        const tripId = url.pathname.split("/")[2];
        const data = await request.json();
        await tripService.addExpense(tripId, data);
        return jsonResponse({ success: true });
      }
      if (request.method === "GET" && /^\/trips\/[^/]+\/details$/.test(url.pathname)) {
        const tripId = url.pathname.split("/")[2];
        return jsonResponse(await tripService.getTripDetails(tripId));
      }
      return errorResponse("Not found", 404);
    } catch (error) {
      return errorResponse(error.message || "Internal server error", error.message === "Trip not found" ? 404 : 500);
    }
  }
};