function handleError(err, res) {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');

  if (err.code === 'invalid_client') {
    const header = 'Bearer realm="authorization server", error="invalid_token",' +
            'error_description="No access token provided"';
    res.set('WWW-Authenticate', header);
  }

  res.status(err.status).json({
    error: err.code,
    description: err.message,
  });
}

export default handleError;