function encodeHeader(value: string): string {
  return /[^\x20-\x7E]/.test(value)
    ? `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`
    : value;
}

function normalizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function createPlainTextEmail(input: {
  to: string;
  subject: string;
  body: string;
}): string {
  const to = normalizeHeaderValue(input.to);
  const subject = normalizeHeaderValue(input.subject);

  return [
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    input.body,
  ].join("\r\n");
}

export function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
