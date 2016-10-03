.SILENT:
.DEFAULT:
help:
	echo
	echo "Storj.io Heroku Add-on Server Make commands"
	echo
	echo "  Commands: "
	echo
	echo "    help - show this message (default)"
	echo "    run - run a containerized version of this architecture locally"
	echo "    kensa - run kensa against the current codebase"
	echo "    integration - run integration tests against the codebase"
	echo "    docker-clean - remove all docker containers"
	echo "    docker-build - build fresh docker containers"

kensa: docker-clean docker-build
	docker-compose -f ./dockerfiles/kensa.yml up

integration: docker-clean docker-build-integration
	docker-compose -f ./dockerfiles/integration.yml up

run: docker-clean docker-build
	docker-compose -f ./dockerfiles/run.yml up

docker-clean:
	docker-compose -f ./dockerfiles/kensa.yml rm -f
	docker-compose -f ./dockerfiles/integration.yml rm -f
	docker-compose -f ./dockerfiles/run.yml rm -f

docker-build: docker-build-integration docker-build-kensa docker-build-run
	docker-compose -f ./dockerfiles/kensa.yml build
	docker-compose -f ./dockerfiles/run.yml build

docker-build-kensa:
	docker-compose -f ./dockerfiles/kensa.yml build

docker-build-integration: ./dockerfiles
	docker-compose -f ./dockerfiles/integration.yml build

docker-build-run:
	docker-compose -f ./dockerfiles/run.yml build

deps:
	echo "  Dependencies: "
	echo
	echo "    * docker $(shell which docker > /dev/null || echo '- \033[31mNOT INSTALLED\033[37m')"
	echo "    * docker-compose $(shell which docker-compose > /dev/null || echo '- \033[31mNOT INSTALLED\033[37m')"

.PHONY: kensa docker-clean docker-build integration run deps docker-build-integration docker-build-kensa docker-build-run
