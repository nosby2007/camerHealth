-- AlterTable
ALTER TABLE "clinical_notes" ADD COLUMN     "amendments" JSONB,
ADD COLUMN     "shared_at" TIMESTAMP(3),
ADD COLUMN     "shared_by_id" TEXT,
ADD COLUMN     "shared_with_care_team" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "structured_data" JSONB;

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "related_type" TEXT,
    "related_id" TEXT,
    "title" TEXT NOT NULL,
    "assigned_to_role" TEXT NOT NULL,
    "assigned_to_id" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'Routine',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "due_at" TIMESTAMP(3),
    "frequency" TEXT,
    "action_reason" TEXT,
    "history" JSONB,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_team_members" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "service" TEXT,
    "contact" TEXT,
    "responsibility" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "note" TEXT,
    "added_by_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_at" TIMESTAMP(3),

    CONSTRAINT "care_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_assessments" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "finding" TEXT,
    "intervention" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "follow_up_at" TIMESTAMP(3),
    "assessed_by_id" TEXT NOT NULL,
    "assessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_patient_id_idx" ON "tasks"("patient_id");

-- CreateIndex
CREATE INDEX "tasks_facility_id_idx" ON "tasks"("facility_id");

-- CreateIndex
CREATE INDEX "tasks_assigned_to_role_idx" ON "tasks"("assigned_to_role");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "care_team_members_patient_id_idx" ON "care_team_members"("patient_id");

-- CreateIndex
CREATE INDEX "care_team_members_facility_id_idx" ON "care_team_members"("facility_id");

-- CreateIndex
CREATE INDEX "social_assessments_patient_id_idx" ON "social_assessments"("patient_id");

-- CreateIndex
CREATE INDEX "social_assessments_facility_id_idx" ON "social_assessments"("facility_id");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_team_members" ADD CONSTRAINT "care_team_members_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_team_members" ADD CONSTRAINT "care_team_members_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_team_members" ADD CONSTRAINT "care_team_members_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_assessments" ADD CONSTRAINT "social_assessments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_assessments" ADD CONSTRAINT "social_assessments_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_assessments" ADD CONSTRAINT "social_assessments_assessed_by_id_fkey" FOREIGN KEY ("assessed_by_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
