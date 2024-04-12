

docker/build:
	docker build . -t ghcr.io/sermas-eu/cli:latest

docker/bash:
	docker run --rm -it --entrypoint bash ghcr.io/sermas-eu/cli:latest

docker/run:
	docker run --rm -it ghcr.io/sermas-eu/cli:latest

docker/push:
	docker push ghcr.io/sermas-eu/cli:latest