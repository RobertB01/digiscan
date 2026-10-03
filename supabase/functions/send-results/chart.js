// Bouwt het spinnenweb (radardiagram) als SVG-string, server-side.
// Geen afhankelijkheden, zodat dit zowel in Deno (edge function) als Node (test) werkt.

const SHORT_LABELS = ['Visie', 'Bekwaam', 'Lespraktijk', 'Inhoud', 'Randvw.', 'Borging'];

const IK_COLOR = '#1E88E5';
const IK_FILL = 'rgba(30, 136, 229, 0.25)';
const SCHOOL_COLOR = '#26A69A';
const SCHOOL_FILL = 'rgba(38, 166, 154, 0.25)';

const WIDTH = 640;
const HEIGHT = 580;
const CENTER_X = 320;
const CENTER_Y = 265;
const RADIUS = 175;
const LABEL_RADIUS = 215;

const FONT = 'DejaVu Sans';

const point = (index, value, total, radius = RADIUS) => {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const r = (value / 10) * radius;
  return {
    x: CENTER_X + r * Math.cos(angle),
    y: CENTER_Y + r * Math.sin(angle)
  };
};

const round = (value) => Math.round(value * 100) / 100;

const polygonPoints = (values) => values
  .map((value, i) => {
    const p = point(i, value, values.length);
    return `${round(p.x)},${round(p.y)}`;
  })
  .join(' ');

export const buildRadarSvg = (ikScores, schoolScores) => {
  const count = SHORT_LABELS.length;
  const parts = [];

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">`);
  parts.push(`<rect width="${WIDTH}" height="${HEIGHT}" fill="white"/>`);

  // Gridringen met schaalcijfers op de bovenste as
  for (const level of [2, 4, 6, 8, 10]) {
    const points = Array.from({ length: count }, (_, i) => {
      const p = point(i, level, count);
      return `${round(p.x)},${round(p.y)}`;
    }).join(' ');
    parts.push(`<polygon points="${points}" fill="none" stroke="#E5E7EB" stroke-width="1.5"/>`);
    parts.push(`<text x="${CENTER_X}" y="${round(CENTER_Y - (level / 10) * RADIUS - 6)}" text-anchor="middle" font-family="${FONT}" font-size="13" fill="#9CA3AF">${level}</text>`);
  }

  // Assen
  for (let i = 0; i < count; i += 1) {
    const p = point(i, 10, count);
    parts.push(`<line x1="${CENTER_X}" y1="${CENTER_Y}" x2="${round(p.x)}" y2="${round(p.y)}" stroke="#E5E7EB" stroke-width="1.5"/>`);
  }

  // Scorevlakken (eerst school, dan ik, zodat beide randen zichtbaar blijven)
  parts.push(`<polygon points="${polygonPoints(schoolScores)}" fill="${SCHOOL_FILL}" stroke="${SCHOOL_COLOR}" stroke-width="3" stroke-linejoin="round"/>`);
  parts.push(`<polygon points="${polygonPoints(ikScores)}" fill="${IK_FILL}" stroke="${IK_COLOR}" stroke-width="3" stroke-linejoin="round"/>`);

  // Scorepunten
  schoolScores.forEach((score, i) => {
    const p = point(i, score, count);
    parts.push(`<circle cx="${round(p.x)}" cy="${round(p.y)}" r="6" fill="${SCHOOL_COLOR}" stroke="white" stroke-width="2"/>`);
  });
  ikScores.forEach((score, i) => {
    const p = point(i, score, count);
    parts.push(`<circle cx="${round(p.x)}" cy="${round(p.y)}" r="6" fill="${IK_COLOR}" stroke="white" stroke-width="2"/>`);
  });

  // Themalabels rondom het web
  SHORT_LABELS.forEach((label, i) => {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    const x = CENTER_X + LABEL_RADIUS * Math.cos(angle);
    let y = CENTER_Y + LABEL_RADIUS * Math.sin(angle);
    let anchor = 'middle';
    if (x < CENTER_X - 10) anchor = 'end';
    else if (x > CENTER_X + 10) anchor = 'start';
    if (Math.abs(y - CENTER_Y) > LABEL_RADIUS * 0.9) y += y < CENTER_Y ? -4 : 12;
    parts.push(`<text x="${round(x)}" y="${round(y)}" text-anchor="${anchor}" font-family="${FONT}" font-size="16" font-weight="bold" fill="#374151">${i + 1}. ${label}</text>`);
  });

  // Legenda onderaan
  const legendY = HEIGHT - 42;
  parts.push(`<rect x="185" y="${legendY - 12}" width="26" height="14" rx="3" fill="${IK_COLOR}"/>`);
  parts.push(`<text x="219" y="${legendY}" font-family="${FONT}" font-size="15" fill="#374151">Ik</text>`);
  parts.push(`<rect x="270" y="${legendY - 12}" width="26" height="14" rx="3" fill="${SCHOOL_COLOR}"/>`);
  parts.push(`<text x="304" y="${legendY}" font-family="${FONT}" font-size="15" fill="#374151">School</text>`);

  parts.push('</svg>');
  return parts.join('');
};
