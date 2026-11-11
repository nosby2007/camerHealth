-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "discharge_disposition" TEXT,
ADD COLUMN     "discharge_reason" TEXT,
ADD COLUMN     "discharged_at" TIMESTAMP(3),
ADD COLUMN     "discharged_by" TEXT;

