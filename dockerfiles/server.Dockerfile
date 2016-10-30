FROM nodesource/node:4

RUN curl -SsL https://github.com/Yelp/dumb-init/releases/download/v1.1.3/dumb-init_1.1.3_amd64 > /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

ENV NODE_ENV production
ADD package.json .
RUN npm install

ADD ./ ./

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "index.js"]
