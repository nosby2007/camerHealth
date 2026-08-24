const assert = require('node:assert/strict')
const { MEDICATION_CATALOG, findMedicationCatalogItem } = require('../util/medication-catalog.cjs')

assert.ok(MEDICATION_CATALOG.length >= 25, 'common hospital formulary should be populated')
assert.equal(findMedicationCatalogItem('Paracetamol 500 mg').genericName, 'Paracetamol')
assert.equal(findMedicationCatalogItem('artemether-lumefantrine tablets').medicationClass, 'Antimalarial combination')
assert.ok(findMedicationCatalogItem('Oxytocin').education)
assert.equal(findMedicationCatalogItem('unknown product'), null)

console.log('medication catalog tests passed')
