import { runOAuthSetup } from "./oauth.js";

runOAuthSetup().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
