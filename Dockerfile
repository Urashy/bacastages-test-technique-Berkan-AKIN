FROM node:20-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npx prisma generate

CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && npx ts-node src/server.ts"]
