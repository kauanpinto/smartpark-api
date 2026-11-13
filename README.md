# SmartPark API

API REST para gerenciamento de estacionamento inteligente, com reservas, pagamento via Mercado Pago e liberação de cancela via IoT.

## Projetos relacionados

[SmartPark Web](https://github.com/kauanpinto/smartpark-web.git)
[SmartPark IoT](https://github.com/kauanpinto/smartpark-iot.git)

## Tecnologias

- [Node.js](https://nodejs.org/) 22.x
- [Express](https://expressjs.com/) ^5.3.0
- [Firebase Admin](https://firebase.google.com/docs/admin/setup) ^14.5.0
- [Zod](https://zod.dev/) ^4.6.7
- [Mercado Pago](https://www.mercadopago.com.br/developers/pt/reference) ^3.6.2

## Segurança

- Autenticação via Firebase ID Token (JWT).
- Validação do ESP32 via Shared Secret (`x-device-secret`).
- Preço e regras de negócio calculados estritamente no servidor.
- Webhook do Mercado Pago validado e idempotente.
- Controle de concorrência com transações no Firestore para evitar double-booking.

## Deploy

A API está hospedada na [Render](https://render.com/) e utiliza o [Firebase Firestore](https://firebase.google.com/docs/firestore) como banco.

**URL**: https://smartpark-api-x974.onrender.com

## Requisitos

- [Node.js](https://nodejs.org/) 22.x
- Conta no [Firebase](https://firebase.google.com/docs) para usar o Firestore e Admin
- Conta no [Mercado Pago](https://www.mercadopago.com.br/developers) para usar o modo desenvolvedor
- Conta no [Telegram](https://web.telegram.org/) para o bot

## Como executar

1. Clone o repositório:

```bash
git clone https://github.com/kauanpinto/smartpark-api.git
cd smartpark-api
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
# Preencha as credenciais (Firebase, Mercado Pago, Telegram, IoT)
```

4. Popule o banco com dados iniciais:

```bash
npm run seed
```

5. Execute o projeto:

```bash
npm run dev
```

A API estará disponível em: http://localhost:3000

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor (padrão: 3000) |
| `FIREBASE_PROJECT_ID` | ID do projeto no Firebase |
| `FIREBASE_CREDENTIALS_JSON` | JSON da Service Account em string (para produção) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Caminho do JSON da Service Account (para dev local) |
| `MERCADOPAGO_ACCESS_TOKEN` | Access Token do Mercado Pago |
| `TELEGRAM_BOT_TOKEN` | Token do Bot do Telegram |
| `TELEGRAM_DEFAULT_CHAT_ID` | Chat ID para envio de notificações |
| `DEVICE_SHARED_SECRET` | Segredo forte compartilhado com o ESP32 |

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor em desenvolvimento |
| `npm start` | Executa o servidor em produção |
| `npm run seed` | Popula o banco com dados fictícios |
| `npm run seed:reset` | Limpa o banco e recria os dados iniciais |

## Endpoints

### Usuário e Pagamento

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/parking-lots` | Lista locais para o mapa |
| GET | `/api/parking-lots/:id/availability` | Disponibilidade por período |
| POST | `/api/reservations` | Cria uma reserva pendente |
| GET | `/api/reservations` | Lista reservas do usuário logado |
| POST | `/api/reservations/:id/checkout` | Gera checkout no Mercado Pago |

### Webhooks e IoT

| Método | Rota | Descrição |
|---|---|---|
| POST | `/webhooks/mercadopago` | Recebe evento do pagamento |
| POST | `/api/iot/access-request` | ESP32 solicita autorização (entrada/saída) |

## Autores

- [Everson Miranda](https://github.com/eversonMI)
- [Kauan Fernando](https://github.com/kauanpinto)
- [Simon Henrique](https://github.com/SimHen90)