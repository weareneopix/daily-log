# Git Daily Log
Generate a log based on the daily commits. The commit message format that is used and pares by `git-daily-log`
is [Karma Semantic Commits](2)

## Installation

Via npm:

```sh
npm i -g @weareneopix/daily-log
```

## Usage

```sh
git-daliy-log [<range>] [<options>]
```
#### `<range>`

Show only commits in the specified revision range. When no `<range>` is specified, it defaults to HEAD
(i.e. the whole history leading to the current commit). origin..HEAD specifies all the commits reachable from the current
commit (i.e. HEAD), but not from origin. For a complete list of ways to spell `<range>`, see the Specifying Ranges section of [gitrevisions](3).

## Options

The CLI provides options to customize the output.

| Option                  | Description                                                    | Required |
|-------------------------|----------------------------------------------------------------|----------|
| `-a, --author <author>` | Show only commits from provided `author`                       | No       |
| `-s, --since <date>`    | Show commits more recent than a specific date. [More info.](1) | No       |
| `-m, --me`              | Show only my commits                                           | No       |
| `-h, --help`            | Get CLI usage information                                      | No       |

## Examples
Show all **your** commits since **yesterday**:

```sh
git-daily-log -m -s "1 day ago"
# or
git-daily-log --me --since "1 day ago"
```

Show all commits between two tags:

```sh
git-daily-log 1.3.0..1.2.1
```

[1]: https://git-scm.com/docs/git-log#Documentation/git-log.txt---sinceltdategt
[2]: http://karma-runner.github.io/3.0/dev/git-commit-msg.html
[3]: https://git-scm.com/docs/gitrevisions#_specifying_ranges
