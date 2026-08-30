-- AlterTable
ALTER TABLE "medications" ADD COLUMN     "education" TEXT,
ADD COLUMN     "form" TEXT,
ADD COLUMN     "priority" TEXT DEFAULT 'Routine',
ADD COLUMN     "side_effects" TEXT,
ADD COLUMN     "therapeutic_class" TEXT;

-- CreateTable
CREATE TABLE "medication_administrations" (
    "id" TEXT NOT NULL,
    "medication_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "administered_at" TIMESTAMP(3),
    "administered_by_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Due',
    "route" TEXT,
    "dose_given" TEXT,
    "site" TEXT,
    "lot_number" TEXT,
    "patient_response" TEXT,
    "refusal_reason" TEXT,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_administrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medication_administrations_medication_id_idx" ON "medication_administrations"("medication_id");

-- CreateIndex
CREATE INDEX "medication_administrations_patient_id_idx" ON "medication_administrations"("patient_id");

-- CreateIndex
CREATE INDEX "medication_administrations_facility_id_idx" ON "medication_administrations"("facility_id");

-- CreateIndex
CREATE INDEX "medication_administrations_scheduled_for_idx" ON "medication_administrations"("scheduled_for");

-- AddForeignKey
ALTER TABLE "medication_administrations" ADD CONSTRAINT "medication_administrations_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "medications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_administrations" ADD CONSTRAINT "medication_administrations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_administrations" ADD CONSTRAINT "medication_administrations_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_administrations" ADD CONSTRAINT "medication_administrations_administered_by_id_fkey" FOREIGN KEY ("administered_by_id") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
