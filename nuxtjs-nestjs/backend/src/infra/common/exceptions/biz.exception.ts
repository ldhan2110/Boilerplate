export type BizErrorType = 'WARN' | 'ERROR';

export class BizException extends Error {
  constructor(
    public readonly errorCode: string,
    public readonly errorType: BizErrorType,
    public readonly errorMessage?: string,
  ) {
    super(errorMessage ?? errorCode);
    this.name = 'BizException';
  }
}
