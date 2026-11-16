export function jsonError(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'INVALID_JSON' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'PAYLOAD_TOO_LARGE' });
  }

  console.error('[jsonError]', err);
  return res.status(500).json({ error: 'INTERNAL_ERROR' });
}
