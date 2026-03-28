FROM php:8.2-fpm-alpine

RUN apk add --no-cache \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    icu-dev \
    oniguruma-dev \
    libxml2-dev \
    curl \
    git \
    unzip

RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        bcmath \
        exif \
        gd \
        intl \
        mysqli \
        opcache \
        pdo_mysql \
        zip \
        soap

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

EXPOSE 9000
CMD ["php-fpm"]
