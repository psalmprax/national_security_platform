# Stage 1 - Build
FROM ghcr.io/cirruslabs/flutter:stable AS build

WORKDIR /app

# Copy dependency files first to leverage Docker layer caching
COPY pubspec.yaml ./

# Get dependencies
RUN flutter pub get

# Copy the rest of the application
COPY . .

# Ensure web platform is configured and build
RUN flutter config --enable-web
RUN flutter create . --platforms web
RUN flutter build web --base-href /mobile/

# Stage 2 - Serve
FROM nginx:alpine
COPY --from=build /app/build/web /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
