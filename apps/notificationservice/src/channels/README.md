# Notification Channels

Channels deliver notifications to different backends (in-app DB, email, SMS, push). Adding a new channel is a small, localized change.

## Architecture

- **Registry** (`registry.ts`): Holds channel implementations. `dispatch(payload)` sends to all requested and configured channels in parallel.
- **Normalize** (`normalize.ts`): Converts raw broker payload (e.g. `channel`, `emailTo`) into `NormalizedNotificationPayload` (channels list + recipients).
- **Channel interface** (`types.ts`): `INotificationChannel` – `name`, `isConfigured()`, `send(context)`.

## Adding a new channel (e.g. SMS, push, Slack)

1. **Extend types** in `types.ts`:
   - Add the channel name to `NotificationChannelName`: `'in_app' | 'email' | 'sms'`.
   - Add recipient fields in `NotificationRecipients` if needed: e.g. `phone?: string` for SMS, `deviceIds?: string[]` for push.

2. **Implement the channel** in a new file, e.g. `sms.channel.ts`:
   - Implement `INotificationChannel`: `name`, `isConfigured()` (e.g. check env for SMS API key), `send(context)` (use `context.recipients.phone`, `context.body`, etc.).
   - Export a factory: `createSmsChannel(): INotificationChannel`.

3. **Normalize** in `normalize.ts`:
   - In `RawNotificationPayload`, add any new raw fields (e.g. `phoneTo?: string`).
   - In `normalizePayload()`, map them into `recipients` (e.g. `recipients.phone = raw.phoneTo`).
   - If using a legacy `channel: 'both'`-style field, extend `resolveChannelsFromLegacy()` to include the new channel when desired.

4. **Register** in `channels/index.ts`:
   - In `initDefaultChannels()`, call `registry.register(createSmsChannel())` (and pass any deps the factory needs).

No changes are required in the consumer or the rest of the app; the registry dispatches to all requested channels in parallel.

## Optimizations

- **Single parse**: Payload is parsed once; normalization produces one structure for all channels.
- **Parallel send**: `dispatch()` uses `Promise.allSettled()` so in_app and email (and future channels) run in parallel.
- **Configured-only**: Only channels that are both requested and `isConfigured()` are invoked; no no-op calls.
- **Lazy init**: Email transporter and other heavy clients are created on first use (in their channel implementations).
