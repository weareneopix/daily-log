const git = require('simple-git')()

git.log({
  '--all': null,
  '--since': '16 hours ago',
}, (err, log) => {
  const print = log.all
    .map(entry => entry.message)
    .map(stripBranchInfo)
  console.log(print)
})

function stripBranchInfo(msg) {
  const result = /(.*)\(.+->.+\)$/.exec(msg)
  return result ? result[1].slice(0, -1) : msg
}
