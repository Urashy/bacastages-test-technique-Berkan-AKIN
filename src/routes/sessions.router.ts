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
      include: {
        hostSchool: true,
        _count: { select: { participants: true } },
      },
    });

    const result = sessions.map((session) => {
      const { _count, hostSchool, ...rest } = session;
      return { ...rest, school: hostSchool, participantCount: _count.participants };
    });

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

    if (!session) {
      return res.status(404).json({ error: 'Session introuvable.' });
    }
    res.json({ data: session });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:id/stats
router.get('/:id/stats', async (req, res, next) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        participants: {
          include: {
            originSchool: true,
            convention: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session introuvable.' });
    }

    const participants = session.participants;

    const byStatus = {
      registered: 0,
      cancelled: 0,
      attended: 0,
      absent: 0,
    };
    for (const p of participants) {
      byStatus[p.status.toLowerCase() as keyof typeof byStatus]++;
    }

    const nonCancelled = participants.filter((p) => p.status !== 'CANCELLED');

    const validatedCount = nonCancelled.filter(
      (p) => p.convention?.status === 'VALIDATED'
    ).length;
    const conventionRate =
      nonCancelled.length > 0
        ? Math.round((validatedCount / nonCancelled.length) * 100) / 100
        : 0;

    const schoolCounts = new Map<string, { schoolName: string; count: number }>();
    for (const p of nonCancelled) {
      if (p.originSchool) {
        const existing = schoolCounts.get(p.originSchool.id);
        if (existing) {
          existing.count++;
        } else {
          schoolCounts.set(p.originSchool.id, {
            schoolName: p.originSchool.name,
            count: 1,
          });
        }
      }
    }

    const topOriginSchools = Array.from(schoolCounts.entries())
      .map(([schoolId, { schoolName, count }]) => ({ schoolId, schoolName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    res.json({
      sessionId: session.id,
      totalParticipants: participants.length,
      byStatus,
      conventionRate,
      topOriginSchools,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
