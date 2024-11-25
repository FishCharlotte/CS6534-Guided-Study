FROM node:20-alpine3.19

WORKDIR /home/node/app

COPY package*.json ./

# Install dependencies
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "start"]