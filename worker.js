export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    // GET /
    if (request.method === "GET" && url.pathname === "/") {
      return new Response("Trip Expense Bot is running!", {
        headers: {
          "Content-Type": "text/plain",
          ...corsHeaders(),
        },
      });
    }

    // GET /trips
    if (request.method === "GET" && url.pathname === "/trips") {
      try {
        const list = await env.KV_BINDING.list({ prefix: "trip:" });
        const trips = [];

        for (const key of list.keys) {
          const trip = await env.KV_BINDING.get(key.name, { type: "json" });
          if (trip) trips.push(trip);
        }

        return jsonResponse(trips);
      } catch (e) {
        return errorResponse("Failed to fetch trips", 500);
      }
    }

    // POST /trips
    if (request.method === "POST" && url.pathname === "/trips") {
      try {
        const body = await request.json();
        if (!body.name || !Array.isArray(body.members)) {
          return errorResponse("Invalid payload", 400);
        }

        const id = crypto.randomUUID();
        const trip = {
          id,
          name: body.name,
          members: body.members,
          created: Date.now(),
        };

        await env.KV_BINDING.put(`trip:${id}`, JSON.stringify(trip));

        return jsonResponse({ success: true, id });
      } catch (e) {
        return errorResponse("Failed to create trip", 500);
      }
    }

    return errorResponse("Not found", 404);
  },
};

// CORS Headers
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// JSON response
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

// Error response
function errorResponse(message, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}
