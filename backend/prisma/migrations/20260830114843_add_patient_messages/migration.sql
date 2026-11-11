-- CreateTable
CREATE TABLE "patient_messages" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_messages_patient_id_idx" ON "patient_messages"("patient_id");

-- CreateIndex
CREATE INDEX "patient_messages_facility_id_idx" ON "patient_messages"("facility_id");

-- AddForeignKey
ALTER TABLE "patient_messages" ADD CONSTRAINT "patient_messages_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_messages" ADD CONSTRAINT "patient_messages_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_messages" ADD CONSTRAINT "patient_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

