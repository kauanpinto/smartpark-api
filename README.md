# SmartPark API

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-FFCA28?logo=firebase&logoColor=black)
![Telegram](https://img.shields.io/badge/Telegram-Bot%20API-26A5E4?logo=telegram&logoColor=white)

> API REST para estacionamento inteligente com reserva antecipada, pagamento digital e cancela automatizada.

> **Projeto acadêmico** desenvolvido em equipe para a disciplina de IoT no SENAI. Não é um produto comercial.

[Documentação](docs/) · [Endpoints](docs/endpoints.md) · [Reportar bug](../../issues)

## Visão geral

Motoristas encontram estacionamentos, consultam disponibilidade e tarifa, reservam uma vaga com horário de chegada e saída, pagam online via Mercado Pago e entram por uma cancela simulada (ESP32 no Wokwi). Confirmações, alertas e tickets chegam pelo Telegram.

Projetos relacionados: **[SmartPark - Web](https://github.com/kauanpinto/smartpark-web)** (frontend) e **[SmartPark - IoT](https://github.com/kauanpinto/smartpark-iot)** (ESP32 no Wokwi).

## Funcionalidades

- Reserva antecipada com preço calculado no servidor
- Pagamento via Mercado Pago Checkout Pro
- Controle de acesso por dispositivo IoT (ENTRY/EXIT) autenticado com HMAC
- Notificações e tickets pelo Telegram
- Painel admin com ocupação, reservas, devices e alertas

## Stack

- [Node.js](https://nodejs.org/) 22.x
- [Express](https://expressjs.com/) ^5.3.0
- [Zod](https://zod.dev/) ^4.6.7
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) ^14.5.1
- [Firebase Firestore](https://firebase.google.com/docs/firestore) e [Firebase Auth](https://firebase.google.com/docs/auth)
- [Axios](https://axios-http.com/) ^1.21.1
- [Helmet](https://helmet.js.org/) ^8.3.0
- [Express Rate Limit](https://express-rate-limit.mintlify.app/) ^8.7.4
- [Prettier](https://prettier.io/) ^3.10.1
- [Mercado Pago Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/landing)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [ESP32 (Wokwi)](https://wokwi.com/)

## Início rápido

**Pré-requisitos:** Node.js 22+, projeto Firebase (Firestore + Auth com e-mail/senha), conta de desenvolvedor no Mercado Pago, bot do Telegram ([@BotFather](https://t.me/botfather)) e um túnel HTTPS (`ngrok` ou `cloudflared`) para webhook e ESP32.

```bash
git clone https://github.com/kauanpinto/smartpark-api.git
cd smartpark-api
npm install
cp .env.example .env   # preencha as variáveis
```

Gere a chave em Firebase Console → Configurações do projeto → Contas de serviço e salve em `secrets/service-account.json`. Depois:

```bash
npm run seed   # 2 estacionamentos, 20 vagas, 2 devices
npm run dev    # http://localhost:3000
```

## Configuração

Principais variáveis (a lista completa está no `.env.example`):

| Variável                         | Descrição                            |
| -------------------------------- | ------------------------------------ |
| `APP_BASE_URL`                   | URL pública da API (webhook + ESP32) |
| `WEB_ORIGIN`                     | URL do frontend (CORS)               |
| `GOOGLE_APPLICATION_CREDENTIALS` | Caminho do service account           |
| `MERCADOPAGO_ACCESS_TOKEN`       | Access Token do Mercado Pago         |
| `TELEGRAM_BOT_TOKEN`             | Token do bot                         |
| `DEVICE_SHARED_SECRET`           | Segredo HMAC do ESP32 (≥16 chars)    |

<details>
<summary>Todas as variáveis de ambiente</summary>

| Variável                         | Descrição                            |
| -------------------------------- | ------------------------------------ |
| `NODE_ENV`                       | development / production / test      |
| `PORT`                           | Porta do servidor (padrão: 3000)     |
| `APP_BASE_URL`                   | URL pública da API (webhook + ESP32) |
| `WEB_ORIGIN`                     | URL do frontend                      |
| `FIREBASE_PROJECT_ID`            | ID do projeto Firebase               |
| `FIREBASE_API_KEY`               | API Key pública (SDK Web)            |
| `GOOGLE_APPLICATION_CREDENTIALS` | Caminho do service account           |
| `MERCADOPAGO_ACCESS_TOKEN`       | Access Token do Mercado Pago         |
| `MERCADOPAGO_WEBHOOK_SECRET`     | Secret do webhook do MP              |
| `TELEGRAM_BOT_TOKEN`             | Token do bot                         |
| `TELEGRAM_BOT_USERNAME`          | Username do bot (sem @)              |
| `TELEGRAM_DEFAULT_CHAT_ID`       | Chat ID do admin (alertas)           |
| `DEVICE_SHARED_SECRET`           | Segredo HMAC do ESP32 (≥16 chars)    |

</details>

## Uso da API

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/parking-lots
```

Rotas protegidas exigem `Authorization: Bearer <idToken>` (Firebase Auth). A lista completa está em [docs/endpoints.md](docs/endpoints.md).

## Arquitetura

```text
src/
├── app.js           # Configuração do Express
├── server.js        # Inicialização + jobs
├── config/          # env, firebase, mercadopago, telegram
├── constants/       # status, coleções, regras
├── schemas/         # Validação Zod
├── repositories/    # Acesso ao Firestore
├── services/        # Regras de negócio
├── controllers/     # Requisições e respostas HTTP
├── routes/          # Rotas
├── middlewares/     # auth, device (HMAC), jsonError
├── jobs/            # Expiração, retry, deviceWatch, telegramPolling
└── utils/           # hmac, time, code, mp-signature

scripts/             # seed, set-admin, sign-request, force-confirm
```

Fluxo da reserva: `PENDING_PAYMENT` → `CONFIRMED` → `CHECKED_IN` → `COMPLETED` (saídas laterais: `EXPIRED`, `CANCELLED`).
Modelo de dados, índices e rules: [docs/firestore.md](docs/firestore.md).

## Segurança

- Firebase Auth (JWT) para usuários e HMAC-SHA256 com janela anti-replay de 60s para dispositivos
- Webhook do Mercado Pago com assinatura validada; o status é sempre reconfirmado via `GET /v1/payments/:id`
- Idempotência em eventos IoT e notificações
- Validação Zod com `.strict()` (preço nunca vem do cliente)
- 404 em vez de 403 em recursos de outros usuários
- Rate limiting, CORS restrito, Helmet e timeout em chamadas externas
- Firestore Rules deny-all; segredos fora do versionamento

## Desenvolvimento

| Comando                | Descrição                            |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Inicia em desenvolvimento            |
| `npm start`            | Inicia o servidor                    |
| `npm run seed`         | Cria dados iniciais                  |
| `npm run set-admin`    | Promove um usuário a admin (via UID) |
| `npm run format`       | Formata o código                     |
| `npm run format:check` | Verifica a formatação                |

## Deploy

> A API ainda não está publicada. Em desenvolvimento, use um túnel HTTPS para o webhook do MP e para o ESP32.

Para produção:

- Jobs (`setInterval`) e Telegram long polling exigem instância persistente (ex.: Cloud Run com `min-instances=1`); não funciona em serverless puro
- `trust proxy` já habilitado
- Service Account via Workload Identity ou secret manager (nunca commitar o JSON)
- Criar os índices do Firestore antes do primeiro deploy
- Webhook do MP exige URL pública HTTPS

## Autores

Projeto desenvolvido em equipe:

- [Everson Miranda](https://github.com/eversonMI)
- [Kauan Fernando](https://github.com/kauanpinto)
- [Simon Henrique](https://github.com/SimHen90)
