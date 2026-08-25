const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const path = require('path')
const { DEFAULT_CATALOG } = require(path.join(__dirname, '../src/lib/default_catalog'))

const prisma = new PrismaClient()

// ─── Default Hospital Model (from original localStorage prototype) ────────────
const DEFAULT_DEPARTMENTS = [
  {
    code: 'EMERGENCY', name: 'Urgences', headOfDepartment: 'Dr. Mbarga Alain', sortOrder: 1,
    wards: [
      { name: 'Tri / Resuscitation Room', beds: 6, sortOrder: 1 },
      { name: "Salle d'Observation Hommes", beds: 10, sortOrder: 2 },
      { name: "Salle d'Observation Femmes", beds: 10, sortOrder: 3 }
    ]
  },
  {
    code: 'MEDICINE', name: 'Médecine Interne', headOfDepartment: 'Dr. Fotso Beatrice', sortOrder: 2,
    wards: [
      { name: 'Unité de Cardiologie', beds: 12, sortOrder: 1 },
      { name: "Unité d'Endocrinologie & Diabète", beds: 10, sortOrder: 2 },
      { name: 'Hospitalisation Médecine Hommes', beds: 16, sortOrder: 3 },
      { name: 'Hospitalisation Médecine Femmes', beds: 16, sortOrder: 4 }
    ]
  },
  {
    code: 'SURGERY', name: 'Chirurgie', headOfDepartment: 'Dr. Essomba Guy', sortOrder: 3,
    wards: [
      { name: 'Chirurgie Générale & Viscérale', beds: 15, sortOrder: 1 },
      { name: 'Traumatologie & Orthopédie', beds: 12, sortOrder: 2 },
      { name: 'Bloc Opératoire Central', beds: 4, sortOrder: 3 },
      { name: 'Salle de Réveil (PACU)', beds: 6, sortOrder: 4 }
    ]
  },
  {
    code: 'PEDIATRICS', name: 'Pédiatrie', headOfDepartment: 'Dr. Nkemba Rose', sortOrder: 4,
    wards: [
      { name: 'Néonatologie & Couveuses', beds: 10, sortOrder: 1 },
      { name: 'Hospitalisation Pédiatrique', beds: 20, sortOrder: 2 },
      { name: 'Unité de Nutrition Thérapeutique', beds: 8, sortOrder: 3 }
    ]
  },
  {
    code: 'OBGYN', name: 'Gynécologie - Obstétrique', headOfDepartment: 'Dr. Manga Therese', sortOrder: 5,
    wards: [
      { name: "Salle d'Accouchement (Maternité)", beds: 8, sortOrder: 1 },
      { name: 'Suites de Couches / Post-Partum', beds: 16, sortOrder: 2 },
      { name: 'Grossesses à Haut Risque (GHR)', beds: 8, sortOrder: 3 }
    ]
  },
  {
    code: 'ICU', name: 'Réanimation & Soins Intensifs', headOfDepartment: 'Dr. Talla Patrick', sortOrder: 6,
    wards: [
      { name: 'Réanimation Polyvalente', beds: 8, sortOrder: 1 },
      { name: 'Soins Intensifs Cardiologiques (USIC)', beds: 6, sortOrder: 2 }
    ]
  },
  {
    code: 'OPD', name: 'Consultations Externes', headOfDepartment: 'Dr. Abena Marie', sortOrder: 7,
    wards: [
      { name: 'Box Consultations Médecine', beds: 4, sortOrder: 1 },
      { name: 'Box Consultations Chirurgie', beds: 2, sortOrder: 2 },
      { name: 'Box Consultations Pédiatrie', beds: 3, sortOrder: 3 }
    ]
  },
  {
    code: 'LAB', name: 'Laboratoire', headOfDepartment: 'Tech. Samuel Bikoe', sortOrder: 8,
    wards: [
      { name: 'Bactériologie & Parasitologie', beds: 0, sortOrder: 1 },
      { name: 'Biochimie & Hématologie', beds: 0, sortOrder: 2 }
    ]
  },
  {
    code: 'IMAGING', name: 'Imagerie Médicale', headOfDepartment: 'Tech. Paul Bekolo', sortOrder: 9,
    wards: [
      { name: 'Radiologie Standard (RX)', beds: 0, sortOrder: 1 },
      { name: 'Échographie', beds: 0, sortOrder: 2 },
      { name: 'Scanner & IRM', beds: 0, sortOrder: 3 }
    ]
  },
  {
    code: 'PHARMACY', name: 'Pharmacie', headOfDepartment: 'Pharm. Jean Atangana', sortOrder: 10,
    wards: [
      { name: 'Dispensaire Principal', beds: 0, sortOrder: 1 },
      { name: 'Pharmacie de Garde (Urgences)', beds: 0, sortOrder: 2 }
    ]
  },
  {
    code: 'BILLING', name: 'Facturation & Caisse', headOfDepartment: 'Mme. Francoise Etoa', sortOrder: 11,
    wards: [
      { name: 'Guichet Principal Facturation', beds: 0, sortOrder: 1 },
      { name: 'Caisse Urgences', beds: 0, sortOrder: 2 }
    ]
  },
  {
    code: 'RECORDS', name: 'Archives & Dossiers Médicaux', headOfDepartment: 'M. Luc Onana', sortOrder: 12,
    wards: [
      { name: 'Bureau des Entrées & Admissions', beds: 0, sortOrder: 1 },
      { name: 'Archives Centrales', beds: 0, sortOrder: 2 }
    ]
  },
  {
    code: 'FRONT_DESK', name: 'Accueil & Orientation', headOfDepartment: 'Mme. Mireille Bella', sortOrder: 13,
    wards: [
      { name: 'Hall Principal & Standard', beds: 0, sortOrder: 1 }
    ]
  },
  {
    code: 'SOCIAL_WORK', name: 'Service Social', headOfDepartment: 'Mme. Jeanne Mballa', sortOrder: 14,
    wards: [
      { name: 'Bureau Accompagnement Social', beds: 0, sortOrder: 1 }
    ]
  }
]

