# SERMAS CLI 

*** The readme is in progress. Please open an issue to report a problem or ask anything ***

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