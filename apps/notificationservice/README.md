# Notification Service

In-app and email notifications for users. Same folder structure as userservice/bookingservice.

## Environment

- `DATABASE_URL` – PostgreSQL connection string
- `GATEWAY_API_KEY` – API key for gateway-to-service auth
- `RABBITMQ_URL` – (optional) RabbitMQ URL for event consumer; if unset, consumer is skipped
- **Email (optional)** – when set, notifications with `channel: 'email'` or `'both'` and a valid `emailTo` are sent via SMTP:
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

## API (via gateway)

- **List**: `GET /api/v1/notification/notifications?page=&limit=&unreadOnly=true`
- **Get one**: `GET /api/v1/notification/notifications/:id`
- **Mark read**: `PATCH /api/v1/notification/notifications/:id/read`
- **Mark all read**: `PATCH /api/v1/notification/notifications/read-all`

Gateway pathRewrite forwards `/api/v1/notification/*` to notification service as `/api/v1/*`.

## Event consumer (optional)

When `RABBITMQ_URL` is set, the service consumes from:

- **Exchange**: `notification.events` (topic)
- **Queue**: `notification-service.in-app`
- **Routing key**: `notification.create`

Publish a message with payload:

```json
{
  "userAuthId": "auth-id-from-jwt",
  "type": "booking_confirmation",
  "title": "Booking confirmed",
  "body": "Your service on ... is confirmed.",
  "metadata": { "bookingId": "..." },
  "channel": "in_app",
  "emailTo": "user@example.com"
}
```

- **channel** (optional): `in_app` (default), `email`, or `both`. When `email` or `both`, and SMTP is configured and `emailTo` is set, an email is sent using the template for `type`.
- **emailTo** (optional): recipient email for delivery when channel includes email.

Supported **type** values for email templates: `booking_confirmation`, `booking_cancellation`, `booking_refund`, `service_person_coming`, `otp_verification`. Other types use a generic subject/body from title and body.

Other services (e.g. booking service) publish to this exchange to create in-app and/or email notifications.

## Database

Run `npx prisma migrate dev` to create the `notifications` table.
