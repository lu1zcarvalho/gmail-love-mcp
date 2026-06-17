import { google, gmail_v1 } from "googleapis";
import { getAuthenticatedOAuthClient } from "./oauth.js";
import { createPlainTextEmail, toBase64Url } from "./mime.js";

export type DraftSummary = {
  id: string;
  messageId?: string;
  to?: string;
  subject?: string;
  date?: string;
  snippet?: string;
};

async function getGmailClient(): Promise<gmail_v1.Gmail> {
  const auth = await getAuthenticatedOAuthClient();
  return google.gmail({ version: "v1", auth });
}

function getHeader(message: gmail_v1.Schema$Message | undefined, name: string): string | undefined {
  return (
    message?.payload?.headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value ??
    undefined
  );
}

export async function createDraft(input: {
  to: string;
  subject: string;
  body: string;
}): Promise<DraftSummary> {
  const gmail = await getGmailClient();
  const raw = toBase64Url(createPlainTextEmail(input));

  const response = await gmail.users.drafts.create({
    userId: "me",
    requestBody: {
      message: { raw },
    },
  });

  return {
    id: response.data.id ?? "",
    messageId: response.data.message?.id ?? undefined,
    to: input.to,
    subject: input.subject,
    snippet: response.data.message?.snippet ?? undefined,
  };
}

export async function listRecentDrafts(maxResults = 10): Promise<DraftSummary[]> {
  const gmail = await getGmailClient();
  const response = await gmail.users.drafts.list({
    userId: "me",
    maxResults,
  });

  const drafts = response.data.drafts ?? [];
  const details = await Promise.all(
    drafts.map(async (draft) => {
      const detail = await gmail.users.drafts.get({
        userId: "me",
        id: draft.id ?? "",
        format: "metadata",
      });

      return {
        id: detail.data.id ?? draft.id ?? "",
        messageId: detail.data.message?.id ?? undefined,
        to: getHeader(detail.data.message, "To"),
        subject: getHeader(detail.data.message, "Subject"),
        date: getHeader(detail.data.message, "Date"),
        snippet: detail.data.message?.snippet ?? undefined,
      };
    }),
  );

  return details.filter((draft) => draft.id);
}

export async function sendDraft(draftId: string): Promise<{ id?: string; threadId?: string; labelIds?: string[] }> {
  const gmail = await getGmailClient();
  const response = await gmail.users.drafts.send({
    userId: "me",
    requestBody: { id: draftId },
  });

  return {
    id: response.data.id ?? undefined,
    threadId: response.data.threadId ?? undefined,
    labelIds: response.data.labelIds ?? undefined,
  };
}
