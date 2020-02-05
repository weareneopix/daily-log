#!/usr/bin/env node

const git = require('simple-git/promise')()
const _ = require('lodash')
const cp = require('copy-paste')
const program = require('commander');
const u = require('./utils');
const m = require('./messages');

const typeMap = {
  'feat': 'New features',
  'chore': 'Chores',
  'refactor': 'Refactoring',
  'fix': 'Fixes',
  null: 'Other commits'
}

program
  .option('-a, --author <author>', 'commit author')
  .option('-c, --commit <commit>', 'commit hash')
  .option('-s, --since <date>', 'show commits more recent than a specific date.')
  .option('-m, --me', 'get only your commits')
  .action(start);

program.parse(process.argv);

async function getUsername() {
  return git.raw(['config', '--get', 'user.name']);
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

async function getLog({ username, range, since }) {
  try {
    const log = await git.raw([
      'log',
      ...(range ? [`${range}`] : []),
      ...(since ? [`--since="${since}"`] : []),
      ...(username ? [`--author=${username}`] : []),
      '--no-merges',
      '--pretty=format:%s',
    ])

    return log;

  } catch (e) {
    u.error(e);
  }
}

function prettyPrintLog(log) {
  const messages = log.split('\n')
  const print = _(messages)
      .map(tokenize)
      .groupBy('type')
      .mapValues(x => _.groupBy(x, 'scope'))
      .mapValues(scopeFormatter)
      .map(typeFormatter)
      .join('\n\n')
  console.log(print)
  return print;
}

function copyLogToClipboard(log) {
  try {
    cp.copy(log);
    u.success(m.success);
    process.exit()
  } catch (e) {
    u.error(e);
  }
}

async function start(r, o) {
  /**
   * Based on the number of parameters provided.
   * Check what is an argument and what are options
   */
  let range;
  let options = o;
  if (typeof r === 'object') {
    options = r;
  } else {
    range = r;
  }

  let username = '';
  const since = options.since;

  if (options.author && options.me) u.error(m.selectedMandA);
  if (options.author) username = options.author;
  if (options.me) username = await getUsername();

  username = username.trim();
  let log = await getLog({ username, range, since });

  if (!log) {
    u.warning(m.blameItOnDgn);
    process.exit()
  }

  log = prettyPrintLog(log);
  copyLogToClipboard(log);
}
