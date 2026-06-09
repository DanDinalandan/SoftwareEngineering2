FROM node:22-alpine

WORKDIR /app

COPY apps/backend/package*.json ./
RUN npm ci

COPY apps/backend/src ./src
COPY apps/backend/supabase ./supabase

EXPOSE 3000

CMD ["npm", "start"]
