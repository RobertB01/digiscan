-- Analyse van de laatste scan, inclusief vraagteksten.
-- Plakken in Supabase Dashboard -> SQL Editor en uitvoeren.
-- De vraagteksten staan niet in de database (alleen in de frontend),
-- daarom worden ze hier inline meegegeven via een CTE.

with vragen (question_id, thema, tekst) as (
  values
    (1,  'Visie en koers', 'Ik vind digitale geletterdheid net zo belangrijk als andere basisvaardigheden op school.'),
    (2,  'Visie en koers', 'Ik kan in gewone taal uitleggen waarom digitale geletterdheid belangrijk is voor onze leerlingen.'),
    (3,  'Visie en koers', 'Ik heb een duidelijk beeld van wat leerlingen op onze school hierover moeten leren.'),
    (4,  'Visie en koers', 'Ik zie digitale geletterdheid als een vast onderdeel van goed onderwijs.'),
    (5,  'Visie en koers', 'Ik weet hoe digitale geletterdheid past bij onze leerlingen en bij onze school.'),
    (6,  'Visie en koers', 'De koers van onze school helpt mij om gerichte keuzes te maken in mijn groep.'),
    (7,  'Visie en koers', 'Binnen ons team vinden we digitale geletterdheid echt belangrijk.'),
    (8,  'Visie en koers', 'Op onze school is duidelijk waarom we met digitale geletterdheid bezig zijn.'),
    (9,  'Visie en koers', 'Op onze school is duidelijk waar we met digitale geletterdheid naartoe werken.'),
    (10, 'Visie en koers', 'Binnen ons team praten we op een vergelijkbare manier over digitale geletterdheid.'),
    (11, 'Visie en koers', 'Op onze school is zichtbaar welke plek digitale geletterdheid inneemt in het onderwijs.'),
    (12, 'Visie en koers', 'Op onze school is digitale geletterdheid iets voor de lange termijn.'),
    (13, 'Bekwaamheid en zelfvertrouwen', 'Ik voel mij bekwaam genoeg om les te geven over digitale geletterdheid.'),
    (14, 'Bekwaamheid en zelfvertrouwen', 'Ik weet welke onderwerpen onder digitale geletterdheid vallen.'),
    (15, 'Bekwaamheid en zelfvertrouwen', 'Ik kan leerdoelen voor digitale geletterdheid koppelen aan mijn eigen groep.'),
    (16, 'Bekwaamheid en zelfvertrouwen', 'Ik kan digitale geletterdheid vertalen naar haalbare lessen in de klas.'),
    (17, 'Bekwaamheid en zelfvertrouwen', 'Ik voel mij zeker genoeg om met leerlingen in gesprek te gaan over digitale onderwerpen.'),
    (18, 'Bekwaamheid en zelfvertrouwen', 'Ik kan bewust kiezen in welke situaties technologie in een les echt iets toevoegt.'),
    (19, 'Bekwaamheid en zelfvertrouwen', 'Ik geef zelf het goede voorbeeld in hoe ik met digitale middelen en media omga.'),
    (20, 'Bekwaamheid en zelfvertrouwen', 'Ik weet genoeg van de digitale leefwereld van mijn leerlingen om daarop aan te sluiten.'),
    (21, 'Bekwaamheid en zelfvertrouwen', 'Binnen ons team is genoeg kennis aanwezig om digitale geletterdheid goed aan te pakken.'),
    (22, 'Bekwaamheid en zelfvertrouwen', 'Collega''s leren op onze school van elkaar op het gebied van digitale geletterdheid.'),
    (23, 'Bekwaamheid en zelfvertrouwen', 'Op onze school wordt groei van leerkrachten op digitale geletterdheid serieus genomen.'),
    (24, 'Bekwaamheid en zelfvertrouwen', 'Ik weet bij wie ik terechtkan als ik hulp nodig heb op dit gebied.'),
    (25, 'Lespraktijk en didactiek', 'Ik geef regelmatig lessen of activiteiten waarin digitale geletterdheid zichtbaar aan bod komt.'),
    (26, 'Lespraktijk en didactiek', 'Ik kan digitale geletterdheid koppelen aan vakken, thema''s of projecten die ik al geef.'),
    (27, 'Lespraktijk en didactiek', 'Ik maak bewust keuzes tussen leren met schermen en leren zonder schermen.'),
    (28, 'Lespraktijk en didactiek', 'Ik gebruik werkvormen waarbij leerlingen actief onderzoeken, maken, bespreken of reflecteren.'),
    (29, 'Lespraktijk en didactiek', 'Ik help leerlingen om kritisch na te denken over wat zij online zien, doen en delen.'),
    (30, 'Lespraktijk en didactiek', 'Op onze school heeft digitale geletterdheid een herkenbare plek in de dagelijkse lespraktijk.'),
    (31, 'Lespraktijk en didactiek', 'Op onze school zijn duidelijke afspraken over hoe digitale geletterdheid in de klas terugkomt.'),
    (32, 'Lespraktijk en didactiek', 'Binnen ons team delen we lesideeën en werkvormen rond digitale geletterdheid met elkaar.'),
    (33, 'Lespraktijk en didactiek', 'Op onze school krijgt digitale geletterdheid structureel aandacht.'),
    (34, 'Lespraktijk en didactiek', 'Op onze school leren leerlingen digitale technologie zowel gebruiken als begrijpen.'),
    (35, 'Inhoudelijke dekking', 'Ik weet dat digitale geletterdheid uit meerdere onderdelen bestaat.'),
    (36, 'Inhoudelijke dekking', 'Ik zie het verschil tussen alleen digitale vaardigheden oefenen en echt begrip opbouwen.'),
    (37, 'Inhoudelijke dekking', 'In mijn onderwijs gaat digitale geletterdheid over meer dan alleen apparaten of mediawijsheid.'),
    (38, 'Inhoudelijke dekking', 'Ik kan leerlingen begeleiden bij het zoeken, beoordelen en gebruiken van digitale informatie.'),
    (39, 'Inhoudelijke dekking', 'Ik kan veiligheid, privacy en online gedrag op een passende manier bespreken in mijn groep.'),
    (40, 'Inhoudelijke dekking', 'Op onze school komen de verschillende onderdelen van digitale geletterdheid breed genoeg aan bod.'),
    (41, 'Inhoudelijke dekking', 'Op onze school gaat digitale geletterdheid zowel over doen als over begrijpen en kritisch denken.'),
    (42, 'Inhoudelijke dekking', 'Binnen ons team is duidelijk welke onderdelen van digitale geletterdheid nog te weinig aandacht krijgen.'),
    (43, 'Inhoudelijke dekking', 'Op onze school is er aandacht voor actuele thema''s zoals AI, beïnvloeding en digitale balans.'),
    (44, 'Inhoudelijke dekking', 'De inhoud van digitale geletterdheid wordt op onze school steeds breder en sterker ingevuld.'),
    (45, 'Randvoorwaarden en ondersteuning', 'Ik heb genoeg tijd om digitale geletterdheid voor te bereiden of in mijn onderwijs op te nemen.'),
    (46, 'Randvoorwaarden en ondersteuning', 'Ik weet welke lessen, materialen of bronnen ik kan gebruiken voor digitale geletterdheid.'),
    (47, 'Randvoorwaarden en ondersteuning', 'Ik krijg genoeg praktische steun om hiermee aan de slag te gaan.'),
    (48, 'Randvoorwaarden en ondersteuning', 'Ik beschik in mijn groep over werkbare digitale middelen als ik die nodig heb.'),
    (49, 'Randvoorwaarden en ondersteuning', 'Op onze school zijn voldoende materialen of bronnen beschikbaar voor digitale geletterdheid.'),
    (50, 'Randvoorwaarden en ondersteuning', 'De digitale infrastructuur van onze school werkt goed genoeg om dit onderwijs te ondersteunen.'),
    (51, 'Randvoorwaarden en ondersteuning', 'Op onze school is duidelijk wie hierin een trekkende of coördinerende rol heeft.'),
    (52, 'Randvoorwaarden en ondersteuning', 'Op onze school wordt digitale geletterdheid door het hele team gedragen.'),
    (53, 'Ontwikkeling, evaluatie en borging', 'Ik weet welke ontwikkeling ik bij leerlingen wil zien op het gebied van digitale geletterdheid.'),
    (54, 'Ontwikkeling, evaluatie en borging', 'Ik kan zien waar mijn leerlingen al sterk in zijn en waar zij nog moeten groeien.'),
    (55, 'Ontwikkeling, evaluatie en borging', 'Ik denk bewust na over wat in mijn aanpak al goed werkt en wat nog beter kan.'),
    (56, 'Ontwikkeling, evaluatie en borging', 'Ik gebruik observaties, gesprekken of leerlingwerk om zicht te krijgen op groei in digitale geletterdheid.'),
    (57, 'Ontwikkeling, evaluatie en borging', 'Binnen ons team bespreken we wat goed gaat en wat nog aandacht vraagt rond digitale geletterdheid.'),
    (58, 'Ontwikkeling, evaluatie en borging', 'Op onze school hebben we zicht op sterke en zwakke punten in digitale geletterdheid.'),
    (59, 'Ontwikkeling, evaluatie en borging', 'Op onze school kiezen we duidelijke prioriteiten in plaats van alles tegelijk te willen.'),
    (60, 'Ontwikkeling, evaluatie en borging', 'Op onze school worden gemaakte keuzes rond digitale geletterdheid ook vastgehouden en uitgebouwd.')
),
laatste_scan as (
  select id from scans order by created_at desc limit 1
)
select
  r.question_id as nr,
  v.thema,
  r.perspective as perspectief,
  r.score,
  v.tekst as stelling
from responses r
join vragen v on v.question_id = r.question_id
where r.scan_id = (select id from laatste_scan)
order by r.question_id;
