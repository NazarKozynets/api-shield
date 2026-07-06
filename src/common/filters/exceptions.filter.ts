import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppLogger } from '../logger/app.logger';

type HttpErrorLike = {
  name?: string;
  message?: string;
  status?: number;
  statusCode?: number;
  expose?: boolean;
};

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const response = context.getResponse<FastifyReply>();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();

      return response.status(statusCode).send(
        this.normalizeHttpResponse(exception.getResponse(), statusCode),
      );
    }

    if (this.isHttpError(exception)) {
      const statusCode = exception.statusCode ?? exception.status;

      return response.status(statusCode).send({
        statusCode,
        message: exception.message ?? 'HTTP error',
        error: exception.name ?? 'HttpError',
      });
    }

    const error = exception instanceof Error ? exception : new Error(String(exception));

    this.logger.error(
      `Unhandled exception: ${request.method} ${request.url}`,
      error.stack ?? error.message,
      ExceptionsFilter.name,
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }

  private normalizeHttpResponse(
    body: string | object,
    statusCode: number,
  ): string | object {
    if (typeof body === 'string') {
      return {
        statusCode,
        message: body,
      };
    }

    return body;
  }

  private isHttpError(exception: unknown): exception is HttpErrorLike & {
    statusCode: number;
  } {
    if (!exception || typeof exception !== 'object') {
      return false;
    }

    const candidate = exception as HttpErrorLike;
    const statusCode = candidate.statusCode ?? candidate.status;

    return (
      Number.isInteger(statusCode) &&
      statusCode !== undefined &&
      statusCode >= 400 &&
      statusCode <= 599 &&
      (candidate.name === 'HttpError' ||
        candidate.expose === true ||
        candidate.statusCode !== undefined ||
        candidate.status !== undefined)
    );
  }
}
