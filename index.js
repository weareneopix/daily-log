const git = require('simple-git')()

git.log({}, (err, log) => {
  const print = log.all
    .map(entry => entry.message)
    .map(stripBranchInfo)
  console.log(print)
})

function stripBranchInfo(msg) {
  const result = /(.*)\(.+->.+\)$/.exec(msg)
  return result ? result[1].slice(0, -1) : msg
}
