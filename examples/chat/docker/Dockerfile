FROM node:14 AS builder
WORKDIR /app
COPY examples/chat/server/ .
RUN npm install
RUN sed -i "s/..\/..\/..\/config\/test-config/.\/resources\/config/g" ./index.js

FROM node:14-alpine
WORKDIR /client
COPY examples/chat/client .
WORKDIR /server
COPY --from=builder /app/index.js .
COPY --from=builder /app/node_modules ./node_modules
COPY config/test-config.js ./resources/config.js
CMD ["node","index.js"]
