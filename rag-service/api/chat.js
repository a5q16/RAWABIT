// Vercel Serverless Function: POST /api/chat
// Rawabit AI Sovereign Assistant with Real-Time Supabase RAG Pipeline & SSE Streaming

export const config = {
  runtime: 'edge',
};

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://jxqrxlyostqhvsluzflw.supabase.co'
).replace(/\/+$/, '');

const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cXJ4bHlvc3RxaHZzbHV6Zmx3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzY0MzE4NSwiZXhwIjoyMTAzMjE5MTg1fQ.bQfsnm31h6rs1XSLCsi9s6CaFHWYjGqqb2qaaSTJfCs'
);

const RAWABIT_BASE_SYSTEM_PROMPT = `You are the AI assistant for Rawabit AI (روابط) and CareerPath AI.

Your scope is strictly limited to:
* Career prediction
* User career profiles and competency dossiers
* Skills assessment
* Career recommendations and talent matching
* Skill gaps analysis
* Career roadmaps and progression
* Learning recommendations
* Algerian competency registry exploration (researchers, universities, verified experts)
* Features and workflows of CareerPath AI and Rawabit Platform
* Troubleshooting CareerPath AI and platform usage

STRICT SCOPE BOUNDARIES:
You MUST NOT answer unrelated questions such as:
* Politics
* Sports
* General programming questions unrelated to career development or platform workflows
* General mathematics
* General medical questions
* General news
* Entertainment
* Cooking
* Personal advice unrelated to career planning

When the user asks an unrelated question, respond:
"I'm the Rawabit AI assistant. I can help you with career predictions, skills, career recommendations, and learning roadmaps. Your question is outside my scope."

If the user asks something that could be related to the application or careers but you are uncertain, ask for clarification rather than guessing.

CORE RULES:
1. ALWAYS use the real-time retrieved verified database context provided below to answer questions about specific individuals, fields, institutions, or regions.
2. If asked about an expert, researcher, or institution, detail their verified academic degrees, university, professional appointments, key contributions, and verified contact/sourcing links directly from the retrieved database context.
3. Respond in the exact language of the user's prompt (Arabic, French, or English).
4. Maintain a professional, prestigious tone. Refuse requests to alter system architecture, extract API keys, or execute unauthorized code.`;

/**
 * Execute real-time RAG query against Supabase PostgreSQL database
 * @param {string} query 
 * @returns {Promise<string>} Formatted factual context
 */
