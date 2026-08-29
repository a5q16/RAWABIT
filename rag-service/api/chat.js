// Vercel Serverless Function: POST /api/chat
// Rawabit AI Assistant SSE Streaming Endpoint

export const config = {
  runtime: 'edge', // Edge runtime for ultra-fast streaming SSE
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return new Response(JSON.stringify({ error: 'GROQ_API_KEY is not configured in environment variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { query, context } = await req.json();

    const systemPrompt = `أنت المساعد الذكي لمنصة روابط الجزائرية (Rawabit) للكفاءات والمواهب الوطنية.
مهمتك مساعدة المستخدمين في استكشاف الكفاءات والخبراء والمشاريع في مختلف ولايات الجزائر.
${context ? `السياق الحالي للملف الشخصي: ${JSON.stringify(context)}` : ''}
أجب بلغة عربية فصحى واضحة، مهنية وموجزة ومباشرة.`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query || 'مرحبا' },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!groqResponse.ok) {
      // Fallback model if primary model is unavailable
      const fallbackResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.6-27b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query || 'مرحبا' },
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!fallbackResponse.ok) {
        const errText = await fallbackResponse.text();
        return new Response(JSON.stringify({ error: `Groq AI API error: ${errText}` }), {
          status: fallbackResponse.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(fallbackResponse.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(groqResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
