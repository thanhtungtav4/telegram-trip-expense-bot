export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

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
