# SERMAS CLI

The SERMAS CLI is designed to interface with the API for management tasks.

## Usage

```sh
sermas-cli -h                               # commands
sermas-cli auth login --saveLocally admin   # asks for the password
sermas-cli --json app list                  # global options go before the command
sermas-cli app admin import ./apps          # app structures (app.yaml, repository/, ...)
sermas-cli app admin export -i my-app out.json
```

`BASE_URL` points at the API (`http://localhost:8080` by default), `CONFIG_DIR` at
the config and credentials directory (`~/.sermas`).

## Development

Node 24 (`nvm use`). `@sermas/api-client` is compiled from its sources: a
`sermas-api-client` checkout beside this one (`API_CLIENT_DIR` for the tests).

```sh
npm ci
npm start -- -h            # from the sources (tsx)
npm run typecheck && npm run lint && npm test
npm run build              # dist/, with the API client bundled in
node dist/index.js -h
make docker/build          # image, with the API client checkout as build context
```

Commands are files under `src/commands/<group>/<name>.ts`, found at run time.

### Autocompletion

```sh
# in ~/.bashrc
alias sermas-cli='<sermas-cli path>/cli-local.sh'
_sermas_completion()
{
    local cur=${COMP_WORDS[COMP_CWORD]}
    local opts=$(sermas-cli completion "${COMP_CWORD}" $@)
    COMPREPLY=( $(compgen -W "${opts}" -- $cur) )
}
complete -F _sermas_completion sermas-cli
```

## License

```
   Copyright 2024 Spindox Labs srl

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```
