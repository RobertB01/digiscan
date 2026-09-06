import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

const THEME_NAMES = [
  'Visie en koers',
  'Bekwaamheid en zelfvertrouwen',
  'Lespraktijk en didactiek',
  'Inhoudelijke dekking',
  'Randvoorwaarden en ondersteuning',
  'Ontwikkeling, evaluatie en borging'
];

const ROUTE_NAMES = [
  'Visie eerst',
  'Teambekwaamheid versterken',
  'Van losse activiteiten naar lespraktijk',
  'Inhoud verbreden en verdiepen',
  'Structuur en randvoorwaarden op orde',
  'Borgen, volgen en doorontwikkelen'
];

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const scoreBand = (score: number) => {
  if (score <= 3.6) return 'Nog niet';
  if (score <= 5.2) return 'Ad hoc';
  if (score <= 6.8) return 'In ontwikkeling';
  if (score <= 8.4) return 'Meestal zichtbaar';
  return 'Stevig ingebed';
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Methode niet toegestaan.' }, 405);

  try {
    const { scanId, email } = await request.json();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!uuidPattern.test(String(scanId)) || cleanEmail.length > 254 || !emailPattern.test(cleanEmail)) {
      return jsonResponse({ error: 'Vul een geldig e-mailadres in.' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase.from('email_deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('scan_id', scanId)
      .gte('sent_at', since);
    if ((count || 0) >= 3) {
      return jsonResponse({ error: 'Voor dit resultaat zijn vandaag al drie e-mails verstuurd.' }, 429);
    }

    const { data: scan, error: scanError } = await supabase.from('scans')
      .select('id, created_at, bouw, extra_answer, recommended_route, scores, individual_scores, school_scores, overall_score')
      .eq('id', scanId)
      .single();
    if (scanError || !scan) return jsonResponse({ error: 'Het resultaat is niet gevonden.' }, 404);

    const individualScores = scan.individual_scores as number[];
    const schoolScores = scan.school_scores as number[];
    const scores = scan.scores as number[];
    const rows = THEME_NAMES.map((name, index) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb">${index + 1}. ${escapeHtml(name)}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center">${individualScores[index].toFixed(1)}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center">${schoolScores[index].toFixed(1)}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb">${scoreBand(scores[index])}</td>
      </tr>`).join('');
    const html = `<!doctype html><html lang="nl"><body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#1f2937">
      <div style="max-width:720px;margin:0 auto;padding:24px">
        <div style="background:linear-gradient(135deg,#1E88E5,#26A69A);padding:28px;border-radius:16px 16px 0 0;color:white">
          <h1 style="margin:0;font-size:24px">Jouw DigiScan-resultaten</h1>
          <p style="margin:8px 0 0">${escapeHtml(scan.bouw)} · totaalscore ${Number(scan.overall_score).toFixed(1)}</p>
        </div>
        <div style="background:white;padding:24px;border-radius:0 0 16px 16px">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead><tr style="background:#f9fafb"><th style="padding:10px;text-align:left">Thema</th><th>Ik</th><th>School</th><th style="text-align:left">Niveau</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="margin-top:22px;padding:16px;background:#eff6ff;border-left:4px solid #1E88E5">
            <strong>Aanbevolen route ${scan.recommended_route}:</strong> ${escapeHtml(ROUTE_NAMES[scan.recommended_route - 1])}
          </div>
          ${scan.extra_answer ? `<div style="margin-top:18px"><strong>Jouw opmerking</strong><p style="line-height:1.6">${escapeHtml(scan.extra_answer)}</p></div>` : ''}
          <p style="margin-top:24px;color:#6b7280;font-size:12px">Dit bericht is automatisch verstuurd. Je e-mailadres is niet opgeslagen.</p>
        </div>
      </div></body></html>`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM'),
        to: [cleanEmail],
        subject: 'Jouw resultaten – Nulmeting Digitale Geletterdheid',
        html
      })
    });
    const resendResult = await resendResponse.json();
    if (!resendResponse.ok) {
      console.error(resendResult);
      return jsonResponse({ error: 'De e-mail kon niet worden verzonden.' }, 502);
    }

    await supabase.from('email_deliveries').insert({
      scan_id: scanId,
      provider_message_id: resendResult.id || null
    });
    return jsonResponse({ sent: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'De e-mail kon niet worden verzonden.' }, 500);
  }
});