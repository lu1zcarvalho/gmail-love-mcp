import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const srcDir = path.dirname(currentFile);
export const projectRoot = path.resolve(srcDir, "..");

export const credentialsPath =
  process.env.GMAIL_OAUTH_CLIENT_PATH ??
  path.join(projectRoot, "credentials", "oauth-client.json");

export const tokenPath =
  process.env.GMAIL_TOKEN_PATH ??
  path.join(projectRoot, "tokens", "gmail-token.json");

export const oauthLoopbackPort = Number(process.env.GMAIL_OAUTH_PORT ?? "3008");

export const gmailScopes = ["https://www.googleapis.com/auth/gmail.compose"];

export const exactSendConfirmation = (draftId: string) => `ENVIAR ${draftId}`;
