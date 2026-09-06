import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || '*';
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin'
};
const jsonResponse = (body: unknown, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' } }
);

type Answers = Record<string, number>;

const THEMES = [
  { id: 1, from: 1, to: 12, individual: new Set([1, 2, 3, 4, 5, 6]) },
  { id: 2, from: 13, to: 24, individual: new Set([13, 14, 15, 16, 17, 18, 19, 20, 24]) },
  { id: 3, from: 25, to: 34, individual: new Set([25, 26, 27, 28, 29]) },
  { id: 4, from: 35, to: 44, individual: new Set([35, 36, 37, 38, 39]) },
  { id: 5, from: 45, to: 52, individual: new Set([45, 46, 47, 48]) },
  { id: 6, from: 53, to: 60, individual: new Set([53, 54, 55, 56]) }
];

const averageOnTen = (values: number[]) =>
  (values.reduce((sum, value) => sum + value, 0) / values.length) * 2;

const routeFor = (scores: number[]) => {
  const lowest = Math.min(...scores);
  const lowestIndex = scores.findIndex((score) => score === lowest);
  if (lowestIndex === 0 || scores[0] < 5.2) return 1;
  if (scores[1] < 5.6 && scores[0] >= 5.2) return 2;
  if (scores[2] < 6 && scores[0] >= 5.2 && scores[1] >= 5.2) return 3;
  if (scores[3] < 6 && scores[0] >= 5.2 && scores[1] >= 5.2 && scores[2] >= 5.2) return 4;
  if (scores[4] < 6 && Math.max(scores[0], scores[1]) >= 6) return 5;
  if (Math.min(scores[0], scores[1], scores[2], scores[3]) >= 6.8 && scores[5] < 6.4) return 6;
  return Math.min(lowestIndex + 1, 6);
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Methode niet toegestaan.' }, 405);

  try {
    const body = await request.json();
    const answers = body.answers as Answers;
    const bouw = String(body.bouw || '');
    const extraAnswer = String(body.extraAnswer || '').trim();
    const questionnaireVersion = String(body.questionnaireVersion || '');
    const consentVersion = String(body.consentVersion || '');
    const allowedBouw = ['Onderbouw', 'Middenbouw', 'Bovenbouw', 'Anders'];

    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      return jsonResponse({ error: 'Antwoorden ontbreken.' }, 400);
    }
    const answerEntries = Object.entries(answers);
    if (answerEntries.length !== 60 || !answerEntries.every(([id, score]) => {
      const questionId = Number(id);
      return Number.isInteger(questionId) && questionId >= 1 && questionId <= 60 &&
        Number.isInteger(score) && score >= 1 && score <= 5;
    })) {
      return jsonResponse({ error: 'Alle 60 antwoorden moeten een score van 1 tot en met 5 hebben.' }, 400);
    }
    if (!allowedBouw.includes(bouw) || !questionnaireVersion || !consentVersion || extraAnswer.length > 2000) {
      return jsonResponse({ error: 'De aangeleverde gegevens zijn ongeldig.' }, 400);
    }

    const scores = THEMES.map((theme) => averageOnTen(
      Array.from({ length: theme.to - theme.from + 1 }, (_, index) => answers[String(theme.from + index)])
    ));
    const individualScores = THEMES.map((theme) => averageOnTen(
      [...theme.individual].map((id) => answers[String(id)])
    ));
    const schoolScores = THEMES.map((theme) => averageOnTen(
      Array.from({ length: theme.to - theme.from + 1 }, (_, index) => theme.from + index)
        .filter((id) => !theme.individual.has(id))
        .map((id) => answers[String(id)])
    ));
    const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const recommendedRoute = routeFor(scores);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );
    const { data: scan, error: scanError } = await supabase.from('scans').insert({
      questionnaire_version: questionnaireVersion,
      consent_version: consentVersion,
      bouw,
      extra_answer: extraAnswer || null,
      recommended_route: recommendedRoute,
      scores,
      individual_scores: individualScores,
      school_scores: schoolScores,
      overall_score: overallScore
    }).select('id').single();
    if (scanError) throw scanError;

    const responses = answerEntries.map(([questionId, score]) => {
      const id = Number(questionId);
      const theme = THEMES.find((item) => id >= item.from && id <= item.to)!;
      return {
        scan_id: scan.id,
        question_id: id,
        theme_id: theme.id,
        perspective: theme.individual.has(id) ? 'ik' : 'school',
        score
      };
    });
    const { error: responseError } = await supabase.from('responses').insert(responses);
    if (responseError) {
      await supabase.from('scans').delete().eq('id', scan.id);
      throw responseError;
    }

    return jsonResponse({ scanId: scan.id }, 201);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Het resultaat kon niet worden opgeslagen.' }, 500);
  }
});