FROM node:20

WORKDIR /

COPY package*.json tsconfig.json init.sh ./

RUN npm install

COPY src src

ENV DATABASE_URL=${DATABASE_URL}

COPY prisma ./prisma

RUN npx prisma generate


# RUN npx prisma migrate dev
RUN npm run build

EXPOSE 3000

CMD [ "sh", "init.sh" ]
