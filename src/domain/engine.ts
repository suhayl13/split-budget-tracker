import { Category, DerivedState, JournalTx, UserDerived, UserId } from './journal';

const CATS: Category[] = ['food', 'transport', 'groceries', 'general'];

export interface EngineConfig {
  startingWalletCents: number; // e.g., 500_00
  monthlyBudgetCents: number;  // e.g., 500_00 (display info only)
}

function emptyUser(id: UserId, cfg: EngineConfig): UserDerived {
  const spent: Record<Category, number> = { food:0, transport:0, groceries:0, general:0 };
  return {
    id,
    name: id === 'A' ? 'User A' : 'User B',
    walletBalanceCents: cfg.startingWalletCents,
    monthlyBudgetCents: cfg.monthlyBudgetCents,
    spentByCategoryCents: spent,
  };
}

// Positive: B owes A. Negative: A owes B. Zero: settled.
function applyJournal(journal: JournalTx[], cfg: EngineConfig): DerivedState {
  const users: Record<UserId, UserDerived> = {
    A: emptyUser('A', cfg),
    B: emptyUser('B', cfg),
  };

  let netBOwesATotalCents = 0;

  for (const tx of journal) {
    if (tx.kind === 'GROUP_EXPENSE') {
      const payer: UserId = tx.paidBy;
      const other: UserId = payer === 'A' ? 'B' : 'A';

      // Cash flow: payer wallet decreases by total
      users[payer].walletBalanceCents -= tx.totalCents;

      // Budget spend: each shares half
      const half = Math.floor(tx.totalCents / 2);
      const remainder = tx.totalCents - 2 * half; // 0 or 1 cent

      // Give the remainder to the non-payer to keep payer's budget equal to half.
      const sharePayer = half;
      const shareOther = half + remainder;

      users[payer].spentByCategoryCents[tx.category] += sharePayer;
      users[other].spentByCategoryCents[tx.category] += shareOther;

      // Net who owes whom: if A paid, B owes A their share; if B paid, A owes B.
      if (payer === 'A') netBOwesATotalCents += shareOther;
      else netBOwesATotalCents -= shareOther;
    } else if (tx.kind === 'SETTLEMENT') {
      // Cash flow
      users[tx.from].walletBalanceCents -= tx.amountCents;
      users[tx.to].walletBalanceCents += tx.amountCents;

      // Reduce net B→A accordingly
      if (tx.from === 'B' && tx.to === 'A') netBOwesATotalCents -= tx.amountCents;
      else if (tx.from === 'A' && tx.to === 'B') netBOwesATotalCents += tx.amountCents;
    }
  }

  return { users, netBOwesATotalCents };
}

export const Engine = { applyJournal };
