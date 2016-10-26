FROM ruby

################
# Install Node #
################

RUN apt-get update \
 && apt-get install -y --force-yes --no-install-recommends\
      apt-transport-https \
      ssh-client \
      build-essential \
      curl \
      ca-certificates \
      git \
      libicu-dev \
      'libicu[0-9][0-9].*' \
      lsb-release \
      python-all \
      rlwrap \
  && rm -rf /var/lib/apt/lists/*;

RUN curl https://deb.nodesource.com/node_4.x/pool/main/n/nodejs/nodejs_4.6.0-1nodesource1~jessie1_amd64.deb > node.deb \
 && dpkg -i node.deb \
 && rm node.deb

#################
# Install kensa #
#################

RUN gem install kensa

#######################################
# Install webserver for code coverage #
#######################################

RUN mkdir -p ./coverage/lcov-report
RUN npm install -g local-web-server

#####################################
# Install netcat for docker_watcher #
#####################################

RUN apt-get update && apt-get install -y --no-install-recommends \
      netcat-traditional \
  && rm -rf /var/lib/apt/lists/*

###################
# Install Service #
###################

WORKDIR /usr/src/app

ENV NODE_ENV dev
ADD package.json .
RUN npm install
ADD ./ ./

EXPOSE 8000

ADD ./dockerfiles/bridge_wrapper.sh /usr/bin/bridge_wrapper.sh
RUN chmod +x /usr/bin/bridge_wrapper.sh

VOLUME /usr/src/app/.nyc_output

CMD ["bridge_wrapper.sh", "npm", "test"]
