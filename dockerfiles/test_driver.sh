#/usr/bin/env bash
docker-compose -f ./dockerfiles/test.yml rm -f
docker-compose -f ./dockerfiles/test.yml up &
until docker ps -a --filter 'name=integration_tests' --format '{{.Status}}' | grep 'Exited' 1>/dev/null 2>/dev/null; do
  sleep 1;
done
docker-compose -f ./dockerfiles/test.yml kill
STATUS=$(docker ps -a --filter 'name=integration_tests' --format '{{.Status}}' | sed 's/^.*(\|).*$//g')
[ "$STATUS" -eq 0 ] || { exit 1; }
