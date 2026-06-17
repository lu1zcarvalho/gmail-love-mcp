import fs from "node:fs/promises";
import http from "node:http";
import { AddressInfo } from "node:net";
import { OAuth2Client } from "google-auth-library";
import { credentialsPath, gmailScopes, oauthLoopbackPort, tokenPath } from "./config.js";
import { readJsonFile, writePrivateJson } from "./secureFile.js";

type InstalledCredentials = {
  installed?: {
    client_id: string;
    client_secret: string;
    redirect_uris?: string[];
  };
  web?: {
    client_id: string;
    client_secret: string;
    redirect_uris?: string[];
  };
};

function getOAuthClientConfig(credentials: InstalledCredentials) {
  const config = credentials.installed ?? credentials.web;
  if (!config?.client_id || !config.client_secret) {
    throw new Error(
      `Invalid OAuth client file at ${credentialsPath}. Expected Google OAuth JSON with installed.client_id/client_secret.`,
    );
  }

  return config;
}

export async function createOAuthClient(redirectUri?: string): Promise<OAuth2Client> {
  const credentials = await readJsonFile<InstalledCredentials>(credentialsPath);
  const config = getOAuthClientConfig(credentials);
  const resolvedRedirectUri =
    redirectUri ?? config.redirect_uris?.[0] ?? `http://127.0.0.1:${oauthLoopbackPort}/oauth2callback`;

  return new OAuth2Client(config.client_id, config.client_secret, resolvedRedirectUri);
}

export async function getAuthenticatedOAuthClient(): Promise<OAuth2Client> {
  const client = await createOAuthClient();

  try {
    const token = await readJsonFile<Record<string, unknown>>(tokenPath);
    client.setCredentials(token);
    return client;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new Error(`Gmail token not found at ${tokenPath}. Run: npm run auth`);
    }

    throw error;
  }
}

export async function runOAuthSetup(): Promise<void> {
  await fs.access(credentialsPath).catch(() => {
    throw new Error(
      `OAuth client file not found at ${credentialsPath}. Download it from Google Cloud and save it there first.`,
    );
  });

  const server = http.createServer();
  const redirectUri = await new Promise<string>((resolve, reject) => {
    server.once("error", reject);
    server.listen(oauthLoopbackPort, "127.0.0.1", () => {
      const address = server.address() as AddressInfo;
      resolve(`http://127.0.0.1:${address.port}/oauth2callback`);
    });
  });

  const client = await createOAuthClient(redirectUri);
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: gmailScopes,
  });

  console.log("\nOpen this URL in your browser and approve the Gmail permission:\n");
  console.log(authUrl);
  console.log("\nWaiting for Google OAuth redirect...\n");

  const code = await new Promise<string>((resolve, reject) => {
    server.on("request", (req, res) => {
      const requestUrl = new URL(req.url ?? "/", redirectUri);
      const authCode = requestUrl.searchParams.get("code");
      const oauthError = requestUrl.searchParams.get("error");

      if (oauthError) {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`OAuth failed: ${oauthError}`);
        reject(new Error(`OAuth failed: ${oauthError}`));
        return;
      }

      if (!authCode) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("No OAuth code found.");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Gmail OAuth complete. You can close this tab and return to the terminal.");
      resolve(authCode);
    });
  }).finally(() => {
    server.close();
  });

  const { tokens } = await client.getToken(code);
  await writePrivateJson(tokenPath, tokens);

  console.log(`Token saved locally at ${tokenPath}`);
}
