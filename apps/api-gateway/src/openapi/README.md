# API Documentation (OpenAPI)

This folder contains the **single global** OpenAPI 3 spec for the Hyperlocal Platform API.

## Why one global spec?

- **Single entry point**: Clients call the API Gateway only; the spec reflects the gateway routes (`/api/v1/auth`, `/api/v1/user`, etc.).
- **One place to maintain**: One `openapi.yaml` and one Swagger UI at `/api-docs`.
- **Accurate for consumers**: Paths, auth, and tags match what the gateway exposes.

## Viewing the docs

- **Swagger UI**: When the API Gateway is running, open **`/api-docs`** in the browser (e.g. `http://localhost:3000/api-docs`).

## Updating the spec

- Edit `openapi.yaml` and add or change paths, schemas, and descriptions.
- After changing the spec, restart the gateway (or rely on your dev watcher) so Swagger UI picks up changes.
- For production builds, `openapi.yaml` is copied to `dist/openapi/` by the `build` script.

## Optional: per-service specs

If you later need **per-service** OpenAPI specs (e.g. for internal tooling or codegen per service), you can:

1. Add an `openapi` folder in each service (auth, user, booking, etc.) with that service’s paths only.
2. Use a merge script or tool (e.g. `openapi-merge` or a custom script) to produce the global spec from those fragments, and keep serving the merged spec from the gateway.

For most use cases, maintaining one global spec at the gateway is simpler.
