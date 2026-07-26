const STORAGE_KEY = 'camero_billing'

const PRE_PAYMENT_REQUIRED = ['consultation']

const DEFAULT_CATALOG = {
  consultations: [
    { id: 'consult-general', category: 'consultation', name: 'General consultation', department: 'Outpatient', unitPrice: 2500, active: true },
    { id: 'consult-emergency', category: 'consultation', name: 'Emergency consultation', department: 'Emergency', unitPrice: 3500, active: true },
    { id: 'consult-specialist', category: 'consultation', name: 'Specialist consultation', department: 'Specialist clinic', unitPrice: 5000, active: true },
    { id: 'consult-antenatal', category: 'consultation', name: 'Antenatal consultation', department: 'Maternity', unitPrice: 3000, active: true }
  ],
  labTests: [
    { id: 'lab-cbc', category: 'laboratory', name: 'Complete Blood Count (CBC/FBC)', aliases: ['CBC', 'FBC'], minPrice: 5000, maxPrice: 8000, unitPrice: 6000, active: true },
    { id: 'lab-blood-group', category: 'laboratory', name: 'Blood Group & Rhesus', minPrice: 3000, maxPrice: 5000, unitPrice: 4000, active: true },
    { id: 'lab-blood-sugar', category: 'laboratory', name: 'Blood Sugar (Random/Fasting)', aliases: ['Blood sugar', 'Fasting glucose'], minPrice: 2000, maxPrice: 4000, unitPrice: 3000, active: true },
    { id: 'lab-hba1c', category: 'laboratory', name: 'HbA1c', minPrice: 12000, maxPrice: 18000, unitPrice: 15000, active: true },
    { id: 'lab-malaria-rdt', category: 'laboratory', name: 'Malaria Test (RDT)', aliases: ['Malaria smear/RDT'], minPrice: 2000, maxPrice: 3500, unitPrice: 2500, active: true },
    { id: 'lab-malaria-microscopy', category: 'laboratory', name: 'Malaria Parasite Microscopy', minPrice: 3000, maxPrice: 5000, unitPrice: 4000, active: true },
    { id: 'lab-hiv', category: 'laboratory', name: 'HIV Test', minPrice: 3000, maxPrice: 10000, unitPrice: 5000, active: true },
    { id: 'lab-hepatitis-b', category: 'laboratory', name: 'Hepatitis B (HBsAg)', minPrice: 5000, maxPrice: 10000, unitPrice: 7000, active: true },
    { id: 'lab-hepatitis-c', category: 'laboratory', name: 'Hepatitis C', minPrice: 6000, maxPrice: 12000, unitPrice: 8000, active: true },
    { id: 'lab-syphilis', category: 'laboratory', name: 'Syphilis (VDRL/TPHA)', minPrice: 3000, maxPrice: 8000, unitPrice: 5000, active: true },
    { id: 'lab-urinalysis', category: 'laboratory', name: 'Urinalysis', minPrice: 2000, maxPrice: 4000, unitPrice: 3000, active: true },
    { id: 'lab-stool', category: 'laboratory', name: 'Stool Analysis', minPrice: 2000, maxPrice: 5000, unitPrice: 3000, active: true },
    { id: 'lab-pregnancy', category: 'laboratory', name: 'Pregnancy Test (Beta-hCG)', aliases: ['Pregnancy test'], minPrice: 3000, maxPrice: 6000, unitPrice: 4000, active: true },
    { id: 'lab-urea', category: 'laboratory', name: 'Urea', minPrice: 2500, maxPrice: 4000, unitPrice: 3000, active: true },
    { id: 'lab-creatinine', category: 'laboratory', name: 'Creatinine', minPrice: 2500, maxPrice: 4000, unitPrice: 3000, active: true },
    { id: 'lab-lft', category: 'laboratory', name: 'Liver Function Tests (LFT)', aliases: ['Liver function tests'], minPrice: 10000, maxPrice: 20000, unitPrice: 15000, active: true },
    { id: 'lab-kft', category: 'laboratory', name: 'Kidney Function Tests (KFT)', aliases: ['Creatinine/Urea'], minPrice: 10000, maxPrice: 18000, unitPrice: 12000, active: true },
    { id: 'lab-lipid', category: 'laboratory', name: 'Lipid Profile', aliases: ['Lipid profile'], minPrice: 8000, maxPrice: 15000, unitPrice: 10000, active: true },
    { id: 'lab-electrolytes', category: 'laboratory', name: 'Electrolytes (Na, K, Cl)', aliases: ['Electrolyte panel'], minPrice: 8000, maxPrice: 15000, unitPrice: 10000, active: true },
    { id: 'lab-esr', category: 'laboratory', name: 'ESR', minPrice: 2000, maxPrice: 4000, unitPrice: 3000, active: true },
    { id: 'lab-crp', category: 'laboratory', name: 'C-Reactive Protein (CRP)', aliases: ['CRP'], minPrice: 5000, maxPrice: 10000, unitPrice: 7000, active: true },
    { id: 'lab-widal', category: 'laboratory', name: 'Widal Test', minPrice: 2000, maxPrice: 4000, unitPrice: 3000, active: true },
    { id: 'lab-genexpert', category: 'laboratory', name: 'Tuberculosis GeneXpert', minPrice: 20000, maxPrice: 35000, unitPrice: 25000, active: true },
    { id: 'lab-culture', category: 'laboratory', name: 'Culture & Antibiotic Sensitivity', aliases: ['Blood culture', 'Urine culture'], minPrice: 15000, maxPrice: 30000, unitPrice: 20000, active: true }
  ],
  imaging: [
    { id: 'img-chest-xray', category: 'imaging', name: 'Chest X-ray', minPrice: 8000, maxPrice: 15000, unitPrice: 10000, active: true },
    { id: 'img-limb-xray', category: 'imaging', name: 'Limb X-ray', minPrice: 8000, maxPrice: 15000, unitPrice: 10000, active: true },
    { id: 'img-spine-xray', category: 'imaging', name: 'Spine X-ray', minPrice: 10000, maxPrice: 18000, unitPrice: 12000, active: true },
    { id: 'img-skull-xray', category: 'imaging', name: 'Skull X-ray', minPrice: 10000, maxPrice: 18000, unitPrice: 12000, active: true },
    { id: 'img-abdominal-us', category: 'imaging', name: 'Abdominal Ultrasound', aliases: ['Abdominal ultrasound'], minPrice: 10000, maxPrice: 20000, unitPrice: 15000, active: true },
    { id: 'img-pelvic-us', category: 'imaging', name: 'Pelvic Ultrasound', aliases: ['Pelvic ultrasound'], minPrice: 10000, maxPrice: 20000, unitPrice: 15000, active: true },
    { id: 'img-obstetric-us', category: 'imaging', name: 'Obstetric Ultrasound', aliases: ['Obstetric ultrasound'], minPrice: 10000, maxPrice: 20000, unitPrice: 15000, active: true },
    { id: 'img-breast-us', category: 'imaging', name: 'Breast Ultrasound', minPrice: 15000, maxPrice: 25000, unitPrice: 20000, active: true },
    { id: 'img-echo', category: 'imaging', name: 'Echocardiography', minPrice: 20000, maxPrice: 35000, unitPrice: 25000, active: true },
    { id: 'img-ecg', category: 'imaging', name: 'ECG', minPrice: 5000, maxPrice: 10000, unitPrice: 7000, active: true },
    { id: 'img-mammography', category: 'imaging', name: 'Mammography', minPrice: 20000, maxPrice: 35000, unitPrice: 25000, active: true },
    { id: 'img-ct-brain', category: 'imaging', name: 'CT Brain', aliases: ['Brain CT scan'], minPrice: 60000, maxPrice: 100000, unitPrice: 75000, active: true },
    { id: 'img-ct-chest', category: 'imaging', name: 'CT Chest', aliases: ['Chest CT scan'], minPrice: 70000, maxPrice: 120000, unitPrice: 85000, active: true },
    { id: 'img-ct-abdomen', category: 'imaging', name: 'CT Abdomen', minPrice: 80000, maxPrice: 120000, unitPrice: 90000, active: true },
    { id: 'img-ct-spine', category: 'imaging', name: 'CT Spine', minPrice: 70000, maxPrice: 120000, unitPrice: 85000, active: true },
    { id: 'img-ct-angiography', category: 'imaging', name: 'CT Angiography', minPrice: 120000, maxPrice: 180000, unitPrice: 150000, active: true }
  ],
  drugs: [
    { id: 'drug-antivenom', category: 'drug', name: 'Anti venom', unitPrice: 14000, costPrice: 0, active: true },
    { id: 'drug-acetazolamide-250', category: 'drug', name: 'Acetazolamide 250mg', unitPrice: 20, costPrice: 0, active: true },
    { id: 'drug-acetyl-salicylate-lysine-0-5', category: 'drug', name: 'Acetyl salicylate lysine 0.5 gm', unitPrice: 350, costPrice: 0, active: true },
    { id: 'drug-acetyl-salicylate-lysine-1', category: 'drug', name: 'Acetyl salicylate lysine 1 gm', unitPrice: 500, costPrice: 0, active: true },
    { id: 'drug-asa-500', category: 'drug', name: 'Acetylsalicylic acid tabs 500mg', unitPrice: 10, costPrice: 0, active: true },
    { id: 'drug-adrenaline', category: 'drug', name: 'Adrenaline (Epinephrine)', unitPrice: 300, costPrice: 0, active: true },
    { id: 'drug-albendazole-400', category: 'drug', name: 'Albendazole 400mg tab', unitPrice: 300, costPrice: 0, active: true },
    { id: 'drug-albendazole-susp', category: 'drug', name: 'Albendazole Susp', unitPrice: 500, costPrice: 0, active: true },
    { id: 'drug-alcohol-70-125ml', category: 'drug', name: 'Alcohol 70% 125ML', unitPrice: 2250, costPrice: 0, active: true },
    { id: 'drug-alcohol-70-1000ml', category: 'drug', name: 'Alcohol 70% 1000ML', unitPrice: 4500, costPrice: 0, active: true },
    { id: 'drug-aluminium-hydroxide', category: 'drug', name: 'Aluminium hydroxide 500mg', unitPrice: 200, costPrice: 0, active: true },
    { id: 'drug-aminophylline-100', category: 'drug', name: 'Aminophylline 100mg tabs', unitPrice: 35, costPrice: 0, active: true },
    { id: 'drug-aminophylline-inj', category: 'drug', name: 'Aminophylline 25mg/ml 10ml inj', unitPrice: 280, costPrice: 0, active: true },
    { id: 'drug-amoxicillin-500', category: 'drug', name: 'Amoxicillin 500mg caps', unitPrice: 700, costPrice: 0, active: true },
    { id: 'drug-amoxiclav-caps', category: 'drug', name: 'Amoxicillin/Clavulanic acid caps', unitPrice: 2500, costPrice: 0, active: true },
    { id: 'drug-amoxicillin-syrup', category: 'drug', name: 'Amoxicillin syrup 250mg', unitPrice: 3000, costPrice: 0, active: true },
    { id: 'drug-ampicillin-1g', category: 'drug', name: 'Ampicillin 1g inj', unitPrice: 800, costPrice: 0, active: true },
    { id: 'drug-analgin-inj', category: 'drug', name: 'Analgin inj', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-anti-haemorrhoid-suppo', category: 'drug', name: 'Anti-Haemorrhoid suppo', unitPrice: 700, costPrice: 0, active: true },
    { id: 'drug-anti-tetanus-toxxin', category: 'drug', name: 'Anti-Tetanus Toxxins inj', unitPrice: 2500, costPrice: 0, active: true },
    { id: 'drug-artemether-40', category: 'drug', name: 'Artemether 40mg inj', unitPrice: 2300, costPrice: 0, active: true },
    { id: 'drug-artemether-80', category: 'drug', name: 'Artemether 80mg inj', unitPrice: 3000, costPrice: 0, active: true },
    { id: 'drug-artemether-lum-susp', category: 'drug', name: 'Artemether lum susp', unitPrice: 1530, costPrice: 0, active: true },
    { id: 'drug-artemether-lum-6x3', category: 'drug', name: 'Artemether+Lumef 6x3', unitPrice: 1000, costPrice: 0, active: true },
    { id: 'drug-artemether-lum-6x4', category: 'drug', name: 'Artemether+Lumef 6x4', unitPrice: 484, costPrice: 0, active: true },
    { id: 'drug-artesunate-60', category: 'drug', name: 'Artesunate 60MG INJ', unitPrice: 2500, costPrice: 0, active: true },
    { id: 'drug-artesunate-amod-child', category: 'drug', name: 'Artesunate+Amodiaquine child', unitPrice: 200, costPrice: 0, active: true },
    { id: 'drug-artesunate-amod-12-12', category: 'drug', name: 'Artesunate+Amodiaquine 12+12', unitPrice: 200, costPrice: 0, active: true },
    { id: 'drug-artesunate-amod-3-3', category: 'drug', name: 'Artesunate+Amodiaquine 3+3', unitPrice: 350, costPrice: 0, active: true },
    { id: 'drug-artesunate-amod-6-6', category: 'drug', name: 'Artesunate+Amodiaquine 6+6', unitPrice: 350, costPrice: 0, active: true },
    { id: 'drug-atropine-1mg', category: 'drug', name: 'Atropine Sulphate 1g/ml inj', unitPrice: 200, costPrice: 0, active: true },
    { id: 'drug-benzathin-pen-1-2', category: 'drug', name: 'Benzathin Penicillin 1.2 MU', unitPrice: 350, costPrice: 0, active: true },
    { id: 'drug-benzathin-pen-2-4', category: 'drug', name: 'Benzathin Penicillin 2.4 MU', unitPrice: 1250, costPrice: 0, active: true },
    { id: 'drug-benzyl-benzoate', category: 'drug', name: 'Benzyl Benzoate', unitPrice: 500, costPrice: 0, active: true },
    { id: 'drug-betamethasone-pomade', category: 'drug', name: 'Betamethasone Pomade', unitPrice: 200, costPrice: 0, active: true },
    { id: 'drug-calcium-gluconate', category: 'drug', name: 'Calcium gluconate 10% inj', unitPrice: 700, costPrice: 0, active: true },
    { id: 'drug-carbocysteine-syrup-2', category: 'drug', name: 'Carbocysteine Syrup 2%(infants)', unitPrice: 900, costPrice: 0, active: true },
    { id: 'drug-carbocysteine-syrup-5', category: 'drug', name: 'Carbocysteine Syrup 5%(adults)', unitPrice: 1500, costPrice: 0, active: true },
    { id: 'drug-carbocysteine-syrup-5-vip', category: 'drug', name: 'Carbocysteine syrup 5%(adults) VIP', unitPrice: 3000, costPrice: 0, active: true },
    { id: 'drug-catheter-iv-18g', category: 'drug', name: 'Catheter I.V type 18 G', unitPrice: 300, costPrice: 0, active: true },
    { id: 'drug-catheter-iv-20g', category: 'drug', name: 'Catheter I.V type 20G', unitPrice: 300, costPrice: 0, active: true },
    { id: 'drug-catheter-iv-22g', category: 'drug', name: 'Catheter I.V type 22G', unitPrice: 300, costPrice: 0, active: true },
    { id: 'drug-catheter-iv-24g', category: 'drug', name: 'Catheter I.V type 24 G', unitPrice: 600, costPrice: 0, active: true },
    { id: 'drug-ceftriaxone-1g', category: 'drug', name: 'Ceftriaxone 1g inj (Oframax)', unitPrice: 2000, costPrice: 0, active: true },
    { id: 'drug-chloramphenicol-250', category: 'drug', name: 'Chloramphenicol 250mg', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-chlorpheniramine-4', category: 'drug', name: 'Chlorpheniramine 4mg', unitPrice: 10, costPrice: 0, active: true },
    { id: 'drug-cimetidine-200', category: 'drug', name: 'Cimetidine 200 mg tabs', unitPrice: 20, costPrice: 0, active: true },
    { id: 'drug-cimetidine-inj', category: 'drug', name: 'Cimetidine 200mg/2ml', unitPrice: 300, costPrice: 0, active: true },
    { id: 'drug-ciprofloxacin-500', category: 'drug', name: 'Ciprofloxacin 500mg', unitPrice: 800, costPrice: 0, active: true },
    { id: 'drug-clotrimazole-cream', category: 'drug', name: 'Clotrimazole cream', unitPrice: 500, costPrice: 0, active: true },
    { id: 'drug-cloxacillin-250-tabs', category: 'drug', name: 'Cloxacillin 250mg tabs', unitPrice: 50, costPrice: 0, active: true },
    { id: 'drug-cloxacillin-500-inj', category: 'drug', name: 'Cloxacillin 500mg inj', unitPrice: 200, costPrice: 0, active: true },
    { id: 'drug-cloxacillin-500-tabs', category: 'drug', name: 'Cloxacillin 500mg tabs', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-compress-sterile', category: 'drug', name: 'Compress Sterile 10x10', unitPrice: 70, costPrice: 0, active: true },
    { id: 'drug-cotrimoxazole-susp', category: 'drug', name: 'Cotrimoxazole 240/5ml', unitPrice: 600, costPrice: 0, active: true },
    { id: 'drug-cotrimoxazole-480', category: 'drug', name: 'Cotrimoxazole 480mg tabs', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-cotton-absorbent-500', category: 'drug', name: 'Cotton Absorbent 500gms', unitPrice: 2840, costPrice: 0, active: true },
    { id: 'drug-cotton-absorbent-50', category: 'drug', name: 'Cotton Absorbent 50gms', unitPrice: 350, costPrice: 0, active: true },
    { id: 'drug-crepe-bandage', category: 'drug', name: 'Crepe bandage 10cm x 4m', unitPrice: 500, costPrice: 0, active: true },
    { id: 'drug-dexametasone-tabs', category: 'drug', name: 'Dexametasone Tabs', unitPrice: 10, costPrice: 0, active: true },
    { id: 'drug-dermobacter', category: 'drug', name: 'Dermobacter', unitPrice: 1700, costPrice: 0, active: true },
    { id: 'drug-dexametasone-inj', category: 'drug', name: 'Dexametasone inj', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-dextrose-5-500', category: 'drug', name: 'Dextrose 5% 500ml', unitPrice: 700, costPrice: 0, active: true },
    { id: 'drug-dextrose-10-500', category: 'drug', name: 'Dextrose 10% 500ml', unitPrice: 800, costPrice: 0, active: true },
    { id: 'drug-dextrose-10-250', category: 'drug', name: 'Dextrose 10% 250ml', unitPrice: 600, costPrice: 0, active: true },
    { id: 'drug-dextrose-5-250', category: 'drug', name: 'Dextrose 5% 250ml', unitPrice: 525, costPrice: 0, active: true },
    { id: 'drug-diazepam-inj', category: 'drug', name: 'Diazepam 10mg inj', unitPrice: 500, costPrice: 0, active: true },
    { id: 'drug-diazepam-5', category: 'drug', name: 'Diazepam 5mg tabs', unitPrice: 20, costPrice: 0, active: true },
    { id: 'drug-diclofenac-inj', category: 'drug', name: 'Diclofenac Inj', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-diclofenac-tabs', category: 'drug', name: 'Diclofenac tabs', unitPrice: 10, costPrice: 0, active: true },
    { id: 'drug-digoxin', category: 'drug', name: 'Digoxin 0.25mg tabs', unitPrice: 50, costPrice: 0, active: true },
    { id: 'drug-syringe-10ml', category: 'drug', name: 'Disp. syringe 10ml with needle', unitPrice: 10, costPrice: 0, active: true },
    { id: 'drug-syringe-5ml', category: 'drug', name: 'Disp. syringe 5 ml with needle', unitPrice: 50, costPrice: 0, active: true },
    { id: 'drug-doxycycline-100', category: 'drug', name: 'Doxycycline 100mg', unitPrice: 50, costPrice: 0, active: true },
    { id: 'drug-ergometrin-inj', category: 'drug', name: 'Ergometrin Inj', unitPrice: 20, costPrice: 0, active: true },
    { id: 'drug-erythromycin-stearate-500', category: 'drug', name: 'Erythromycin Stearate 500 mg', unitPrice: 35, costPrice: 0, active: true },
    { id: 'drug-exam-gloves', category: 'drug', name: 'Examination Gloves(medium)', unitPrice: 60, costPrice: 0, active: true },
    { id: 'drug-ferrous-folic', category: 'drug', name: 'Ferrous + Folic Acid tab', unitPrice: 40, costPrice: 0, active: true },
    { id: 'drug-ferrous-fumarate-susp-100', category: 'drug', name: 'Ferrous Fumarate susp 100ml', unitPrice: 1000, costPrice: 0, active: true },
    { id: 'drug-fluconazole-200', category: 'drug', name: 'Fluconazole 200mg', unitPrice: 1200, costPrice: 0, active: true },
    { id: 'drug-foley-catheter-18', category: 'drug', name: 'Foley Catheter 18', unitPrice: 1000, costPrice: 0, active: true },
    { id: 'drug-furosemide-inj', category: 'drug', name: 'Furosemide 20mg/2ml inj', unitPrice: 1000, costPrice: 0, active: true },
    { id: 'drug-furosemide-40', category: 'drug', name: 'Furosemide 40mg', unitPrice: 1500, costPrice: 0, active: true },
    { id: 'drug-gentamicine-eye-drops', category: 'drug', name: 'Gentamicine 0.3% 10ml eye drops', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-gentamicine-inj', category: 'drug', name: 'Gentamicine inj 80mg/2ml', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-glibenclamide-5', category: 'drug', name: 'Glibenclamide 5mg tabs', unitPrice: 10, costPrice: 0, active: true },
    { id: 'drug-sterile-gloves-7-5', category: 'drug', name: 'Gloves Sterile size 7.5', unitPrice: 500, costPrice: 0, active: true },
    { id: 'drug-griseofulvine-500', category: 'drug', name: 'Griseofulvine tabs 500mg', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-registration-card', category: 'drug', name: 'H/C fund registration card', unitPrice: 250, costPrice: 0, active: true },
    { id: 'drug-hartmanns-solution', category: 'drug', name: 'Hartmanns solution 500ml', unitPrice: 1000, costPrice: 0, active: true },
    { id: 'drug-hydrochlorothiazide', category: 'drug', name: 'Hydrochlorthiazide tabs 500mg', unitPrice: 500, costPrice: 0, active: true },
    { id: 'drug-hydrocortisone-100', category: 'drug', name: 'Hydrocortisone 100mg inj', unitPrice: 700, costPrice: 0, active: true },
    { id: 'drug-hyoscine-butylbromide', category: 'drug', name: 'Hyoscine Butylbromide 20mg/ml', unitPrice: 200, costPrice: 0, active: true },
    { id: 'drug-ibuprofen-400', category: 'drug', name: 'Ibuprofen 400 mg', unitPrice: 20, costPrice: 0, active: true },
    { id: 'drug-indomethacine-25', category: 'drug', name: 'Indomethacine 25mg', unitPrice: 200, costPrice: 0, active: true },
    { id: 'drug-infusion-set', category: 'drug', name: 'Infusion Set', unitPrice: 200, costPrice: 0, active: true },
    { id: 'drug-insulin-atrapid', category: 'drug', name: 'Insulin 100iu/ml (atrapid)', unitPrice: 3500, costPrice: 0, active: true },
    { id: 'drug-insulin-mixtard', category: 'drug', name: 'Insulin 100iu/ml (mixtard)', unitPrice: 3500, costPrice: 0, active: true },
    { id: 'drug-insulin-syringe', category: 'drug', name: 'Insulin Syringe ICC 100iu', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-ketamine-50', category: 'drug', name: 'Ketamine 50mg/ml inj', unitPrice: 1000, costPrice: 0, active: true },
    { id: 'drug-lidocaine-2', category: 'drug', name: 'Lidocaine 2%', unitPrice: 1000, costPrice: 0, active: true },
    { id: 'drug-lidocaine-adrenaline', category: 'drug', name: 'Lidocaine +adrenaline', unitPrice: 1200, costPrice: 0, active: true },
    { id: 'drug-lp-needle-19', category: 'drug', name: 'Lumbar puncture needle 19 G', unitPrice: 690, costPrice: 0, active: true },
    { id: 'drug-lp-needle-22', category: 'drug', name: 'Lumbar puncture needle 22 G', unitPrice: 700, costPrice: 0, active: true },
    { id: 'drug-magnesium-sulphate', category: 'drug', name: 'Magnesium sulphate inj', unitPrice: 500, costPrice: 0, active: true },
    { id: 'drug-mannitol-10', category: 'drug', name: 'Mannitol 10% 500ml', unitPrice: 2000, costPrice: 0, active: true },
    { id: 'drug-mebendazole-100', category: 'drug', name: 'Mebendazole 100mg tabs', unitPrice: 20, costPrice: 0, active: true },
    { id: 'drug-metformin-500', category: 'drug', name: 'Metformin 500mg tabs', unitPrice: 50, costPrice: 0, active: true },
    { id: 'drug-methyldopa-250', category: 'drug', name: 'Methyldopa 250mg tabs', unitPrice: 70, costPrice: 0, active: true },
    { id: 'drug-metoclopramide-inj', category: 'drug', name: 'Metoclopramide 10mg/2ml inj', unitPrice: 600, costPrice: 0, active: true },
    { id: 'drug-metronidazole-susp', category: 'drug', name: 'Metronidazole 125mg/5ml susp', unitPrice: 1500, costPrice: 0, active: true },
    { id: 'drug-metronidazole-250', category: 'drug', name: 'Metronidazole 250mg tabs', unitPrice: 20, costPrice: 0, active: true },
    { id: 'drug-metronidazole-500', category: 'drug', name: 'Metronidazole 500mg tabs', unitPrice: 50, costPrice: 0, active: true },
    { id: 'drug-metronidazole-inf', category: 'drug', name: 'Metronidazole 5mg/ml infusion', unitPrice: 700, costPrice: 0, active: true },
    { id: 'drug-miconazole-cream', category: 'drug', name: 'Miconazole 2% Cream', unitPrice: 660, costPrice: 0, active: true },
    { id: 'drug-morphine-10', category: 'drug', name: 'Morphine 10mg/ml Inj', unitPrice: 1000, costPrice: 0, active: true },
    { id: 'drug-multivitamin-tabs', category: 'drug', name: 'Multivitamin tabs', unitPrice: 10, costPrice: 0, active: true },
    { id: 'drug-ng-tube-18', category: 'drug', name: 'Nasogastric tube 18', unitPrice: 1000, costPrice: 0, active: true },
    { id: 'drug-ng-tube-13', category: 'drug', name: 'Nasogastric tube CH 13', unitPrice: 1000, costPrice: 0, active: true },
    { id: 'drug-ng-tube-6', category: 'drug', name: 'Nasogastric tube 6', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-needle-butterfly-19', category: 'drug', name: 'Needle Butterfly No. 19G', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-needle-butterfly-21', category: 'drug', name: 'Needle Butterfly No. 21G', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-needle-butterfly-23', category: 'drug', name: 'Needle Butterfly No. 23G', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-needle-butterfly-25', category: 'drug', name: 'Needle Butterfly No. 25G', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-needle-21', category: 'drug', name: 'Needle No. 21G', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-needle-23', category: 'drug', name: 'Needle No. 23 G', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-neomycin-bactracin', category: 'drug', name: 'Neomycin/Bactracin pomade', unitPrice: 500, costPrice: 0, active: true },
    { id: 'drug-nifedipine-20', category: 'drug', name: 'Nifedipine 20mg tabs', unitPrice: 550, costPrice: 0, active: true },
    { id: 'drug-normal-saline-250', category: 'drug', name: 'Normal Saline 250ml', unitPrice: 700, costPrice: 0, active: true },
    { id: 'drug-normal-saline-500', category: 'drug', name: 'Normal Saline 500ml', unitPrice: 1900, costPrice: 0, active: true },
    { id: 'drug-nystatin-ov', category: 'drug', name: 'Nystatin 100 000 iu ov', unitPrice: 700, costPrice: 0, active: true },
    { id: 'drug-nystatin-susp', category: 'drug', name: 'Nystatin 50 000 IU/5ml Susp', unitPrice: 700, costPrice: 0, active: true },
    { id: 'drug-nystatine-tabs', category: 'drug', name: 'Nystatine tabs', unitPrice: 75, costPrice: 0, active: true },
    { id: 'drug-omeprazole-20', category: 'drug', name: 'Omeprazole 20mg tabs', unitPrice: 50, costPrice: 0, active: true },
    { id: 'drug-ors-zinc', category: 'drug', name: 'ORS Zinc', unitPrice: 600, costPrice: 0, active: true },
    { id: 'drug-paracetamol-syrup', category: 'drug', name: 'Paracetamol 120 ml syrup', unitPrice: 2200, costPrice: 0, active: true },
    { id: 'drug-paracetamol-500', category: 'drug', name: 'Paracetamol 500mg tab', unitPrice: 5, costPrice: 0, active: true },
    { id: 'drug-paracetamol-inf', category: 'drug', name: 'Paracetamol inf', unitPrice: 300, costPrice: 0, active: true },
    { id: 'drug-penicillin-g-5mui', category: 'drug', name: 'Penicillin G 5MUI', unitPrice: 400, costPrice: 0, active: true },
    { id: 'drug-penicillin-g-1mu', category: 'drug', name: 'Penicillin G inj IMU', unitPrice: 400, costPrice: 0, active: true },
    { id: 'drug-penicillin-v-250', category: 'drug', name: 'Penicillin V tabs 250mg', unitPrice: 650, costPrice: 0, active: true },
    { id: 'drug-pentazocine-30', category: 'drug', name: 'Pentazocine 30mg/ml', unitPrice: 3350, costPrice: 0, active: true },
    { id: 'drug-perforated-plaster', category: 'drug', name: 'Perforated plaster 18cmX500cm', unitPrice: 800, costPrice: 0, active: true },
    { id: 'drug-pethidine-100', category: 'drug', name: 'Pethidine 100mg/2ml inj', unitPrice: 75, costPrice: 0, active: true },
    { id: 'drug-phenobarb-inj', category: 'drug', name: 'Phenobarb 100mg inj', unitPrice: 500, costPrice: 0, active: true },
    { id: 'drug-phenobarb-100', category: 'drug', name: 'Phenobarb 100mg tabs', unitPrice: 50, costPrice: 0, active: true },
    { id: 'drug-phloroglucinol-40', category: 'drug', name: 'Phloroglucinol 40mg/4ml', unitPrice: 65, costPrice: 0, active: true },
    { id: 'drug-phloroglucinol-80', category: 'drug', name: 'Phloroglucinol 80mg', unitPrice: 300, costPrice: 0, active: true },
    { id: 'drug-phytomenadione', category: 'drug', name: 'Phytomenadione 1mg/ml (vitK1)', unitPrice: 300, costPrice: 0, active: true },
    { id: 'drug-potassium-chloride', category: 'drug', name: 'Potassium Chloride 10% hypertonic', unitPrice: 500, costPrice: 0, active: true },
    { id: 'drug-praziquantel-500', category: 'drug', name: 'Praziquantel 500 mg tabs', unitPrice: 105, costPrice: 0, active: true },
    { id: 'drug-prednisolone-5', category: 'drug', name: 'Prednisolone 5mg tabs', unitPrice: 10, costPrice: 0, active: true },
    { id: 'drug-promethazine-50', category: 'drug', name: 'Promethazine 50mg/2ml', unitPrice: 200, costPrice: 0, active: true },
    { id: 'drug-propranolol-40', category: 'drug', name: 'Propranolol 40mg tabs', unitPrice: 5, costPrice: 0, active: true },
    { id: 'drug-pvp-iodine', category: 'drug', name: 'PVP Iodine 10% Solution', unitPrice: 1200, costPrice: 0, active: true },
    { id: 'drug-quinine-200', category: 'drug', name: 'Quinine 200mg/2ml', unitPrice: 200, costPrice: 0, active: true },
    { id: 'drug-quinine-400', category: 'drug', name: 'Quinine 400mg/4ml', unitPrice: 250, costPrice: 0, active: true },
    { id: 'drug-quinine-600', category: 'drug', name: 'Quinine 600mg/2ml', unitPrice: 300, costPrice: 0, active: true },
    { id: 'drug-quinine-sulphate-200', category: 'drug', name: 'Quinine Sulphate 200mg', unitPrice: 30, costPrice: 0, active: true },
    { id: 'drug-quinine-sulphate-300', category: 'drug', name: 'Quinine Sulphate 300mg', unitPrice: 50, costPrice: 0, active: true },
    { id: 'drug-ranitidine-inj', category: 'drug', name: 'Ranitidine inj', unitPrice: 300, costPrice: 0, active: true },
    { id: 'drug-ranitidine-150', category: 'drug', name: 'Ranitidine tabs 150mg', unitPrice: 20, costPrice: 0, active: true },
    { id: 'drug-salbutamol-inj', category: 'drug', name: 'Salbutamol 0.5 mg/ml inj', unitPrice: 200, costPrice: 0, active: true },
    { id: 'drug-salbutamol-2', category: 'drug', name: 'Salbutamol 2mg tab', unitPrice: 10, costPrice: 0, active: true },
    { id: 'drug-sodium-chloride', category: 'drug', name: 'Sodium chloride Inj', unitPrice: 200, costPrice: 0, active: true },
    { id: 'drug-sulphadoxine-pyrimetamine', category: 'drug', name: 'Sulphadoxine/Pyrimetamine', unitPrice: 20, costPrice: 0, active: true },
    { id: 'drug-surgical-blade-23', category: 'drug', name: 'Surgical Blade 23G', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-suture-catgut-chromic-0', category: 'drug', name: 'Suture Catgut chromic 0', unitPrice: 800, costPrice: 0, active: true },
    { id: 'drug-suture-catgut-chromic-1-0', category: 'drug', name: 'Suture Catgut chromic 1/0', unitPrice: 800, costPrice: 0, active: true },
    { id: 'drug-suture-catgut-chromic-2-0', category: 'drug', name: 'Suture Catgut chromic 2/0', unitPrice: 800, costPrice: 0, active: true },
    { id: 'drug-suture-catgut-plain-0', category: 'drug', name: 'Suture Catgut plain 0', unitPrice: 800, costPrice: 0, active: true },
    { id: 'drug-suture-catgut-plain-1-0', category: 'drug', name: 'Suture Catgut plain 1/0', unitPrice: 800, costPrice: 0, active: true },
    { id: 'drug-suture-catgut-plain-2', category: 'drug', name: 'Suture Catgut plain 2', unitPrice: 800, costPrice: 0, active: true },
    { id: 'drug-suture-catgut-plain-2-0', category: 'drug', name: 'Suture Catgut plain 2/0', unitPrice: 800, costPrice: 0, active: true },
    { id: 'drug-suture-catut-chromic-2', category: 'drug', name: 'Suture Catut chromic 2', unitPrice: 800, costPrice: 0, active: true },
    { id: 'drug-suture-nylon-0', category: 'drug', name: 'Suture Nylon 0', unitPrice: 800, costPrice: 0, active: true },
    { id: 'drug-suture-nylon-1', category: 'drug', name: 'Suture Nylon 1', unitPrice: 800, costPrice: 0, active: true },
    { id: 'drug-suture-nylon-2-0', category: 'drug', name: 'Suture Nylon 2/0', unitPrice: 800, costPrice: 0, active: true },
    { id: 'drug-suture-silk-0', category: 'drug', name: 'Suture silk 0', unitPrice: 1700, costPrice: 0, active: true },
    { id: 'drug-suture-silk-1', category: 'drug', name: 'Suture silk 1', unitPrice: 1700, costPrice: 0, active: true },
    { id: 'drug-suture-silk-2-0', category: 'drug', name: 'Suture silk 2/0', unitPrice: 1700, costPrice: 0, active: true },
    { id: 'drug-suture-vicryl-0', category: 'drug', name: 'Suture Vicryl 0 (Atramat)', unitPrice: 1700, costPrice: 0, active: true },
    { id: 'drug-suture-vicryl-1', category: 'drug', name: 'Suture Vicryl 1 (Atramat)', unitPrice: 1700, costPrice: 0, active: true },
    { id: 'drug-suture-vicryl-2-0', category: 'drug', name: 'Suture Vicryl 2/0 (Atramat)', unitPrice: 1700, costPrice: 0, active: true },
    { id: 'drug-tetracaine-eye-drop', category: 'drug', name: 'Tetracaine HCL Eye Drop', unitPrice: 500, costPrice: 0, active: true },
    { id: 'drug-tetracycline-eye-ointment', category: 'drug', name: 'Tetracycline 1% eye ointment', unitPrice: 500, costPrice: 0, active: true },
    { id: 'drug-urine-bag-adult', category: 'drug', name: 'Urine collecting bag adult', unitPrice: 500, costPrice: 0, active: true },
    { id: 'drug-urine-bag-paediatric', category: 'drug', name: 'Urine collecting bag paediatric', unitPrice: 500, costPrice: 0, active: true },
    { id: 'drug-vecuronium-bromide', category: 'drug', name: 'Vecuronium Bromide', unitPrice: 2760, costPrice: 0, active: true },
    { id: 'drug-vitamin-b-complex-inj', category: 'drug', name: 'Vitamin B complex inj 10 ml', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-vitamin-b-complex-tabs', category: 'drug', name: 'Vitamin B complex tabs', unitPrice: 30, costPrice: 0, active: true },
    { id: 'drug-water-for-injection', category: 'drug', name: 'Water for injection 10ml', unitPrice: 100, costPrice: 0, active: true },
    { id: 'drug-acfol-5mg', category: 'drug', name: 'Acfol 5mg cap B/25', unitPrice: 1700, costPrice: 1268, active: true },
    { id: 'drug-avas-10', category: 'drug', name: 'Avas 10', unitPrice: 4300, costPrice: 4196, active: true },
    { id: 'drug-aclav-100mg', category: 'drug', name: 'Aclav 100mg', unitPrice: 4050, costPrice: 3030, active: true },
    { id: 'drug-aclav-1g-125mg-sachet', category: 'drug', name: 'Aclav 1g/125mg Sachet B/12', unitPrice: 4350, costPrice: 3272, active: true },
    { id: 'drug-aclav-500mg-625mg-sachet', category: 'drug', name: 'Aclav 500mg/62.5mg sach B/12', unitPrice: 4350, costPrice: 3245, active: true },
    { id: 'drug-amarel-2mg', category: 'drug', name: 'Amarel 2mg tab B/30', unitPrice: 5000, costPrice: 3899, active: true },
    { id: 'drug-amoxiclav-denk', category: 'drug', name: 'Amoxiclav Denk', unitPrice: 3900, costPrice: 3245, active: true },
    { id: 'drug-actapulgite-ped', category: 'drug', name: 'Actapulgite ped 1G sach B/20', unitPrice: 1600, costPrice: 1221, active: true },
  ],
  supplies: [
    { id: 'supply-syringe-10ml', category: 'supply', name: 'Disposable syringe 10ml with needle', unitPrice: 10, active: true },
    { id: 'supply-syringe-5ml', category: 'supply', name: 'Disposable syringe 5ml with needle', unitPrice: 50, active: true },
    { id: 'supply-syringe-2-5ml', category: 'supply', name: 'Disposable syringe 2.5ml with needle', unitPrice: 30, active: true },
    { id: 'supply-exam-gloves', category: 'supply', name: 'Examination Gloves (medium) each', unitPrice: 60, active: true },
    { id: 'supply-sterile-gloves-7-5', category: 'supply', name: 'Sterile Gloves size 7.5 / pair', unitPrice: 500, active: true },
    { id: 'supply-infusion-set', category: 'supply', name: 'Infusion Set', unitPrice: 200, active: true },
    { id: 'supply-catheter-iv-18', category: 'supply', name: 'Catheter I.V type 18G', unitPrice: 300, active: true },
    { id: 'supply-catheter-iv-20', category: 'supply', name: 'Catheter I.V type 20G', unitPrice: 300, active: true },
    { id: 'supply-catheter-iv-22', category: 'supply', name: 'Catheter I.V type 22G', unitPrice: 300, active: true },
    { id: 'supply-catheter-iv-24', category: 'supply', name: 'Catheter I.V type 24G', unitPrice: 600, active: true },
    { id: 'supply-foley-catheter-16', category: 'supply', name: 'Foley Catheter 16', unitPrice: 800, active: true },
    { id: 'supply-foley-catheter-18', category: 'supply', name: 'Foley Catheter 18', unitPrice: 1000, active: true },
    { id: 'supply-ng-tube-18', category: 'supply', name: 'Nasogastric tube 18', unitPrice: 1000, active: true },
    { id: 'supply-ng-tube-13', category: 'supply', name: 'Nasogastric tube CH 13', unitPrice: 1000, active: true },
    { id: 'supply-ng-tube-6', category: 'supply', name: 'Nasogastric tube 6', unitPrice: 100, active: true },
    { id: 'supply-needle-butterfly-19', category: 'supply', name: 'Butterfly needle 19G', unitPrice: 100, active: true },
    { id: 'supply-needle-butterfly-21', category: 'supply', name: 'Butterfly needle 21G', unitPrice: 100, active: true },
    { id: 'supply-needle-butterfly-23', category: 'supply', name: 'Butterfly needle 23G', unitPrice: 100, active: true },
    { id: 'supply-needle-butterfly-25', category: 'supply', name: 'Butterfly needle 25G', unitPrice: 100, active: true },
    { id: 'supply-needle-21', category: 'supply', name: 'Needle No. 21G', unitPrice: 100, active: true },
    { id: 'supply-needle-23', category: 'supply', name: 'Needle No. 23G', unitPrice: 100, active: true },
    { id: 'supply-lp-needle-19', category: 'supply', name: 'Lumbar puncture needle 19G', unitPrice: 690, active: true },
    { id: 'supply-lp-needle-22', category: 'supply', name: 'Lumbar puncture needle 22G', unitPrice: 700, active: true },
    { id: 'supply-surgical-blade-23', category: 'supply', name: 'Surgical Blade 23G', unitPrice: 100, active: true },
    { id: 'supply-compress-sterile', category: 'supply', name: 'Compress Sterile 10x10', unitPrice: 70, active: true },
    { id: 'supply-cotton-absorbent-500', category: 'supply', name: 'Cotton Absorbent 500g', unitPrice: 2840, active: true },
    { id: 'supply-cotton-absorbent-50', category: 'supply', name: 'Cotton Absorbent 50g', unitPrice: 350, active: true },
    { id: 'supply-crepe-bandage', category: 'supply', name: 'Crepe bandage 10cm x 4m', unitPrice: 500, active: true },
    { id: 'supply-perforated-plaster', category: 'supply', name: 'Perforated plaster 18cm x 500cm', unitPrice: 800, active: true },
    { id: 'supply-urine-bag-adult', category: 'supply', name: 'Urine collecting bag adult', unitPrice: 500, active: true },
    { id: 'supply-urine-bag-paediatric', category: 'supply', name: 'Urine collecting bag paediatric', unitPrice: 500, active: true },
    { id: 'supply-alcohol-70-125', category: 'supply', name: 'Alcohol 70% 125ml (topical)', unitPrice: 2250, active: true },
    { id: 'supply-alcohol-70-1000', category: 'supply', name: 'Alcohol 70% 1000ml (topical)', unitPrice: 4500, active: true },
    { id: 'supply-pvp-iodine', category: 'supply', name: 'PVP Iodine 10% Solution 500ml', unitPrice: 1200, active: true },
    { id: 'supply-registration-card', category: 'supply', name: 'Hospital registration card', unitPrice: 250, active: true },
  ],
  hospitalization: [
    { id: 'bed-observation', category: 'hospitalization', name: 'Observation bed day', ward: 'Emergency Observation', unitPrice: 5000, active: true },
    { id: 'bed-standard', category: 'hospitalization', name: 'Standard ward day', ward: 'General Medicine', unitPrice: 7000, active: true },
    { id: 'bed-maternity', category: 'hospitalization', name: 'Maternity ward day', ward: 'Maternity', unitPrice: 8000, active: true },
    { id: 'bed-surgery', category: 'hospitalization', name: 'Surgery ward day', ward: 'Surgery', unitPrice: 10000, active: true },
    { id: 'bed-isolation', category: 'hospitalization', name: 'Isolation ward day', ward: 'Isolation', unitPrice: 12000, active: true },
    { id: 'bed-private', category: 'hospitalization', name: 'Private room day', ward: 'Private', unitPrice: 25000, active: true },
    { id: 'bed-icu', category: 'hospitalization', name: 'Intensive care day', ward: 'ICU', unitPrice: 50000, active: true }
  ],
  nursingActs: [
    { id: 'act-injection', category: 'nursing_act', name: 'Injection administration', unitPrice: 1000, active: true },
    { id: 'act-iv-line', category: 'nursing_act', name: 'IV line placement', unitPrice: 2500, active: true },
    { id: 'act-dressing', category: 'nursing_act', name: 'Wound dressing', unitPrice: 3000, active: true },
    { id: 'act-nebulization', category: 'nursing_act', name: 'Nebulization session', unitPrice: 2500, active: true }
  ],
  procedures: [
    { id: 'procedure-minor', category: 'procedure', name: 'Minor procedure', unitPrice: 15000, active: true },
    { id: 'procedure-surgery', category: 'procedure', name: 'Surgery package', unitPrice: 100000, active: true }
  ]
}

export const state = () => ({
  catalog: clone(DEFAULT_CATALOG),
  manualCharges: [],
  payments: [],
  waivedChargeIds: [],
  cancelledChargeIds: [],
  lastReceiptNumber: 0,
  // ── Payment Clearances (Pre-payment workflow) ──
  paymentClearances: []
})

export const mutations = {
  LOAD_FROM_STORAGE(state) {
    const saved = loadBilling()
    if (!saved) return
    state.catalog = mergeCatalog(clone(DEFAULT_CATALOG), saved.catalog || {})
    state.manualCharges = Array.isArray(saved.manualCharges) ? saved.manualCharges : []
    state.payments = Array.isArray(saved.payments) ? saved.payments : []
    state.waivedChargeIds = Array.isArray(saved.waivedChargeIds) ? saved.waivedChargeIds : []
    state.cancelledChargeIds = Array.isArray(saved.cancelledChargeIds) ? saved.cancelledChargeIds : []
    state.lastReceiptNumber = Number(saved.lastReceiptNumber || 0)
    state.paymentClearances = Array.isArray(saved.paymentClearances) ? saved.paymentClearances : []
  },
  RESET_CATALOG(state) {
    state.catalog = clone(DEFAULT_CATALOG)
    persistBilling(state)
  },
  ADD_CATALOG_ITEM(state, { section, item }) {
    if (!Array.isArray(state.catalog[section])) return
    state.catalog[section].push(item)
    persistBilling(state)
  },
  UPDATE_CATALOG_ITEM(state, payload) {
    const section = state.catalog[payload.section]
    if (!Array.isArray(section)) return
    const index = section.findIndex(item => item.id === payload.id)
    if (index === -1) return
    section.splice(index, 1, { ...section[index], ...payload.updates, updatedAt: new Date().toISOString() })
    persistBilling(state)
  },
  ADD_MANUAL_CHARGE(state, charge) {
    state.manualCharges.push(charge)
    persistBilling(state)
  },
  UPDATE_MANUAL_CHARGE(state, charge) {
    const index = state.manualCharges.findIndex(item => item.id === charge.id)
    if (index === -1) return
    state.manualCharges.splice(index, 1, charge)
    persistBilling(state)
  },
  WAIVE_CHARGE(state, chargeId) {
    if (!state.waivedChargeIds.includes(chargeId)) state.waivedChargeIds.push(chargeId)
    state.cancelledChargeIds = state.cancelledChargeIds.filter(id => id !== chargeId)
    persistBilling(state)
  },
  CANCEL_CHARGE(state, chargeId) {
    if (!state.cancelledChargeIds.includes(chargeId)) state.cancelledChargeIds.push(chargeId)
    state.waivedChargeIds = state.waivedChargeIds.filter(id => id !== chargeId)
    persistBilling(state)
  },
  REOPEN_CHARGE(state, chargeId) {
    state.waivedChargeIds = state.waivedChargeIds.filter(id => id !== chargeId)
    state.cancelledChargeIds = state.cancelledChargeIds.filter(id => id !== chargeId)
    persistBilling(state)
  },
  ADD_PAYMENT(state, payment) {
    state.lastReceiptNumber += 1
    state.payments.push({ ...payment, receiptNumber: payment.receiptNumber || formatReceiptNumber(state.lastReceiptNumber) })
    persistBilling(state)
  },
  VOID_PAYMENT(state, paymentId) {
    const index = state.payments.findIndex(item => item.id === paymentId)
    if (index === -1) return
    state.payments.splice(index, 1, { ...state.payments[index], status: 'Voided', voidedAt: new Date().toISOString() })
    persistBilling(state)
  },
  // ── Payment Clearance mutations ──
  ISSUE_CLEARANCE(state, clearance) {
    state.paymentClearances.push(clearance)
    persistBilling(state)
  },
  REVOKE_CLEARANCE(state, clearanceId) {
    const idx = state.paymentClearances.findIndex(c => c.id === clearanceId)
    if (idx !== -1) {
      state.paymentClearances.splice(idx, 1, { ...state.paymentClearances[idx], status: 'Revoked', revokedAt: new Date().toISOString() })
      persistBilling(state)
    }
  }
}

export const actions = {
  loadFromStorage({ commit }) { commit('LOAD_FROM_STORAGE') },
  resetCatalog({ commit }) { commit('RESET_CATALOG') },
  updateCatalogItem({ commit }, payload) { commit('UPDATE_CATALOG_ITEM', payload) },
  createManualCharge({ commit, rootState }, payload) {
    const charge = normalizeCharge({
      ...payload,
      id: payload.id || uniqueId('MCH'),
      sourceType: 'manual',
      sourceId: payload.sourceId || null,
      institution: payload.institution || rootState.auth.institution,
      region: payload.region || rootState.auth.region,
      createdBy: payload.createdBy || rootState.auth.fullName || rootState.auth.staffId || 'Cash Office',
      createdAt: payload.createdAt || new Date().toISOString()
    })
    commit('ADD_MANUAL_CHARGE', charge)
    return charge
  },
  updateManualCharge({ commit }, charge) { commit('UPDATE_MANUAL_CHARGE', normalizeCharge(charge)) },
  waiveCharge({ commit }, chargeId) { commit('WAIVE_CHARGE', chargeId) },
  cancelCharge({ commit }, chargeId) { commit('CANCEL_CHARGE', chargeId) },
  reopenCharge({ commit }, chargeId) { commit('REOPEN_CHARGE', chargeId) },
  recordPayment({ commit, state, getters, dispatch, rootGetters, rootState }, payload) {
    const statement = getters.statementForPatient(payload.patientId)
    const amount = Number(payload.amount || 0)
    if (!payload.patientId || amount <= 0) return null

    const lastNum = (state.lastReceiptNumber || 0) + 1
    state.lastReceiptNumber = lastNum
    const receiptNumber = formatReceiptNumber(lastNum)

    const payment = {
      id: payload.id || uniqueId('PAY'),
      patientId: payload.patientId,
      statementId: statement.id,
      receiptNumber,
      amount,
      method: payload.method || 'Cash',
      reference: payload.reference || '',
      note: payload.note || 'Payment received at Cash Office',
      status: 'Posted',
      cashier: payload.cashier || rootState.auth.fullName || rootState.auth.staffId || 'Cash Office',
      institution: payload.institution || rootState.auth.institution,
      paidAt: payload.paidAt || new Date().toISOString()
    }
    commit('ADD_PAYMENT', payment)

    // Sync payment status to Lab and Imaging orders
    const updatedStatement = getters.statementForPatient(payload.patientId)
    const labOrders = rootGetters['clinical/getLabOrders'] || []
    const imagingOrders = rootGetters['clinical/getImagingOrders'] || []
    const medications = rootGetters['clinical/getMedications'] || []

    labOrders.filter(o => o.patientId === payload.patientId).forEach(order => {
      const charge = (updatedStatement.charges || []).find(c => c.sourceType === 'lab_order' && c.sourceId === order.id)
      if (charge && updatedStatement.amountPaid >= charge.total) {
        dispatch('clinical/updateLabOrder', { ...order, paymentStatus: 'Paid' }, { root: true })
      }
    })

    imagingOrders.filter(o => o.patientId === payload.patientId).forEach(order => {
      const charge = (updatedStatement.charges || []).find(c => c.sourceType === 'imaging_order' && c.sourceId === order.id)
      if (charge && updatedStatement.amountPaid >= charge.total) {
        dispatch('clinical/updateImagingOrder', { ...order, paymentStatus: 'Paid' }, { root: true })
      }
    })

    // Sync payment status for Medication orders
    medications.filter(o => o.patientId === payload.patientId).forEach(order => {
      const charge = (updatedStatement.charges || []).find(c => c.category === 'drug' && c.sourceId === order.id)
      if (charge) {
        const isPaid = (payload.paidChargeIds && Array.isArray(payload.paidChargeIds))
          ? payload.paidChargeIds.includes(charge.id)
          : (updatedStatement.amountPaid >= charge.total)

        if (isPaid && order.paymentStatus !== 'Paid') {
          dispatch('clinical/updateMedication', { ...order, paymentStatus: 'Paid' }, { root: true })
        }
      }
    })

    return payment
  },
  voidPayment({ commit }, paymentId) { commit('VOID_PAYMENT', paymentId) },
  // ── Payment Clearance actions ──
  issueClearance({ commit, rootState, getters }, { patientId, serviceType, department, amount, method }) {
    if (!patientId || !serviceType || !amount) return null
    const clearance = {
      id: uniqueId('CLR'),
      patientId,
      serviceType,
      department: department || 'General Medicine',
      amount,
      status: 'Active',
      clearanceCode: 'PC-' + Date.now().toString(36).toUpperCase(),
      issuedBy: rootState.auth.fullName || rootState.auth.staffId || 'Cash Office',
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
    commit('ISSUE_CLEARANCE', clearance)
    // Also record a payment for this clearance
    const payment = {
      id: uniqueId('PAY'),
      patientId,
      receiptNumber: 'CLR-' + clearance.clearanceCode.split('-')[1],
      amount: Number(amount),
      method: method || 'Cash',
      reference: clearance.clearanceCode,
      note: 'Pre-payment for ' + serviceType + ' — ' + (department || 'General Medicine'),
      status: 'Posted',
      cashier: clearance.issuedBy,
      institution: rootState.auth.institution,
      paidAt: clearance.issuedAt
    }
    commit('ADD_PAYMENT', payment)
    return { clearance, payment }
  },
  revokeClearance({ commit }, clearanceId) { commit('REVOKE_CLEARANCE', clearanceId) }
}

export const getters = {
  catalog: state => state.catalog,
  catalogSections: state => Object.keys(state.catalog),
  flatCatalog: state => flattenCatalog(state.catalog),
  activeCatalog: state => flattenCatalog(state.catalog).filter(item => item.active !== false),
  manualCharges: state => state.manualCharges,
  payments: state => state.payments.filter(item => item.status !== 'Voided'),
  autoChargeLines: (state, getters, rootState, rootGetters) => buildAutoCharges(state, rootState, rootGetters),
  chargeLines: (state, getters) => [...getters.autoChargeLines, ...state.manualCharges.map(normalizeCharge)].map(charge => applyChargeState(charge, state)),
  billableChargeLines: (state, getters) => getters.chargeLines.filter(charge => !['Cancelled', 'Waived'].includes(charge.status)),
  chargesForPatient: (state, getters) => patientId => getters.chargeLines.filter(charge => charge.patientId === patientId),
  paymentsForPatient: (state, getters) => patientId => getters.payments.filter(payment => payment.patientId === patientId),
  statementForPatient: (state, getters, rootState, rootGetters) => patientId => {
    const patients = rootGetters['clinical/getPatients'] || []
    const patient = patients.find(item => item.id === patientId) || {}
    const charges = getters.chargesForPatient(patientId)
    const billableCharges = charges.filter(charge => !['Cancelled', 'Waived'].includes(charge.status))
    const waivedCharges = charges.filter(charge => charge.status === 'Waived')
    const payments = getters.paymentsForPatient(patientId)
    const totalCharges = sumMoney(billableCharges.map(charge => charge.total))
    const waivedTotal = sumMoney(waivedCharges.map(charge => charge.total))
    const amountPaid = sumMoney(payments.map(payment => payment.amount))
    const balance = Math.max(totalCharges - amountPaid, 0)
    return {
      id: 'ACC-' + patientId,
      patientId,
      patientName: patient.name || (patient.firstName || '') + ' ' + (patient.lastName || '') || patientId,
      institution: patient.institution || rootState.auth.institution,
      charges,
      payments,
      totalCharges,
      waivedTotal,
      amountPaid,
      balance,
      status: resolveStatementStatus(totalCharges, amountPaid, balance, waivedTotal),
      updatedAt: latestDate([...charges.map(item => item.createdAt), ...payments.map(item => item.paidAt)])
    }
  },
  patientStatements: (state, getters, rootState, rootGetters) => {
    const patients = rootGetters['clinical/getPatients'] || []
    return patients.map(patient => getters.statementForPatient(patient.id))
  },
  billingQueue: (state, getters) => getters.patientStatements.filter(statement => statement.totalCharges > 0 || statement.balance > 0).sort((a, b) => b.balance - a.balance),
  getPatientBalance: (state, getters) => patientId => getters.statementForPatient(patientId).balance,
  getPatientStatus: (state, getters) => patientId => getters.statementForPatient(patientId).status,
  getCatalogItem: state => (section, id) => {
    const items = state.catalog[section] || []
    return items.find(item => item.id === id) || null
  },
  // ── Payment Clearance getters ──
  paymentClearances: state => state.paymentClearances,
  activeClearancesForPatient: (state) => (patientId) => {
    return state.paymentClearances.filter(c => c.patientId === patientId && c.status === 'Active' && new Date(c.expiresAt) > new Date())
  },
  getPaymentClearance: (state) => (patientId, serviceType) => {
    const now = new Date()
    return state.paymentClearances.find(c => c.patientId === patientId && c.serviceType === serviceType && c.status === 'Active' && new Date(c.expiresAt) > now) || null
  },
  hasConsultationClearance: (state, getters) => (patientId) => {
    if (!PRE_PAYMENT_REQUIRED.includes('consultation')) return true
    return !!getters.getPaymentClearance(patientId, 'consultation')
  },
  clearedPatientsForDepartment: (state, getters, rootState, rootGetters) => (department) => {
    const now = new Date()
    const activeClearances = state.paymentClearances.filter(c =>
      c.serviceType === 'consultation' &&
      c.status === 'Active' &&
      new Date(c.expiresAt) > now &&
      (!department || c.department === department)
    )
    const patients = rootGetters['clinical/getPatients'] || []
    return activeClearances.map(c => {
      const patient = patients.find(p => p.id === c.patientId) || {}
      return {
        ...c,
        patientName: patient.name || ((patient.firstName || '') + ' ' + (patient.lastName || '')).trim() || c.patientId,
        patientAge: patient.dob ? Math.floor((Date.now() - new Date(patient.dob)) / (1000 * 60 * 60 * 24 * 365.25)) : null,
        patientGender: patient.gender || ''
      }
    })
  }
}

function buildAutoCharges(state, rootState, rootGetters) {
  const charges = []
  const visits = rootGetters['clinical/getVisits'] || []
  const labs = rootGetters['clinical/getLabOrders'] || []
  const imaging = rootGetters['clinical/getImagingOrders'] || []
  const medications = rootGetters['clinical/getMedications'] || []
  const inpatients = rootGetters['clinical/getInpatients'] || []
  const legacyInvoices = rootGetters['clinical/getInvoices'] || []

  visits.forEach(visit => {
    if (!visit.patientId) return
    const catalogItem = findCatalogItem(state.catalog.consultations, visit.department || visit.encounterType || 'General consultation') || state.catalog.consultations[0]
    const explicitPrice = visit.billing && visit.billing.consultationFee
    charges.push(normalizeCharge({ id: deterministicId('visit', visit.id || visit.createdAt, 'consultation'), patientId: visit.patientId, category: 'consultation', description: visit.description || 'Consultation - ' + (visit.diagnosis || visit.chiefComplaint || 'Clinical encounter'), quantity: 1, unitPrice: Number(explicitPrice || catalogItem.unitPrice || 0), sourceType: 'visit', sourceId: visit.id, departmentSource: 'Consultation', orderedBy: visit.recordedBy || visit.createdBy || '', createdAt: visit.createdAt || visit.recordedAt, institution: visit.institution || rootState.auth.institution }))
  })

  labs.forEach(order => {
    if (!order.patientId) return
    const label = order.testName || order.test || order.name || 'Laboratory test'
    const catalogItem = findCatalogItem(state.catalog.labTests, label)
    const unitPrice = catalogItem ? Number(catalogItem.unitPrice || 0) : Number(order.price || order.unitPrice || 5000)
    charges.push(normalizeCharge({ id: deterministicId('lab', order.id || order.requestedAt, normalizeKey(label)), patientId: order.patientId, category: 'laboratory', description: label, quantity: Number(order.quantity || 1), unitPrice, priceStatus: 'priced', sourceType: 'lab_order', sourceId: order.id, sourceStatus: order.status, departmentSource: 'Laboratory', orderedBy: order.orderedBy || order.createdBy || '', createdAt: order.requestedAt || order.createdAt, institution: order.institution || rootState.auth.institution }))
  })

  imaging.forEach(order => {
    if (!order.patientId) return
    const label = order.modality || order.exam || order.testName || 'Imaging exam'
    const catalogItem = findCatalogItem(state.catalog.imaging, label)
    const unitPrice = catalogItem ? Number(catalogItem.unitPrice || 0) : Number(order.price || order.unitPrice || 10000)
    charges.push(normalizeCharge({ id: deterministicId('imaging', order.id || order.requestedAt, normalizeKey(label)), patientId: order.patientId, category: 'imaging', description: label, quantity: Number(order.quantity || 1), unitPrice, priceStatus: 'priced', sourceType: 'imaging_order', sourceId: order.id, sourceStatus: order.status, departmentSource: 'Imaging', orderedBy: order.orderedBy || order.createdBy || '', createdAt: order.requestedAt || order.createdAt, institution: order.institution || rootState.auth.institution }))
  })

  medications.forEach(order => {
    if (!order.patientId || order.status === 'Discontinued' || order.status === 'Cancelled') return
    const label = order.medication || 'Medication'
    const catalogItem = findCatalogItem(state.catalog.drugs, label)
    const unitPrice = catalogItem ? Number(catalogItem.unitPrice || 0) : Number(order.price || order.unitPrice || 1000)
    charges.push(normalizeCharge({ id: deterministicId('drug', order.id || order.prescribedAt, normalizeKey(label)), patientId: order.patientId, category: 'drug', description: label, quantity: Number(order.quantity || 1), unitPrice, priceStatus: 'priced', sourceType: 'medication_order', sourceId: order.id, sourceStatus: order.status, departmentSource: 'Pharmacy', orderedBy: order.prescribedBy || order.createdBy || '', createdAt: order.prescribedAt || order.createdAt, institution: order.institution || rootState.auth.institution }))
  })

  inpatients.forEach(stay => {
    if (!stay.patientId) return
    const catalogItem = findHospitalizationPrice(state.catalog.hospitalization, stay.ward)
    const days = hospitalizationDays(stay.admissionDate || stay.admittedAt, stay.dischargeDate)
    if (days > 0) {
      charges.push(normalizeCharge({ id: deterministicId('inpatient', stay.id || stay.admittedAt, 'bed-days'), patientId: stay.patientId, category: 'hospitalization', description: catalogItem.name + ' (' + days + ' day' + (days > 1 ? 's' : '') + ')', quantity: days, unitPrice: Number(catalogItem.unitPrice || 0), sourceType: 'inpatient_stay', sourceId: stay.id, sourceStatus: stay.status, departmentSource: 'Inpatient', orderedBy: stay.admittedBy || stay.attendingDoctor || '', createdAt: stay.admissionDate || stay.admittedAt, institution: stay.institution || rootState.auth.institution }))
    }
  })

  legacyInvoices.forEach(invoice => {
    if (!invoice.patientId || !invoice.amount) return
    charges.push(normalizeCharge({ id: deterministicId('legacy-invoice', invoice.id || invoice.createdAt, 'import'), patientId: invoice.patientId, category: 'legacy', description: invoice.description || invoice.serviceType || 'Legacy invoice charge', quantity: 1, unitPrice: Number(invoice.amount || 0), sourceType: 'legacy_invoice', sourceId: invoice.id, sourceStatus: invoice.status, departmentSource: invoice.serviceType || 'Billing', orderedBy: invoice.createdBy || '', createdAt: invoice.createdAt, institution: invoice.institution || rootState.auth.institution }))
  })

  return dedupeCharges(charges)
}

function normalizeCharge(charge) {
  const quantity = Number(charge.quantity || 1)
  const unitPrice = Number(charge.unitPrice || charge.amount || 0)
  return { id: charge.id, patientId: charge.patientId, category: charge.category || 'other', description: charge.description || 'Unspecified charge', quantity, unitPrice, total: Number((quantity * unitPrice).toFixed(0)), status: charge.status || 'Open', priceStatus: charge.priceStatus || (unitPrice > 0 ? 'priced' : 'needs_price'), sourceType: charge.sourceType || 'manual', sourceId: charge.sourceId || null, sourceStatus: charge.sourceStatus || '', departmentSource: charge.departmentSource || charge.category || 'Billing', orderedBy: charge.orderedBy || '', institution: charge.institution || '', region: charge.region || '', createdBy: charge.createdBy || '', createdAt: charge.createdAt || new Date().toISOString() }
}

function applyChargeState(charge, state) {
  if (state.cancelledChargeIds.includes(charge.id)) return { ...charge, status: 'Cancelled' }
  if (state.waivedChargeIds.includes(charge.id)) return { ...charge, status: 'Waived' }
  return charge
}

function findCatalogItem(items, label) {
  if (!label) return null
  const key = normalizeKey(label)
  if (!key) return null

  // 1. Direct match with name, department, ward, id, or aliases
  let match = (items || []).find(item => {
    const keys = [item.name, item.department, item.ward, item.id].concat(item.aliases || []).map(normalizeKey)
    return keys.includes(key)
  })
  if (match) return match

  // 2. Substring match (either catalog key inside label or label inside catalog key)
  match = (items || []).find(item => {
    const keys = [item.name].concat(item.aliases || []).map(normalizeKey)
    return keys.some(k => k && (key.includes(k) || k.includes(key)))
  })
  if (match) return match

  // 3. Significant word token match
  const labelWords = key.split('_').filter(w => w.length > 2)
  match = (items || []).find(item => {
    const itemWords = normalizeKey(item.name).split('_').filter(w => w.length > 2)
    return itemWords.some(w => labelWords.includes(w))
  })
  return match || null
}

function findHospitalizationPrice(items, ward) {
  const match = findCatalogItem(items, ward)
  return match || items.find(item => item.id === 'bed-standard') || { name: 'Ward day', unitPrice: 0 }
}

function hospitalizationDays(start, end) {
  if (!start) return 1
  const startDate = new Date(start)
  const endDate = end ? new Date(end) : new Date()
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 1
  const ms = endDate.setHours(0, 0, 0, 0) - startDate.setHours(0, 0, 0, 0)
  return Math.max(Math.ceil(ms / 86400000) || 1, 1)
}

function flattenCatalog(catalog) {
  return Object.keys(catalog).reduce((items, section) => items.concat((catalog[section] || []).map(item => ({ ...item, section }))), [])
}

function mergeCatalog(base, saved) {
  Object.keys(saved).forEach(section => {
    if (!Array.isArray(saved[section])) return
    const merged = [].concat(base[section] || [])
    saved[section].forEach(savedItem => {
      const index = merged.findIndex(item => item.id === savedItem.id)
      if (index === -1) merged.push(savedItem)
      else merged.splice(index, 1, { ...merged[index], ...savedItem })
    })
    base[section] = merged
  })
  return base
}

function resolveStatementStatus(totalCharges, amountPaid, balance, waivedTotal) {
  if (totalCharges === 0 && waivedTotal > 0) return 'WAIVED'
  if (totalCharges === 0) return 'NO_CHARGES'
  if (balance === 0) return 'PAID'
  if (amountPaid > 0) return 'PARTIAL'
  return 'UNPAID'
}

function dedupeCharges(charges) {
  const seen = new Set()
  return charges.filter(charge => {
    if (seen.has(charge.id)) return false
    seen.add(charge.id)
    return true
  })
}

function sumMoney(values) { return values.reduce((total, value) => total + Number(value || 0), 0) }

function latestDate(values) {
  const dates = values.filter(Boolean).map(value => new Date(value)).filter(date => !Number.isNaN(date.getTime()))
  if (!dates.length) return null
  return new Date(Math.max(...dates.map(date => date.getTime()))).toISOString()
}

function uniqueId(prefix) { return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase() }
function deterministicId(type, sourceId, suffix) { return 'CHG-' + type + '-' + normalizeKey(sourceId || 'unknown') + '-' + normalizeKey(suffix || 'item') }
function normalizeKey(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') }
function formatReceiptNumber(value) { return 'RCT-' + String(value).padStart(6, '0') }
function clone(value) { return JSON.parse(JSON.stringify(value)) }

function loadBilling() {
  if (!process.client) return null
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch (e) { return null }
}

function persistBilling(state) {
  if (!process.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ catalog: state.catalog, manualCharges: state.manualCharges, payments: state.payments, waivedChargeIds: state.waivedChargeIds, cancelledChargeIds: state.cancelledChargeIds, lastReceiptNumber: state.lastReceiptNumber, paymentClearances: state.paymentClearances }))
}
