#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exactSendConfirmation } from "./config.js";
import { createDraft, listRecentDrafts, sendDraft } from "./gmail.js";
import { buildLoveEmailBody } from "./loveEmail.js";

const server = new McpServer({
  name: "gmail-love-mcp",
  version: "0.1.0",
});

function textResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

server.registerTool(
  "create_love_email_draft",
  {
    title: "Create romantic Gmail draft",
    description:
      "Creates a romantic email draft in Gmail. This tool never sends email; it only creates a Gmail draft.",
    inputSchema: {
      to: z.string().email(),
      subject: z.string().min(1),
      tone: z.string().min(1).describe("Example: doce, saudoso, apaixonado, divertido, poetico."),
      context: z.string().describe("Personal context, memory, occasion, or feeling to include in the draft."),
    },
    annotations: {
      destructiveHint: false,
      openWorldHint: true,
    },
  },
  async ({ to, subject, tone, context }) => {
    const body = buildLoveEmailBody(tone, context);
    const draft = await createDraft({ to, subject, body });

    return textResult({
      status: "draft_created",
      draft,
      safety: "Email was saved as a Gmail draft and was not sent.",
      preview: body,
    });
  },
);

server.registerTool(
  "list_recent_drafts",
  {
    title: "List recent Gmail drafts",
    description: "Lists recent Gmail drafts so the user can inspect draft IDs before approving a send.",
    annotations: {
      readOnlyHint: true,
      openWorldHint: true,
    },
  },
  async () => {
    const drafts = await listRecentDrafts();
    return textResult({ drafts });
  },
);

server.registerTool(
  "send_approved_draft",
  {
    title: "Send explicitly approved Gmail draft",
    description:
      "Sends an existing Gmail draft only after explicit user confirmation. The user must confirm with the exact phrase shown by this tool.",
    inputSchema: {
      draft_id: z.string().min(1),
    },
    annotations: {
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  async ({ draft_id }) => {
    const expected = exactSendConfirmation(draft_id);
    const confirmation = await server.server.elicitInput({
      mode: "form",
      message: `Confirm sending this Gmail draft. Type exactly: ${expected}`,
      requestedSchema: {
        type: "object",
        properties: {
          confirmation: {
            type: "string",
            title: "Explicit send confirmation",
            description: `Type exactly: ${expected}`,
          },
        },
        required: ["confirmation"],
      },
    });

    if (confirmation.action !== "accept" || confirmation.content?.confirmation !== expected) {
      return textResult({
        status: "not_sent",
        draft_id,
        required_confirmation: expected,
        message: "The draft was not sent because explicit confirmation was not provided.",
      });
    }

    const sent = await sendDraft(draft_id);
    return textResult({
      status: "sent",
      draft_id,
      sent,
    });
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
