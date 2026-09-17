# Hostinger deployment

This repository keeps `docker-compose.yml` for local/Azure development. Use `docker-compose.production.yml` for a Hostinger VPS deployment.

## Deploy

1. Copy `.env.example` to `.env` on the VPS and fill in the Azure values. Never commit `.env`.
2. Build and start the service:

   `docker compose -f docker-compose.production.yml up -d --build`

3. Verify the container and health endpoint:

   `docker compose -f docker-compose.production.yml ps`
   `curl -fsS http://127.0.0.1:8080/health`

The production file binds the application to loopback by default, runs it as a non-root user, requires the Azure secrets at startup, and enables a restart policy. Put the Hostinger reverse proxy or Traefik route in front of port 8080 rather than exposing the application directly.

## Updates

Pull the reviewed branch or merge it into `main`, then run:

`docker compose -f docker-compose.production.yml up -d --build`