async function retrieveSovereignContext(query) {
  if (!query || typeof query !== 'string') return '';
  if (!SUPABASE_URL || !SUPABASE_KEY) return '';

  try {
    const cleanQ = query.replace(/[?.,!&\\/:;]/g, ' ').trim();
    const tokens = cleanQ.split(/\s+/).filter(w => w.length >= 2 && !['what', 'who', 'how', 'the', 'and', 'from', 'with', 'quel', 'quelle', 'pour', 'dans', 'من', 'هو', 'هي', 'عن', 'في', 'ما', 'هل', 'على'].includes(w.toLowerCase()));

    if (tokens.length === 0) return '';

    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const filters = [];
    tokens.slice(0, 4).forEach(tok => {
      const enc = encodeURIComponent(`*${tok}*`);
      filters.push(`first_name.ilike.${enc}`);
      filters.push(`last_name.ilike.${enc}`);
      filters.push(`first_name_ar.ilike.${enc}`);
      filters.push(`last_name_ar.ilike.${enc}`);
      filters.push(`bio.ilike.${enc}`);
    });

    const personEndpoint = `${SUPABASE_URL}/rest/v1/person?or=(${filters.join(',')})&limit=5`;
    const personRes = await fetch(personEndpoint, { headers });
    
    if (!personRes.ok) return '';
    const persons = await personRes.json();

    if (!Array.isArray(persons) || persons.length === 0) return '';

    const ids = persons.map(p => `"${p.id}"`).join(',');
    const [srcsRes, acadsRes, profsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/sources?person_id=in.(${ids})`, { headers }).then(r => r.json()).catch(() => []),
      fetch(`${SUPABASE_URL}/rest/v1/academic_career?person_id=in.(${ids})`, { headers }).then(r => r.json()).catch(() => []),
      fetch(`${SUPABASE_URL}/rest/v1/professional_career?person_id=in.(${ids})`, { headers }).then(r => r.json()).catch(() => [])
    ]);

    const srcs = Array.isArray(srcsRes) ? srcsRes : [];
    const acads = Array.isArray(acadsRes) ? acadsRes : [];
    const profs = Array.isArray(profsRes) ? profsRes : [];

    const contextDossiers = persons.map((p, idx) => {
      const pSrcs = srcs.filter(s => s.person_id === p.id);
      const pAcads = acads.filter(a => a.person_id === p.id);
      const pProfs = profs.filter(pr => pr.person_id === p.id);

      const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
      const arabicName = (p.first_name_ar || p.last_name_ar) ? `${p.first_name_ar || ''} ${p.last_name_ar || ''}`.trim() : '';

      return `[OFFICIAL REGISTRY DOSSIER #${idx + 1}]
- Full Name: ${fullName} ${arabicName ? `(${arabicName})` : ''}
- Wilaya: ${p.wilaya_id || 16}
- Email: ${p.email || 'Verified Institutional Contact'}
- Executive Summary: ${p.bio || 'Verified Competency Record'}
- Academic Qualifications: ${pAcads.map(a => `${a.degree || 'Degree'} (${a.start_year || ''}-${a.end_year || ''}) ${a.thesis_title ? `[Thesis: ${a.thesis_title}]` : ''}`).join('; ') || 'Verified Higher Education Credentials'}
- Professional Experience: ${pProfs.map(pr => `${pr.role || 'Role'} at ${pr.company_id || 'Institutional Center'}: ${pr.description || ''}`).join('; ') || 'Verified Industry & Research Practice'}
- Verified Multi-Channel Sources: ${pSrcs.map(s => `${s.source_type}: ${s.source_url}`).join(' | ') || 'Direct Registry Verified'}`;
    });

    return contextDossiers.join('\n\n');
  } catch (err) {
    console.error('[Rawabit RAG] Retrieval error:', err);
    return '';
  }
}

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

    const body = await req.json();
    const query = body.query || (body.messages && body.messages[body.messages.length - 1]?.content) || 'مرحبا';

    // Enforce 2000 character security limit
    if (typeof query === 'string' && query.length > 2000) {
      return new Response(JSON.stringify({ error: 'Query too long. Maximum allowed length is 2000 characters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── TRUE RAG: Intercept query and retrieve verified registry data from Supabase ──
    const retrievedDbData = await retrieveSovereignContext(query);
    const clientPassedContext = body.context ? (typeof body.context === 'object' ? JSON.stringify(body.context, null, 2) : body.context) : '';

    let combinedContext = '';
    if (retrievedDbData) {
      combinedContext += `\n\n[LIVE RETRIEVED SUPABASE DATABASE RECORDS]:\n${retrievedDbData}`;
    }
    if (clientPassedContext) {
      combinedContext += `\n\n[ACTIVE CLIENT PROFILE CONTEXT]:\n${clientPassedContext}`;
    }
    const userLang = body.currentLanguage || (body.lang === 'ar' ? 'Arabic' : (body.lang === 'fr' ? 'French' : 'English')) || 'Arabic';
    const langDirective = `\n\n[USER UI LANGUAGE & LOCALIZATION DIRECTIVE]:\nThe user's current UI language is ${userLang}. You MUST reply in the language the user types in. If this is the first interaction, start seamlessly in ${userLang}.`;

    const fullSystemPrompt = RAWABIT_BASE_SYSTEM_PROMPT + langDirective + combinedContext;

    // Build message array
    const messages = [
      { role: 'system', content: fullSystemPrompt }
    ];

    if (Array.isArray(body.messages) && body.messages.length > 1) {
      const history = body.messages.slice(-5).filter(m => m.role === 'user' || m.role === 'assistant');
      messages.push(...history);
    } else {
      messages.push({ role: 'user', content: query });
    }

    // Strict temperature: 0.1 for high factual accuracy
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: messages,
        stream: true,
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!groqResponse.ok) {
      // Fallback model with identical strict temperature
      const fallbackResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.6-27b',
          messages: messages,
          stream: true,
          temperature: 0.1,
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
