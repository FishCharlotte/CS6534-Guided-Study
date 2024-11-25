FROM node:20-alpine3.19

WORKDIR /home/node/app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 8080

CMD ["npm", "start"]