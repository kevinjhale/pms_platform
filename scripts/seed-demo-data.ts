/**
 * Seed script for comprehensive demo data
 *
 * Creates:
 * - 10 renters (some with active leases)
 * - 3 landlords with unique properties
 * - 3 property managers
 * - 1 maintenance worker
 * - 3 organizations (landlord-only, landlord+PM, PM-only)
 *
 * Run with: npx tsx scripts/seed-demo-data.ts
 */

import { getDb } from '../src/db';
import {
  users,
  organizations,
  organizationMembers,
  properties,
  units,
  leases,
  rentPayments,
  maintenanceRequests,
  maintenanceComments,
  applications,
} from '../src/db/schema';
import { generateId, now, dollarsToCents } from '../src/lib/utils';
import { eq } from 'drizzle-orm';

const db = getDb();

// Helper to create dates
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const monthsFromNow = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
};

async function seed() {
  console.log('Seeding demo data...\n');

  // Clear existing demo data (except core demo users)
  console.log('Clearing previous demo data...');

  // ========================================
  // USERS - Demo credentials
  // ========================================
  console.log('\nCreating users...');

  // 10 Renters
  const renters = [
    { id: 'renter-1', email: 'alice.johnson@demo.com', name: 'Alice Johnson', role: 'renter' as const },
    { id: 'renter-2', email: 'bob.smith@demo.com', name: 'Bob Smith', role: 'renter' as const },
    { id: 'renter-3', email: 'carol.williams@demo.com', name: 'Carol Williams', role: 'renter' as const },
    { id: 'renter-4', email: 'david.brown@demo.com', name: 'David Brown', role: 'renter' as const },
    { id: 'renter-5', email: 'emma.davis@demo.com', name: 'Emma Davis', role: 'renter' as const },
    { id: 'renter-6', email: 'frank.miller@demo.com', name: 'Frank Miller', role: 'renter' as const },
    { id: 'renter-7', email: 'grace.wilson@demo.com', name: 'Grace Wilson', role: 'renter' as const },
    { id: 'renter-8', email: 'henry.moore@demo.com', name: 'Henry Moore', role: 'renter' as const },
    { id: 'renter-9', email: 'iris.taylor@demo.com', name: 'Iris Taylor', role: 'renter' as const },
    { id: 'renter-10', email: 'jack.anderson@demo.com', name: 'Jack Anderson', role: 'renter' as const },
  ];

  // 3 Landlords
  const landlords = [
    { id: 'landlord-1', email: 'john.properties@demo.com', name: 'John Properties', role: 'landlord' as const },
    { id: 'landlord-2', email: 'sarah.realty@demo.com', name: 'Sarah Realty', role: 'landlord' as const },
    { id: 'landlord-3', email: 'mike.estates@demo.com', name: 'Mike Estates', role: 'landlord' as const },
  ];

  // 3 Property Managers
  const managers = [
    { id: 'manager-1', email: 'pm.lisa@demo.com', name: 'Lisa Chen (PM)', role: 'manager' as const },
    { id: 'manager-2', email: 'pm.robert@demo.com', name: 'Robert Garcia (PM)', role: 'manager' as const },
    { id: 'manager-3', email: 'pm.maria@demo.com', name: 'Maria Santos (PM)', role: 'manager' as const },
  ];

  // 1 Maintenance Worker
  const maintenanceWorkers = [
    { id: 'maintenance-1', email: 'maint.joe@demo.com', name: 'Joe Fix-It', role: 'maintenance' as const },
  ];

  const allUsers = [...renters, ...landlords, ...managers, ...maintenanceWorkers];
  const timestamp = now();

  for (const user of allUsers) {
    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(users).values({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      console.log(`  Created user: ${user.email}`);
    } else {
      // Update role if needed
      await db.update(users).set({ role: user.role, updatedAt: timestamp }).where(eq(users.id, user.id));
      console.log(`  Updated user: ${user.email}`);
    }
  }

  // ========================================
  // ORGANIZATIONS
  // ========================================
  console.log('\nCreating organizations...');

  const orgs = [
    { id: 'org-landlord-only', name: 'Johnson Properties LLC', slug: 'johnson-properties', type: 'landlord' },
    { id: 'org-landlord-pm', name: 'Realty & Management Group', slug: 'realty-management', type: 'both' },
    { id: 'org-pm-only', name: 'Premier Property Management', slug: 'premier-pm', type: 'manager' },
  ];

  for (const org of orgs) {
    const existing = await db.select().from(organizations).where(eq(organizations.id, org.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(organizations).values({
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      console.log(`  Created org: ${org.name}`);
    }
  }

  // ========================================
  // ORGANIZATION MEMBERSHIPS
  // ========================================
  console.log('\nCreating organization memberships...');

  const memberships = [
    // Org 1: Landlord-only (John owns it)
    { orgId: 'org-landlord-only', userId: 'landlord-1', role: 'owner' as const },

    // Org 2: Both landlord and PM (Sarah owns, Lisa manages)
    { orgId: 'org-landlord-pm', userId: 'landlord-2', role: 'owner' as const },
    { orgId: 'org-landlord-pm', userId: 'manager-1', role: 'manager' as const },

    // Org 3: PM-only (Maria manages for Mike, who is a silent landlord)
    { orgId: 'org-pm-only', userId: 'manager-2', role: 'owner' as const },
    { orgId: 'org-pm-only', userId: 'landlord-3', role: 'admin' as const },
    { orgId: 'org-pm-only', userId: 'manager-3', role: 'manager' as const },
    { orgId: 'org-pm-only', userId: 'maintenance-1', role: 'staff' as const },
  ];

  for (const mem of memberships) {
    const existing = await db.select().from(organizationMembers)
      .where(eq(organizationMembers.organizationId, mem.orgId))
      .limit(100);
    const alreadyMember = existing.find(m => m.userId === mem.userId);

    if (!alreadyMember) {
      await db.insert(organizationMembers).values({
        id: generateId(),
        organizationId: mem.orgId,
        userId: mem.userId,
        role: mem.role,
        createdAt: timestamp,
      });
      console.log(`  Added ${mem.userId} to ${mem.orgId} as ${mem.role}`);
    }
  }

  // ========================================
  // PROPERTIES
  // ========================================
  console.log('\nCreating properties...');

  const propertiesData = [
    // John's properties (Org 1)
    {
      id: 'prop-1',
      orgId: 'org-landlord-only',
      name: 'Sunset Apartments',
      address: '123 Sunset Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90028',
      propertyType: 'apartment' as const,
      yearBuilt: 2015,
      description: 'Modern apartment complex with great amenities',
    },
    {
      id: 'prop-2',
      orgId: 'org-landlord-only',
      name: 'Oak Street Townhomes',
      address: '456 Oak Street',
      city: 'Pasadena',
      state: 'CA',
      zip: '91101',
      propertyType: 'townhouse' as const,
      yearBuilt: 2010,
      description: 'Beautiful townhomes in a quiet neighborhood',
    },

    // Sarah's properties (Org 2)
    {
      id: 'prop-3',
      orgId: 'org-landlord-pm',
      name: 'Marina View Complex',
      address: '789 Harbor Drive',
      city: 'Marina del Rey',
      state: 'CA',
      zip: '90292',
      propertyType: 'apartment' as const,
      yearBuilt: 2018,
      description: 'Luxury apartments with ocean views',
    },
    {
      id: 'prop-4',
      orgId: 'org-landlord-pm',
      name: 'Downtown Lofts',
      address: '321 Main Street',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90012',
      propertyType: 'condo' as const,
      yearBuilt: 2020,
      description: 'Industrial-style lofts in the heart of downtown',
    },

    // Premier PM properties (Org 3 - Mike's properties managed by PM)
    {
      id: 'prop-5',
      orgId: 'org-pm-only',
      name: 'Valley Gardens',
      address: '555 Garden Way',
      city: 'Sherman Oaks',
      state: 'CA',
      zip: '91403',
      propertyType: 'multi_family' as const,
      yearBuilt: 2005,
      description: 'Family-friendly apartments with playground',
    },
    {
      id: 'prop-6',
      orgId: 'org-pm-only',
      name: 'Hillside Estates',
      address: '777 Hill Road',
      city: 'Glendale',
      state: 'CA',
      zip: '91201',
      propertyType: 'single_family' as const,
      yearBuilt: 2012,
      description: 'Executive homes with stunning views',
    },
  ];

  for (const prop of propertiesData) {
    const existing = await db.select().from(properties).where(eq(properties.id, prop.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(properties).values({
        id: prop.id,
        organizationId: prop.orgId,
        name: prop.name,
        address: prop.address,
        city: prop.city,
        state: prop.state,
        zip: prop.zip,
        country: 'US',
        propertyType: prop.propertyType,
        yearBuilt: prop.yearBuilt,
        description: prop.description,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      console.log(`  Created property: ${prop.name}`);
    }
  }

  // ========================================
  // UNITS
  // ========================================
  console.log('\nCreating units...');

  const unitsData = [
    // Sunset Apartments (prop-1) - 4 units
    { id: 'unit-1', propId: 'prop-1', unitNumber: '101', bed: 1, bath: 1, sqft: 650, rent: 1800, status: 'occupied' as const },
    { id: 'unit-2', propId: 'prop-1', unitNumber: '102', bed: 2, bath: 1, sqft: 900, rent: 2400, status: 'occupied' as const },
    { id: 'unit-3', propId: 'prop-1', unitNumber: '201', bed: 2, bath: 2, sqft: 1000, rent: 2800, status: 'available' as const },
    { id: 'unit-4', propId: 'prop-1', unitNumber: '202', bed: 3, bath: 2, sqft: 1200, rent: 3200, status: 'available' as const },

    // Oak Street Townhomes (prop-2) - 3 units
    { id: 'unit-5', propId: 'prop-2', unitNumber: 'A', bed: 3, bath: 2.5, sqft: 1800, rent: 3500, status: 'occupied' as const },
    { id: 'unit-6', propId: 'prop-2', unitNumber: 'B', bed: 3, bath: 2.5, sqft: 1800, rent: 3500, status: 'available' as const },
    { id: 'unit-7', propId: 'prop-2', unitNumber: 'C', bed: 4, bath: 3, sqft: 2200, rent: 4200, status: 'maintenance' as const },

    // Marina View Complex (prop-3) - 4 units
    { id: 'unit-8', propId: 'prop-3', unitNumber: '301', bed: 1, bath: 1, sqft: 750, rent: 2500, status: 'occupied' as const },
    { id: 'unit-9', propId: 'prop-3', unitNumber: '302', bed: 2, bath: 2, sqft: 1100, rent: 3500, status: 'occupied' as const },
    { id: 'unit-10', propId: 'prop-3', unitNumber: '401', bed: 2, bath: 2, sqft: 1100, rent: 3600, status: 'available' as const },
    { id: 'unit-11', propId: 'prop-3', unitNumber: '402', bed: 3, bath: 2, sqft: 1400, rent: 4500, status: 'available' as const },

    // Downtown Lofts (prop-4) - 3 units
    { id: 'unit-12', propId: 'prop-4', unitNumber: 'PH1', bed: 2, bath: 2, sqft: 1500, rent: 5000, status: 'occupied' as const },
    { id: 'unit-13', propId: 'prop-4', unitNumber: 'PH2', bed: 2, bath: 2, sqft: 1500, rent: 5000, status: 'available' as const },
    { id: 'unit-14', propId: 'prop-4', unitNumber: 'PH3', bed: 3, bath: 2.5, sqft: 2000, rent: 6500, status: 'available' as const },

    // Valley Gardens (prop-5) - 4 units
    { id: 'unit-15', propId: 'prop-5', unitNumber: '1A', bed: 2, bath: 1, sqft: 850, rent: 2000, status: 'occupied' as const },
    { id: 'unit-16', propId: 'prop-5', unitNumber: '1B', bed: 2, bath: 1, sqft: 850, rent: 2000, status: 'occupied' as const },
    { id: 'unit-17', propId: 'prop-5', unitNumber: '2A', bed: 3, bath: 2, sqft: 1100, rent: 2500, status: 'available' as const },
    { id: 'unit-18', propId: 'prop-5', unitNumber: '2B', bed: 3, bath: 2, sqft: 1100, rent: 2500, status: 'available' as const },

    // Hillside Estates (prop-6) - 2 units
    { id: 'unit-19', propId: 'prop-6', unitNumber: '1', bed: 4, bath: 3, sqft: 2500, rent: 5500, status: 'occupied' as const },
    { id: 'unit-20', propId: 'prop-6', unitNumber: '2', bed: 5, bath: 4, sqft: 3200, rent: 7500, status: 'available' as const },
  ];

  for (const unit of unitsData) {
    const existing = await db.select().from(units).where(eq(units.id, unit.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(units).values({
        id: unit.id,
        propertyId: unit.propId,
        unitNumber: unit.unitNumber,
        bedrooms: unit.bed,
        bathrooms: unit.bath,
        sqft: unit.sqft,
        rentAmount: dollarsToCents(unit.rent),
        depositAmount: dollarsToCents(unit.rent), // 1 month deposit
        status: unit.status,
        features: ['Air Conditioning', 'Dishwasher', 'In-unit Laundry'],
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      console.log(`  Created unit: ${unit.propId} - ${unit.unitNumber}`);
    }
  }

  // ========================================
  // LEASES (for occupied units)
  // ========================================
  console.log('\nCreating leases...');

  const leasesData = [
    // Active leases
    { id: 'lease-1', unitId: 'unit-1', tenantId: 'renter-1', rent: 1800, startDaysAgo: 180 },
    { id: 'lease-2', unitId: 'unit-2', tenantId: 'renter-2', rent: 2400, startDaysAgo: 90 },
    { id: 'lease-3', unitId: 'unit-5', tenantId: 'renter-3', rent: 3500, startDaysAgo: 365 },
    { id: 'lease-4', unitId: 'unit-8', tenantId: 'renter-4', rent: 2500, startDaysAgo: 60 },
    { id: 'lease-5', unitId: 'unit-9', tenantId: 'renter-5', rent: 3500, startDaysAgo: 120 },
    { id: 'lease-6', unitId: 'unit-12', tenantId: 'renter-6', rent: 5000, startDaysAgo: 200 },
    { id: 'lease-7', unitId: 'unit-15', tenantId: 'renter-7', rent: 2000, startDaysAgo: 45 },
    { id: 'lease-8', unitId: 'unit-16', tenantId: 'renter-8', rent: 2000, startDaysAgo: 300 },
    { id: 'lease-9', unitId: 'unit-19', tenantId: 'renter-9', rent: 5500, startDaysAgo: 150 },
  ];

  for (const lease of leasesData) {
    const existing = await db.select().from(leases).where(eq(leases.id, lease.id)).limit(1);
    if (existing.length === 0) {
      const startDate = daysAgo(lease.startDaysAgo);
      const endDate = monthsFromNow(12 - Math.floor(lease.startDaysAgo / 30));

      await db.insert(leases).values({
        id: lease.id,
        unitId: lease.unitId,
        tenantId: lease.tenantId,
        status: 'active',
        startDate,
        endDate,
        monthlyRent: dollarsToCents(lease.rent),
        securityDeposit: dollarsToCents(lease.rent),
        lateFeeAmount: dollarsToCents(50),
        lateFeeGraceDays: 5,
        moveInDate: startDate,
        petPolicy: 'cats_and_dogs',
        petDeposit: dollarsToCents(500),
        parkingSpaces: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      console.log(`  Created lease: ${lease.tenantId} in ${lease.unitId}`);
    }
  }

  // ========================================
  // RENT PAYMENTS
  // ========================================
  console.log('\nCreating rent payments...');

  // Create current month's payment for each lease
  for (const lease of leasesData) {
    const paymentId = `payment-${lease.id}-current`;
    const existing = await db.select().from(rentPayments).where(eq(rentPayments.id, paymentId)).limit(1);

    if (existing.length === 0) {
      const periodStart = new Date();
      periodStart.setDate(1);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(0);
      const dueDate = new Date(periodStart);
      dueDate.setDate(1);

      await db.insert(rentPayments).values({
        id: paymentId,
        leaseId: lease.id,
        periodStart,
        periodEnd,
        dueDate,
        amountDue: dollarsToCents(lease.rent),
        amountPaid: dollarsToCents(lease.rent),
        status: 'paid',
        paidAt: daysAgo(2),
        paymentMethod: 'ach',
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      console.log(`  Created payment for lease: ${lease.id}`);
    }
  }

  // ========================================
  // APPLICATIONS (for renters 9, 10 who don't have leases)
  // ========================================
  console.log('\nCreating applications...');

  const applicationsData = [
    { id: 'app-1', unitId: 'unit-3', applicantId: 'renter-10', status: 'submitted' as const },
    { id: 'app-2', unitId: 'unit-6', applicantId: 'renter-10', status: 'under_review' as const },
    { id: 'app-3', unitId: 'unit-10', applicantId: 'renter-10', status: 'draft' as const },
  ];

  for (const app of applicationsData) {
    const existing = await db.select().from(applications).where(eq(applications.id, app.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(applications).values({
        id: app.id,
        unitId: app.unitId,
        applicantId: app.applicantId,
        status: app.status,
        firstName: 'Jack',
        lastName: 'Anderson',
        phone: '555-0110',
        currentAddress: '999 Current Ave',
        currentCity: 'Los Angeles',
        currentState: 'CA',
        currentZip: '90001',
        employer: 'Tech Corp',
        monthlyIncome: dollarsToCents(8000),
        submittedAt: app.status === 'submitted' || app.status === 'under_review' ? daysAgo(3) : null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      console.log(`  Created application: ${app.applicantId} for ${app.unitId}`);
    }
  }

  // ========================================
  // MAINTENANCE REQUESTS
  // ========================================
  console.log('\nCreating maintenance requests...');

  const maintenanceData = [
    { id: 'maint-1', unitId: 'unit-1', requestedBy: 'renter-1', title: 'Leaky faucet in bathroom', category: 'plumbing' as const, priority: 'medium' as const, status: 'completed' as const },
    { id: 'maint-2', unitId: 'unit-2', requestedBy: 'renter-2', title: 'AC not cooling properly', category: 'hvac' as const, priority: 'high' as const, status: 'in_progress' as const, assignedTo: 'maintenance-1' },
    { id: 'maint-3', unitId: 'unit-5', requestedBy: 'renter-3', title: 'Broken window latch', category: 'structural' as const, priority: 'low' as const, status: 'open' as const },
    { id: 'maint-4', unitId: 'unit-7', requestedBy: 'landlord-1', title: 'Full renovation before listing', category: 'other' as const, priority: 'medium' as const, status: 'in_progress' as const, assignedTo: 'maintenance-1' },
    { id: 'maint-5', unitId: 'unit-9', requestedBy: 'renter-5', title: 'Dishwasher not draining', category: 'appliance' as const, priority: 'medium' as const, status: 'pending_parts' as const, assignedTo: 'maintenance-1' },
    { id: 'maint-6', unitId: 'unit-15', requestedBy: 'renter-7', title: 'Pest control needed', category: 'pest' as const, priority: 'high' as const, status: 'acknowledged' as const },
  ];

  for (const maint of maintenanceData) {
    const existing = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, maint.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(maintenanceRequests).values({
        id: maint.id,
        unitId: maint.unitId,
        requestedBy: maint.requestedBy,
        title: maint.title,
        description: `Detailed description for: ${maint.title}`,
        category: maint.category,
        priority: maint.priority,
        status: maint.status,
        assignedTo: maint.assignedTo || null,
        assignedAt: maint.assignedTo ? daysAgo(2) : null,
        completedAt: maint.status === 'completed' ? daysAgo(1) : null,
        completedBy: maint.status === 'completed' ? 'maintenance-1' : null,
        resolutionSummary: maint.status === 'completed' ? 'Issue resolved successfully' : null,
        permissionToEnter: true,
        createdAt: daysAgo(5),
        updatedAt: timestamp,
      });
      console.log(`  Created maintenance request: ${maint.title}`);
    }
  }

  // Add some comments to maintenance requests
  const comments = [
    { requestId: 'maint-2', authorId: 'maintenance-1', content: 'Checked the unit, compressor needs refrigerant. Will return tomorrow.', isInternal: false },
    { requestId: 'maint-2', authorId: 'manager-1', content: 'Please prioritize this - tenant is elderly.', isInternal: true },
    { requestId: 'maint-5', authorId: 'maintenance-1', content: 'Ordered replacement pump, expected in 3-5 days.', isInternal: false },
  ];

  for (const comment of comments) {
    const commentId = generateId();
    await db.insert(maintenanceComments).values({
      id: commentId,
      requestId: comment.requestId,
      authorId: comment.authorId,
      content: comment.content,
      isInternal: comment.isInternal,
      createdAt: daysAgo(1),
    }).onConflictDoNothing();
  }

  console.log('\n✓ Demo data seeding complete!\n');

  console.log('Demo Logins:');
  console.log('─'.repeat(50));
  console.log('\nRenters (password: any):');
  renters.forEach(r => console.log(`  ${r.email}`));
  console.log('\nLandlords (password: any):');
  landlords.forEach(l => console.log(`  ${l.email}`));
  console.log('\nProperty Managers (password: any):');
  managers.forEach(m => console.log(`  ${m.email}`));
  console.log('\nMaintenance Workers (password: any):');
  maintenanceWorkers.forEach(m => console.log(`  ${m.email}`));
  console.log('\n' + '─'.repeat(50));
}

seed().catch(console.error);
