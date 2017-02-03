FROM node:6

RUN rm -rf /usr/src/app
RUN git clone https://github.com/Storj/bridge.git /usr/src/app \
 && cd /usr/src/app \
 && git checkout 52e6fc5e1bea4a3d762bb1e47b0fb24426cdf0e6
WORKDIR /usr/src/app

ENV NODE_ENV integration

RUN npm install --production \
 && npm link

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
  "storage":{ \
      "mongoUrl": "mongodb://service_bridge_mongodb:27017/bridge", \
      "mongoOpts": {} \
  }, \
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
