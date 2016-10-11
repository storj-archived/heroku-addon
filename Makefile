.SILENT:
.DEFAULT:
help:
	echo
	echo "Storj.io Heroku Add-on Server Make commands"
	echo
	echo "  Commands: "
	echo
	echo "    help - show this message (default)"
	echo "    test - run tests against the codebase"
	echo "    docker-clean - remove all docker containers"
	echo "    docker-build - build fresh docker containers"

test: docker-clean docker-build
	docker-compose -f ./dockerfiles/test.yml up

docker-clean:
	docker-compose -f ./dockerfiles/test.yml rm -f


docker-build: ./dockerfiles
	docker-compose -f ./dockerfiles/test.yml build


deps:
	echo "  Dependencies: "
	echo
	echo "    * docker $(shell which docker > /dev/null || echo '- \033[31mNOT INSTALLED\033[37m')"
	echo "    * docker-compose $(shell which docker-compose > /dev/null || echo '- \033[31mNOT INSTALLED\033[37m')"

.PHONY: docker-clean docker-build test deps
