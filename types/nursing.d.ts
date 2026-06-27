export type ClinicalMarkerType =
  | 'wound'
  | 'pressure_injury'
  | 'surgical_incision'
  | 'iv_line'
  | 'peg_tube'
  | 'foley_catheter'
  | 'trach'
  | 'ostomy'
  | 'drain'
  | 'rash'
  | 'bruise'
  | 'edema'
  | 'pain_point'

export type BodyViewType = 'anterior' | 'posterior' | 'left_lateral' | 'right_lateral'
export type NursingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'refused' | 'missed' | 'cancelled'
export type ClinicalNoteStatus = 'draft' | 'signed' | 'amended'
export type ClinicalNoteType = 'nursing_note' | 'wound_note' | 'progress_note' | 'incident_note' | 'provider_notification' | 'discharge_note'

export interface BodyMapMarker {
  id: string
  facilityId: string
  patientId: string
  xPosition: number
  yPosition: number
  bodyRegion: string
  laterality?: 'left' | 'right' | 'midline' | 'bilateral'
  viewType: BodyViewType
  markerType: ClinicalMarkerType
  severity: 'low' | 'moderate' | 'high' | 'critical'
  status: 'active' | 'resolved' | 'monitoring'
  linkedEntityType?: string
  linkedEntityId?: string
}

export interface Wound {
  id: string
  facilityId: string
  patientId: string
  woundType: string
  anatomicalLocation: string
  laterality?: string
  classification?: string
  status: string
  onsetDate?: string
  acquiredLocation?: string
  providerNotified?: boolean
  followUpDate?: string
}

export interface WoundAssessment {
  id: string
  woundId: string
  patientId: string
  lengthCm: number
  widthCm: number
  depthCm?: number
  surfaceArea: number
  volume?: number | null
  undermining?: string
  tunneling?: string
  tissueTypes?: string[]
  drainageAmount?: string
  drainageType?: string
  odor?: string
  periwoundCondition?: string
  painScore?: number
  infectionSigns?: string[]
  treatmentPlan?: string
  dressingType?: string
  dressingFrequency?: string
  offloading?: string
  compression?: string
  npwt?: boolean
  warningAreaIncreased?: boolean
}

export interface NursingTask {
  id: string
  facilityId: string
  patientId: string
  title: string
  status: NursingTaskStatus
  priority: 'routine' | 'urgent' | 'stat'
  dueAt?: string
  reason?: string
  linkedOrderId?: string
  assignedNurseId?: string
}

export interface ClinicalNote {
  id: string
  facilityId: string
  patientId: string
  noteType: ClinicalNoteType
  status: ClinicalNoteStatus
  body: string
  signedAt?: string
  signedBy?: string
  amendments?: Array<{ id: string; body: string; actor: string; at: string }>
}
