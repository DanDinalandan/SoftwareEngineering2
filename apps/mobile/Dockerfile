FROM node:22-bullseye-slim

WORKDIR /app

COPY apps/mobile/package*.json ./
RUN npm ci

COPY apps/mobile/App.js ./App.js
COPY apps/mobile/src ./src
COPY apps/mobile/assets ./assets

EXPOSE 8081 19000 19001 19002

ENV EXPO_NO_TELEMETRY=0
ENV EXPO_OFFLINE=0

CMD ["npx", "expo", "start", "--lan", "--clear"]
