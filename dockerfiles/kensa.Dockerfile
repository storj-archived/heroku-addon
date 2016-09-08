FROM ruby

WORKDIR /usr/src/app
RUN gem install kensa

ADD ./addon-manifest.json ./
RUN sed -i 's/localhost/server/g' ./addon-manifest.json

CMD ["kensa", "test", "all"]
