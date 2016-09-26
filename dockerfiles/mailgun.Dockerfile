FROM nodesource/node:4

ADD ./mock-mailgun/package.json .
RUN npm install
ADD ./mock-mailgun/* ./

CMD ["node", "index.js"]
