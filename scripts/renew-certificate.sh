#!/bin/sh
set -eu
# Only this application's certificate. Existing hosts/certificates remain untouched.
/usr/bin/docker exec nginx-proxy-manager certbot renew --cert-name laranindersleri-perinet-org --quiet --deploy-hook 'nginx -t && nginx -s reload'
