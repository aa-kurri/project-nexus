/**
 * Migration Pipeline — Logger
 *
 * Structured logging with colors and level filtering.
 */

import chalk from "chalk";
import { getConfig } from "./config.js";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LEVEL_COLORS: Record<LogLevel, (s: string) => string> = {
  debug: chalk.gray,
  info: chalk.cyan,
  warn: chalk.yellow,
  error: chalk.red,
};

const LEVEL_LABELS: Record<LogLevel, string> = {
  debug: "DBG",
  info: "INF",
  warn: "WRN",
  error: "ERR",
};

class Logger {
  private minLevel: LogLevel = "info";
  private stage: string = "global";

  configure(level: LogLevel, stage?: string) {
    this.minLevel = level;
    if (stage) this.stage = stage;
  }

  setStage(stage: string) {
    this.stage = stage;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.minLevel]) return;

    const timestamp = new Date().toISOString().slice(11, 23);
    const color = LEVEL_COLORS[level];
    const label = LEVEL_LABELS[level];
    const prefix = `${chalk.dim(timestamp)} ${color(label)} ${chalk.dim(`[${this.stage}]`)}`;

    console.log(`${prefix} ${message}`);
    if (data) {
      console.log(chalk.dim(JSON.stringify(data, null, 2)));
    }
  }

  debug(msg: string, data?: Record<string, unknown>) {
    this.log("debug", msg, data);
  }
  info(msg: string, data?: Record<string, unknown>) {
    this.log("info", msg, data);
  }
  warn(msg: string, data?: Record<string, unknown>) {
    this.log("warn", msg, data);
  }
  error(msg: string, data?: Record<string, unknown>) {
    this.log("error", msg, data);
  }

  success(msg: string) {
    console.log(`${chalk.green("  ✔")} ${msg}`);
  }

  fail(msg: string) {
    console.log(`${chalk.red("  ✘")} ${msg}`);
  }

  separator(title?: string) {
    const line = "═".repeat(60);
    if (title) {
      console.log(`\n${chalk.bold.white(line)}\n${chalk.bold.white(`  ${title}`)}\n${chalk.bold.white(line)}\n`);
    } else {
      console.log(chalk.dim("─".repeat(60)));
    }
  }

  table(rows: Record<string, string | number>[]) {
    console.table(rows);
  }
}

export const logger = new Logger();
