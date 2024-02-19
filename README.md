# SERMAS CLI

The SERMAS CLI is designed to interface with the API for management tasks.

## Usage

```sh

# help
sermas -h

# login
sermas auth login


```


## development

### add autocompletion
``` 
# in ~/.bashrc

alias sermas='cd <sermas.xr path>/cli && ./cli-local.sh'
_sermas_completion()
{
    local cur=${COMP_WORDS[COMP_CWORD]}
    local opts=$(sermas completion "${COMP_CWORD}" $@)
    COMPREPLY=( $(compgen -W "${opts}" -- $cur) )
}
complete -F _sermas_completion sermas
``` 