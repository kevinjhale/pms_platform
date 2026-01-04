import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { units } from './properties';
import { users } from './users';

export const applications = sqliteTable('applications', {
  id: text('id').primaryKey(),
  unitId: text('unit_id').notNull().references(() => units.id, { onDelete: 'cascade' }),
  applicantId: text('applicant_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', {
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn']
  }).notNull().default('draft'),

  // Personal Info
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  dateOfBirth: text('date_of_birth'),
  ssn: text('ssn'), // encrypted in practice

  // Current Address
  currentAddress: text('current_address'),
  currentCity: text('current_city'),
  currentState: text('current_state'),
  currentZip: text('current_zip'),
  currentRent: integer('current_rent'),
  currentLandlord: text('current_landlord'),
  currentLandlordPhone: text('current_landlord_phone'),
  moveInDate: integer('move_in_date', { mode: 'timestamp' }),

  // Employment
  employer: text('employer'),
  employerPhone: text('employer_phone'),
  jobTitle: text('job_title'),
  monthlyIncome: integer('monthly_income'),
  employmentStartDate: integer('employment_start_date', { mode: 'timestamp' }),

  // Additional occupants
  additionalOccupants: text('additional_occupants', { mode: 'json' }).$type<Array<{
    name: string;
    relationship: string;
    age?: number;
  }>>(),

  // Pets
  hasPets: integer('has_pets', { mode: 'boolean' }),
  pets: text('pets', { mode: 'json' }).$type<Array<{
    type: string;
    breed: string;
    weight: number;
  }>>(),

  // References
  references: text('references', { mode: 'json' }).$type<Array<{
    name: string;
    relationship: string;
    phone: string;
  }>>(),

  // Background check consent
  backgroundCheckConsent: integer('background_check_consent', { mode: 'boolean' }),
  backgroundCheckConsentDate: integer('background_check_consent_date', { mode: 'timestamp' }),

  // Decision
  decidedBy: text('decided_by').references(() => users.id),
  decidedAt: integer('decided_at', { mode: 'timestamp' }),
  decisionNotes: text('decision_notes'),

  // Timestamps
  submittedAt: integer('submitted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const applicationDocuments = sqliteTable('application_documents', {
  id: text('id').primaryKey(),
  applicationId: text('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  documentType: text('document_type', {
    enum: ['id', 'pay_stub', 'bank_statement', 'tax_return', 'reference_letter', 'other']
  }).notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull(),
});

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type ApplicationDocument = typeof applicationDocuments.$inferSelect;
