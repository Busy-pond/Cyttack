/** Direct seed entrypoint — only used by `pnpm seed`, never imported. */
import { seed } from "./seed.js";

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
