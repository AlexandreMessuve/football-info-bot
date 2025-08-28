FROM node:alpine
LABEL authors="zal"
LABEL description="Bot discord for football info matches and more"
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["npm", "run", "start"]
EXPOSE 3000
