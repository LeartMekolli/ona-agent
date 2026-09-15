export class OnaError extends Error {
  constructor(
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ConfigurationError extends OnaError {}
export class ContextBuildFailedError extends OnaError {}
export class ProviderError extends OnaError {
  constructor(
    message: string,
    readonly statusCode: number | undefined,
    cause?: unknown,
  ) {
    super(message, cause);
  }
}
