FROM nodesource/node:4

RUN rm -rf /usr/src/app
RUN git clone https://github.com/Storj/bridge.git /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV integration

RUN npm install --production

RUN npm link

RUN mkdir -p ./.storj-bridge/config
ENV STORJ_BRIDGE_DIR /usr/src/app

RUN apt-get update && apt-get install -y --no-install-recommends \
      netcat-traditional \
  && rm -rf /var/lib/apt/lists/*

ADD bridge_wrapper.sh /usr/bin/bridge_wrapper.sh
RUN chmod +x /usr/bin/bridge_wrapper.sh

RUN echo ' \
{ \
  "logger": { \
    "level": 4 \
  }, \
  "server": { \
    "host": "storj.bridge.mock", \
    "timeout": 60000, \
    "port": 8080 \
  }, \
  "storage": [ \
    { \
      "name": "bridge", \
      "host": "service_bridge_mongodb", \
      "port": 27017 \
    } \
  ], \
  "messaging": { \
    "url": "amqp://service_bridge_rabbitmq", \
    "queues": { \
      "renterpool": { \
        "name": "storj.work.renterpool", \
        "options": { \
          "exclusive": false, \
          "durable": true, \
          "arguments": { \
            "messageTtl": 120000 \
          } \
        } \
      }, \
      "callback": { \
        "name": "", \
        "options": { \
          "exclusive": true, \
          "durable": false, \
          "arguments": { \
          } \
        } \
      } \
    }, \
    "exchanges": { \
      "events": { \
        "name": "storj.events", \
        "type": "topic", \
        "options": { \
          "durable": true \
        } \
      } \
    } \
  }, \
  "mailer": { \
    "host": "smtp.myemail.com", \
    "port": 25, \
    "secure": false, \
    "from": "robot@storj.io", \
    "tls": { \
      "rejectUnauthorized": false \
    } \
  } \
} \
' > ./.storj-bridge/config/integration

EXPOSE 8080

CMD ["bridge_wrapper.sh", "storj-bridge"]
