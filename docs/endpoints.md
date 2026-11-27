# Endpoints

| Método | Rota                                 | Acesso        | Descrição                                  |
| ------ | ------------------------------------ | ------------- | ------------------------------------------ |
| GET    | `/health`                            | Público       | Healthcheck                                |
| GET    | `/api/parking-lots`                  | Público       | Lista estacionamentos com `available_now`  |
| GET    | `/api/parking-lots/:id/availability` | Público       | Disponibilidade e preço por período        |
| POST   | `/api/reservations`                  | Usuário       | Cria reserva (preço calculado no servidor) |
| GET    | `/api/reservations`                  | Usuário       | Lista reservas do usuário                  |
| GET    | `/api/reservations/:id`              | Dono ou admin | Detalhe da reserva                         |
| POST   | `/api/reservations/:id/cancel`       | Usuário       | Cancela reserva `PENDING_PAYMENT`          |
| POST   | `/api/reservations/:id/checkout`     | Usuário       | Cria preferência no Mercado Pago           |
| POST   | `/webhooks/mercadopago`              | Assinatura MP | Webhook de pagamento                       |
| POST   | `/api/telegram/link-code`            | Usuário       | Gera código de vínculo do chat             |
| GET    | `/api/me`                            | Usuário       | Dados do usuário + status do vínculo       |
| POST   | `/api/iot/access-request`            | Device (HMAC) | ESP32 solicita ENTRY ou EXIT               |
| POST   | `/api/iot/telemetry`                 | Device (HMAC) | ESP32 envia heartbeat                      |
| POST   | `/api/admin/parking-lots`            | Admin         | Cria estacionamento + vagas + device       |
| GET    | `/api/admin/dashboard`               | Admin         | Ocupação, reservas, devices e alertas      |

**Autenticação**

- **Usuário/Admin:** `Authorization: Bearer <idToken>` (Firebase Auth)
- **Device:** headers `x-device-id`, `x-timestamp` e `x-signature` (HMAC-SHA256, janela de 60s)
- **Webhook MP:** assinatura HMAC validada no servidor
