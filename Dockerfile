FROM ruby:2.7.2

ENV RACK_ENV=production
ENV PORT=8080

EXPOSE 8080

WORKDIR /app
ADD Gemfile Gemfile.lock /app/
RUN bundle config set --local deployment true && bundle install

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      supervisor locales nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN DEBIAN_FRONTEND=noninteractive dpkg-reconfigure locales \
    && locale-gen C.UTF-8 \
    && /usr/sbin/update-locale LANG=C.UTF-8

ENV LC_ALL C.UTF-8

ARG SUPERCRONIC_URL=https://github.com/aptible/supercronic/releases/download/v0.1.3/supercronic-linux-amd64

ADD $SUPERCRONIC_URL /usr/local/bin/supercronic
RUN chmod +x "/usr/local/bin/supercronic"

RUN useradd -m stringer && chown stringer:stringer /app

COPY --chown=stringer:stringer . /app
COPY --chown=stringer:stringer docker/supervisord.conf /etc/supervisord.conf
COPY --chown=stringer:stringer docker/start.sh /app/

USER stringer

CMD /app/start.sh
