import { PrismaClient, SessionStatus, ParticipantStatus, ConventionStatus } from '@prisma/client';

const prisma = new PrismaClient();

const SCHOOLS = [
  { name: 'Lycée Jean Moulin', city: 'Bordeaux', zipCode: '33000' },
  { name: 'Lycée Marie Curie', city: 'Versailles', zipCode: '78000' },
  { name: 'Collège Victor Hugo', city: 'Lyon', zipCode: '69001' },
  { name: 'Lycée Louis Pasteur', city: 'Strasbourg', zipCode: '67000' },
  { name: 'Lycée Jules Ferry', city: 'Paris', zipCode: '75009' },
  { name: 'Lycée Simone Veil', city: 'Nantes', zipCode: '44000' },
  { name: 'Collège Albert Camus', city: 'Marseille', zipCode: '13001' },
  { name: 'Lycée Émile Zola', city: 'Rennes', zipCode: '35000' },
  { name: 'Lycée Blaise Pascal', city: 'Clermont-Ferrand', zipCode: '63000' },
  { name: 'Collège François Villon', city: 'Lille', zipCode: '59000' },
];

const SESSION_TEMPLATES = [
  { title: 'Ministage Informatique et Numérique', description: 'Découverte du code et des métiers du numérique' },
  { title: 'Ministage Sciences et Technologies', description: 'Expériences scientifiques en laboratoire' },
  { title: 'Ministage Arts et Design', description: 'Initiation au design graphique et à l\'illustration' },
  { title: 'Ministage Mécanique et Robotique', description: 'Construction et programmation de robots' },
  { title: 'Ministage Santé et Biologie', description: 'Découverte des métiers de la santé' },
  { title: 'Ministage Communication et Médias', description: 'Journalisme, radio et création de contenu' },
  { title: 'Ministage Architecture et BTP', description: 'Maquettes, plans et visites de chantier' },
  { title: 'Ministage Électronique et Domotique', description: 'Systèmes embarqués et maison connectée' },
  { title: 'Ministage Agronomie et Environnement', description: 'Agriculture durable et biodiversité' },
  { title: 'Ministage Finance et Gestion', description: 'Comptabilité et finance d\'entreprise' },
];

const FIRST_NAMES = ['Emma', 'Lucas', 'Chloé', 'Nathan', 'Léa', 'Hugo', 'Manon', 'Tom', 'Inès', 'Théo', 'Camille', 'Raphaël', 'Zoé', 'Maxime', 'Sarah', 'Antoine', 'Clara', 'Baptiste', 'Jade', 'Mathis'];
const LAST_NAMES  = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier'];

const CAPACITIES = [5, 8, 10, 8, 12, 10, 6, 15, 10, 8, 12, 10, 8, 6, 10, 12, 8, 10, 15, 8];
const STATUSES: SessionStatus[] = [
  'OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN',
  'OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN',
  'OPEN', 'OPEN', 'OPEN', 'OPEN', 'OPEN',
  'CLOSED', 'CLOSED', 'CLOSED',
  'CANCELLED', 'CANCELLED',
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

async function main() {
  const existing = await prisma.school.count();
  if (existing > 0) {
    console.log('Base déjà initialisée, seed ignoré.');
    return;
  }

  console.log('Initialisation de la base de données...');

  const schools = await prisma.$transaction(
    SCHOOLS.map(s => prisma.school.create({ data: s }))
  );

  const baseDate = new Date('2026-04-29T00:00:00.000Z');

  const sessions = [];
  for (let i = 0; i < 20; i++) {
    const template = SESSION_TEMPLATES[i % SESSION_TEMPLATES.length];
    const hostSchool = schools[i % schools.length];
    const daysOffset = (i - 10) * 7;
    const startDate = new Date(baseDate.getTime() + daysOffset * 86400000);
    const endDate   = new Date(startDate.getTime() + 3 * 86400000);

    const session = await prisma.session.create({
      data: {
        title: `${template.title} — ${hostSchool.city}`,
        description: template.description,
        hostSchoolId: hostSchool.id,
        maxCapacity: CAPACITIES[i],
        allocatedPlaces: 0,
        startDate,
        endDate,
        status: STATUSES[i],
      },
    });
    sessions.push(session);
  }

  let participantTotal = 0;

  for (let si = 0; si < sessions.length; si++) {
    const session = sessions[si];
    const count = session.maxCapacity + 3 + Math.floor(seededRandom(si * 7) * 5);

    for (let pi = 0; pi < count; pi++) {
      const seed = si * 100 + pi;
      const statusRoll = seededRandom(seed);
      const status: ParticipantStatus =
        statusRoll < 0.65 ? 'REGISTERED'
        : statusRoll < 0.80 ? 'CANCELLED'
        : statusRoll < 0.93 ? 'ATTENDED'
        : 'ABSENT';

      const originSchool = seededRandom(seed + 1) > 0.1
        ? schools[Math.floor(seededRandom(seed + 2) * schools.length)]
        : null;

      const birthYear = 2008 + Math.floor(seededRandom(seed + 3) * 4);
      const birthMonth = 1 + Math.floor(seededRandom(seed + 4) * 12);
      const birthDay = 1 + Math.floor(seededRandom(seed + 5) * 28);

      const participant = await prisma.participant.create({
        data: {
          sessionId: session.id,
          firstName: pick(FIRST_NAMES, seed),
          lastName: pick(LAST_NAMES, seed + 3),
          birthDate: new Date(`${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`),
          status,
          originSchoolId: originSchool?.id ?? null,
        },
      });
      participantTotal++;

      if (status !== 'CANCELLED' && seededRandom(seed + 6) < 0.65) {
        const convRoll = seededRandom(seed + 7);
        const convStatus: ConventionStatus =
          convRoll < 0.60 ? 'VALIDATED'
          : convRoll < 0.85 ? 'PENDING'
          : 'REJECTED';

        await prisma.convention.create({
          data: { participantId: participant.id, status: convStatus },
        });
      }
    }
  }

  console.log(`Seed terminé : ${schools.length} établissements, ${sessions.length} sessions, ${participantTotal} participants.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
