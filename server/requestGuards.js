const { readRuntimeConfig } = require('./runtimeConfigStore');

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
  const runtimeConfig = readRuntimeConfig();

  if (runtimeConfig.allowRemoteControls || isLoopbackAddress(getRequestAddress(req))) {
    return next();
  }

  return res.status(403).json({
    error: 'Control endpoints are localhost-only by default. Enable remote controls in the app settings to override.',
  });
}

module.exports = {
  requireLocalControlRequest,
};
