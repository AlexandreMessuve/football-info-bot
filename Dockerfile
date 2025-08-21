FROM node:alpine
LABEL authors="zal"
LABEL description="A simple Dockerfile to run a Node.js application in a lightweight Alpine Linux container."
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["npm", "run", "start"]
EXPOSE 3000
