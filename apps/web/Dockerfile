FROM node:22-alpine

WORKDIR /app

COPY apps/web/package*.json ./
RUN npm ci

COPY apps/web/index.html ./index.html
COPY apps/web/vite.config.js ./vite.config.js
COPY apps/web/eslint.config.js ./eslint.config.js
COPY apps/web/src ./src

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
