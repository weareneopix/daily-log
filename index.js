#!/usr/bin/env node

const git = require('simple-git')()
const _ = require('lodash')
const cp = require('copy-paste')

const typeMap = {
  'feat': 'New features',
  'chore': 'Chores',
  'refactor': 'Refactoring',
  'fix': 'Fixes',
  null: 'Other commits'
}

const supportedFlags = [{
    name: 'help',
    flag: '--help',
    short: '-h',
    info: 'Display help message.',
    usage: ['git daily-log --help'],
  }, {
    name: 'branch selection',
    flag: '--branch',
    short: '-b',
    info: 'Select the branches from which to parse commit messages. Default is *develop*.',
    usage: ['git --branch staging', 'git -b branch-1 branch-2 branch-3'],
  }]

const processArgs = process.argv

// check for `--help` flag
const hasHelpFlag = _.findIndex(processArgs, arg => arg == '--help') > -1
if (hasHelpFlag) {
  console.log('This is a simple util for pretty printing daily log based on git semantic commit messages')
  console.log('Options:')
  supportedFlags.forEach(supportedFlag => {
    const usage = supportedFlag.usage.map(usage => `\`${usage}\``).join(' OR ')
    console.log(`\t${supportedFlag.flag}`)
    console.log(`\t\t${supportedFlag.info}`)
    console.log(`\t\tUsage: ${usage}`)
  })
  process.exit()
}

const branchNames = getBranchNames()

const throwErrorAndQuit = () => {
  console.error('Looks like nothing has been done in last 16 hours.')
  console.error('You can probably blame it on design, though.')
  process.exit(1)
}

git.raw(['config', '--get', 'user.email'], (err, _email) => {
  const email = _email.trim()

  git.raw([
    'log',
    ...branchNames,
    '--since="16 hours ago"',
    '--no-merges',
    `--author=${email}`,
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

  })
})

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

function getBranchNames() {
  const branchFlagIndex = _.findIndex(processArgs, arg => arg == '-b' || arg == '--branch')
  if (branchFlagIndex == -1) {
    // no branch flag, assume default (`develop`)
    return ['develop']
  }

  const branchNameStart = branchFlagIndex + 1
  const nextFlagIndex = _.findIndex(processArgs, arg => /^\-+/.test(arg), branchNameStart)
  const branchNameEnd = nextFlagIndex == -1 ? processArgs.length : nextFlagIndex - 1
  const names = processArgs.slice(branchNameStart, branchNameEnd)
  return names
}
