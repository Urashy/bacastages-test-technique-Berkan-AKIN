import { Router } from 'express';
import { SessionStatus } from '@prisma/client';
import { prisma } from '../prisma';

const router = Router();

// POST /api/sessions/:id/participants
// Body : { firstName, lastName, birthDate, originSchoolId? }
router.post('/:id/participants', async (req, res, next) => {
  try {
    const { id: sessionId } = req.params;
    const { firstName, lastName, birthDate, originSchoolId } = req.body;

    if (!firstName || !lastName || !birthDate) {
      return res.status(400).json({
        error: 'Les champs firstName, lastName et birthDate sont requis.',
      });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session introuvable.' });
    }

    if (session.status !== SessionStatus.OPEN) {
      return res.status(409).json({
        error: 'Cette session n\'est plus ouverte aux inscriptions.',
      });
    }

    if (session.allocatedPlaces >= session.maxCapacity) {
      return res.status(409).json({ error: 'Cette session est complète.' });
    }

    const participant = await prisma.participant.create({
      data: {
        sessionId,
        firstName,
        lastName,
        birthDate: new Date(birthDate),
        originSchoolId: originSchoolId ?? null,
      },
    });

    res.status(201).json({ data: participant });
  } catch (error) {
    next(error);
  }
});

export default router;
