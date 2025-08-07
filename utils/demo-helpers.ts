import { DemoLogger } from './logger';
import ora, { Ora } from 'ora';
import * as readline from 'readline-sync';

const logger = new DemoLogger('DemoHelpers');

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function createSpinner(text: string): Ora {
  return ora({
    text,
    spinner: 'dots'
  });
}

export async function withSpinner<T>(
  text: string,
  action: () => Promise<T>
): Promise<T> {
  const spinner = createSpinner(text);
  spinner.start();
  
  try {
    const result = await action();
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

export function waitForUserInput(message: string = 'Press Enter to continue...'): void {
  readline.question(message);
}

export function getUserInput(prompt: string): string {
  return readline.question(prompt);
}

export function getUserChoice(prompt: string, choices: string[]): number {
  return readline.keyInSelect(choices, prompt);
}

export function formatAccountId(accountId: string): string {
  return accountId.startsWith('0.0.') ? accountId : `0.0.${accountId}`;
}

export function truncateString(str: string, maxLength: number = 50): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      logger.warning(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await sleep(delay);
    }
  }
  
  throw new Error('Max retries exceeded');
}

export function displayHeader(title: string, description?: string): void {
  console.clear();
  logger.title(`🚀 ${title}`);
  if (description) {
    console.log(description);
    console.log();
  }
}

export function displayStep(stepNumber: number, total: number, description: string): void {
  logger.step(stepNumber, `[${stepNumber}/${total}] ${description}`);
}

export function displayResult(label: string, value: any): void {
  console.log(`${label}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`);
}