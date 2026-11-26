# Modelo do Firestore

| Coleção | Doc ID | Campos principais |
| --- | --- | --- |
| `parking_lots` | auto | name, address, latitude, longitude, hourly_rate_cents, opening_hours, active |
| `spaces` | auto | parking_lot_id, label, active, occupancy_state |
| `reservations` | código (SP...) | user_id, parking_lot_id, space_id, arrival_expected, departure_expected, status, price_estimate_cents, expires_at |
| `payments` | reservation_id | provider, preference_id, checkout_url, payment_id, status, amount_cents |
| `access_events` | `{device_id}_{event_id}` | type, timestamp, result, reason |
| `tickets` | reservation_id | arrival_real, departure_real, duration_minutes, final_amount_cents, telegram_status |
| `devices` | device_id | parking_lot_id, last_seen, status, offline_alerted |
| `notifications` | `{reservationId}_{TYPE}` | channel, type, status, attempts, last_error |
| `users` | uid | telegram_chat_id, telegram_linked_at |
| `telegram_link_codes` | código (8 chars) | uid, expires_at, used |

## Estados da reserva

`PENDING_PAYMENT` → `CONFIRMED` → `CHECKED_IN` → `COMPLETED`

Saídas laterais: `EXPIRED`, `CANCELLED`

## Índices obrigatórios

Firestore Console → Índices → Criar índice composto.

| Coleção | Campos | Motivo |
| --- | --- | --- |
| `reservations` | user_id ASC, created_at DESC | Listagem do usuário |
| `reservations` | status ASC, arrival_expected ASC | Job de expiração (no-show) |
| `reservations` | status ASC, expires_at ASC | Job de expiração (pending) |
| `devices` | last_seen ASC, offline_alerted ASC | Job de watch |

## Security Rules

Todo acesso é via API (Admin SDK); o cliente fica bloqueado:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```