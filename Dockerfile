# Stage 1: Установка зависимостей
FROM node:18-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

# Stage 2: Сборка финального образа
FROM node:18-alpine
WORKDIR /app

# Копируем зависимости из предыдущего шага
COPY --from=deps /app/node_modules ./node_modules

# Копируем исходный код приложения
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]