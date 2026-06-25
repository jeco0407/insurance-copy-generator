export const config = { runtime: 'edge' };

export default async function handler(req) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ status: '❌ GROQ_API_KEY 未設定' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 20,
        stream: false,
        messages: [{ role: 'user', content: '說你好兩個字就好' }],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({
        status: `❌ API 錯誤 ${res.status}`,
        error: data,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      status: '✅ 連線成功',
      reply: data.choices?.[0]?.message?.content,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (e) {
    return new Response(JSON.stringify({ status: '❌ 例外錯誤', error: e.message }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
