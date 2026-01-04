import { getDb, applications, units, properties, users } from "@/db";
import { eq, desc, and } from "drizzle-orm";
import { generateId, now } from "@/lib/utils";
import type { Application, NewApplication } from "@/db/schema/applications";

export type ApplicationWithDetails = Application & {
  unitTitle: string;
  propertyAddress: string;
  applicantName: string;
  applicantEmail: string;
};

export async function createApplication(
  unitId: string,
  applicantId: string
): Promise<Application> {
  const db = getDb();
  const timestamp = now();

  const id = generateId();
  await db.insert(applications).values({
    id,
    unitId,
    applicantId,
    status: "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const result = await db
    .select()
    .from(applications)
    .where(eq(applications.id, id))
    .limit(1);

  return result[0];
}

export async function getApplicationById(
  id: string
): Promise<ApplicationWithDetails | null> {
  const db = getDb();

  const results = await db
    .select({
      application: applications,
      unitNumber: units.unitNumber,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyCity: properties.city,
      propertyState: properties.state,
      applicantName: users.name,
      applicantEmail: users.email,
    })
    .from(applications)
    .innerJoin(units, eq(applications.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .innerJoin(users, eq(applications.applicantId, users.id))
    .where(eq(applications.id, id))
    .limit(1);

  if (results.length === 0) return null;

  const row = results[0];
  return {
    ...row.application,
    unitTitle: row.unitNumber
      ? `${row.propertyName} - Unit ${row.unitNumber}`
      : row.propertyName,
    propertyAddress: `${row.propertyAddress}, ${row.propertyCity}, ${row.propertyState}`,
    applicantName: row.applicantName || "Unknown",
    applicantEmail: row.applicantEmail,
  };
}

export async function getApplicationsByApplicant(
  applicantId: string
): Promise<ApplicationWithDetails[]> {
  const db = getDb();

  const results = await db
    .select({
      application: applications,
      unitNumber: units.unitNumber,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyCity: properties.city,
      propertyState: properties.state,
      applicantName: users.name,
      applicantEmail: users.email,
    })
    .from(applications)
    .innerJoin(units, eq(applications.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .innerJoin(users, eq(applications.applicantId, users.id))
    .where(eq(applications.applicantId, applicantId))
    .orderBy(desc(applications.createdAt));

  return results.map((row) => ({
    ...row.application,
    unitTitle: row.unitNumber
      ? `${row.propertyName} - Unit ${row.unitNumber}`
      : row.propertyName,
    propertyAddress: `${row.propertyAddress}, ${row.propertyCity}, ${row.propertyState}`,
    applicantName: row.applicantName || "Unknown",
    applicantEmail: row.applicantEmail,
  }));
}

export async function getApplicationsByOrganization(
  organizationId: string
): Promise<ApplicationWithDetails[]> {
  const db = getDb();

  const results = await db
    .select({
      application: applications,
      unitNumber: units.unitNumber,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyCity: properties.city,
      propertyState: properties.state,
      applicantName: users.name,
      applicantEmail: users.email,
    })
    .from(applications)
    .innerJoin(units, eq(applications.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .innerJoin(users, eq(applications.applicantId, users.id))
    .where(eq(properties.organizationId, organizationId))
    .orderBy(desc(applications.createdAt));

  return results.map((row) => ({
    ...row.application,
    unitTitle: row.unitNumber
      ? `${row.propertyName} - Unit ${row.unitNumber}`
      : row.propertyName,
    propertyAddress: `${row.propertyAddress}, ${row.propertyCity}, ${row.propertyState}`,
    applicantName: row.applicantName || "Unknown",
    applicantEmail: row.applicantEmail,
  }));
}

export async function updateApplication(
  id: string,
  data: Partial<NewApplication>
): Promise<void> {
  const db = getDb();
  await db
    .update(applications)
    .set({ ...data, updatedAt: now() })
    .where(eq(applications.id, id));
}

export async function submitApplication(id: string): Promise<void> {
  const db = getDb();
  const timestamp = now();
  await db
    .update(applications)
    .set({
      status: "submitted",
      submittedAt: timestamp,
      updatedAt: timestamp,
    })
    .where(eq(applications.id, id));
}

export async function approveApplication(
  id: string,
  decidedBy: string,
  notes?: string
): Promise<void> {
  const db = getDb();
  const timestamp = now();
  await db
    .update(applications)
    .set({
      status: "approved",
      decidedBy,
      decidedAt: timestamp,
      decisionNotes: notes || null,
      updatedAt: timestamp,
    })
    .where(eq(applications.id, id));
}

export async function rejectApplication(
  id: string,
  decidedBy: string,
  notes?: string
): Promise<void> {
  const db = getDb();
  const timestamp = now();
  await db
    .update(applications)
    .set({
      status: "rejected",
      decidedBy,
      decidedAt: timestamp,
      decisionNotes: notes || null,
      updatedAt: timestamp,
    })
    .where(eq(applications.id, id));
}

export async function getExistingApplication(
  unitId: string,
  applicantId: string
): Promise<Application | null> {
  const db = getDb();
  const results = await db
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.unitId, unitId),
        eq(applications.applicantId, applicantId)
      )
    )
    .limit(1);

  return results[0] || null;
}
