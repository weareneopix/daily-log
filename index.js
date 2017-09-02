const git = require('simple-git')()
const _ = require('lodash')

const typeMap = {
  'feat': 'New features',
  'chore': 'Chores',
  'refactor': 'Refactoring',
  'fix': 'Fixes',
}

git.log({
  '--all': null,
  '--no-merges': null,
  '--since': '16 hours ago',
}, (err, log) => {
  const print = _(log.all)
    .map(entry => entry.message)
    .map(stripBranchInfo)
    .map(tokenize)
    .groupBy('type')
    .mapValues(x => _.groupBy(x, 'scope'))
    .mapValues(scopeFormatter)
    .map(typeFormatter)
    .join('\n\n')
  console.log(print)
})

function stripBranchInfo(msg) {
  const result = /(.*)\(.+->.+\)$/.exec(msg)
  return result ? result[1].slice(0, -1) : msg
}

function tokenize(msg) {
  const result = /^(\S+)\((.*)\):\s?(.*)/g.exec(msg)
  if (result == null) return {type: null, scope: null, message: msg}
  const [, type, scope, message] = result
  return {type, scope, message}
}

function scopeNameFormatter(scopeName) {
  const name = scopeName == '*' ? 'general' : scopeName
  return `> *${name}*`
}

function scopeFormatter(scope) {
  return _(scope)
    .map((commits, scope) => {
      const messages = commits.map(({message}) => `• ${message}`)
      const formattedMsgs = messages.map(m => '> ' + m).join('\n')
      return `${scopeNameFormatter(scope)}\n${formattedMsgs}`
    })
}

function typeFormatter(group, type) {
  const formattedType = typeMap[type] ? typeMap[type] : type
  return `\`${formattedType}\`\n${group.join('\n>\n')}`
}
