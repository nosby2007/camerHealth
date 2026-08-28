// ─── CameroHealth — MTN Mobile Money Collections client ────────────────────
// Implements the "Request to Pay" flow against MTN's Collections API
// (sandbox.momodeveloper.mtn.com in dev, proxy.momoapi.mtn.com in prod).
// Optional like Supabase: if credentials are absent, callers get a clear
// "not configured" error instead of a crash at startup.
const crypto = require('crypto')
const {
  MTN_MOMO_SUBSCRIPTION_KEY,
  MTN_MOMO_API_USER,
  MTN_MOMO_API_KEY,
  MTN_MOMO_ENV
} = require('../../config')

const BASE_URL = MTN_MOMO_ENV === 'production'
  ? 'https://proxy.momoapi.mtn.com'
  : 'https://sandbox.momodeveloper.mtn.com'

function isConfigured() {
  return Boolean(MTN_MOMO_SUBSCRIPTION_KEY && MTN_MOMO_API_USER && MTN_MOMO_API_KEY)
}

function notConfiguredError() {
  const error = new Error('MTN Mobile Money is not configured. Set MTN_MOMO_SUBSCRIPTION_KEY, MTN_MOMO_API_USER and MTN_MOMO_API_KEY.')
  error.status = 500
  error.code = 'MTN_MOMO_NOT_CONFIGURED'
  return error
}

async function getAccessToken() {
  const credentials = Buffer.from(`${MTN_MOMO_API_USER}:${MTN_MOMO_API_KEY}`).toString('base64')
  const response = await fetch(`${BASE_URL}/collection/token/`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Ocp-Apim-Subscription-Key': MTN_MOMO_SUBSCRIPTION_KEY
    }
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`MTN MoMo auth failed (${response.status}): ${body}`)
  }
  const data = await response.json()
  return data.access_token
}

function normalizePhoneNumber(phoneNumber) {
  return String(phoneNumber).replace(/[^\d]/g, '').replace(/^0/, '237')
}

// Initiates a Request to Pay. Returns { referenceId } — MTN confirms
// asynchronously (the patient approves on their phone), so the caller must
// poll getTransactionStatus or receive the webhook callback.
async function requestToPay({ phoneNumber, amount, currency = 'XAF', externalId, payerMessage, payeeNote }) {
  if (!isConfigured()) throw notConfiguredError()

  const referenceId = crypto.randomUUID()
  const token = await getAccessToken()

  const response = await fetch(`${BASE_URL}/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': MTN_MOMO_SUBSCRIPTION_KEY,
      'X-Reference-Id': referenceId,
      'X-Target-Environment': MTN_MOMO_ENV,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: String(amount),
      currency,
      externalId,
      payer: { partyIdType: 'MSISDN', partyId: normalizePhoneNumber(phoneNumber) },
      payerMessage: payerMessage || 'CameroHealth payment request',
      payeeNote: payeeNote || 'CameroHealth invoice'
    })
  })

  if (response.status !== 202) {
    const body = await response.text().catch(() => '')
    throw new Error(`MTN MoMo request-to-pay failed (${response.status}): ${body}`)
  }

  return { referenceId }
}

// MTN transaction statuses: PENDING | SUCCESSFUL | FAILED
async function getTransactionStatus(referenceId) {
  if (!isConfigured()) throw notConfiguredError()
  const token = await getAccessToken()

  const response = await fetch(`${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': MTN_MOMO_SUBSCRIPTION_KEY,
      'X-Target-Environment': MTN_MOMO_ENV
    }
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`MTN MoMo status check failed (${response.status}): ${body}`)
  }

  const data = await response.json()
  return { status: data.status, raw: data }
}

module.exports = { isConfigured, requestToPay, getTransactionStatus }
