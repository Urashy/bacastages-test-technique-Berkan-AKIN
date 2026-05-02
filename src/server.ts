import express from 'express';
import morgan from 'morgan';
import { router } from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', router);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\nAPI démarrée sur http://localhost:${PORT}`);
  console.log('Endpoints disponibles :');
  console.log('  GET  /health');
  console.log('  GET  /api/sessions');
  console.log('  GET  /api/sessions/:id');
  console.log('  POST /api/sessions/:id/participants');
  console.log('  GET  /api/sessions/:id/stats\n');
});

export default app;
