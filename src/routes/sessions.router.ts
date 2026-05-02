import { Router } from 'express';
import { SessionStatus } from '@prisma/client';
import { prisma } from '../prisma';

const router = Router();

// GET /api/sessions
// Paramètre optionnel : ?status=OPEN|CLOSED|CANCELLED
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;

    const sessions = await prisma.session.findMany({
      where: status ? { status: status as SessionStatus } : undefined,
      orderBy: { startDate: 'asc' },
    });

    const result = await Promise.all(
      sessions.map(async (session) => {
        const school = await prisma.school.findUnique({
          where: { id: session.hostSchoolId },
        });
        const participantCount = await prisma.participant.count({
          where: { sessionId: session.id },
        });
        return { ...session, school, participantCount };
      })
    );

    res.json({ data: result, total: result.length });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        hostSchool: true,
        participants: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    res.json({ data: session });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:id/stats
router.get('/:id/stats', async (req, res, next) => {
  try {
    // TODO : implémenter cet endpoint
    //
    // Réponse attendue :
    // {
    //   sessionId: string,
    //   totalParticipants: number,
    //   byStatus: {
    //     registered: number,
    //     cancelled: number,
    //     attended: number,
    //     absent: number,
    //   },
    //   conventionRate: number,   // proportion de participants non-annulés avec une convention VALIDATED
    //   topOriginSchools: [       // top 3 par nombre de participants non-annulés, ordre décroissant
    //     { schoolId: string, schoolName: string, count: number }
    //   ]
    // }
    //
    // Contrainte : pas de requête N+1.

    res.status(501).json({ error: 'Not implemented' });
  } catch (error) {
    next(error);
  }
});

export default router;
