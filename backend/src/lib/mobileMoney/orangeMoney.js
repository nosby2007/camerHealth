// ─── CameroHealth — Orange Money client (stub) ──────────────────────────────
// Orange Money has no self-serve sandbox — onboarding requires a commercial
// relationship with Orange Cameroun. This module keeps the same interface as
// mtnMomo.js so mobile-money.js can route to either provider without the
// caller knowing which one is behind it; it becomes a real integration once
// ORANGE_MONEY_CLIENT_ID/SECRET are issued.
const { ORANGE_MONEY_CLIENT_ID, ORANGE_MONEY_CLIENT_SECRET } = require('../../config')

function isConfigured() {
  return Boolean(ORANGE_MONEY_CLIENT_ID && ORANGE_MONEY_CLIENT_SECRET)
}

function notConfiguredError() {
  const error = new Error('Orange Money is not configured. This provider requires a commercial agreement with Orange Cameroun — set ORANGE_MONEY_CLIENT_ID and ORANGE_MONEY_CLIENT_SECRET once issued.')
  error.status = 500
  error.code = 'ORANGE_MONEY_NOT_CONFIGURED'
  return error
}

async function requestToPay() {
  throw notConfiguredError()
}

async function getTransactionStatus() {
  throw notConfiguredError()
}

module.exports = { isConfigured, requestToPay, getTransactionStatus }
