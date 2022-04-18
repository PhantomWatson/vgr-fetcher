FROM php:7.4-fpm

ARG WEB_USER
ARG WEB_GROUP
ARG PHP_ROOT_DIR
ARG APACHE_EXPOSED_PORT

COPY www.conf ${PHP_ROOT_DIR}/php-fpm.d/www.conf

RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"

EXPOSE ${APACHE_EXPOSED_PORT}

ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/

RUN chmod +x /usr/local/bin/install-php-extensions && sync && \
    install-php-extensions \
    bcmath \
    bz2 \
    curl \
    fileinfo \
    gd \
    intl \
    mbstring \
    pdo \
    simplexml \
    zip

RUN install-php-extensions @composer

RUN pecl install xdebug && docker-php-ext-enable xdebug

RUN curl -sL https://deb.nodesource.com/setup_14.x | bash

RUN apt-get install nodejs

RUN npm install -g grunt

WORKDIR "/var/www/html/webroot"

RUN usermod -u 1000 ${WEB_USER} \
 && groupmod -g 1000 ${WEB_GROUP} \
 && chgrp -R staff ${PHP_ROOT_DIR}/php-fpm.d/www.conf