async function main() {
  console.log('[SEED] Starting CameroHealth full system seeder...')

  const facilityCode = 'HGOPY'
  const facilityEmail = 'contact@hgopy.cm'
  const rawPassword = 'AdminPassword123!'

  // ── 1. Facility ─────────────────────────────────────────────────────────────
  let facility = await prisma.facility.findUnique({ where: { code: facilityCode } })
  if (!facility) {
    facility = await prisma.facility.create({
      data: {
        code: facilityCode,
        name: 'Hôpital Gynéco-Obstétrique et Pédiatrique de Yaoundé',
        region: 'Centre',
        city: 'Yaoundé',
        quarter: 'Ngousso',
        email: facilityEmail,
        phone: '+237 222 21 00 00',
        status: 'active'
      }
    })
    console.log('[SEED] ✅ Facility created:', facility.name)
  } else {
    console.log('[SEED] ℹ️  Facility exists:', facility.name)
  }

  // ── 2. Staff Profiles ────────────────────────────────────────────────────────
  const salt = await bcrypt.genSalt(12)
  const passwordHash = await bcrypt.hash(rawPassword, salt)

  const staffToCreate = [
    { staffCode: `${facilityCode}-ADM001`, fullName: 'Dr. Joseph Nkoa', email: 'admin@camerohealth.cm', role: 'ADMIN', department: 'Administration', position: 'Chief Medical Officer' },
    { staffCode: `${facilityCode}-DOC001`, fullName: 'Dr. Mbarga Alain', email: 'doctor@camerohealth.cm', role: 'DOCTOR', department: 'Urgences', position: 'Senior Emergency Physician' },
    { staffCode: `${facilityCode}-NUR001`, fullName: "Sr. Chantal Eto'o", email: 'nurse@camerohealth.cm', role: 'NURSE', department: 'Urgences', position: 'Registered Nurse' },
    { staffCode: `${facilityCode}-MAJ001`, fullName: 'Maj. Pauline Nguem', email: 'headnurse@camerohealth.cm', role: 'MAJOR_SERVICE', department: 'Médecine Interne', position: 'Major de Service' },
    { staffCode: `${facilityCode}-PHA001`, fullName: 'Pharm. Jean Atangana', email: 'pharmacy@camerohealth.cm', role: 'PHARMACY', department: 'Pharmacie', position: 'Chief Pharmacist' },
    { staffCode: `${facilityCode}-LAB001`, fullName: 'Tech. Samuel Bikoe', email: 'lab@camerohealth.cm', role: 'LAB', department: 'Laboratoire', position: 'Senior Lab Technologist' },
    { staffCode: `${facilityCode}-RAD001`, fullName: 'Tech. Paul Bekolo', email: 'imaging@camerohealth.cm', role: 'IMAGING', department: 'Imagerie Médicale', position: 'Radiology Technician' }
  ]

  const createdStaff = {}
  for (const item of staffToCreate) {
    let staff = await prisma.staffProfile.findFirst({ where: { email: item.email, facilityId: facility.id } })
    if (!staff) {
      staff = await prisma.staffProfile.create({ data: { ...item, passwordHash, facilityId: facility.id, status: 'active' } })
      console.log(`[SEED] ✅ Staff: ${staff.fullName} (${staff.staffCode})`)
    } else {
      await prisma.staffProfile.update({ where: { id: staff.id }, data: { passwordHash, staffCode: item.staffCode } })
      console.log(`[SEED] ℹ️  Staff exists: ${staff.fullName}`)
    }
    createdStaff[item.role] = staff
  }

  // ── 3. Hospital Model (Departments & Wards) ───────────────────────────────────
  console.log('[SEED] Seeding hospital model (departments & wards)...')
  for (const dept of DEFAULT_DEPARTMENTS) {
    let department = await prisma.department.findFirst({
      where: { facilityId: facility.id, code: dept.code }
    })
    if (!department) {
      department = await prisma.department.create({
        data: {
          facilityId: facility.id,
          code: dept.code,
          name: dept.name,
          headOfDepartment: dept.headOfDepartment,
          sortOrder: dept.sortOrder,
          status: 'Active'
        }
      })
      console.log(`[SEED] ✅ Department: ${department.name}`)
    } else {
      console.log(`[SEED] ℹ️  Department exists: ${department.name}`)
    }

    for (const ward of dept.wards) {
      const wardExists = await prisma.ward.findFirst({
        where: { departmentId: department.id, name: ward.name }
      })
      if (!wardExists) {
        await prisma.ward.create({
          data: {
            departmentId: department.id,
            name: ward.name,
            beds: ward.beds,
            sortOrder: ward.sortOrder,
            status: 'Active'
          }
        })
        console.log(`[SEED]    ↳ Ward: ${ward.name} (${ward.beds} beds)`)
      }
    }
  }

  // ── 4. Demo Patients ─────────────────────────────────────────────────────────
  const adminUser = createdStaff['ADMIN']
  const patientsToCreate = [
    { firstName: 'Jean-Luc', lastName: 'Mbah', gender: 'Male', dateOfBirth: new Date('1992-05-14'), phone: '+237 677 12 34 56', email: 'jeanluc.mbah@gmail.com', address: 'Biyem-Assi, Yaoundé', bloodType: 'O+', allergies: 'Penicillin' },
    { firstName: 'Therese', lastName: 'Ngo Ondoa', gender: 'Female', dateOfBirth: new Date('1998-11-20'), phone: '+237 699 88 77 66', email: 'therese.ondoa@yahoo.fr', address: 'Bastos, Yaoundé', bloodType: 'A+', allergies: 'None' },
    { firstName: 'Marc', lastName: 'Ekwalla', gender: 'Male', dateOfBirth: new Date('1981-03-08'), phone: '+237 655 44 33 22', email: 'm.ekwalla@gmail.com', address: 'Omnisports, Yaoundé', bloodType: 'B+', allergies: 'Sulfa drugs' }
  ]

  for (let i = 0; i < patientsToCreate.length; i++) {
    const mrn = `${facilityCode}-${String(i + 1).padStart(6, '0')}`
    const existing = await prisma.patient.findFirst({ where: { mrn, facilityId: facility.id } })
    if (!existing) {
      await prisma.patient.create({ data: { mrn, ...patientsToCreate[i], facilityId: facility.id, createdById: adminUser.id } })
      console.log(`[SEED] ✅ Patient: ${patientsToCreate[i].firstName} ${patientsToCreate[i].lastName} (${mrn})`)
    }
  }

  // ── 5. Seed Price Catalog ───────────────────────────────────────────────────
  console.log('[SEED] Seeding default price catalog...')
  const existingCount = await prisma.priceCatalog.count({ where: { facilityId: facility.id } })
  if (existingCount === 0) {
    const catalogRecords = []
    for (const [section, items] of Object.entries(DEFAULT_CATALOG)) {
      for (const item of items) {
        catalogRecords.push({
          facilityId: facility.id,
          section,
          category: item.category || section,
          name: item.name,
          unitPrice: item.unitPrice || 0,
          costPrice: item.costPrice || 0,
          minPrice: item.minPrice || null,
          maxPrice: item.maxPrice || null,
          department: item.department || null,
          ward: item.ward || null,
          aliases: item.aliases || [],
          active: item.active !== false
        })
      }
    }
    await prisma.priceCatalog.createMany({
      data: catalogRecords,
      skipDuplicates: true
    })
    console.log(`[SEED] ✅ Seeded ${catalogRecords.length} default price catalog items.`)
  } else {
    console.log(`[SEED] ℹ️  Price catalog is already seeded (${existingCount} items).`)
  }

  // ── 6. Seed an initial Audit Log entry ──────────────────────────────────────
  const auditCount = await prisma.auditLog.count({ where: { facilityId: facility.id } })
  if (auditCount === 0) {
    await prisma.auditLog.create({
      data: {
        facilityId: facility.id,
        action: 'FACILITY_REGISTERED',
        actorId: adminUser.id,
        detail: `Facility ${facility.name} (${facility.code}) registered and seeded on CameroHealth`
      }
    })
    console.log('[SEED] ✅ Initial audit log entry created')
  }

  console.log('\n[SEED] 🎉 System Seeding Completed Successfully!')
  console.log(`[SEED] Default password for all staff: ${rawPassword}`)
}

main()
  .catch((e) => {
    console.error('[SEED FAILED]', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
