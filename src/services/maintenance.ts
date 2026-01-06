import {
  getDb,
  maintenanceRequests,
  maintenanceComments,
  units,
  properties,
  users,
  leases,
} from "@/db";
import { eq, desc, and, or, lt, isNull } from "drizzle-orm";
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

export type MaintenanceFilters = {
  status?: string;
  category?: string;
  priority?: string;
  propertyId?: string;
  unitId?: string;
  sortBy?: "date" | "priority" | "status";
  sortOrder?: "asc" | "desc";
  includeArchived?: boolean;
};

const PRIORITY_ORDER: Record<string, number> = {
  emergency: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const STATUS_ORDER: Record<string, number> = {
  open: 0,
  acknowledged: 1,
  in_progress: 2,
  pending_parts: 3,
  completed: 4,
  cancelled: 5,
};

export async function getMaintenanceRequestsByOrganization(
  organizationId: string,
  status?: string,
  filters?: MaintenanceFilters
): Promise<MaintenanceRequestWithDetails[]> {
  const db = getDb();

  const includeArchived = filters?.includeArchived ?? false;
  const whereConditions = includeArchived
    ? eq(properties.organizationId, organizationId)
    : and(
        eq(properties.organizationId, organizationId),
        or(
          eq(maintenanceRequests.archived, false),
          isNull(maintenanceRequests.archived)
        )
      );

  const query = db
    .select({
      request: maintenanceRequests,
      unitNumber: units.unitNumber,
      unitId: units.id,
      propertyId: properties.id,
      propertyName: properties.name,
      propertyAddress: properties.address,
      requestedByName: users.name,
    })
    .from(maintenanceRequests)
    .innerJoin(units, eq(maintenanceRequests.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .innerJoin(users, eq(maintenanceRequests.requestedBy, users.id))
    .where(whereConditions)
    .orderBy(desc(maintenanceRequests.createdAt));

  const results = await query;

  // Apply filters
  let filtered = results;

  // Status filter (from old param or new filters)
  const statusFilter = filters?.status || status;
  if (statusFilter) {
    filtered = filtered.filter((r) => r.request.status === statusFilter);
  }

  // Category filter
  if (filters?.category) {
    filtered = filtered.filter((r) => r.request.category === filters.category);
  }

  // Priority filter
  if (filters?.priority) {
    filtered = filtered.filter((r) => r.request.priority === filters.priority);
  }

  // Property filter
  if (filters?.propertyId) {
    filtered = filtered.filter((r) => r.propertyId === filters.propertyId);
  }

  // Unit filter
  if (filters?.unitId) {
    filtered = filtered.filter((r) => r.unitId === filters.unitId);
  }

  // Apply sorting
  const sortBy = filters?.sortBy || "date";
  const sortOrder = filters?.sortOrder || "desc";

  filtered.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "priority":
        comparison =
          (PRIORITY_ORDER[a.request.priority] || 99) -
          (PRIORITY_ORDER[b.request.priority] || 99);
        break;
      case "status":
        comparison =
          (STATUS_ORDER[a.request.status] || 99) -
          (STATUS_ORDER[b.request.status] || 99);
        break;
      case "date":
      default:
        comparison =
          new Date(b.request.createdAt).getTime() -
          new Date(a.request.createdAt).getTime();
        break;
    }

    return sortOrder === "asc" ? -comparison : comparison;
  });

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

export async function getMaintenanceRequestsByWorker(
  workerId: string,
  status?: string
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
    .where(eq(maintenanceRequests.assignedTo, workerId))
    .orderBy(desc(maintenanceRequests.createdAt));

  const filtered = status
    ? results.filter((r) => r.request.status === status)
    : results;

  return filtered.map((row) => ({
    ...row.request,
    unitNumber: row.unitNumber,
    propertyName: row.propertyName,
    propertyAddress: row.propertyAddress,
    requestedByName: row.requestedByName || "Unknown",
    assignedToName: null,
  }));
}

export async function getAllMaintenanceRequests(
  status?: string
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
    .orderBy(desc(maintenanceRequests.createdAt));

  const filtered = status
    ? results.filter((r) => r.request.status === status)
    : results;

  return filtered.map((row) => ({
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
  actualCost?: number,
  hoursSpent?: number
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
      actualCost: actualCost ?? null,
      hoursSpent: hoursSpent ?? null,
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

// ============ ARCHIVE ============

export async function archiveMaintenanceRequest(id: string): Promise<void> {
  const db = getDb();
  const timestamp = now();
  await db
    .update(maintenanceRequests)
    .set({
      archived: true,
      archivedAt: timestamp,
      updatedAt: timestamp,
    })
    .where(eq(maintenanceRequests.id, id));
}

export async function unarchiveMaintenanceRequest(id: string): Promise<void> {
  const db = getDb();
  const timestamp = now();
  await db
    .update(maintenanceRequests)
    .set({
      archived: false,
      archivedAt: null,
      updatedAt: timestamp,
    })
    .where(eq(maintenanceRequests.id, id));
}

export async function archiveCompletedRequestsOlderThan(
  organizationId: string,
  days: number
): Promise<number> {
  const db = getDb();
  const timestamp = now();
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get IDs of completed requests older than cutoff date for this organization
  const toArchive = await db
    .select({ id: maintenanceRequests.id })
    .from(maintenanceRequests)
    .innerJoin(units, eq(maintenanceRequests.unitId, units.id))
    .innerJoin(properties, eq(units.propertyId, properties.id))
    .where(
      and(
        eq(properties.organizationId, organizationId),
        eq(maintenanceRequests.status, "completed"),
        or(
          eq(maintenanceRequests.archived, false),
          isNull(maintenanceRequests.archived)
        ),
        lt(maintenanceRequests.completedAt, cutoffDate)
      )
    );

  if (toArchive.length === 0) return 0;

  // Archive each request
  for (const { id } of toArchive) {
    await db
      .update(maintenanceRequests)
      .set({
        archived: true,
        archivedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(maintenanceRequests.id, id));
  }

  return toArchive.length;
}
