import {
  getDb,
  maintenanceRequests,
  maintenanceComments,
  units,
  properties,
  users,
  leases,
} from "@/db";
import { eq, desc, and, or } from "drizzle-orm";
import { generateId, now } from "@/lib/utils";
import type {
  MaintenanceRequest,
  NewMaintenanceRequest,
  MaintenanceComment,
} from "@/db/schema/maintenance";

export type MaintenanceRequestWithDetails = MaintenanceRequest & {
  unitNumber: string | null;
  propertyName: string;
  propertyAddress: string;
  requestedByName: string;
  assignedToName: string | null;
};

// ============ MAINTENANCE REQUESTS ============

export async function createMaintenanceRequest(
  data: Omit<NewMaintenanceRequest, "id" | "createdAt" | "updatedAt">
): Promise<MaintenanceRequest> {
  const db = getDb();
  const id = generateId();
  const timestamp = now();

  await db.insert(maintenanceRequests).values({
    ...data,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const result = await db
    .select()
    .from(maintenanceRequests)
    .where(eq(maintenanceRequests.id, id))
    .limit(1);
  return result[0];
}

export async function getMaintenanceRequestById(
  id: string
): Promise<MaintenanceRequestWithDetails | null> {
  const db = getDb();

  const requestedByUser = db
    .select({ id: users.id, name: users.name })
    .from(users)
    .as("requestedByUser");
  const assignedToUser = db
    .select({ id: users.id, name: users.name })
    .from(users)
    .as("assignedToUser");

  const results = await db
    .select({
      request: maintenanceRequests,
      unitNumber: units.unitNumber,
      propertyName: properties.name,
      propertyAddress: properties.address,
      requestedByName: users.name,
    })
    .from(maintenanceRequests)
    .innerJoin(units, eq(maintenanceRequests.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .innerJoin(users, eq(maintenanceRequests.requestedBy, users.id))
    .where(eq(maintenanceRequests.id, id))
    .limit(1);

  if (results.length === 0) return null;

  const row = results[0];

  // Get assigned user name if exists
  let assignedToName: string | null = null;
  if (row.request.assignedTo) {
    const assignedUser = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, row.request.assignedTo))
      .limit(1);
    assignedToName = assignedUser[0]?.name || null;
  }

  return {
    ...row.request,
    unitNumber: row.unitNumber,
    propertyName: row.propertyName,
    propertyAddress: row.propertyAddress,
    requestedByName: row.requestedByName || "Unknown",
    assignedToName,
  };
}

export async function getMaintenanceRequestsByOrganization(
  organizationId: string,
  status?: string
): Promise<MaintenanceRequestWithDetails[]> {
  const db = getDb();

  let query = db
    .select({
      request: maintenanceRequests,
      unitNumber: units.unitNumber,
      propertyName: properties.name,
      propertyAddress: properties.address,
      requestedByName: users.name,
    })
    .from(maintenanceRequests)
    .innerJoin(units, eq(maintenanceRequests.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .innerJoin(users, eq(maintenanceRequests.requestedBy, users.id))
    .where(eq(properties.organizationId, organizationId))
    .orderBy(desc(maintenanceRequests.createdAt));

  const results = await query;

  // Filter by status if provided
  const filtered = status
    ? results.filter((r) => r.request.status === status)
    : results;

  return filtered.map((row) => ({
    ...row.request,
    unitNumber: row.unitNumber,
    propertyName: row.propertyName,
    propertyAddress: row.propertyAddress,
    requestedByName: row.requestedByName || "Unknown",
    assignedToName: null, // Would need separate query for each
  }));
}

export async function getMaintenanceRequestsByTenant(
  tenantId: string
): Promise<MaintenanceRequestWithDetails[]> {
  const db = getDb();

  const results = await db
    .select({
      request: maintenanceRequests,
      unitNumber: units.unitNumber,
      propertyName: properties.name,
      propertyAddress: properties.address,
      requestedByName: users.name,
    })
    .from(maintenanceRequests)
    .innerJoin(units, eq(maintenanceRequests.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .innerJoin(users, eq(maintenanceRequests.requestedBy, users.id))
    .where(eq(maintenanceRequests.requestedBy, tenantId))
    .orderBy(desc(maintenanceRequests.createdAt));

  return results.map((row) => ({
    ...row.request,
    unitNumber: row.unitNumber,
    propertyName: row.propertyName,
    propertyAddress: row.propertyAddress,
    requestedByName: row.requestedByName || "Unknown",
    assignedToName: null,
  }));
}

export async function updateMaintenanceRequest(
  id: string,
  data: Partial<NewMaintenanceRequest>
): Promise<void> {
  const db = getDb();
  await db
    .update(maintenanceRequests)
    .set({ ...data, updatedAt: now() })
    .where(eq(maintenanceRequests.id, id));
}

export async function assignMaintenanceRequest(
  id: string,
  assignedTo: string
): Promise<void> {
  const db = getDb();
  const timestamp = now();
  await db
    .update(maintenanceRequests)
    .set({
      assignedTo,
      assignedAt: timestamp,
      status: "acknowledged",
      updatedAt: timestamp,
    })
    .where(eq(maintenanceRequests.id, id));
}

export async function updateMaintenanceStatus(
  id: string,
  status: MaintenanceRequest["status"]
): Promise<void> {
  const db = getDb();
  const timestamp = now();

  const updates: Partial<NewMaintenanceRequest> = {
    status,
    updatedAt: timestamp,
  };

  if (status === "completed") {
    updates.completedAt = timestamp;
  }

  await db
    .update(maintenanceRequests)
    .set(updates)
    .where(eq(maintenanceRequests.id, id));
}

export async function completeMaintenanceRequest(
  id: string,
  completedBy: string,
  resolutionSummary: string,
  actualCost?: number
): Promise<void> {
  const db = getDb();
  const timestamp = now();
  await db
    .update(maintenanceRequests)
    .set({
      status: "completed",
      completedAt: timestamp,
      completedBy,
      resolutionSummary,
      actualCost: actualCost || null,
      updatedAt: timestamp,
    })
    .where(eq(maintenanceRequests.id, id));
}

// ============ COMMENTS ============

export async function addMaintenanceComment(
  requestId: string,
  authorId: string,
  content: string,
  isInternal = false
): Promise<MaintenanceComment> {
  const db = getDb();
  const id = generateId();
  const timestamp = now();

  await db.insert(maintenanceComments).values({
    id,
    requestId,
    authorId,
    content,
    isInternal,
    createdAt: timestamp,
  });

  const result = await db
    .select()
    .from(maintenanceComments)
    .where(eq(maintenanceComments.id, id))
    .limit(1);
  return result[0];
}

export async function getMaintenanceComments(
  requestId: string,
  includeInternal = false
): Promise<(MaintenanceComment & { authorName: string })[]> {
  const db = getDb();

  const baseQuery = db
    .select({
      comment: maintenanceComments,
      authorName: users.name,
    })
    .from(maintenanceComments)
    .innerJoin(users, eq(maintenanceComments.authorId, users.id))
    .where(eq(maintenanceComments.requestId, requestId))
    .orderBy(maintenanceComments.createdAt);

  const results = await baseQuery;

  // Filter out internal comments if not included
  const filtered = includeInternal
    ? results
    : results.filter((r) => !r.comment.isInternal);

  return filtered.map((row) => ({
    ...row.comment,
    authorName: row.authorName || "Unknown",
  }));
}

// ============ STATS ============

export async function getMaintenanceStats(organizationId: string): Promise<{
  open: number;
  inProgress: number;
  completed: number;
  avgResolutionDays: number;
}> {
  const db = getDb();

  const requests = await db
    .select({ status: maintenanceRequests.status })
    .from(maintenanceRequests)
    .innerJoin(units, eq(maintenanceRequests.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(eq(properties.organizationId, organizationId));

  const open = requests.filter(
    (r) => r.status === "open" || r.status === "acknowledged"
  ).length;
  const inProgress = requests.filter(
    (r) => r.status === "in_progress" || r.status === "pending_parts"
  ).length;
  const completed = requests.filter((r) => r.status === "completed").length;

  return {
    open,
    inProgress,
    completed,
    avgResolutionDays: 0, // Would need more complex query
  };
}
