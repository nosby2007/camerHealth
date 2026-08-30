-- Align the column name with the vocabulary already used everywhere in the
-- frontend (medicationClass), rather than the therapeuticClass name first
-- chosen when the column was added moments ago in the same feature.
ALTER TABLE "medications" RENAME COLUMN "therapeutic_class" TO "medication_class";
