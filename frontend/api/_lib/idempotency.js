const crypto = require('crypto')

const MEMORY_IDEMPOTENCY = new Map()

function getIdempotencyKey(req) {
  const header = req.headers['idempotency-key'] || req.headers['x-idempotency-key']
  const key = header ? String(header).trim() : ''
  if (!key) return null
  return key.slice(0, 200)
}

function hashBody(body) {
  const payload = body && typeof body === 'object' ? body : {}
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
}

function memoryStorageKey({ endpoint, requesterId, idempotencyKey }) {
  return [endpoint, requesterId || 'anonymous', idempotencyKey].join('::')
}

function memoryGetRecord(params) {
  return MEMORY_IDEMPOTENCY.get(memoryStorageKey(params)) || null
}

function memorySetRecord(params, record) {
  MEMORY_IDEMPOTENCY.set(memoryStorageKey(params), record)
}

async function dbGetRecord(adminClient, params) {
  const { data, error } = await adminClient
    .from('idempotency_keys')
    .select('*')
    .eq('key', params.idempotencyKey)
    .eq('endpoint', params.endpoint)
    .eq('requester_id', params.requesterId)
    .maybeSingle()

  if (error) throw error
  return data || null
}

async function dbInsertProcessing(adminClient, params) {
  const expiresAt = new Date(Date.now() + params.ttlMs).toISOString()
  const { error } = await adminClient
    .from('idempotency_keys')
    .insert({
      key: params.idempotencyKey,
      endpoint: params.endpoint,
      requester_id: params.requesterId,
      request_hash: params.requestHash,
      status: 'processing',
      response_body: null,
      expires_at: expiresAt
    })

  if (error) throw error
}

async function dbComplete(adminClient, params) {
  const { error } = await adminClient
    .from('idempotency_keys')
    .update({
      status: params.status,
      response_body: params.responseBody,
      updated_at: new Date().toISOString()
    })
    .eq('key', params.idempotencyKey)
    .eq('endpoint', params.endpoint)
    .eq('requester_id', params.requesterId)

  if (error) throw error
}

function isTableMissing(error) {
  const message = (error && error.message ? error.message : '').toLowerCase()
  return error && (error.code === 'PGRST205' || message.includes('idempotency_keys') && message.includes('not found'))
}

async function beginIdempotency({
  req,
  adminClient,
  endpoint,
  requesterId,
  body,
  ttlMs = 24 * 60 * 60 * 1000
}) {
  const idempotencyKey = getIdempotencyKey(req)
  if (!idempotencyKey) {
    return {
      enabled: false,
      idempotencyKey: null,
      requestHash: null,
      storage: 'none'
    }
  }

  const requestHash = hashBody(body)
  const requester = requesterId || 'anonymous'
  const params = {
    endpoint,
    requesterId: requester,
    idempotencyKey,
    requestHash,
    ttlMs
  }

  try {
    const record = await dbGetRecord(adminClient, params)
    if (!record) {
      await dbInsertProcessing(adminClient, params)
      return { enabled: true, replay: false, conflict: false, inProgress: false, storage: 'db', ...params }
    }

    if (record.request_hash !== requestHash) {
      return { enabled: true, conflict: true, replay: false, inProgress: false, storage: 'db', ...params }
    }

    if (record.status === 'completed' && record.response_body) {
      return { enabled: true, replay: true, cachedResponse: record.response_body, storage: 'db', ...params }
    }

    if (record.status === 'processing') {
      return { enabled: true, inProgress: true, replay: false, conflict: false, storage: 'db', ...params }
    }

    await dbComplete(adminClient, {
      ...params,
      status: 'processing',
      responseBody: null
    })
    return { enabled: true, replay: false, conflict: false, inProgress: false, storage: 'db', ...params }
  } catch (error) {
    if (!isTableMissing(error)) {
      throw error
    }

    const existing = memoryGetRecord(params)
    if (!existing) {
      memorySetRecord(params, {
        requestHash,
        status: 'processing',
        responseBody: null,
        expiresAt: Date.now() + ttlMs
      })
      return { enabled: true, replay: false, conflict: false, inProgress: false, storage: 'memory', ...params }
    }

    if (existing.requestHash !== requestHash) {
      return { enabled: true, conflict: true, replay: false, inProgress: false, storage: 'memory', ...params }
    }

    if (existing.status === 'completed' && existing.responseBody) {
      return { enabled: true, replay: true, cachedResponse: existing.responseBody, storage: 'memory', ...params }
    }

    if (existing.status === 'processing') {
      return { enabled: true, inProgress: true, replay: false, conflict: false, storage: 'memory', ...params }
    }

    existing.status = 'processing'
    existing.responseBody = null
    memorySetRecord(params, existing)
    return { enabled: true, replay: false, conflict: false, inProgress: false, storage: 'memory', ...params }
  }
}

async function completeIdempotency(adminClient, context, { status, responseBody }) {
  if (!context || !context.enabled) return

  if (context.storage === 'db') {
    await dbComplete(adminClient, {
      endpoint: context.endpoint,
      requesterId: context.requesterId,
      idempotencyKey: context.idempotencyKey,
      status,
      responseBody
    })
    return
  }

  const record = memoryGetRecord(context)
  if (!record) return
  record.status = status
  record.responseBody = responseBody || null
  memorySetRecord(context, record)
}

module.exports = {
  getIdempotencyKey,
  hashBody,
  beginIdempotency,
  completeIdempotency
}