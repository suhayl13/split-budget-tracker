import { Router } from 'express';
import { SettleSchema } from '../lib/validation';
import { repo } from '../repo/memoryRepo';
import { Engine } from '../domain/engine';
import { fromCents, nowIso, toCents } from '../lib/money';
import { UsersConfig } from './users';
import { JournalTx } from '../domain/journal';
import { z } from 'zod';

export const settleRouter = Router();

settleRouter.post('/', (req, res) => {
  try {
  const body = SettleSchema.parse(req.body);
  const state = Engine.applyJournal(repo.getAll(), UsersConfig);

  // Compute who owes whom and how much
  let owedFrom: 'A' | 'B' | null = null;
  let owedTo: 'A' | 'B' | null = null;
  let maxAmountCents = 0;

  if (state.netBOwesATotalCents > 0) { // B owes A
    owedFrom = 'B'; owedTo = 'A'; maxAmountCents = state.netBOwesATotalCents;
  } else if (state.netBOwesATotalCents < 0) { // A owes B
    owedFrom = 'A'; owedTo = 'B'; maxAmountCents = -state.netBOwesATotalCents;
  } else {
    return res.status(400).json({ error: 'Nothing to settle. Net is zero.' });
  }

  if (body.from !== owedFrom || body.to !== owedTo) {
    return res.status(400).json({ error: `Direction invalid. Currently ${owedFrom} owes ${owedTo}.` });
  }

  let applyCents = maxAmountCents;
  if (typeof body.amount === 'number') {
    const reqCents = toCents(body.amount);
    applyCents = Math.min(reqCents, maxAmountCents);
  }

  const tx: JournalTx = {
    id: 'tx_' + Math.random().toString(36).slice(2, 10),
    kind: 'SETTLEMENT',
    from: body.from,
    to: body.to,
    amountCents: applyCents,
    timestamp: nowIso(),
  };
  repo.add(tx);

  res.status(201).json({
    settlement: { ...tx, amount: fromCents(tx.amountCents) },
    capped: applyCents !== (body.amount ? toCents(body.amount) : applyCents),
  });
} catch (err) {
  if (err instanceof z.ZodError) {

      return res.status(400).json({error:err.issues[0].message});
    }
    throw err;
  }
});
