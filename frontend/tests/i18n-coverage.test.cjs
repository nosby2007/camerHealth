const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const root = path.resolve(__dirname, '..')
const en = require('../locales/en.json')
const fr = require('../locales/fr.json')

function flattenKeys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) => {
    const next = prefix ? `${prefix}.${key}` : key
    return child && typeof child === 'object' && !Array.isArray(child)
      ? flattenKeys(child, next)
      : [next]
  })
}

function hasKey(messages, dottedKey) {
  return dottedKey.split('.').every((segment, index, segments) => {
    messages = messages && messages[segment]
    return index < segments.length - 1 ? messages && typeof messages === 'object' : messages !== undefined
  })
}

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(entryPath)
    return /\.(?:js|vue)$/.test(entry.name) ? [entryPath] : []
  })
}

test('English and French locale dictionaries have identical keys', () => {
  assert.deepEqual(flattenKeys(fr).sort(), flattenKeys(en).sort())
})

test('every literal translation key used by the UI exists in both dictionaries', () => {
  const files = ['components', 'layouts', 'pages'].flatMap(folder => sourceFiles(path.join(root, folder)))
  const missing = []
  const keyPattern = /\$t\(\s*['"]([^'"]+)['"]/g

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8')
    for (const match of source.matchAll(keyPattern)) {
      if (!hasKey(en, match[1]) || !hasKey(fr, match[1])) {
        missing.push(`${path.relative(root, file)}: ${match[1]}`)
      }
    }
  }

  assert.deepEqual(missing, [])
})

test('translated nursing surfaces do not reintroduce common English controls', () => {
  const translatedFiles = [
    'components/clinical/ClinicalWorkspace.vue',
    'components/nursing/WoundCard.vue',
    'components/nursing/NurseTaskList.vue',
    'components/nursing/ClinicalNoteEditor.vue',
    'components/nursing/ClinicalFlags.vue',
    'components/nursing/ClinicalAvatar.vue',
    'components/nursing/NursePatientHeader.vue',
    'components/clinical/patient360/PatientBanner.vue',
    'components/clinical/patient360/LeftPatientPanel.vue',
    'components/clinical/patient360/RightClinicalPanel.vue'
  ]
  const visibleEnglish = />\s*(?:Save|Sign|New|Open|Close|Front|Back|Patient|Allerg(?:y|ies)|Clinical|Medical History|Pending Tasks|Care Team|No Orders)(?:\s|<)/i
  const offenders = translatedFiles.filter(file => {
    const template = fs.readFileSync(path.join(root, file), 'utf8').split('</template>')[0]
    return visibleEnglish.test(template)
  })

  assert.deepEqual(offenders, [])
})
