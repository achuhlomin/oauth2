
class OAuthError extends Error {
  constructor(code, message, err) {
    if (err instanceof Error) {
      super(message || err.message);
      this.stack = err.stack;
    } else {
      super(message || '');
    }
    this.code = code;

    switch (code) {
      case 'unsupported_grant_type':
        this.status = 400;
        break;
      case 'invalid_grant':'';
        this.status = 400;
        break;
      case 'invalid_request':
        this.status = 400;
        break;
      case 'invalid_client':
        this.status = 401;
        break;
      case 'invalid_token':'';
        this.status = 401;
        break;
      case 'server_error':
        this.status = 503;
        break;
      default:
        // Leave all other errors to the default error handler
        this.status = 500;
        break;
    }
  }
}

export default OAuthError;