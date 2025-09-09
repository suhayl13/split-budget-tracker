import { z } from "zod";

export const CreateExpenseSchema = z.object({
  paidBy: z.enum(["A", "B"]),
  total: z.number().positive(),
  category: z
    .enum(["food", "transport", "groceries", "general"])
    .default("general"),
  note: z.string().optional(),
});

export const SettleSchema = z
  .object({
    from: z.enum(["A", "B"]),
    to: z.enum(["A", "B"]),
    amount: z.number().positive().optional(),
  })
  .refine(
    (data) => data.from !== data.to, // from and to must differ
    { error: "from and to must differ", path: ["to"] }
  );
