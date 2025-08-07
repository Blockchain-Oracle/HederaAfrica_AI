import chalk from 'chalk';

export class DemoLogger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private timestamp(): string {
    return new Date().toLocaleTimeString();
  }

  info(message: string, data?: any): void {
    console.log(
      chalk.blue(`[${this.timestamp()}]`),
      chalk.cyan(`[${this.context}]`),
      message
    );
    if (data) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  success(message: string, data?: any): void {
    console.log(
      chalk.blue(`[${this.timestamp()}]`),
      chalk.green(`[${this.context}]`),
      chalk.green('✅'),
      message
    );
    if (data) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  error(message: string, error?: any): void {
    console.log(
      chalk.blue(`[${this.timestamp()}]`),
      chalk.red(`[${this.context}]`),
      chalk.red('❌'),
      message
    );
    if (error) {
      console.error(chalk.red(error));
    }
  }

  warning(message: string): void {
    console.log(
      chalk.blue(`[${this.timestamp()}]`),
      chalk.yellow(`[${this.context}]`),
      chalk.yellow('⚠️'),
      message
    );
  }

  step(stepNumber: number, message: string): void {
    console.log(
      chalk.blue(`[${this.timestamp()}]`),
      chalk.magenta(`[Step ${stepNumber}]`),
      message
    );
  }

  divider(): void {
    console.log(chalk.gray('─'.repeat(60)));
  }

  title(title: string): void {
    this.divider();
    console.log(chalk.bold.white(title));
    this.divider();
  }
}