const chalk = require('chalk');

exports.warning = msg => console.log(chalk.yellow(msg))
exports.success = msg => console.log(chalk.green(msg))
exports.error = msg => {
    console.log(chalk.red(msg))
    process.exit(1)
}