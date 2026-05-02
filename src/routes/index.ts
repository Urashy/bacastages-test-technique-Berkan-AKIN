import { Router } from 'express';
import sessionsRouter from './sessions.router';
import participantsRouter from './participants.router';

export const router = Router();

router.use('/sessions', sessionsRouter);
router.use('/sessions', participantsRouter);
