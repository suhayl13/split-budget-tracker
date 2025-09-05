import { Router } from 'express';
import { repo } from '../repo/memoryRepo';
import { Engine } from '../domain/engine';
import { fromCents } from '../lib/money';

export const usersRouter = Router();

const CFG = { startingWalletCents: 50000, monthlyBudgetCents: 50000 };

usersRouter.get('/', (_req, res) => {
  const state = Engine.applyJournal(repo.getAll(), CFG);
  const A = state.users.A;
  const B = state.users.B;

  const responseUsers = [A, B].map(u => ({
    id: u.id,
    name: u.name,
    walletBalance: fromCents(u.walletBalanceCents),
    monthlyBudget: fromCents(u.monthlyBudgetCents),
    spentByCategory: Object.fromEntries(
      Object.entries(u.spentByCategoryCents).map(([k, v]) => [k, fromCents(v as number)])
    ),
  }));

  let receivableA = 0, payableA = 0, receivableB = 0, payableB = 0;
  if (state.netBOwesATotalCents > 0) {
    receivableA = state.netBOwesATotalCents;
    payableB = state.netBOwesATotalCents;
  } else if (state.netBOwesATotalCents < 0) {
    receivableB = -state.netBOwesATotalCents;
    payableA = -state.netBOwesATotalCents;
  }

  res.json({
    users: responseUsers.map(u => ({
      ...u,
      receivableFromOther: fromCents(u.id === 'A' ? receivableA : receivableB),
      payableToOther: fromCents(u.id === 'A' ? payableA : payableB),
      netBetweenUsers: fromCents(u.id === 'A' ? state.netBOwesATotalCents : -state.netBOwesATotalCents)
    }))
  });
});

export const UsersConfig = CFG;
