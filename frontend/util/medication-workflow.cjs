const MAR_EXCLUDED_STATUSES = new Set(['cancelled', 'canceled', 'discontinued', 'rejected', 'draft', 'voided'])

function medicationName(medication = {}) {
  return medication.drug || medication.medication || medication.name || ''
}

function isMedicationOrderForMar(medication) {
  if (!medication || !medication.id || !medicationName(medication)) return false
  return !MAR_EXCLUDED_STATUSES.has(String(medication.status || 'active').trim().toLowerCase())
}

function defaultAdministrationInstructions(route) {
  const normalized = String(route || '').toLowerCase()
  if (/iv|intravenous|infusion/.test(normalized)) {
    return 'Verify the signed order, allergies, IV access, compatibility and infusion rate; monitor the site and patient response.'
  }
  if (/im|intramuscular|subcutaneous|injection/.test(normalized)) {
    return 'Verify the signed order, allergies, dose and injection site; document the site and reassess the patient.'
  }
  if (/inhal|nebul/.test(normalized)) {
    return 'Verify the signed order and baseline respiratory status; administer with the prescribed device and reassess response.'
  }
  return 'Verify the signed order, patient identity, allergies, dose, route and timing; document administration and reassess response.'
}

function resolveAdministrationInstructions(medication = {}, catalogItem = null) {
  return medication.administrationInstructions || medication.instructions || medication.notes ||
    (catalogItem && catalogItem.administrationInstructions) || defaultAdministrationInstructions(medication.route)
}

module.exports = {
  defaultAdministrationInstructions,
  isMedicationOrderForMar,
  medicationName,
  resolveAdministrationInstructions
}
