#!/usr/bin/env node

const git = require('simple-git')()
const _ = require('lodash')
const cp = require('copy-paste')
const program = require('commander');

const typeMap = {
  'feat': 'New features',
  'chore': 'Chores',
  'refactor': 'Refactoring',
  'fix': 'Fixes',
  null: 'Other commits'
}

program
  .option('-a, --author <author>', 'commit author')
  .option('-m, --me', 'get only your commits');
  
program.parse(process.argv);

const throwErrorAndQuit = () => {
  console.error('Looks like nothing has been done in last 16 hours.')
  console.error('You can probably blame it on design, though.')
  process.exit()
}

let username = '';
let hasFinished = false

if (program.author) {
  username = program.author.trim()
  hasFinished = true;
  getCommits();
}


if (program.me && !hasFinished) {
  hasFinished = true;
  git.raw(['config', '--get', 'user.name'], (err, _username) => { 
    username = _username.trim()
    getCommits();
  })
}

if (!hasFinished) {
  getCommits();
}

function getCommits() { 
  git.raw([
    'log',
    '--since="16 hours ago"',
    '--no-merges',
    ...username && [`--author=${username}`],
    '--pretty=format:%s',
  ], (err, log) => {
  
    if (log == null) {
      throwErrorAndQuit();
    }
  
    const messages = log.split('\n')
  
    if (messages.length == 0) {
      throwErrorAndQuit();
    }
  
    const print = _(messages)
      .map(tokenize)
      .groupBy('type')
      .mapValues(x => _.groupBy(x, 'scope'))
      .mapValues(scopeFormatter)
      .map(typeFormatter)
      .join('\n\n')
    console.log(print)
  
    cp.copy(print, (err, next) => {
      if (err) {
        return console.log('Copying to clipboard was not successful.')
      }
      console.log('\nSuccessfully copied to clipboard!')
      process.exit()
    })
  });
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
      if (scope != null && scope != 'null') { // lol
        return `${scopeNameFormatter(scope)}\n${formattedMsgs}`
      } else {
        return formattedMsgs
      }
    })
}

function typeFormatter(group, type) {
  const formattedType = typeMap[type] ? typeMap[type] : type
  return `\`${formattedType}\`\n${group.join('\n>\n')}`
}
