export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (request.method === "GET" && url.pathname === "/") {
      return new Response("Trip Expense Bot is running!", {
        headers: {
          "Content-Type": "text/plain",
          ...corsHeaders(),
        },
      });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    // GET /trips
    if (request.method === "GET" && url.pathname === "/trips") {
      const list = await env.KV_BINDING.list();
      const trips = [];

      for (const key of list.keys) {
        const value = await env.KV_BINDING.get(key.name, { type: "json" });
        if (value) trips.push(value);
      }

      return new Response(JSON.stringify(trips), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(),
        },
      });
    }

    // POST /trips
    if (request.method === "POST" && url.pathname === "/trips") {
      const data = await request.json();
      const id = crypto.randomUUID();
      const trip = {
        id,
        name: data.name,
        members: data.members,
        created: Date.now(),
      };

      await env.KV_BINDING.put(`trip:${id}`, JSON.stringify(trip));

      return new Response(JSON.stringify({ success: true, id }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(),
        },
      });
    }

    // POST /trips/:id/expense
    if (request.method === "POST" && url.pathname.match(/^\/trips\/([^/]+)\/expense$/)) {
      const tripId = url.pathname.split("/")[2];
      const data = await request.json();
      const expenseId = crypto.randomUUID();
      const expense = {
        id: expenseId,
        tripId,
        description: data.description,
        amount: data.amount,
        paidBy: data.paidBy,
        sharedBy: data.sharedBy,
        created: Date.now(),
      };
      await env.KV_BINDING.put(`expense:${tripId}:${expenseId}`, JSON.stringify(expense));
      return new Response(JSON.stringify({ success: true, id: expenseId }), {
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    // GET /trips/:id/expenses
    if (request.method === "GET" && url.pathname.match(/^\/trips\/([^/]+)\/expenses$/)) {
      const tripId = url.pathname.split("/")[2];
      const list = await env.KV_BINDING.list({ prefix: `expense:${tripId}:` });
      const expenses = [];
      for (const key of list.keys) {
        const value = await env.KV_BINDING.get(key.name, { type: "json" });
        if (value) expenses.push(value);
      }
      return new Response(JSON.stringify(expenses), {
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    // GET /trips/:id/stats
    if (request.method === "GET" && url.pathname.match(/^\/trips\/([^/]+)\/stats$/)) {
      const tripId = url.pathname.split("/")[2];
      const list = await env.KV_BINDING.list({ prefix: `expense:${tripId}:` });
      const expenses = [];
      for (const key of list.keys) {
        const value = await env.KV_BINDING.get(key.name, { type: "json" });
        if (value) expenses.push(value);
      }
      // Calculate total spent per member
      const stats = {};
      for (const exp of expenses) {
        if (!stats[exp.paidBy]) stats[exp.paidBy] = 0;
        stats[exp.paidBy] += Number(exp.amount) || 0;
      }
      return new Response(JSON.stringify(stats), {
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
