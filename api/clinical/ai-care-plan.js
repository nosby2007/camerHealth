const { optionalEnv } = require('../_lib/env')
const {
  json,
  badRequest,
  internalServerError,
  serviceUnavailable,
  methodNotAllowed,
  tooManyRequests
} = require('../_lib/http')
const { enforceRateLimits } = require('../_lib/rate-limit')
const { getCorrelationId } = require('../_lib/correlation')

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['acuityScore', 'riskLabel', 'nextBestAction', 'insights', 'priorityRows'],
  properties: {
    acuityScore: { type: 'integer', minimum: 0, maximum: 100 },
    riskLabel: { type: 'string' },
    nextBestAction: { type: 'string' },
    insights: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['level', 'icon', 'title', 'detail'],
        properties: {
          level: { type: 'string', enum: ['high', 'warning', 'info', 'good'] },
          icon: { type: 'string' },
          title: { type: 'string' },
          detail: { type: 'string' }
        }
      }
    },
    priorityRows: {
      type: 'array',
      minItems: 1,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'reason', 'owner', 'nextAction'],
        properties: {
          label: { type: 'string' },
          reason: { type: 'string' },
          owner: { type: 'string' },
          nextAction: { type: 'string' }
        }
      }
    }
  }
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) return req.body
  let raw = ''
  for await (const chunk of req) raw += chunk
  if (!raw) return {}
  return JSON.parse(raw)
}

function clampText(value, max = 400) {
  if (value === null || value === undefined) return ''
  return String(value).slice(0, max)
}

function normalizeContext(context) {
  const safe = context && typeof context === 'object' && !Array.isArray(context) ? context : {}
  return {
    role: clampText(safe.role, 80),
    patient: {
      age: clampText(safe.patient && safe.patient.age, 24),
      gender: clampText(safe.patient && safe.patient.gender, 40),
      patientClass: clampText(safe.patient && safe.patient.patientClass, 80),
      isolation: clampText(safe.patient && safe.patient.isolation, 120)
    },
    latestVitals: safe.latestVitals || null,
    latestVitalsSummary: clampText(safe.latestVitalsSummary, 240),
    latestNursingNoteSummary: clampText(safe.latestNursingNoteSummary, 500),
    openTasks: Array.isArray(safe.openTasks) ? safe.openTasks.slice(0, 12).map(item => ({
      title: clampText(item && item.title, 180),
      priority: clampText(item && item.priority, 60),
      status: clampText(item && item.status, 60),
      owner: clampText(item && item.owner, 80)
    })) : [],
    medications: Array.isArray(safe.medications) ? safe.medications.slice(0, 12).map(item => ({
      name: clampText(item && item.name, 160),
      route: clampText(item && item.route, 60),
      schedule: clampText(item && item.schedule, 80),
      status: clampText(item && item.status, 80)
    })) : [],
    diagnostics: {
      labOrders: Number(safe.diagnostics && safe.diagnostics.labOrders) || 0,
      imagingOrders: Number(safe.diagnostics && safe.diagnostics.imagingOrders) || 0
    },
    wound: {
      status: clampText(safe.wound && safe.wound.status, 240),
      due: Boolean(safe.wound && safe.wound.due)
    },
    schedule: Array.isArray(safe.schedule) ? safe.schedule.slice(0, 8).map(item => ({
      time: clampText(item && item.time, 20),
      label: clampText(item && item.label, 180),
      owner: clampText(item && item.owner, 80),
      status: clampText(item && item.status, 40)
    })) : []
  }
}

function extractOutputText(response) {
  if (response && typeof response.output_text === 'string') return response.output_text
  const chunks = []
  const output = Array.isArray(response && response.output) ? response.output : []
  output.forEach((item) => {
    const content = Array.isArray(item.content) ? item.content : []
    content.forEach((part) => {
      if (typeof part.text === 'string') chunks.push(part.text)
      if (typeof part.output_text === 'string') chunks.push(part.output_text)
    })
  })
  return chunks.join('\n')
}

module.exports = async (req, res) => {
  const correlationId = getCorrelationId(req, res)
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'], correlationId)

  const limit = enforceRateLimits(req, [
    { scope: 'clinical-ai-care-plan:ip', max: 20, windowMs: 60 * 1000 }
  ])
  if (limit.limited) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds))
    return tooManyRequests(res, 'Too many AI care plan requests. Please retry later.', correlationId)
  }

  let body
  try {
    body = await readJsonBody(req)
  } catch (error) {
    return badRequest(res, 'Invalid JSON payload.', 'INVALID_JSON', null, correlationId)
  }

  const context = normalizeContext(body.context)
  if (!context.role) {
    return badRequest(res, 'Missing clinical role context.', 'INVALID_CLINICAL_AI_CONTEXT', null, correlationId)
  }

  const apiKey = optionalEnv('OPENAI_API_KEY')
  if (!apiKey) {
    return serviceUnavailable(res, 'OpenAI is not configured on this environment.', 'OPENAI_NOT_CONFIGURED', correlationId)
  }

  const model = optionalEnv('OPENAI_MODEL', 'gpt-4.1-mini')

  try {
    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 1200,
        input: [
          {
            role: 'system',
            content: 'You are a clinical workflow copilot for nurses. Return clinical decision support only, not a diagnosis. Use concise, safe, explainable recommendations. Escalate urgent abnormal signals. Never invent patient facts. Return JSON matching the schema.'
          },
          {
            role: 'user',
            content: JSON.stringify({
              instruction: 'Generate an AI-driven flowsheet care plan for the current shift. Prioritize nursing actions by time, risk, and documentation need.',
              context
            })
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'clinical_ai_care_plan',
            strict: true,
            schema: RESPONSE_SCHEMA
          }
        }
      })
    })

    const payload = await openAiResponse.json().catch(() => null)
    if (!openAiResponse.ok) {
      return serviceUnavailable(res, 'OpenAI request failed.', 'OPENAI_REQUEST_FAILED', correlationId, {
        status: openAiResponse.status,
        error: payload && payload.error ? payload.error.message : 'Unknown OpenAI error'
      })
    }

    const outputText = extractOutputText(payload)
    let plan
    try {
      plan = JSON.parse(outputText)
    } catch (error) {
      return internalServerError(res, 'OpenAI returned an unreadable care plan.', 'OPENAI_RESPONSE_PARSE_FAILED', correlationId)
    }

    return json(res, 200, {
      ok: true,
      correlationId,
      model,
      plan
    })
  } catch (error) {
    return serviceUnavailable(res, 'OpenAI service is unreachable.', 'OPENAI_UNREACHABLE', correlationId)
  }
}
