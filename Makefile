
IMAGE=ghcr.io/sermas-eu/cli:dev

docker/build:
	docker build . -t ${IMAGE}

docker/bash:
	docker run --rm -it --entrypoint bash ${IMAGE}

docker/run:
	docker run --rm -it ${IMAGE}

docker/push:
	docker push ${IMAGE}