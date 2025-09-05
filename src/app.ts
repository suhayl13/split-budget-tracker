import express from 'express';
import cors from 'cors';
import { usersRouter } from './routes/users';
import { transactionsRouter } from './routes/transactions';
import { settleRouter } from './routes/settle';
import { repo } from './repo/memoryRepo';

const app = express();
app.use(cors());
app.use(express.json());

// required endpoints
app.use('/users', usersRouter);
app.use('/transactions', transactionsRouter);
app.use('/settle', settleRouter);

// (dev) reset endpoint to clear data.json
app.post('/reset', (_req, res) => {
  repo.clear();
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Split & Budget Tracker listening on http://localhost:${PORT}`);
});
