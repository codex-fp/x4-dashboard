const REMOTE_CONTROL_ENABLED = process.env.ALLOW_REMOTE_CONTROLS === 'true';

const LOOPBACK_ADDRESSES = new Set([
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1',
]);

function isLoopbackAddress(address) {
  return LOOPBACK_ADDRESSES.has(address);
}

function getRequestAddress(req) {
  return req.ip || req.socket?.remoteAddress || '';
}

function requireLocalControlRequest(req, res, next) {
  if (REMOTE_CONTROL_ENABLED || isLoopbackAddress(getRequestAddress(req))) {
    return next();
  }

  return res.status(403).json({
    error: 'Control endpoints are localhost-only by default. Set ALLOW_REMOTE_CONTROLS=true to override.',
  });
}

module.exports = {
  REMOTE_CONTROL_ENABLED,
  requireLocalControlRequest,
};
