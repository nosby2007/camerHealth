const MEDICATION_CATALOG = [
  medication('paracetamol', 'Paracetamol', 'Analgesic / antipyretic', ['Pain', 'Fever'], ['Oral', 'IV', 'Rectal'], 'tablet', 'Nausea, rash; liver injury with overdose', 'Do not combine several products containing paracetamol. Respect the prescribed dose.', 'Check total daily dose and liver disease.'),
  medication('ibuprofen', 'Ibuprofen', 'NSAID', ['Pain', 'Inflammation', 'Fever'], ['Oral'], 'tablet', 'Dyspepsia, bleeding, kidney injury, fluid retention', 'Take with food and report black stools, reduced urine or breathing difficulty.', 'Avoid in active ulcer, severe renal disease and late pregnancy.'),
  medication('tramadol', 'Tramadol', 'Opioid analgesic', ['Moderate pain', 'Post-operative pain'], ['Oral', 'IV', 'IM'], 'tablet', 'Drowsiness, nausea, constipation, seizures', 'May cause sleepiness. Avoid alcohol and do not drive.', 'Review seizure risk and serotonergic medicines.'),
  medication('morphine', 'Morphine', 'Opioid analgesic', ['Severe pain', 'Palliative care'], ['Oral', 'IV', 'IM', 'Subcutaneous'], 'tablet', 'Respiratory depression, sedation, nausea, constipation', 'Call staff for excessive sleepiness or difficulty breathing. A bowel plan may be needed.', 'Monitor respiratory rate, sedation, renal function and naloxone access.'),
  medication('amoxicillin', 'Amoxicillin', 'Penicillin antibiotic', ['Respiratory infection', 'ENT infection', 'Dental infection'], ['Oral'], 'tablet', 'Diarrhoea, nausea, rash, anaphylaxis', 'Complete the prescribed course and report rash, swelling or breathing difficulty.', 'Verify beta-lactam allergy and local antimicrobial guidance.'),
  medication('amoxicillin-clavulanate', 'Amoxicillin / clavulanate', 'Penicillin antibiotic', ['Skin infection', 'Respiratory infection', 'Bite wound'], ['Oral', 'IV'], 'tablet', 'Diarrhoea, nausea, rash, liver injury', 'Take with food when oral and complete the course.', 'Verify allergy, hepatic history and local antimicrobial guidance.'),
  medication('ceftriaxone', 'Ceftriaxone', 'Cephalosporin antibiotic', ['Sepsis', 'Meningitis', 'Pneumonia', 'Complicated infection'], ['IV', 'IM'], 'iv', 'Diarrhoea, rash, injection-site pain, biliary sludge', 'Report rash, severe diarrhoea or breathing difficulty.', 'Verify severe beta-lactam allergy; avoid calcium-containing IV mixing in neonates.'),
  medication('metronidazole', 'Metronidazole', 'Nitroimidazole antimicrobial', ['Anaerobic infection', 'Abdominal infection', 'Protozoal infection'], ['Oral', 'IV'], 'tablet', 'Nausea, metallic taste, neuropathy', 'Avoid alcohol during treatment and for at least 48 hours after the last dose.', 'Review prolonged therapy and neurologic symptoms.'),
  medication('ciprofloxacin', 'Ciprofloxacin', 'Fluoroquinolone antibiotic', ['Complicated urinary infection', 'Enteric infection'], ['Oral', 'IV'], 'tablet', 'Nausea, QT prolongation, tendon injury, neuropathy', 'Report tendon pain, numbness or palpitations. Separate from antacids and iron.', 'Reserve according to antimicrobial policy and culture results.'),
  medication('gentamicin', 'Gentamicin', 'Aminoglycoside antibiotic', ['Severe gram-negative infection', 'Sepsis'], ['IV', 'IM'], 'iv', 'Kidney injury, hearing or balance injury', 'Report reduced urine, hearing change or dizziness.', 'Dose by weight and renal function; monitor levels when indicated.'),
  medication('artesunate', 'Artesunate', 'Antimalarial', ['Severe malaria'], ['IV', 'IM'], 'iv', 'Delayed haemolysis, nausea, transient blood changes', 'Complete follow-on oral combination therapy and attend the planned blood check.', 'Confirm malaria protocol, weight-based dosing and post-treatment haemolysis follow-up.'),
  medication('artemether-lumefantrine', 'Artemether / lumefantrine', 'Antimalarial combination', ['Uncomplicated malaria'], ['Oral'], 'tablet', 'Headache, dizziness, nausea, QT prolongation', 'Take each dose with food or milk and complete all doses.', 'Confirm diagnostic testing, weight band and interacting QT medicines.'),
  medication('amlodipine', 'Amlodipine', 'Calcium-channel blocker', ['Hypertension', 'Angina'], ['Oral'], 'tablet', 'Ankle swelling, headache, flushing, dizziness', 'Rise slowly and report troublesome ankle swelling.', 'Review blood pressure and oedema.'),
  medication('lisinopril', 'Lisinopril', 'ACE inhibitor', ['Hypertension', 'Heart failure', 'Renal protection'], ['Oral'], 'tablet', 'Cough, high potassium, kidney injury, angioedema', 'Report facial swelling immediately. Avoid during pregnancy.', 'Check renal function, potassium and pregnancy status.'),
  medication('furosemide', 'Furosemide', 'Loop diuretic', ['Fluid overload', 'Heart failure', 'Pulmonary oedema'], ['Oral', 'IV'], 'tablet', 'Dehydration, low potassium, low blood pressure, hearing injury', 'Expect increased urination; report cramps, dizziness or reduced urine.', 'Monitor fluid balance, weight, renal function and electrolytes.'),
  medication('metformin', 'Metformin', 'Biguanide antidiabetic', ['Type 2 diabetes'], ['Oral'], 'tablet', 'Diarrhoea, nausea, vitamin B12 deficiency; rare lactic acidosis', 'Take with meals. Follow sick-day and contrast instructions from the care team.', 'Review renal function, severe illness and iodinated contrast exposure.'),
  medication('regular-insulin', 'Regular insulin', 'Short-acting insulin', ['Diabetes', 'Hyperglycaemia', 'DKA protocol'], ['Subcutaneous', 'IV'], 'injection', 'Hypoglycaemia, low potassium, injection-site reaction', 'Know the signs of low blood sugar and keep a fast sugar source available.', 'Independent dose check, glucose monitoring and meal coordination are required.'),
  medication('nph-insulin', 'NPH insulin', 'Intermediate-acting insulin', ['Diabetes', 'Basal insulin need'], ['Subcutaneous'], 'injection', 'Hypoglycaemia, weight gain, injection-site reaction', 'Rotate injection sites and follow meal and glucose-monitoring instructions.', 'Verify insulin type, dose, timing and hypoglycaemia plan.'),
  medication('omeprazole', 'Omeprazole', 'Proton-pump inhibitor', ['Peptic ulcer', 'Reflux', 'GI protection'], ['Oral', 'IV'], 'tablet', 'Headache, diarrhoea; low magnesium or infection with prolonged use', 'Take before food when directed and report persistent diarrhoea.', 'Review ongoing indication for prolonged treatment.'),
  medication('ondansetron', 'Ondansetron', 'Antiemetic', ['Nausea', 'Vomiting'], ['Oral', 'IV'], 'tablet', 'Headache, constipation, QT prolongation', 'Report palpitations, fainting or severe constipation.', 'Review QT risk and interacting medicines.'),
  medication('salbutamol', 'Salbutamol', 'Short-acting bronchodilator', ['Asthma', 'Bronchospasm'], ['Inhalation', 'Nebulized'], 'inhaler', 'Tremor, palpitations, headache, low potassium', 'Use the demonstrated inhaler or nebulizer technique and report poor relief.', 'Assess response, heart rate and need for escalation.'),
  medication('prednisolone', 'Prednisolone', 'Corticosteroid', ['Asthma exacerbation', 'Inflammation', 'Autoimmune condition'], ['Oral'], 'tablet', 'High glucose, mood change, infection risk, gastric irritation', 'Take with food; do not stop prolonged treatment suddenly.', 'Review infection, diabetes and taper requirements.'),
  medication('oxytocin', 'Oxytocin', 'Uterotonic', ['Labour induction', 'Postpartum haemorrhage'], ['IV', 'IM'], 'iv', 'Uterine hyperstimulation, hypotension, water intoxication', 'Explain monitoring and immediately report severe continuous pain or breathing difficulty.', 'Use an obstetric protocol with maternal and fetal monitoring.'),
  medication('misoprostol', 'Misoprostol', 'Prostaglandin / uterotonic', ['Postpartum haemorrhage', 'Cervical preparation', 'Obstetric protocol'], ['Oral', 'Sublingual', 'Rectal', 'Vaginal'], 'tablet', 'Fever, chills, diarrhoea, uterine cramping', 'Explain expected cramping and bleeding and when urgent review is required.', 'Confirm indication, gestation and the approved obstetric protocol.'),
  medication('magnesium-sulfate', 'Magnesium sulfate', 'Electrolyte / anticonvulsant', ['Eclampsia prevention', 'Eclampsia', 'Severe hypomagnesaemia'], ['IV', 'IM'], 'iv', 'Flushing, weakness, low blood pressure, respiratory depression', 'Report breathing difficulty, marked weakness or reduced urine.', 'Monitor reflexes, respiration, urine output and calcium gluconate availability.'),
  medication('enoxaparin', 'Enoxaparin', 'Low-molecular-weight heparin', ['VTE prevention', 'VTE treatment', 'Acute coronary syndrome'], ['Subcutaneous'], 'injection', 'Bleeding, bruising, low platelets', 'Report unusual bleeding; do not rub the injection site.', 'Check weight, renal function, platelets and bleeding risk.'),
  medication('adrenaline', 'Adrenaline (epinephrine)', 'Adrenergic agonist', ['Anaphylaxis', 'Cardiac arrest', 'Severe bronchospasm'], ['IM', 'IV'], 'injection', 'Tachycardia, tremor, hypertension, arrhythmia', 'Emergency medicine; explain expected palpitations after stabilization.', 'Verify indication, concentration and route before administration.'),
  medication('oral-rehydration-salts', 'Oral rehydration salts', 'Fluid and electrolyte replacement', ['Diarrhoea', 'Dehydration'], ['Oral'], 'syrup', 'Vomiting or electrolyte imbalance if mixed incorrectly', 'Mix exactly with the stated volume of safe water; discard after the locally recommended period.', 'Assess dehydration severity and escalate when oral therapy is insufficient.')
]

function medication(id, genericName, medicationClass, needs, routes, form, sideEffects, education, warnings) {
  return {
    id,
    genericName,
    medicationClass,
    needs,
    routes,
    form,
    sideEffects,
    education,
    warnings,
    labels: [genericName, medicationClass, ...needs]
  }
}

function normalizeMedicationName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function findMedicationCatalogItem(value) {
  const query = normalizeMedicationName(value)
  if (!query) return null
  return MEDICATION_CATALOG.find(item => {
    const name = normalizeMedicationName(item.genericName)
    return name === query || query.includes(name) || name.includes(query)
  }) || null
}

module.exports = { MEDICATION_CATALOG, findMedicationCatalogItem, normalizeMedicationName }
