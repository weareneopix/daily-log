const git = require('simple-git')()

git.log({
  '--all': null,
  '--no-merges': null,
  '--since': '16 hours ago',
}, (err, log) => {
  const print = log.all
    .map(entry => entry.message)
    .map(stripBranchInfo)
    .map(tokenize)
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
