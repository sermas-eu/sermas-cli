API_URL?=https://localhost:8080


openapi/download:
	curl '${API_URL}' \
		-k -o ./spec.json

openapi/generate:
	npm run generate

openapi: openapi/download openapi/generate


apps/import:
	./dev-cli.sh app admin import -s ../backend/api/config/apps.json

apps/import/with-clients:
	./dev-cli.sh app admin import ../backend/api/config/apps.json