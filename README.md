# gmail-love-mcp

Servidor MCP local em Node.js/TypeScript para criar rascunhos românticos para o meu amor no Gmail e enviar somente depois de confirmação explícita do usuário.

## Garantias de segurança

- Usa OAuth2 com Gmail API.
- Usa o escopo mínimo para o fluxo deste projeto: `https://www.googleapis.com/auth/gmail.compose`.
- Nunca envia automaticamente no tool `create_love_email_draft`; ele só cria draft.
- O tool `send_approved_draft(draft_id)` pede confirmação interativa antes de chamar `users.drafts.send`.
- A confirmação exigida é a frase exata `ENVIAR <draft_id>`.
- Tokens e credenciais ficam em arquivos locais ignorados pelo Git:
  - `credentials/oauth-client.json`
  - `tokens/gmail-token.json`

## Requisitos

- Node.js 20 ou mais recente
- npm
- Conta Google/Gmail
- Projeto no Google Cloud

## Configurar Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um projeto novo ou selecione um projeto existente.
3. Abra `APIs & Services`.
4. Em `OAuth consent screen`, configure a tela de consentimento.
5. Para uso pessoal, deixe como app externo em modo de teste e adicione seu e-mail em `Test users`.

## Habilitar Gmail API

1. No Google Cloud Console, abra `APIs & Services` > `Library`.
2. Procure por `Gmail API`.
3. Clique em `Enable`.

## Criar OAuth Client

1. Abra `APIs & Services` > `Credentials`.
2. Clique em `Create Credentials` > `OAuth client ID`.
3. Escolha `Desktop app`.
4. Baixe o JSON.
5. Salve o arquivo como:

```text
C:\Users\Luiz\Desktop\gmail-love-mcp\credentials\oauth-client.json
```

Não coloque esse arquivo no Git.

## Instalar e autenticar

```bash
cd C:\Users\Luiz\Desktop\gmail-love-mcp
npm install
npm run auth
```

O comando `npm run auth` abre um fluxo OAuth local em `http://127.0.0.1:3008/oauth2callback`, mostra uma URL no terminal, espera a autorização no navegador e salva o token em:

```text
C:\Users\Luiz\Desktop\gmail-love-mcp\tokens\gmail-token.json
```

Em Windows, se quiser restringir o acesso ao token ao seu usuário:

```powershell
icacls .\tokens\gmail-token.json /inheritance:r /grant:r "$env:USERNAME:F"
icacls .\credentials\oauth-client.json /inheritance:r /grant:r "$env:USERNAME:F"
```

## Rodar o servidor MCP

Durante desenvolvimento:

```bash
npm run dev
```

Build e execução:

```bash
npm run build
npm start
```

## Conectar no Codex

Depois de rodar `npm install`, adicione este servidor MCP local na configuração do Codex usando transporte `stdio`.

Exemplo de configuração:

```json
{
  "mcpServers": {
    "gmail-love": {
      "command": "node",
      "args": [
        "C:\\Users\\Luiz\\Desktop\\gmail-love-mcp\\dist\\index.js"
      ]
    }
  }
}
```

Antes de usar essa configuração, compile:

```bash
cd C:\Users\Luiz\Desktop\gmail-love-mcp
npm run build
```

Alternativa para desenvolvimento:

```json
{
  "mcpServers": {
    "gmail-love": {
      "command": "npx",
      "args": [
        "tsx",
        "C:\\Users\\Luiz\\Desktop\\gmail-love-mcp\\src\\index.ts"
      ]
    }
  }
}
```

## Tools MCP

### `create_love_email_draft(to, subject, tone, context)`

Cria um rascunho no Gmail com texto romântico. Não envia e-mail.

Exemplo:

```json
{
  "to": "namorada@example.com",
  "subject": "Pensei em voce hoje",
  "tone": "doce",
  "context": "Quero agradecer pelo jantar de ontem e dizer que estou com saudade."
}
```

### `list_recent_drafts()`

Lista rascunhos recentes, incluindo `draft_id`, destinatário, assunto, data e snippet quando disponíveis.

### `send_approved_draft(draft_id)`

Solicita confirmação explícita antes de enviar. Para enviar, digite exatamente:

```text
ENVIAR <draft_id>
```

Se a confirmação for cancelada, recusada ou diferente da frase esperada, nada é enviado.

## Escopo Gmail usado

Este projeto usa apenas:

```text
https://www.googleapis.com/auth/gmail.compose
```

Esse escopo permite gerenciar rascunhos e enviar rascunhos existentes. Ele evita escopos mais amplos como `https://mail.google.com/` e `gmail.modify`.

Referências oficiais:

- [Gmail API scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [users.drafts.send](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.drafts/send)

## Variáveis opcionais

- `GMAIL_OAUTH_CLIENT_PATH`: caminho alternativo para o JSON do OAuth client.
- `GMAIL_TOKEN_PATH`: caminho alternativo para o token local.
- `GMAIL_OAUTH_PORT`: porta do callback OAuth local. Padrão: `3008`.
