# SERMAS CLI 

**The readme is in progress. Please open an issue to report a problem or ask anything**

The SERMAS CLI is designed to interface with the API for management tasks.

## Usage

```sh

# help
sermas-cli -h

# login
sermas-cli auth login

```


## development

### add autocompletion
``` 
# in ~/.bashrc

alias sermas-cli='cd <sermas-cli path>/cli && ./cli-local.sh'
_sermas_completion()
{
    local cur=${COMP_WORDS[COMP_CWORD]}
    local opts=$(sermas completion "${COMP_CWORD}" $@)
    COMPREPLY=( $(compgen -W "${opts}" -- $cur) )
}
complete -F _sermas_completion sermas
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
