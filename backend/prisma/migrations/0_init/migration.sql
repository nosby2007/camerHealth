-- CreateTable
CREATE TABLE "facilities" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "quarter" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "organization_id" TEXT,
    "organization_unit_id" TEXT,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profiles" (
    "id" TEXT NOT NULL,
    "auth_user_id" TEXT,
    "staff_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT,
    "service" TEXT,
    "specialty" TEXT,
    "position" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "password_hash" TEXT,
    "facility_id" TEXT NOT NULL,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "mrn" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "country" TEXT,
    "blood_type" TEXT,
    "allergies" TEXT,
    "medical_history" TEXT,
    "surgical_history" TEXT,
    "family_history" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "patient_status" TEXT,
    "external_id" TEXT,
    "patient_type" TEXT,
    "payment_profile" TEXT,
    "acuity_level" TEXT,
    "department_routing" TEXT,
    "service_routing" TEXT,
    "specialty_routing" TEXT,
    "visit_reason" TEXT,
    "phi_access_basis" TEXT,
    "consent_status" TEXT,
    "insurance_provider" TEXT,
    "policy_number" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_relationship" TEXT,
    "emergency_contact_phone" TEXT,
    "metadata" JSONB,
    "facility_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "encounter_type" TEXT NOT NULL,
    "chief_complaint" TEXT,
    "triage_level" TEXT,
    "severity" TEXT,
    "clinical_status" TEXT,
    "disease" TEXT,
    "symptoms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "symptom_text" TEXT,
    "diagnosis" TEXT,
    "lab_results" TEXT,
    "imaging_notes" TEXT,
    "prescription" TEXT,
    "treatment_plan" TEXT,
    "notes" TEXT,
    "past_history" JSONB,
    "physical_exam" JSONB,
    "vitals" JSONB,
    "conclusion" TEXT,
    "admission_ward" TEXT,
    "admission_reason" TEXT,
    "referral_target" TEXT,
    "attending_doctor_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "recorded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_orders" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "test" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Routine',
    "status" TEXT NOT NULL DEFAULT 'Requested',
    "result" TEXT,
    "notes" TEXT,
    "requested_by_id" TEXT NOT NULL,
    "completed_by_id" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imaging_orders" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "exam" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Routine',
    "status" TEXT NOT NULL DEFAULT 'Requested',
    "result" TEXT,
    "notes" TEXT,
    "image_path" TEXT,
    "image_url" TEXT,
    "image_name" TEXT,
    "image_mime_type" TEXT,
    "image_uploaded_at" TIMESTAMP(3),
    "image_uploaded_by_id" TEXT,
    "requested_by_id" TEXT NOT NULL,
    "completed_by_id" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imaging_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "drug" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "route" TEXT,
    "duration" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "dispensing_status" TEXT NOT NULL DEFAULT 'Pending',
    "payment_status" TEXT NOT NULL DEFAULT 'Unpaid',
    "in_stock" BOOLEAN,
    "qty_dispensed" INTEGER,
    "dispensed_by" TEXT,
    "dispensed_at" TIMESTAMP(3),
    "pharmacist_notes" TEXT,
    "notes" TEXT,
    "prescribed_by_id" TEXT NOT NULL,
    "prescribed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "notes" TEXT,
    "provider_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inpatients" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "ward" TEXT NOT NULL,
    "bed_number" TEXT,
    "admission_type" TEXT,
    "admission_reason" TEXT,
    "diagnosis" TEXT,
    "treatment_plan" TEXT,
    "attending_doctor_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Admitted',
    "admitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discharged_at" TIMESTAMP(3),
    "discharge_summary" TEXT,
    "admitted_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inpatients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Unpaid',
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "issued_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charges" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "department_source" TEXT,
    "source_type" TEXT,
    "source_id" TEXT,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "total" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "cashier" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clearances" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "service_type" TEXT NOT NULL,
    "department" TEXT,
    "clearance_code" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "issued_by" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "clearances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "facility_id" TEXT,
    "organization_id" TEXT,
    "organization_unit_id" TEXT,
    "action" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "target_id" TEXT,
    "detail" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "head_of_department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wards" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "beds" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_catalog" (
    "id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "cost_price" DOUBLE PRECISION DEFAULT 0,
    "min_price" DOUBLE PRECISION,
    "max_price" DOUBLE PRECISION,
    "department" TEXT,
    "ward" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flowsheet_columns" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "encounter_id" TEXT,
    "facility_id" TEXT NOT NULL,
    "label" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "filed_at" TIMESTAMP(3),
    "filed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flowsheet_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flowsheet_cells" (
    "id" TEXT NOT NULL,
    "row_id" TEXT NOT NULL,
    "column_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "encounter_id" TEXT,
    "facility_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "display_value" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "documented_at" TIMESTAMP(3) NOT NULL,
    "documented_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flowsheet_cells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flowsheet_corrections" (
    "id" TEXT NOT NULL,
    "original_cell_id" TEXT NOT NULL,
    "row_id" TEXT NOT NULL,
    "column_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "encounter_id" TEXT,
    "facility_id" TEXT NOT NULL,
    "new_value" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "corrected_at" TIMESTAMP(3) NOT NULL,
    "corrected_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flowsheet_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wounds" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wound_assessments" (
    "id" TEXT NOT NULL,
    "wound_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "length_cm" DOUBLE PRECISION,
    "width_cm" DOUBLE PRECISION,
    "depth_cm" DOUBLE PRECISION,
    "surface_area" DOUBLE PRECISION,
    "volume" DOUBLE PRECISION,
    "warning_area_increased" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "assessed_at" TIMESTAMP(3) NOT NULL,
    "assessed_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wound_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wound_photos" (
    "id" TEXT NOT NULL,
    "wound_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "image_url" TEXT,
    "image_path" TEXT,
    "taken_at" TIMESTAMP(3) NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wound_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_plans" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "encounter_id" TEXT,
    "admission_id" TEXT,
    "facility_id" TEXT NOT NULL,
    "name" TEXT,
    "title" TEXT,
    "type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_plan_problems" (
    "id" TEXT NOT NULL,
    "care_plan_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "diagnosis" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_plan_problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_plan_goals" (
    "id" TEXT NOT NULL,
    "problem_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "expected_end_date" TIMESTAMP(3),
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "timeline" TEXT,
    "last_progress_status" TEXT,
    "last_documented_at" TIMESTAMP(3),
    "last_documented_by_id" TEXT,
    "status_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_plan_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_plan_outcomes" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "label" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT,
    "status_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_plan_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_plan_progress_entries" (
    "id" TEXT NOT NULL,
    "care_plan_id" TEXT NOT NULL,
    "problem_id" TEXT,
    "goal_id" TEXT,
    "outcome_id" TEXT,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "progress_status" TEXT NOT NULL,
    "comment" TEXT,
    "documented_by_id" TEXT NOT NULL,
    "documented_by_role" TEXT,
    "documented_at" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "care_plan_progress_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_plan_reviews" (
    "id" TEXT NOT NULL,
    "care_plan_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "reviewed_by_id" TEXT NOT NULL,
    "reviewed_at" TIMESTAMP(3) NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "care_plan_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_titles" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "encounter_id" TEXT,
    "facility_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_points" (
    "id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "encounter_id" TEXT,
    "admission_id" TEXT,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "topic" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "required_learners" JSONB,
    "material_ids" JSONB,
    "linked_problem_ids" JSONB,
    "linked_order_ids" JSONB,
    "linked_medication_ids" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "system_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_documentation" (
    "id" TEXT NOT NULL,
    "point_id" TEXT NOT NULL,
    "title_id" TEXT,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "learners" JSONB,
    "readiness" TEXT,
    "methods" JSONB,
    "responses" JSONB,
    "comment" TEXT,
    "teaching_completed" BOOLEAN NOT NULL DEFAULT false,
    "family_education" BOOLEAN,
    "next_review_at" TIMESTAMP(3),
    "taught_by_id" TEXT NOT NULL,
    "taught_by_role" TEXT,
    "taught_at" TIMESTAMP(3) NOT NULL,
    "filed_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'filed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_documentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_materials" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'French',
    "format" TEXT NOT NULL DEFAULT 'Verbal + printed',
    "instructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_assignments" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "added_to_avs" BOOLEAN NOT NULL DEFAULT true,
    "added_by_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL,
    "removed_at" TIMESTAMP(3),
    "removed_by_id" TEXT,

    CONSTRAINT "material_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_comments" (
    "id" TEXT NOT NULL,
    "point_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "commented_by_id" TEXT NOT NULL,
    "commented_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discharge_plans" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "admission_id" TEXT,
    "facility_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discharge_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discharge_milestones" (
    "id" TEXT NOT NULL,
    "discharge_plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "owner" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "due_label" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discharge_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discharge_follow_ups" (
    "id" TEXT NOT NULL,
    "discharge_plan_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discharge_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vital_signs" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "bp" TEXT,
    "hr" INTEGER,
    "rr" INTEGER,
    "temp" DOUBLE PRECISION,
    "spo2" INTEGER,
    "glucose" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "gcs_e" INTEGER,
    "gcs_v" INTEGER,
    "gcs_m" INTEGER,
    "pain" INTEGER,
    "recorded_by_id" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vital_signs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_notes" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "encounter_id" TEXT,
    "note_type" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "author_role" TEXT,
    "created_by_id" TEXT NOT NULL,
    "signed_at" TIMESTAMP(3),
    "signed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "organization_code" TEXT,
    "name" TEXT NOT NULL,
    "organization_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "dhis_base_url" TEXT,
    "dhis_username" TEXT,
    "dhis_password_encrypted" TEXT,
    "dhis_org_unit_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dhis_indicator_mappings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "indicator_key" TEXT NOT NULL,
    "dhis_data_element_id" TEXT NOT NULL,
    "dhis_category_option_combo_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dhis_indicator_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_units" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "parent_unit_id" TEXT,
    "unit_code" TEXT,
    "name" TEXT NOT NULL,
    "unit_type" TEXT NOT NULL,
    "hierarchy_level" INTEGER NOT NULL DEFAULT 0,
    "region" TEXT,
    "city" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_assignments" (
    "id" TEXT NOT NULL,
    "staff_profile_id" TEXT NOT NULL,
    "assignment_role" TEXT NOT NULL,
    "assignment_scope" TEXT NOT NULL,
    "organization_id" TEXT,
    "organization_unit_id" TEXT,
    "facility_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "assigned_by_staff_id" TEXT,
    "assigned_reason" TEXT,
    "start_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_activity_reports" (
    "id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "organization_unit_id" TEXT,
    "report_month" INTEGER NOT NULL,
    "report_year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "indicators" JSONB NOT NULL,
    "submitted_by_id" TEXT,
    "submitted_at" TIMESTAMP(3),
    "validated_by_id" TEXT,
    "validated_at" TIMESTAMP(3),
    "validation_notes" TEXT,
    "rejected_by_id" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "dhis_synced_at" TIMESTAMP(3),
    "dhis_sync_status" TEXT,
    "dhis_sync_detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_activity_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "organization_name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "facility_type" TEXT,
    "region" TEXT,
    "city" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "estimated_value" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "quote_amount" DOUBLE PRECISION,
    "quote_sent_at" TIMESTAMP(3),
    "contract_value" DOUBLE PRECISION,
    "contract_signed_at" TIMESTAMP(3),
    "renewal_date" TIMESTAMP(3),
    "lost_reason" TEXT,
    "assigned_to_staff_id" TEXT,
    "converted_facility_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "body" TEXT,
    "from_stage" TEXT,
    "to_stage" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobile_money_requests" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "provider" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "external_reference_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "status_detail" TEXT,
    "paid_charge_ids" JSONB,
    "completed_payment_id" TEXT,
    "requested_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_money_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facilities_code_key" ON "facilities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "facilities_email_key" ON "facilities"("email");

-- CreateIndex
CREATE INDEX "facilities_organization_id_idx" ON "facilities"("organization_id");

-- CreateIndex
CREATE INDEX "facilities_organization_unit_id_idx" ON "facilities"("organization_unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_auth_user_id_key" ON "staff_profiles"("auth_user_id");

-- CreateIndex
CREATE INDEX "staff_profiles_facility_id_idx" ON "staff_profiles"("facility_id");

-- CreateIndex
CREATE INDEX "staff_profiles_role_idx" ON "staff_profiles"("role");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_staff_code_facility_id_key" ON "staff_profiles"("staff_code", "facility_id");

-- CreateIndex
CREATE INDEX "patients_facility_id_idx" ON "patients"("facility_id");

-- CreateIndex
CREATE INDEX "patients_first_name_last_name_idx" ON "patients"("first_name", "last_name");

-- CreateIndex
CREATE INDEX "patients_department_routing_idx" ON "patients"("department_routing");

-- CreateIndex
CREATE UNIQUE INDEX "patients_mrn_facility_id_key" ON "patients"("mrn", "facility_id");

-- CreateIndex
CREATE INDEX "visits_patient_id_idx" ON "visits"("patient_id");

-- CreateIndex
CREATE INDEX "visits_facility_id_idx" ON "visits"("facility_id");

-- CreateIndex
CREATE INDEX "visits_created_at_idx" ON "visits"("created_at");

-- CreateIndex
CREATE INDEX "lab_orders_patient_id_idx" ON "lab_orders"("patient_id");

-- CreateIndex
CREATE INDEX "lab_orders_facility_id_idx" ON "lab_orders"("facility_id");

-- CreateIndex
CREATE INDEX "lab_orders_status_idx" ON "lab_orders"("status");

-- CreateIndex
CREATE INDEX "imaging_orders_patient_id_idx" ON "imaging_orders"("patient_id");

-- CreateIndex
CREATE INDEX "imaging_orders_facility_id_idx" ON "imaging_orders"("facility_id");

-- CreateIndex
CREATE INDEX "imaging_orders_status_idx" ON "imaging_orders"("status");

-- CreateIndex
CREATE INDEX "medications_patient_id_idx" ON "medications"("patient_id");

-- CreateIndex
CREATE INDEX "medications_facility_id_idx" ON "medications"("facility_id");

-- CreateIndex
CREATE INDEX "appointments_patient_id_idx" ON "appointments"("patient_id");

-- CreateIndex
CREATE INDEX "appointments_facility_id_idx" ON "appointments"("facility_id");

-- CreateIndex
CREATE INDEX "appointments_date_idx" ON "appointments"("date");

-- CreateIndex
CREATE INDEX "inpatients_patient_id_idx" ON "inpatients"("patient_id");

-- CreateIndex
CREATE INDEX "inpatients_facility_id_idx" ON "inpatients"("facility_id");

-- CreateIndex
CREATE INDEX "inpatients_status_idx" ON "inpatients"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_patient_id_idx" ON "invoices"("patient_id");

-- CreateIndex
CREATE INDEX "invoices_facility_id_idx" ON "invoices"("facility_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "charges_invoice_id_idx" ON "charges"("invoice_id");

-- CreateIndex
CREATE INDEX "charges_patient_id_idx" ON "charges"("patient_id");

-- CreateIndex
CREATE INDEX "charges_facility_id_idx" ON "charges"("facility_id");

-- CreateIndex
CREATE INDEX "charges_source_type_source_id_idx" ON "charges"("source_type", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_receipt_number_key" ON "payments"("receipt_number");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_patient_id_idx" ON "payments"("patient_id");

-- CreateIndex
CREATE INDEX "payments_facility_id_idx" ON "payments"("facility_id");

-- CreateIndex
CREATE UNIQUE INDEX "clearances_clearance_code_key" ON "clearances"("clearance_code");

-- CreateIndex
CREATE INDEX "clearances_patient_id_idx" ON "clearances"("patient_id");

-- CreateIndex
CREATE INDEX "clearances_facility_id_idx" ON "clearances"("facility_id");

-- CreateIndex
CREATE INDEX "clearances_service_type_idx" ON "clearances"("service_type");

-- CreateIndex
CREATE INDEX "audit_logs_facility_id_idx" ON "audit_logs"("facility_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "departments_facility_id_idx" ON "departments"("facility_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_facility_id_code_key" ON "departments"("facility_id", "code");

-- CreateIndex
CREATE INDEX "wards_department_id_idx" ON "wards"("department_id");

-- CreateIndex
CREATE INDEX "price_catalog_facility_id_idx" ON "price_catalog"("facility_id");

-- CreateIndex
CREATE INDEX "price_catalog_section_idx" ON "price_catalog"("section");

-- CreateIndex
CREATE INDEX "flowsheet_columns_patient_id_idx" ON "flowsheet_columns"("patient_id");

-- CreateIndex
CREATE INDEX "flowsheet_columns_facility_id_idx" ON "flowsheet_columns"("facility_id");

-- CreateIndex
CREATE INDEX "flowsheet_cells_column_id_idx" ON "flowsheet_cells"("column_id");

-- CreateIndex
CREATE INDEX "flowsheet_cells_patient_id_idx" ON "flowsheet_cells"("patient_id");

-- CreateIndex
CREATE INDEX "flowsheet_cells_row_id_idx" ON "flowsheet_cells"("row_id");

-- CreateIndex
CREATE INDEX "flowsheet_corrections_original_cell_id_idx" ON "flowsheet_corrections"("original_cell_id");

-- CreateIndex
CREATE INDEX "flowsheet_corrections_patient_id_idx" ON "flowsheet_corrections"("patient_id");

-- CreateIndex
CREATE INDEX "wounds_patient_id_idx" ON "wounds"("patient_id");

-- CreateIndex
CREATE INDEX "wounds_facility_id_idx" ON "wounds"("facility_id");

-- CreateIndex
CREATE INDEX "wound_assessments_wound_id_idx" ON "wound_assessments"("wound_id");

-- CreateIndex
CREATE INDEX "wound_assessments_patient_id_idx" ON "wound_assessments"("patient_id");

-- CreateIndex
CREATE INDEX "wound_photos_wound_id_idx" ON "wound_photos"("wound_id");

-- CreateIndex
CREATE INDEX "wound_photos_patient_id_idx" ON "wound_photos"("patient_id");

-- CreateIndex
CREATE INDEX "care_plans_patient_id_idx" ON "care_plans"("patient_id");

-- CreateIndex
CREATE INDEX "care_plans_facility_id_idx" ON "care_plans"("facility_id");

-- CreateIndex
CREATE INDEX "care_plan_problems_care_plan_id_idx" ON "care_plan_problems"("care_plan_id");

-- CreateIndex
CREATE INDEX "care_plan_problems_patient_id_idx" ON "care_plan_problems"("patient_id");

-- CreateIndex
CREATE INDEX "care_plan_goals_problem_id_idx" ON "care_plan_goals"("problem_id");

-- CreateIndex
CREATE INDEX "care_plan_goals_patient_id_idx" ON "care_plan_goals"("patient_id");

-- CreateIndex
CREATE INDEX "care_plan_outcomes_goal_id_idx" ON "care_plan_outcomes"("goal_id");

-- CreateIndex
CREATE INDEX "care_plan_outcomes_patient_id_idx" ON "care_plan_outcomes"("patient_id");

-- CreateIndex
CREATE INDEX "care_plan_progress_entries_care_plan_id_idx" ON "care_plan_progress_entries"("care_plan_id");

-- CreateIndex
CREATE INDEX "care_plan_progress_entries_patient_id_idx" ON "care_plan_progress_entries"("patient_id");

-- CreateIndex
CREATE INDEX "care_plan_reviews_care_plan_id_idx" ON "care_plan_reviews"("care_plan_id");

-- CreateIndex
CREATE INDEX "education_titles_patient_id_idx" ON "education_titles"("patient_id");

-- CreateIndex
CREATE INDEX "education_titles_facility_id_idx" ON "education_titles"("facility_id");

-- CreateIndex
CREATE INDEX "education_points_title_id_idx" ON "education_points"("title_id");

-- CreateIndex
CREATE INDEX "education_points_patient_id_idx" ON "education_points"("patient_id");

-- CreateIndex
CREATE INDEX "education_documentation_point_id_idx" ON "education_documentation"("point_id");

-- CreateIndex
CREATE INDEX "education_documentation_patient_id_idx" ON "education_documentation"("patient_id");

-- CreateIndex
CREATE INDEX "patient_materials_patient_id_idx" ON "patient_materials"("patient_id");

-- CreateIndex
CREATE INDEX "material_assignments_patient_id_idx" ON "material_assignments"("patient_id");

-- CreateIndex
CREATE INDEX "material_assignments_material_id_idx" ON "material_assignments"("material_id");

-- CreateIndex
CREATE INDEX "education_comments_point_id_idx" ON "education_comments"("point_id");

-- CreateIndex
CREATE INDEX "discharge_plans_patient_id_idx" ON "discharge_plans"("patient_id");

-- CreateIndex
CREATE INDEX "discharge_plans_facility_id_idx" ON "discharge_plans"("facility_id");

-- CreateIndex
CREATE INDEX "discharge_milestones_discharge_plan_id_idx" ON "discharge_milestones"("discharge_plan_id");

-- CreateIndex
CREATE INDEX "discharge_follow_ups_discharge_plan_id_idx" ON "discharge_follow_ups"("discharge_plan_id");

-- CreateIndex
CREATE INDEX "discharge_follow_ups_kind_idx" ON "discharge_follow_ups"("kind");

-- CreateIndex
CREATE INDEX "vital_signs_patient_id_idx" ON "vital_signs"("patient_id");

-- CreateIndex
CREATE INDEX "vital_signs_facility_id_idx" ON "vital_signs"("facility_id");

-- CreateIndex
CREATE INDEX "vital_signs_recorded_at_idx" ON "vital_signs"("recorded_at");

-- CreateIndex
CREATE INDEX "clinical_notes_patient_id_idx" ON "clinical_notes"("patient_id");

-- CreateIndex
CREATE INDEX "clinical_notes_facility_id_idx" ON "clinical_notes"("facility_id");

-- CreateIndex
CREATE INDEX "clinical_notes_note_type_idx" ON "clinical_notes"("note_type");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_organization_code_key" ON "organizations"("organization_code");

-- CreateIndex
CREATE UNIQUE INDEX "dhis_indicator_mappings_organization_id_indicator_key_key" ON "dhis_indicator_mappings"("organization_id", "indicator_key");

-- CreateIndex
CREATE INDEX "organization_units_organization_id_parent_unit_id_idx" ON "organization_units"("organization_id", "parent_unit_id");

-- CreateIndex
CREATE INDEX "organization_units_unit_type_idx" ON "organization_units"("unit_type");

-- CreateIndex
CREATE UNIQUE INDEX "organization_units_organization_id_unit_code_key" ON "organization_units"("organization_id", "unit_code");

-- CreateIndex
CREATE INDEX "staff_assignments_staff_profile_id_status_idx" ON "staff_assignments"("staff_profile_id", "status");

-- CreateIndex
CREATE INDEX "staff_assignments_assignment_scope_status_idx" ON "staff_assignments"("assignment_scope", "status");

-- CreateIndex
CREATE INDEX "monthly_activity_reports_organization_unit_id_report_month__idx" ON "monthly_activity_reports"("organization_unit_id", "report_month", "report_year");

-- CreateIndex
CREATE INDEX "monthly_activity_reports_status_idx" ON "monthly_activity_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_activity_reports_facility_id_report_month_report_ye_key" ON "monthly_activity_reports"("facility_id", "report_month", "report_year");

-- CreateIndex
CREATE INDEX "leads_stage_idx" ON "leads"("stage");

-- CreateIndex
CREATE INDEX "leads_region_idx" ON "leads"("region");

-- CreateIndex
CREATE INDEX "lead_activities_lead_id_idx" ON "lead_activities"("lead_id");

-- CreateIndex
CREATE INDEX "mobile_money_requests_patient_id_idx" ON "mobile_money_requests"("patient_id");

-- CreateIndex
CREATE INDEX "mobile_money_requests_facility_id_idx" ON "mobile_money_requests"("facility_id");

-- CreateIndex
CREATE INDEX "mobile_money_requests_external_reference_id_idx" ON "mobile_money_requests"("external_reference_id");

-- AddForeignKey
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_organization_unit_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_attending_doctor_id_fkey" FOREIGN KEY ("attending_doctor_id") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imaging_orders" ADD CONSTRAINT "imaging_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imaging_orders" ADD CONSTRAINT "imaging_orders_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imaging_orders" ADD CONSTRAINT "imaging_orders_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imaging_orders" ADD CONSTRAINT "imaging_orders_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_prescribed_by_id_fkey" FOREIGN KEY ("prescribed_by_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inpatients" ADD CONSTRAINT "inpatients_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inpatients" ADD CONSTRAINT "inpatients_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inpatients" ADD CONSTRAINT "inpatients_admitted_by_id_fkey" FOREIGN KEY ("admitted_by_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inpatients" ADD CONSTRAINT "inpatients_attending_doctor_id_fkey" FOREIGN KEY ("attending_doctor_id") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_issued_by_id_fkey" FOREIGN KEY ("issued_by_id") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clearances" ADD CONSTRAINT "clearances_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clearances" ADD CONSTRAINT "clearances_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wards" ADD CONSTRAINT "wards_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_catalog" ADD CONSTRAINT "price_catalog_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flowsheet_columns" ADD CONSTRAINT "flowsheet_columns_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flowsheet_columns" ADD CONSTRAINT "flowsheet_columns_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flowsheet_cells" ADD CONSTRAINT "flowsheet_cells_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "flowsheet_columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flowsheet_corrections" ADD CONSTRAINT "flowsheet_corrections_original_cell_id_fkey" FOREIGN KEY ("original_cell_id") REFERENCES "flowsheet_cells"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wounds" ADD CONSTRAINT "wounds_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wounds" ADD CONSTRAINT "wounds_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wound_assessments" ADD CONSTRAINT "wound_assessments_wound_id_fkey" FOREIGN KEY ("wound_id") REFERENCES "wounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wound_photos" ADD CONSTRAINT "wound_photos_wound_id_fkey" FOREIGN KEY ("wound_id") REFERENCES "wounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_plans" ADD CONSTRAINT "care_plans_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_plans" ADD CONSTRAINT "care_plans_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_plan_problems" ADD CONSTRAINT "care_plan_problems_care_plan_id_fkey" FOREIGN KEY ("care_plan_id") REFERENCES "care_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_plan_goals" ADD CONSTRAINT "care_plan_goals_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "care_plan_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "care_plan_outcomes" ADD CONSTRAINT "care_plan_outcomes_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "care_plan_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_titles" ADD CONSTRAINT "education_titles_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_titles" ADD CONSTRAINT "education_titles_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_points" ADD CONSTRAINT "education_points_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "education_titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_documentation" ADD CONSTRAINT "education_documentation_point_id_fkey" FOREIGN KEY ("point_id") REFERENCES "education_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_assignments" ADD CONSTRAINT "material_assignments_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "patient_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discharge_plans" ADD CONSTRAINT "discharge_plans_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discharge_plans" ADD CONSTRAINT "discharge_plans_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discharge_milestones" ADD CONSTRAINT "discharge_milestones_discharge_plan_id_fkey" FOREIGN KEY ("discharge_plan_id") REFERENCES "discharge_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discharge_follow_ups" ADD CONSTRAINT "discharge_follow_ups_discharge_plan_id_fkey" FOREIGN KEY ("discharge_plan_id") REFERENCES "discharge_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_notes" ADD CONSTRAINT "clinical_notes_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dhis_indicator_mappings" ADD CONSTRAINT "dhis_indicator_mappings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_parent_unit_id_fkey" FOREIGN KEY ("parent_unit_id") REFERENCES "organization_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_staff_profile_id_fkey" FOREIGN KEY ("staff_profile_id") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_organization_unit_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_activity_reports" ADD CONSTRAINT "monthly_activity_reports_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

