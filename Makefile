
IMAGE=ghcr.io/sermas-eu/cli:dev

docker/build:
	docker build . -t ${IMAGE}

docker/bash:
	docker run --rm -it --entrypoint bash ${IMAGE}

docker/run:
	docker run --rm -it ${IMAGE}

docker/push:
	docker push ${IMAGE}

docs/watch:
	npx nodemon --exec make docs/gen ./src/**/*.ts

docs/gen:
	./cli-local.sh -l debug docs-gen
	cat ../sermas-eu.github.io/tpl/sermas-cli/usage.md > ../sermas-eu.github.io/docs/sermas-cli/usage.md
	cat docs/sermas-cli.md >> ../sermas-eu.github.io/docs/sermas-cli/usage.md