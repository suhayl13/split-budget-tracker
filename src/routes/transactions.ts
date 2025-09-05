import { Router } from 'express';
import { z } from 'zod';
import { repo } from '../repo/memoryRepo';
import { CreateExpenseSchema } from '../lib/validation';
import { nowIso, toCents, fromCents } from '../lib/money';
import { JournalTx } from '../domain/journal';

export const transactionsRouter = Router();

transactionsRouter.get('/', (_req, res) => {
  const list = repo.getAll().map(t => {
    if (t.kind === 'GROUP_EXPENSE') {
      const half = Math.floor(t.totalCents / 2);
      const splitEach = fromCents(t.totalCents - half); // show the larger share (handles odd cent)
      return { ...t, total: fromCents(t.totalCents), splitEach };
    }
    return { ...t, amount: fromCents(t.amountCents) };
  });
  res.json({ transactions: list });
});

transactionsRouter.post('/', (req, res) => {
  const body = CreateExpenseSchema.parse(req.body);
  const tx: JournalTx = {
    id: 'tx_' + Math.random().toString(36).slice(2, 10),
    kind: 'GROUP_EXPENSE',
    paidBy: body.paidBy,
    totalCents: toCents(body.total),
    category: body.category,
    note: body.note,
    timestamp: nowIso(),
  };
  repo.add(tx);
  const half = Math.floor(tx.totalCents / 2);
  const splitEach = fromCents(tx.totalCents - half);
  res.status(201).json({
    transaction: {
      ...tx,
      total: fromCents(tx.totalCents),
      splitEach,
    }
  });
});
