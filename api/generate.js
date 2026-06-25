export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: '伺服器尚未設定 API Key，請聯繫管理員。' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: '無效的請求格式' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      stream: false,
      messages: [
        { role: 'system', content: body.system },
        ...body.messages,
      ],
    }),
  });

  if (!upstream.ok) {
    const error = await upstream.json().catch(() => ({ error: `API 錯誤 ${upstream.status}` }));
    return new Response(
      JSON.stringify({ error: error.error?.message || error.error || `API 錯誤 ${upstream.status}` }),
      { status: upstream.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const result = await upstream.json();
  const text = result.choices?.[0]?.message?.content || '';

  return new Response(JSON.stringify({ text }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
