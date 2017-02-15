FROM node:6

ADD ./mock-mailgun/package.json .
RUN npm install
ADD ./mock-mailgun/* ./

CMD ["node", "index.js"]
