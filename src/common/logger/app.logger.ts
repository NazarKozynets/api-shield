import { LoggerService } from '@nestjs/common';

type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose' | 'fatal';

type AppLoggerOptions = {
  suppressNestStartupLogs?: boolean;
  colorize?: boolean;
  debug?: boolean;
};

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  brightRed: '\x1b[91m',
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  log: COLORS.green,
  error: COLORS.red,
  warn: COLORS.yellow,
  debug: COLORS.magenta,
  verbose: COLORS.cyan,
  fatal: COLORS.brightRed,
};

const NEST_STARTUP_CONTEXTS = new Set([
  'NestFactory',
  'InstanceLoader',
  'RoutesResolver',
  'RouterExplorer',
  'NestApplication',
]);

export class AppLogger implements LoggerService {
  private readonly context?: string;
  private readonly options: AppLoggerOptions;

  constructor(context?: string, options?: AppLoggerOptions);
  constructor(options?: AppLoggerOptions);
  constructor(
    contextOrOptions?: string | AppLoggerOptions,
    options: AppLoggerOptions = {},
  ) {
    if (typeof contextOrOptions === 'string') {
      this.context = contextOrOptions;
      this.options = options;
      return;
    }

    this.options = contextOrOptions ?? {};
  }

  log(message: unknown, ...optionalParams: unknown[]) {
    this.write('log', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    this.write('error', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    this.write('warn', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]) {
    this.write('debug', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]) {
    this.write('verbose', message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]) {
    this.write('fatal', message, optionalParams);
  }

  private write(level: LogLevel, message: unknown, optionalParams: unknown[]) {
    if (this.shouldSuppress(level, optionalParams)) {
      return;
    }

    const output = this.format(level, message, optionalParams);

    switch (level) {
      case 'error':
      case 'fatal':
        console.error(output);
        return;
      case 'warn':
        console.warn(output);
        return;
      case 'debug':
        console.debug(output);
        return;
      default:
        console.log(output);
    }
  }

  private shouldSuppress(level: LogLevel, optionalParams: unknown[]) {
    if (level === 'debug' && !this.shouldLogDebug()) {
      return true;
    }

    if (!this.options.suppressNestStartupLogs || level !== 'log') {
      return false;
    }

    return optionalParams.some(
      (param) => typeof param === 'string' && NEST_STARTUP_CONTEXTS.has(param),
    );
  }

  private shouldLogDebug(): boolean {
    if (this.options.debug !== undefined) {
      return this.options.debug;
    }

    return process.env.NODE_ENV === 'dev';
  }

  private format(
    level: LogLevel,
    message: unknown,
    optionalParams: unknown[],
  ): string {
    const timestamp = new Date().toISOString();
    const levelLabel = level.toUpperCase();
    const context = this.context ? `[${this.context}]` : undefined;

    const parts = [
      this.colorize(timestamp, COLORS.dim),
      this.colorize(levelLabel, LEVEL_COLORS[level]),
      context ? this.colorize(context, COLORS.yellow) : undefined,
      this.colorize(this.stringify(message), LEVEL_COLORS[level]),
      ...optionalParams.map((param) =>
        this.colorize(this.stringify(param), LEVEL_COLORS[level]),
      ),
    ];

    return parts.filter(Boolean).join(' ');
  }

  private colorize(value: string, color: string): string {
    if (!this.shouldColorize()) {
      return value;
    }

    return `${color}${value}${COLORS.reset}`;
  }

  private shouldColorize(): boolean {
    if (this.options.colorize !== undefined) {
      return this.options.colorize;
    }

    return process.stdout.isTTY && !process.env.NO_COLOR;
  }

  private stringify(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (value instanceof Error) {
      return value.stack ?? value.message;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}
