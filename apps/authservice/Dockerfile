FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json turbo.json ./
COPY packages ./packages
COPY apps/authservice ./apps/authservice
COPY apps/api-gateway ./apps/api-gateway
COPY apps/bookingservice ./apps/bookingservice
COPY apps/notificationservice ./apps/notificationservice
COPY apps/providerservice ./apps/providerservice
COPY apps/userservice ./apps/userservice
RUN npm ci
RUN cd apps/authservice && npx prisma generate
RUN npx turbo run build --filter=authservice

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json
COPY --from=builder /app/apps/authservice/package.json /app/apps/authservice/package.json
COPY --from=builder /app/apps/authservice/dist /app/apps/authservice/dist
COPY --from=builder /app/apps/api-gateway/package.json /app/apps/api-gateway/package.json
COPY --from=builder /app/apps/bookingservice/package.json /app/apps/bookingservice/package.json
COPY --from=builder /app/apps/notificationservice/package.json /app/apps/notificationservice/package.json
COPY --from=builder /app/apps/providerservice/package.json /app/apps/providerservice/package.json
COPY --from=builder /app/apps/userservice/package.json /app/apps/userservice/package.json
COPY --from=builder /app/packages/shared/package.json /app/packages/shared/package.json
COPY --from=builder /app/packages/shared/dist /app/packages/shared/dist
RUN npm ci --omit=dev
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "apps/authservice/dist/server.js"]
