import chalk from "chalk";

export const info = (message) => console.log(chalk.cyanBright.bold(message));

export const danger = (message) => console.log(chalk.redBright.bold(message));

export const success = (message) =>
  console.log(chalk.greenBright.bold(message));
