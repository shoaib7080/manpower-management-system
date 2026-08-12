// One-time cleanup script for pre-existing bad `trade` values that predate
// enum validation being enforced on import/update.
//
// Run from the server/ directory:
//   node scripts/fixEmployeeTrades.js            (dry run — no writes)
//   node scripts/fixEmployeeTrades.js --apply     (actually writes fixes)
//
// What it does:
//   1. Finds every employee whose stored `trade` isn't an exact match in
//      TRADES.
//   2. If it matches a canonical trade case-insensitively (e.g. "WELDER" vs
//      "Welder"), that's a safe, unambiguous auto-fix.
//   3. Anything that doesn't match at all (e.g. "spray painter" as a literal
//      trade, not a casing issue) is printed for you to review and decide by
//      hand — the script deliberately does not guess at these.

import dotenv from "dotenv";
import mongoose from "mongoose";
import { TRADES } from "../config/constants.js";
import Employee from "../models/Employee.js";

dotenv.config({ path: "../.env" });

const APPLY = process.argv.includes("--apply");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(
    `Connected. Mode: ${APPLY ? "APPLY (writing changes)" : "DRY RUN (no writes)"}\n`,
  );

  const tradeLookup = new Map(TRADES.map((t) => [t.toLowerCase(), t]));
  const employees = await Employee.find({}).select(
    "employeeId name trade specialization",
  );

  const fixable = [];
  const unresolved = [];

  for (const emp of employees) {
    const raw = (emp.trade || "").trim();
    if (TRADES.includes(raw)) continue; // already valid, nothing to do

    const canonical = tradeLookup.get(raw.toLowerCase());
    if (canonical) {
      fixable.push({
        id: emp._id,
        employeeId: emp.employeeId,
        name: emp.name,
        from: raw,
        to: canonical,
      });
    } else {
      unresolved.push({
        employeeId: emp.employeeId,
        name: emp.name,
        storedTrade: raw,
      });
    }
  }

  console.log(`Case/whitespace mismatches (safe auto-fix): ${fixable.length}`);
  console.table(
    fixable.map(({ employeeId, name, from, to }) => ({
      employeeId,
      name,
      from,
      to,
    })),
  );

  if (APPLY && fixable.length) {
    for (const f of fixable) {
      await Employee.updateOne({ _id: f.id }, { $set: { trade: f.to } });
    }
    console.log(`Applied ${fixable.length} fixes.\n`);
  } else if (fixable.length) {
    console.log("Dry run only — re-run with --apply to write these changes.\n");
  }

  console.log(
    `\nNo canonical match at all (needs a manual decision): ${unresolved.length}`,
  );
  console.table(unresolved);
  if (unresolved.length) {
    console.log(
      "\nFor each of these, decide the correct canonical `trade` and, if the\n" +
        'original value describes a real specialization (e.g. "spray painter"),\n' +
        "add it to the Specialization collection for that trade first, then set\n" +
        "it on the employee via the (now-fixed) update endpoint or a follow-up script.",
    );
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
