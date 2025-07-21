export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
  
      // Parse URL params
      const parts = url.pathname.split('/').filter(Boolean);
      const method = request.method;
  
      // CORS
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      };
      if (method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  
      // POST /trip - tạo nhóm
      if (method === 'POST' && parts[0] === 'trip') {
        const body = await request.json();
        const { id, name, members } = body;
        await env.TRIP_KV.put(`trip:${id}:meta`, JSON.stringify({ id, name, members }));
        await env.TRIP_KV.put(`trip:${id}:expenses`, JSON.stringify([]));
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }
  
      // GET /trip/:id - lấy thông tin nhóm
      if (method === 'GET' && parts[0] === 'trip' && parts[1]) {
        const meta = await env.TRIP_KV.get(`trip:${parts[1]}:meta`);
        return new Response(meta || '{}', { headers: corsHeaders });
      }
  
      // POST /trip/:id/expense - thêm chi tiêu
      if (method === 'POST' && parts[0] === 'trip' && parts[2] === 'expense') {
        const id = parts[1];
        const data = await request.json();
        const raw = await env.TRIP_KV.get(`trip:${id}:expenses`);
        const expenses = raw ? JSON.parse(raw) : [];
        expenses.push(data);
        await env.TRIP_KV.put(`trip:${id}:expenses`, JSON.stringify(expenses));
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }
  
      // GET /trip/:id/expenses - danh sách chi tiêu
      if (method === 'GET' && parts[0] === 'trip' && parts[2] === 'expenses') {
        const raw = await env.TRIP_KV.get(`trip:${parts[1]}:expenses`);
        return new Response(raw || '[]', { headers: corsHeaders });
      }
  
      // GET /trip/:id/stats - tính ai nợ ai
      if (method === 'GET' && parts[0] === 'trip' && parts[2] === 'stats') {
        const raw = await env.TRIP_KV.get(`trip:${parts[1]}:expenses`);
        const expenses = raw ? JSON.parse(raw) : [];
        const stats = calculateStats(expenses);
        return new Response(JSON.stringify(stats), { headers: corsHeaders });
      }
  
      return new Response('Not Found', { status: 404 });
    }
  };
  
  // Hàm tính nợ
  function calculateStats(expenses) {
    const balances = {};
    const debts = {};
  
    for (let e of expenses) {
      const { payer, amount, beneficiaries } = e;
      const share = amount / beneficiaries.length;
  
      if (!balances[payer]) balances[payer] = { paid: 0, owes: 0 };
      balances[payer].paid += amount;
  
      for (let b of beneficiaries) {
        if (!balances[b]) balances[b] = { paid: 0, owes: 0 };
        balances[b].owes += share;
  
        if (b !== payer) {
          const key = `${b}->${payer}`;
          debts[key] = (debts[key] || 0) + share;
        }
      }
    }
  
    return { balances, debts };
  }
  