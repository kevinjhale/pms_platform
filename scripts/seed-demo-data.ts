/**
 * Seed script for comprehensive demo data
 *
 * Creates:
 * - 10 renters (some with active leases)
 * - 3 landlords with unique properties
 * - 3 property managers
 * - 1 maintenance worker
 * - 3 organizations (landlord-only, landlord+PM, PM-only)
 * - 6 properties with 20 units
 * - Property manager assignments
 * - Unit photos
 * - Leases and historical rent payments
 * - Applications with documents
 * - Maintenance requests with comments
 * - Audit logs
 *
 * Run with: bun run db:seed  OR  npm run db:seed
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
  propertyManagers,
  unitPhotos,
  applicationDocuments,
  auditLogs,
  leaseCharges,
  paymentLineItems,
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
    { id: 'renter-1', email: 'alice.johnson@demo.com', name: 'Alice Johnson', role: 'renter' as const, phone: '(310) 555-0101' },
    { id: 'renter-2', email: 'bob.smith@demo.com', name: 'Bob Smith', role: 'renter' as const, phone: '(310) 555-0102' },
    { id: 'renter-3', email: 'carol.williams@demo.com', name: 'Carol Williams', role: 'renter' as const, phone: '(626) 555-0103' },
    { id: 'renter-4', email: 'david.brown@demo.com', name: 'David Brown', role: 'renter' as const, phone: '(424) 555-0104' },
    { id: 'renter-5', email: 'emma.davis@demo.com', name: 'Emma Davis', role: 'renter' as const, phone: '(424) 555-0105' },
    { id: 'renter-6', email: 'frank.miller@demo.com', name: 'Frank Miller', role: 'renter' as const, phone: '(213) 555-0106' },
    { id: 'renter-7', email: 'grace.wilson@demo.com', name: 'Grace Wilson', role: 'renter' as const, phone: '(818) 555-0107' },
    { id: 'renter-8', email: 'henry.moore@demo.com', name: 'Henry Moore', role: 'renter' as const, phone: '(818) 555-0108' },
    { id: 'renter-9', email: 'iris.taylor@demo.com', name: 'Iris Taylor', role: 'renter' as const, phone: '(818) 555-0109' },
    { id: 'renter-10', email: 'jack.anderson@demo.com', name: 'Jack Anderson', role: 'renter' as const, phone: '(310) 555-0110' },
  ];

  // 3 Landlords
  const landlords = [
    { id: 'landlord-1', email: 'john.properties@demo.com', name: 'John Properties', role: 'landlord' as const, phone: '(310) 555-1001' },
    { id: 'landlord-2', email: 'sarah.realty@demo.com', name: 'Sarah Realty', role: 'landlord' as const, phone: '(424) 555-1002' },
    { id: 'landlord-3', email: 'mike.estates@demo.com', name: 'Mike Estates', role: 'landlord' as const, phone: '(818) 555-1003' },
  ];

  // 3 Property Managers
  const managers = [
    { id: 'manager-1', email: 'pm.lisa@demo.com', name: 'Lisa Chen (PM)', role: 'manager' as const, phone: '(424) 555-2001' },
    { id: 'manager-2', email: 'pm.robert@demo.com', name: 'Robert Garcia (PM)', role: 'manager' as const, phone: '(818) 555-2002' },
    { id: 'manager-3', email: 'pm.maria@demo.com', name: 'Maria Santos (PM)', role: 'manager' as const, phone: '(818) 555-2003' },
  ];

  // 1 Maintenance Worker
  const maintenanceWorkers = [
    { id: 'maintenance-1', email: 'maint.joe@demo.com', name: 'Joe Fix-It', role: 'maintenance' as const, phone: '(818) 555-3001' },
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
        phone: user.phone,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      console.log(`  Created user: ${user.email}`);
    } else {
      // Update role and phone if needed
      await db.update(users).set({ role: user.role, phone: user.phone, updatedAt: timestamp }).where(eq(users.id, user.id));
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
      apn: '5547-021-015',
      utilityWater: 'LADWP',
      utilityTrash: 'LA Sanitation',
      utilityElectricity: 'LADWP',
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
      apn: '5723-018-009',
      utilityWater: 'Pasadena Water & Power',
      utilityTrash: 'Athens Services',
      utilityElectricity: 'Pasadena Water & Power',
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
      apn: '4228-006-023',
      utilityWater: 'Golden State Water',
      utilityTrash: 'Republic Services',
      utilityElectricity: 'SoCal Edison',
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
      apn: '5147-003-041',
      utilityWater: 'LADWP',
      utilityTrash: 'LA Sanitation',
      utilityElectricity: 'LADWP',
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
      apn: '2273-014-007',
      utilityWater: 'LADWP',
      utilityTrash: 'Universal Waste Systems',
      utilityElectricity: 'SoCal Edison',
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
      apn: '5641-025-018',
      utilityWater: 'Glendale Water & Power',
      utilityTrash: 'Glendale Refuse',
      utilityElectricity: 'Glendale Water & Power',
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
        apn: prop.apn,
        utilityWater: prop.utilityWater,
        utilityTrash: prop.utilityTrash,
        utilityElectricity: prop.utilityElectricity,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      console.log(`  Created property: ${prop.name}`);
    } else {
      // Update property fields
      await db.update(properties).set({
        apn: prop.apn,
        utilityWater: prop.utilityWater,
        utilityTrash: prop.utilityTrash,
        utilityElectricity: prop.utilityElectricity,
        updatedAt: timestamp,
      }).where(eq(properties.id, prop.id));
    }
  }

  // ========================================
  // PROPERTY MANAGERS
  // ========================================
  console.log('\nCreating property manager assignments...');

  const propertyManagersData = [
    // Lisa manages Sarah's Marina View Complex
    { id: 'pm-assign-1', propertyId: 'prop-3', userId: 'manager-1', splitPercentage: 10, proposedBy: 'landlord-2', status: 'accepted' as const },
    // Lisa also manages Downtown Lofts
    { id: 'pm-assign-2', propertyId: 'prop-4', userId: 'manager-1', splitPercentage: 12, proposedBy: 'landlord-2', status: 'accepted' as const },
    // Robert manages Valley Gardens for Mike
    { id: 'pm-assign-3', propertyId: 'prop-5', userId: 'manager-2', splitPercentage: 15, proposedBy: 'landlord-3', status: 'accepted' as const },
    // Maria manages Hillside Estates
    { id: 'pm-assign-4', propertyId: 'prop-6', userId: 'manager-3', splitPercentage: 12, proposedBy: 'manager-2', status: 'accepted' as const },
    // Pending assignment - John considering a PM for Oak Street
    { id: 'pm-assign-5', propertyId: 'prop-2', userId: 'manager-1', splitPercentage: 8, proposedBy: 'manager-1', status: 'proposed' as const },
  ];

  for (const pm of propertyManagersData) {
    const existing = await db.select().from(propertyManagers).where(eq(propertyManagers.id, pm.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(propertyManagers).values({
        id: pm.id,
        propertyId: pm.propertyId,
        userId: pm.userId,
        splitPercentage: pm.splitPercentage,
        status: pm.status,
        proposedBy: pm.proposedBy,
        acceptedAt: pm.status === 'accepted' ? daysAgo(30) : null,
        createdAt: daysAgo(60),
      });
      console.log(`  Assigned ${pm.userId} to ${pm.propertyId} (${pm.status})`);
    }
  }

  // ========================================
  // UNITS
  // ========================================
  console.log('\nCreating units...');

  const unitsData = [
    // Sunset Apartments (prop-1) - 4 units
    { id: 'unit-1', propId: 'prop-1', unitNumber: '101', bed: 1, bath: 1, sqft: 650, rent: 1800, status: 'occupied' as const, listedDaysAgo: 200 },
    { id: 'unit-2', propId: 'prop-1', unitNumber: '102', bed: 2, bath: 1, sqft: 900, rent: 2400, status: 'occupied' as const, listedDaysAgo: 120 },
    { id: 'unit-3', propId: 'prop-1', unitNumber: '201', bed: 2, bath: 2, sqft: 1000, rent: 2800, status: 'available' as const, listedDaysAgo: 14 },
    { id: 'unit-4', propId: 'prop-1', unitNumber: '202', bed: 3, bath: 2, sqft: 1200, rent: 3200, status: 'available' as const, listedDaysAgo: 7 },

    // Oak Street Townhomes (prop-2) - 3 units
    { id: 'unit-5', propId: 'prop-2', unitNumber: 'A', bed: 3, bath: 2.5, sqft: 1800, rent: 3500, status: 'occupied' as const, listedDaysAgo: 400 },
    { id: 'unit-6', propId: 'prop-2', unitNumber: 'B', bed: 3, bath: 2.5, sqft: 1800, rent: 3500, status: 'available' as const, listedDaysAgo: 21 },
    { id: 'unit-7', propId: 'prop-2', unitNumber: 'C', bed: 4, bath: 3, sqft: 2200, rent: 4200, status: 'maintenance' as const, listedDaysAgo: null },

    // Marina View Complex (prop-3) - 4 units
    { id: 'unit-8', propId: 'prop-3', unitNumber: '301', bed: 1, bath: 1, sqft: 750, rent: 2500, status: 'occupied' as const, listedDaysAgo: 90 },
    { id: 'unit-9', propId: 'prop-3', unitNumber: '302', bed: 2, bath: 2, sqft: 1100, rent: 3500, status: 'occupied' as const, listedDaysAgo: 150 },
    { id: 'unit-10', propId: 'prop-3', unitNumber: '401', bed: 2, bath: 2, sqft: 1100, rent: 3600, status: 'available' as const, listedDaysAgo: 10 },
    { id: 'unit-11', propId: 'prop-3', unitNumber: '402', bed: 3, bath: 2, sqft: 1400, rent: 4500, status: 'available' as const, listedDaysAgo: 5 },

    // Downtown Lofts (prop-4) - 3 units
    { id: 'unit-12', propId: 'prop-4', unitNumber: 'PH1', bed: 2, bath: 2, sqft: 1500, rent: 5000, status: 'occupied' as const, listedDaysAgo: 220 },
    { id: 'unit-13', propId: 'prop-4', unitNumber: 'PH2', bed: 2, bath: 2, sqft: 1500, rent: 5000, status: 'available' as const, listedDaysAgo: 30 },
    { id: 'unit-14', propId: 'prop-4', unitNumber: 'PH3', bed: 3, bath: 2.5, sqft: 2000, rent: 6500, status: 'available' as const, listedDaysAgo: 45 },

    // Valley Gardens (prop-5) - 4 units
    { id: 'unit-15', propId: 'prop-5', unitNumber: '1A', bed: 2, bath: 1, sqft: 850, rent: 2000, status: 'occupied' as const, listedDaysAgo: 60 },
    { id: 'unit-16', propId: 'prop-5', unitNumber: '1B', bed: 2, bath: 1, sqft: 850, rent: 2000, status: 'occupied' as const, listedDaysAgo: 320 },
    { id: 'unit-17', propId: 'prop-5', unitNumber: '2A', bed: 3, bath: 2, sqft: 1100, rent: 2500, status: 'available' as const, listedDaysAgo: 3 },
    { id: 'unit-18', propId: 'prop-5', unitNumber: '2B', bed: 3, bath: 2, sqft: 1100, rent: 2500, status: 'available' as const, listedDaysAgo: null },

    // Hillside Estates (prop-6) - 2 units
    { id: 'unit-19', propId: 'prop-6', unitNumber: '1', bed: 4, bath: 3, sqft: 2500, rent: 5500, status: 'occupied' as const, listedDaysAgo: 180 },
    { id: 'unit-20', propId: 'prop-6', unitNumber: '2', bed: 5, bath: 4, sqft: 3200, rent: 7500, status: 'available' as const, listedDaysAgo: 60 },
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
        listedDate: unit.listedDaysAgo ? daysAgo(unit.listedDaysAgo) : null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      console.log(`  Created unit: ${unit.propId} - ${unit.unitNumber}`);
    } else {
      // Update listedDate if needed
      await db.update(units).set({
        listedDate: unit.listedDaysAgo ? daysAgo(unit.listedDaysAgo) : null,
        updatedAt: timestamp,
      }).where(eq(units.id, unit.id));
    }
  }

  // ========================================
  // UNIT PHOTOS
  // ========================================
  console.log('\nCreating unit photos...');

  const unitPhotosData = [
    // Sunset Apartments unit 101
    { id: 'photo-1', unitId: 'unit-1', url: '/demo/photos/living-room-1.jpg', caption: 'Spacious living room', sortOrder: 0 },
    { id: 'photo-2', unitId: 'unit-1', url: '/demo/photos/kitchen-1.jpg', caption: 'Modern kitchen with stainless steel appliances', sortOrder: 1 },
    { id: 'photo-3', unitId: 'unit-1', url: '/demo/photos/bedroom-1.jpg', caption: 'Master bedroom with natural light', sortOrder: 2 },
    // Marina View unit 301
    { id: 'photo-4', unitId: 'unit-8', url: '/demo/photos/marina-view-living.jpg', caption: 'Living area with ocean view', sortOrder: 0 },
    { id: 'photo-5', unitId: 'unit-8', url: '/demo/photos/marina-view-balcony.jpg', caption: 'Private balcony', sortOrder: 1 },
    // Downtown Loft PH1
    { id: 'photo-6', unitId: 'unit-12', url: '/demo/photos/loft-main.jpg', caption: 'Open concept loft space', sortOrder: 0 },
    { id: 'photo-7', unitId: 'unit-12', url: '/demo/photos/loft-exposed-brick.jpg', caption: 'Exposed brick walls', sortOrder: 1 },
    { id: 'photo-8', unitId: 'unit-12', url: '/demo/photos/loft-kitchen.jpg', caption: 'Chef\'s kitchen with island', sortOrder: 2 },
    // Available units need photos for listings
    { id: 'photo-9', unitId: 'unit-3', url: '/demo/photos/sunset-201-living.jpg', caption: 'Bright living room', sortOrder: 0 },
    { id: 'photo-10', unitId: 'unit-3', url: '/demo/photos/sunset-201-bedroom.jpg', caption: 'Primary bedroom', sortOrder: 1 },
    { id: 'photo-11', unitId: 'unit-6', url: '/demo/photos/oak-b-exterior.jpg', caption: 'Townhome exterior', sortOrder: 0 },
    { id: 'photo-12', unitId: 'unit-6', url: '/demo/photos/oak-b-living.jpg', caption: 'Two-story living room', sortOrder: 1 },
    { id: 'photo-13', unitId: 'unit-20', url: '/demo/photos/hillside-2-exterior.jpg', caption: 'Estate home with mountain views', sortOrder: 0 },
    { id: 'photo-14', unitId: 'unit-20', url: '/demo/photos/hillside-2-pool.jpg', caption: 'Private pool and patio', sortOrder: 1 },
  ];

  for (const photo of unitPhotosData) {
    const existing = await db.select().from(unitPhotos).where(eq(unitPhotos.id, photo.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(unitPhotos).values({
        id: photo.id,
        unitId: photo.unitId,
        url: photo.url,
        caption: photo.caption,
        sortOrder: photo.sortOrder,
        createdAt: daysAgo(30),
      });
      console.log(`  Added photo to ${photo.unitId}: ${photo.caption}`);
    }
  }

  // ========================================
  // LEASES (for occupied units)
  // ========================================
  console.log('\nCreating leases...');

  const leasesData = [
    // Active leases with varied statuses and some co-signers
    {
      id: 'lease-1', unitId: 'unit-1', tenantId: 'renter-1', rent: 1800, startDaysAgo: 180,
      paymentStatus: 'current' as const, cleaningFee: 150,
      coSigner: { name: 'Tom Johnson', email: 'tom.johnson@demo.com', phone: '(310) 555-9001' },
    },
    {
      id: 'lease-2', unitId: 'unit-2', tenantId: 'renter-2', rent: 2400, startDaysAgo: 90,
      paymentStatus: 'partial' as const, cleaningFee: 200,
      coSigner: null,
    },
    {
      id: 'lease-3', unitId: 'unit-5', tenantId: 'renter-3', rent: 3500, startDaysAgo: 365,
      paymentStatus: 'current' as const, cleaningFee: 300,
      coSigner: { name: 'James Williams', email: 'james.williams@demo.com', phone: '(626) 555-9002' },
    },
    {
      id: 'lease-4', unitId: 'unit-8', tenantId: 'renter-4', rent: 2500, startDaysAgo: 60,
      paymentStatus: 'current' as const, cleaningFee: 175,
      coSigner: null,
    },
    {
      id: 'lease-5', unitId: 'unit-9', tenantId: 'renter-5', rent: 3500, startDaysAgo: 120,
      paymentStatus: 'current' as const, cleaningFee: 250,
      coSigner: { name: 'Michael Davis', email: 'michael.davis@demo.com', phone: '(424) 555-9003' },
    },
    {
      id: 'lease-6', unitId: 'unit-12', tenantId: 'renter-6', rent: 5000, startDaysAgo: 200,
      paymentStatus: 'current' as const, cleaningFee: 400,
      coSigner: null,
    },
    {
      id: 'lease-7', unitId: 'unit-15', tenantId: 'renter-7', rent: 2000, startDaysAgo: 45,
      paymentStatus: 'current' as const, cleaningFee: 150,
      coSigner: null,
    },
    {
      id: 'lease-8', unitId: 'unit-16', tenantId: 'renter-8', rent: 2000, startDaysAgo: 300,
      paymentStatus: 'delinquent' as const, cleaningFee: 150,
      coSigner: { name: 'Patricia Moore', email: 'patricia.moore@demo.com', phone: '(818) 555-9004' },
    },
    {
      id: 'lease-9', unitId: 'unit-19', tenantId: 'renter-9', rent: 5500, startDaysAgo: 150,
      paymentStatus: 'current' as const, cleaningFee: 500,
      coSigner: null,
    },
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
        paymentStatus: lease.paymentStatus,
        startDate,
        endDate,
        monthlyRent: dollarsToCents(lease.rent),
        securityDeposit: dollarsToCents(lease.rent),
        cleaningFee: dollarsToCents(lease.cleaningFee),
        lateFeeAmount: dollarsToCents(50),
        lateFeeGraceDays: 5,
        moveInDate: startDate,
        petPolicy: 'cats_and_dogs',
        petDeposit: dollarsToCents(500),
        parkingSpaces: 1,
        coSignerName: lease.coSigner?.name || null,
        coSignerEmail: lease.coSigner?.email || null,
        coSignerPhone: lease.coSigner?.phone || null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      console.log(`  Created lease: ${lease.tenantId} in ${lease.unitId}`);
    } else {
      // Update with new rent roll fields
      await db.update(leases).set({
        paymentStatus: lease.paymentStatus,
        cleaningFee: dollarsToCents(lease.cleaningFee),
        coSignerName: lease.coSigner?.name || null,
        coSignerEmail: lease.coSigner?.email || null,
        coSignerPhone: lease.coSigner?.phone || null,
        updatedAt: timestamp,
      }).where(eq(leases.id, lease.id));
    }
  }

  // ========================================
  // LEASE CHARGES (utilities and other recurring charges)
  // ========================================
  console.log('\nCreating lease charges...');

  // Define charges per lease - rent is already tracked in lease, so we add utilities
  const leaseChargesData = [
    // Lease 1 (unit-1): Water/Trash fixed, Electricity variable
    { id: 'charge-1-wt', leaseId: 'lease-1', category: 'water_trash' as const, name: 'Water & Trash', amountType: 'fixed' as const, fixedAmount: 75, estimatedAmount: null },
    { id: 'charge-1-elec', leaseId: 'lease-1', category: 'electricity' as const, name: 'Electric', amountType: 'variable' as const, fixedAmount: null, estimatedAmount: 85 },

    // Lease 2 (unit-2): All utilities included as fixed
    { id: 'charge-2-wt', leaseId: 'lease-2', category: 'water_trash' as const, name: 'Water & Trash', amountType: 'fixed' as const, fixedAmount: 80, estimatedAmount: null },
    { id: 'charge-2-elec', leaseId: 'lease-2', category: 'electricity' as const, name: 'Electric', amountType: 'fixed' as const, fixedAmount: 120, estimatedAmount: null },

    // Lease 3 (unit-5): Townhouse with higher utilities
    { id: 'charge-3-wt', leaseId: 'lease-3', category: 'water_trash' as const, name: 'Water & Trash', amountType: 'fixed' as const, fixedAmount: 100, estimatedAmount: null },
    { id: 'charge-3-elec', leaseId: 'lease-3', category: 'electricity' as const, name: 'Electric', amountType: 'variable' as const, fixedAmount: null, estimatedAmount: 150 },
    { id: 'charge-3-gas', leaseId: 'lease-3', category: 'gas' as const, name: 'Gas', amountType: 'variable' as const, fixedAmount: null, estimatedAmount: 60 },

    // Lease 4 (unit-8): Marina View - utilities included
    { id: 'charge-4-wt', leaseId: 'lease-4', category: 'water_trash' as const, name: 'Water & Trash', amountType: 'fixed' as const, fixedAmount: 65, estimatedAmount: null },
    { id: 'charge-4-elec', leaseId: 'lease-4', category: 'electricity' as const, name: 'Electric', amountType: 'fixed' as const, fixedAmount: 95, estimatedAmount: null },

    // Lease 5 (unit-9): Variable electricity
    { id: 'charge-5-wt', leaseId: 'lease-5', category: 'water_trash' as const, name: 'Water & Trash', amountType: 'fixed' as const, fixedAmount: 85, estimatedAmount: null },
    { id: 'charge-5-elec', leaseId: 'lease-5', category: 'electricity' as const, name: 'Electric', amountType: 'variable' as const, fixedAmount: null, estimatedAmount: 130 },

    // Lease 6 (unit-12): Downtown Loft - high utilities, includes parking
    { id: 'charge-6-wt', leaseId: 'lease-6', category: 'water_trash' as const, name: 'Water & Trash', amountType: 'fixed' as const, fixedAmount: 90, estimatedAmount: null },
    { id: 'charge-6-elec', leaseId: 'lease-6', category: 'electricity' as const, name: 'Electric', amountType: 'variable' as const, fixedAmount: null, estimatedAmount: 175 },
    { id: 'charge-6-parking', leaseId: 'lease-6', category: 'parking' as const, name: 'Parking Spot', amountType: 'fixed' as const, fixedAmount: 200, estimatedAmount: null },

    // Lease 7 (unit-15): Valley Gardens - modest utilities
    { id: 'charge-7-wt', leaseId: 'lease-7', category: 'water_trash' as const, name: 'Water & Trash', amountType: 'fixed' as const, fixedAmount: 55, estimatedAmount: null },
    { id: 'charge-7-elec', leaseId: 'lease-7', category: 'electricity' as const, name: 'Electric', amountType: 'fixed' as const, fixedAmount: 75, estimatedAmount: null },

    // Lease 8 (unit-16): Similar to unit-15
    { id: 'charge-8-wt', leaseId: 'lease-8', category: 'water_trash' as const, name: 'Water & Trash', amountType: 'fixed' as const, fixedAmount: 55, estimatedAmount: null },
    { id: 'charge-8-elec', leaseId: 'lease-8', category: 'electricity' as const, name: 'Electric', amountType: 'fixed' as const, fixedAmount: 75, estimatedAmount: null },

    // Lease 9 (unit-19): Large estate - high utilities, pet fee
    { id: 'charge-9-wt', leaseId: 'lease-9', category: 'water_trash' as const, name: 'Water & Trash', amountType: 'fixed' as const, fixedAmount: 125, estimatedAmount: null },
    { id: 'charge-9-elec', leaseId: 'lease-9', category: 'electricity' as const, name: 'Electric', amountType: 'variable' as const, fixedAmount: null, estimatedAmount: 225 },
    { id: 'charge-9-gas', leaseId: 'lease-9', category: 'gas' as const, name: 'Gas', amountType: 'variable' as const, fixedAmount: null, estimatedAmount: 85 },
    { id: 'charge-9-pet', leaseId: 'lease-9', category: 'pet_fee' as const, name: 'Pet Fee', amountType: 'fixed' as const, fixedAmount: 50, estimatedAmount: null },
  ];

  for (const charge of leaseChargesData) {
    const existing = await db.select().from(leaseCharges).where(eq(leaseCharges.id, charge.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(leaseCharges).values({
        id: charge.id,
        leaseId: charge.leaseId,
        category: charge.category,
        name: charge.name,
        amountType: charge.amountType,
        fixedAmount: charge.fixedAmount ? dollarsToCents(charge.fixedAmount) : null,
        estimatedAmount: charge.estimatedAmount ? dollarsToCents(charge.estimatedAmount) : null,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  }
  console.log(`  Created ${leaseChargesData.length} lease charges`);

  // ========================================
  // RENT PAYMENTS (24 months of historical data)
  // ========================================
  console.log('\nCreating rent payments (24 months of history)...');

  // Helper to get month start/end
  const getMonthBounds = (monthsAgo: number) => {
    const start = new Date();
    start.setMonth(start.getMonth() - monthsAgo);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  // Payment methods to vary the data
  const paymentMethods: Array<'ach' | 'check' | 'card' | 'cash'> = ['ach', 'check', 'card', 'cash'];

  // Extended lease history - simulate that some leases started earlier for historical data
  const leaseHistoryMonths: Record<string, number> = {
    'lease-1': 24,  // Alice has been here 2 years
    'lease-2': 18,  // Bob for 18 months
    'lease-3': 24,  // Carol for 2 years
    'lease-4': 12,  // David for 1 year
    'lease-5': 20,  // Emma for 20 months
    'lease-6': 24,  // Frank for 2 years
    'lease-7': 15,  // Grace for 15 months
    'lease-8': 24,  // Henry for 2 years (has issues)
    'lease-9': 18,  // Iris for 18 months
  };

  // Create 24 months of historical payments for each lease
  for (const lease of leasesData) {
    const monthsOfHistory = leaseHistoryMonths[lease.id] || Math.min(24, Math.floor(lease.startDaysAgo / 30));

    for (let monthsAgo = 0; monthsAgo <= monthsOfHistory; monthsAgo++) {
      const paymentId = `payment-${lease.id}-m${monthsAgo}`;
      const existing = await db.select().from(rentPayments).where(eq(rentPayments.id, paymentId)).limit(1);

      if (existing.length === 0) {
        const { start: periodStart, end: periodEnd } = getMonthBounds(monthsAgo);
        const dueDate = new Date(periodStart);
        dueDate.setDate(1);

        // Vary payment status - mostly paid, some late, some partial
        let status: 'paid' | 'late' | 'partial' | 'due' = 'paid';
        let amountPaid = dollarsToCents(lease.rent);
        let lateFee = 0;
        let paidAt: Date | null = new Date(periodStart);
        paidAt.setDate(3 + Math.floor(Math.random() * 5)); // Paid between 3rd-7th

        // Add variety for realistic data
        // Late payments scattered through history
        const isLateMonth = (monthsAgo % 7 === 3 && lease.id === 'lease-2') ||
                          (monthsAgo % 11 === 5 && lease.id === 'lease-8') ||
                          (monthsAgo === 14 && lease.id === 'lease-5');

        // Partial payments occasionally
        const isPartialMonth = (monthsAgo % 9 === 2 && lease.id === 'lease-7') ||
                              (monthsAgo === 8 && lease.id === 'lease-8') ||
                              (monthsAgo === 16 && lease.id === 'lease-3');

        if (isLateMonth) {
          status = 'late';
          lateFee = dollarsToCents(50);
          paidAt.setDate(12 + Math.floor(Math.random() * 5)); // Paid late
        } else if (isPartialMonth) {
          status = 'partial';
          amountPaid = dollarsToCents(lease.rent * (0.4 + Math.random() * 0.3)); // 40-70% paid
        } else if (monthsAgo === 0) {
          // Current month - some not yet paid
          if (lease.id === 'lease-8') {
            status = 'due';
            amountPaid = 0;
            paidAt = null;
          }
        }

        await db.insert(rentPayments).values({
          id: paymentId,
          leaseId: lease.id,
          periodStart,
          periodEnd,
          dueDate,
          amountDue: dollarsToCents(lease.rent),
          amountPaid,
          lateFee,
          status,
          paidAt,
          paymentMethod: paidAt ? paymentMethods[Math.floor(Math.random() * paymentMethods.length)] : null,
          createdAt: periodStart,
          updatedAt: timestamp,
        });
      }
    }
    console.log(`  Created ${monthsOfHistory + 1} payments for lease: ${lease.id}`);
  }

  // ========================================
  // PAYMENT LINE ITEMS (breakdown by category)
  // ========================================
  console.log('\nCreating payment line items (24 months)...');

  // Build a map of lease charges per lease
  const chargesByLease = new Map<string, typeof leaseChargesData>();
  for (const charge of leaseChargesData) {
    if (!chargesByLease.has(charge.leaseId)) {
      chargesByLease.set(charge.leaseId, []);
    }
    chargesByLease.get(charge.leaseId)!.push(charge);
  }

  // Create line items for each payment
  let lineItemCount = 0;
  for (const lease of leasesData) {
    const monthsOfHistory = leaseHistoryMonths[lease.id] || Math.min(24, Math.floor(lease.startDaysAgo / 30));
    const charges = chargesByLease.get(lease.id) || [];

    for (let monthsAgo = 0; monthsAgo <= monthsOfHistory; monthsAgo++) {
      const paymentId = `payment-${lease.id}-m${monthsAgo}`;
      const { start: periodStart } = getMonthBounds(monthsAgo);

      // Determine if this payment was paid (matching rent payments logic)
      let paymentPaid = true;
      let partialPayment = false;
      const isPartialMonth = (monthsAgo % 9 === 2 && lease.id === 'lease-7') ||
                            (monthsAgo === 8 && lease.id === 'lease-8') ||
                            (monthsAgo === 16 && lease.id === 'lease-3');
      if (monthsAgo === 0 && lease.id === 'lease-8') {
        paymentPaid = false;
      } else if (isPartialMonth) {
        partialPayment = true;
      }

      // Add rent line item
      const rentLineItemId = `line-${paymentId}-rent`;
      const existingRentLine = await db.select().from(paymentLineItems).where(eq(paymentLineItems.id, rentLineItemId)).limit(1);
      if (existingRentLine.length === 0) {
        const rentDue = dollarsToCents(lease.rent);
        const rentPaid = partialPayment ? Math.floor(rentDue * 0.5) : (paymentPaid ? rentDue : 0);
        await db.insert(paymentLineItems).values({
          id: rentLineItemId,
          rentPaymentId: paymentId,
          leaseChargeId: null, // Rent is not a separate charge
          category: 'rent',
          name: 'Rent',
          amountDue: rentDue,
          amountPaid: rentPaid,
          createdAt: periodStart,
        });
        lineItemCount++;
      }

      // Add line items for each charge
      for (const charge of charges) {
        const lineItemId = `line-${paymentId}-${charge.category}`;
        const existingLine = await db.select().from(paymentLineItems).where(eq(paymentLineItems.id, lineItemId)).limit(1);
        if (existingLine.length === 0) {
          // For variable charges, add some variation (+/- 20%)
          let amountDue = charge.fixedAmount || charge.estimatedAmount || 0;
          if (charge.amountType === 'variable' && charge.estimatedAmount) {
            const variance = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
            amountDue = Math.round(charge.estimatedAmount * variance);
          }
          amountDue = dollarsToCents(amountDue);

          const amountPaid = partialPayment ? Math.floor(amountDue * 0.5) : (paymentPaid ? amountDue : 0);

          await db.insert(paymentLineItems).values({
            id: lineItemId,
            rentPaymentId: paymentId,
            leaseChargeId: charge.id,
            category: charge.category,
            name: charge.name,
            amountDue,
            amountPaid,
            createdAt: periodStart,
          });
          lineItemCount++;
        }
      }

      // Add late fee line item if applicable (matching rent payments logic)
      const isLateMonth = (monthsAgo % 7 === 3 && lease.id === 'lease-2') ||
                        (monthsAgo % 11 === 5 && lease.id === 'lease-8') ||
                        (monthsAgo === 14 && lease.id === 'lease-5');
      if (isLateMonth) {
        const lateFeeLineItemId = `line-${paymentId}-late_fee`;
        const existingLateLine = await db.select().from(paymentLineItems).where(eq(paymentLineItems.id, lateFeeLineItemId)).limit(1);
        if (existingLateLine.length === 0) {
          await db.insert(paymentLineItems).values({
            id: lateFeeLineItemId,
            rentPaymentId: paymentId,
            leaseChargeId: null,
            category: 'late_fee',
            name: 'Late Fee',
            amountDue: dollarsToCents(50),
            amountPaid: dollarsToCents(50),
            createdAt: periodStart,
          });
          lineItemCount++;
        }
      }
    }
  }
  console.log(`  Created ${lineItemCount} payment line items`);

  // ========================================
  // APPLICATIONS (various statuses and applicants)
  // ========================================
  console.log('\nCreating applications...');

  const applicationsData = [
    // Jack Anderson - active applicant looking for places
    {
      id: 'app-1', unitId: 'unit-3', applicantId: 'renter-10', status: 'submitted' as const,
      firstName: 'Jack', lastName: 'Anderson', phone: '555-0110',
      employer: 'Tech Corp', income: 8000, daysAgo: 3,
    },
    {
      id: 'app-2', unitId: 'unit-6', applicantId: 'renter-10', status: 'under_review' as const,
      firstName: 'Jack', lastName: 'Anderson', phone: '555-0110',
      employer: 'Tech Corp', income: 8000, daysAgo: 7,
    },
    {
      id: 'app-3', unitId: 'unit-10', applicantId: 'renter-10', status: 'draft' as const,
      firstName: 'Jack', lastName: 'Anderson', phone: '555-0110',
      employer: 'Tech Corp', income: 8000, daysAgo: 1,
    },
    // Historical applications - approved (led to current leases)
    {
      id: 'app-4', unitId: 'unit-1', applicantId: 'renter-1', status: 'approved' as const,
      firstName: 'Alice', lastName: 'Johnson', phone: '555-0101',
      employer: 'Finance Inc', income: 6500, daysAgo: 200, decidedBy: 'landlord-1',
    },
    {
      id: 'app-5', unitId: 'unit-8', applicantId: 'renter-4', status: 'approved' as const,
      firstName: 'David', lastName: 'Brown', phone: '555-0104',
      employer: 'Healthcare Co', income: 7200, daysAgo: 75, decidedBy: 'manager-1',
    },
    // Rejected application
    {
      id: 'app-6', unitId: 'unit-13', applicantId: 'renter-10', status: 'rejected' as const,
      firstName: 'Jack', lastName: 'Anderson', phone: '555-0110',
      employer: 'Tech Corp', income: 8000, daysAgo: 30, decidedBy: 'manager-1',
      decisionNotes: 'Income to rent ratio below minimum threshold for this unit',
    },
    // Withdrawn application
    {
      id: 'app-7', unitId: 'unit-20', applicantId: 'renter-10', status: 'withdrawn' as const,
      firstName: 'Jack', lastName: 'Anderson', phone: '555-0110',
      employer: 'Tech Corp', income: 8000, daysAgo: 45,
    },
  ];

  for (const app of applicationsData) {
    const existing = await db.select().from(applications).where(eq(applications.id, app.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(applications).values({
        id: app.id,
        unitId: app.unitId,
        applicantId: app.applicantId,
        status: app.status,
        firstName: app.firstName,
        lastName: app.lastName,
        phone: app.phone,
        currentAddress: '999 Current Ave',
        currentCity: 'Los Angeles',
        currentState: 'CA',
        currentZip: '90001',
        employer: app.employer,
        monthlyIncome: dollarsToCents(app.income),
        hasPets: app.applicantId === 'renter-4',
        pets: app.applicantId === 'renter-4' ? [{ type: 'Dog', breed: 'Golden Retriever', weight: 65 }] : null,
        additionalOccupants: app.applicantId === 'renter-1' ? [{ name: 'Tom Johnson', relationship: 'Spouse', age: 32 }] : null,
        references: [
          { name: 'Jane Doe', relationship: 'Former Landlord', phone: '555-9999' },
          { name: 'John Smith', relationship: 'Employer', phone: '555-8888' },
        ],
        backgroundCheckConsent: app.status !== 'draft',
        backgroundCheckConsentDate: app.status !== 'draft' ? daysAgo(app.daysAgo) : null,
        submittedAt: app.status !== 'draft' ? daysAgo(app.daysAgo) : null,
        decidedBy: (app as any).decidedBy || null,
        decidedAt: (app as any).decidedBy ? daysAgo(app.daysAgo - 2) : null,
        decisionNotes: (app as any).decisionNotes || null,
        createdAt: daysAgo(app.daysAgo + 2),
        updatedAt: timestamp,
      });
      console.log(`  Created application: ${app.firstName} ${app.lastName} for ${app.unitId} (${app.status})`);
    }
  }

  // ========================================
  // APPLICATION DOCUMENTS
  // ========================================
  console.log('\nCreating application documents...');

  const appDocsData = [
    // Jack's submitted application documents
    { id: 'appdoc-1', applicationId: 'app-1', type: 'id' as const, fileName: 'drivers_license.pdf', url: '/demo/docs/id-jack.pdf' },
    { id: 'appdoc-2', applicationId: 'app-1', type: 'pay_stub' as const, fileName: 'paystub_dec.pdf', url: '/demo/docs/paystub-jack-1.pdf' },
    { id: 'appdoc-3', applicationId: 'app-1', type: 'pay_stub' as const, fileName: 'paystub_nov.pdf', url: '/demo/docs/paystub-jack-2.pdf' },
    { id: 'appdoc-4', applicationId: 'app-1', type: 'bank_statement' as const, fileName: 'bank_statement_q4.pdf', url: '/demo/docs/bank-jack.pdf' },
    // Under review application
    { id: 'appdoc-5', applicationId: 'app-2', type: 'id' as const, fileName: 'drivers_license.pdf', url: '/demo/docs/id-jack.pdf' },
    { id: 'appdoc-6', applicationId: 'app-2', type: 'pay_stub' as const, fileName: 'paystub_recent.pdf', url: '/demo/docs/paystub-jack-3.pdf' },
    { id: 'appdoc-7', applicationId: 'app-2', type: 'reference_letter' as const, fileName: 'landlord_reference.pdf', url: '/demo/docs/ref-jack.pdf' },
    // Historical approved application
    { id: 'appdoc-8', applicationId: 'app-4', type: 'id' as const, fileName: 'passport.pdf', url: '/demo/docs/id-alice.pdf' },
    { id: 'appdoc-9', applicationId: 'app-4', type: 'tax_return' as const, fileName: 'tax_return_2024.pdf', url: '/demo/docs/tax-alice.pdf' },
    { id: 'appdoc-10', applicationId: 'app-5', type: 'id' as const, fileName: 'state_id.pdf', url: '/demo/docs/id-david.pdf' },
    { id: 'appdoc-11', applicationId: 'app-5', type: 'pay_stub' as const, fileName: 'paystub.pdf', url: '/demo/docs/paystub-david.pdf' },
  ];

  for (const doc of appDocsData) {
    const existing = await db.select().from(applicationDocuments).where(eq(applicationDocuments.id, doc.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(applicationDocuments).values({
        id: doc.id,
        applicationId: doc.applicationId,
        documentType: doc.type,
        fileName: doc.fileName,
        fileUrl: doc.url,
        uploadedAt: daysAgo(5),
      });
      console.log(`  Added document to ${doc.applicationId}: ${doc.fileName}`);
    }
  }

  // ========================================
  // MAINTENANCE REQUESTS
  // ========================================
  console.log('\nCreating maintenance requests...');

  const maintenanceData = [
    // Completed requests
    { id: 'maint-1', unitId: 'unit-1', requestedBy: 'renter-1', title: 'Leaky faucet in bathroom', category: 'plumbing' as const, priority: 'medium' as const, status: 'completed' as const, daysAgo: 15, description: 'The bathroom sink faucet has been dripping constantly for the past week. Water is pooling under the cabinet.' },
    { id: 'maint-7', unitId: 'unit-5', requestedBy: 'renter-3', title: 'Garage door opener malfunction', category: 'electrical' as const, priority: 'medium' as const, status: 'completed' as const, daysAgo: 30, description: 'Garage door opener stopped working. Remote control batteries replaced but still not functioning.' },
    { id: 'maint-8', unitId: 'unit-12', requestedBy: 'renter-6', title: 'Light fixture replacement', category: 'electrical' as const, priority: 'low' as const, status: 'completed' as const, daysAgo: 45, description: 'Kitchen pendant light is flickering and needs to be replaced.' },
    // In progress
    { id: 'maint-2', unitId: 'unit-2', requestedBy: 'renter-2', title: 'AC not cooling properly', category: 'hvac' as const, priority: 'high' as const, status: 'in_progress' as const, assignedTo: 'maintenance-1', daysAgo: 3, description: 'Air conditioning unit is running but not cooling the apartment. Temperature stays around 78°F even when set to 68°F.' },
    { id: 'maint-4', unitId: 'unit-7', requestedBy: 'landlord-1', title: 'Full renovation before listing', category: 'other' as const, priority: 'medium' as const, status: 'in_progress' as const, assignedTo: 'maintenance-1', daysAgo: 10, description: 'Unit needs complete refresh before being listed. Paint, deep clean, and minor repairs needed.' },
    // Pending parts
    { id: 'maint-5', unitId: 'unit-9', requestedBy: 'renter-5', title: 'Dishwasher not draining', category: 'appliance' as const, priority: 'medium' as const, status: 'pending_parts' as const, assignedTo: 'maintenance-1', daysAgo: 7, description: 'Dishwasher leaves standing water at the bottom after each cycle. Tried running garbage disposal but issue persists.' },
    { id: 'maint-9', unitId: 'unit-16', requestedBy: 'renter-8', title: 'Refrigerator ice maker broken', category: 'appliance' as const, priority: 'low' as const, status: 'pending_parts' as const, assignedTo: 'maintenance-1', daysAgo: 12, description: 'Ice maker stopped producing ice. Water dispenser works fine.' },
    // Open/new requests
    { id: 'maint-3', unitId: 'unit-5', requestedBy: 'renter-3', title: 'Broken window latch', category: 'structural' as const, priority: 'low' as const, status: 'open' as const, daysAgo: 2, description: 'Master bedroom window latch is broken. Window can still close but does not lock securely.' },
    { id: 'maint-10', unitId: 'unit-8', requestedBy: 'renter-4', title: 'Clogged bathroom drain', category: 'plumbing' as const, priority: 'medium' as const, status: 'open' as const, daysAgo: 1, description: 'Shower drain is very slow. Water pools up to ankle level during showers.' },
    // Acknowledged
    { id: 'maint-6', unitId: 'unit-15', requestedBy: 'renter-7', title: 'Pest control needed', category: 'pest' as const, priority: 'high' as const, status: 'acknowledged' as const, daysAgo: 4, description: 'Seeing small ants in the kitchen near the sink area. Also noticed a few near the garbage.' },
    { id: 'maint-11', unitId: 'unit-19', requestedBy: 'renter-9', title: 'Smoke detector beeping', category: 'security' as const, priority: 'medium' as const, status: 'acknowledged' as const, daysAgo: 1, description: 'Smoke detector in hallway beeps intermittently. Replaced battery but issue continues.' },
    // Cancelled request
    { id: 'maint-12', unitId: 'unit-2', requestedBy: 'renter-2', title: 'Toilet running constantly', category: 'plumbing' as const, priority: 'medium' as const, status: 'cancelled' as const, daysAgo: 20, description: 'Toilet in guest bathroom was running. Issue resolved on its own - flapper was just stuck.' },
  ];

  for (const maint of maintenanceData) {
    const existing = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, maint.id)).limit(1);
    if (existing.length === 0) {
      const createdDate = daysAgo(maint.daysAgo);
      await db.insert(maintenanceRequests).values({
        id: maint.id,
        unitId: maint.unitId,
        requestedBy: maint.requestedBy,
        title: maint.title,
        description: maint.description,
        category: maint.category,
        priority: maint.priority,
        status: maint.status,
        assignedTo: (maint as any).assignedTo || null,
        assignedAt: (maint as any).assignedTo ? daysAgo(maint.daysAgo - 1) : null,
        completedAt: maint.status === 'completed' ? daysAgo(maint.daysAgo - 3) : null,
        completedBy: maint.status === 'completed' ? 'maintenance-1' : null,
        resolutionSummary: maint.status === 'completed' ? 'Issue resolved successfully. Replaced faulty component and tested operation.' : null,
        permissionToEnter: true,
        estimatedCost: maint.status === 'completed' ? dollarsToCents(75 + Math.floor(Math.random() * 200)) : null,
        actualCost: maint.status === 'completed' ? dollarsToCents(50 + Math.floor(Math.random() * 250)) : null,
        rating: maint.status === 'completed' ? 4 + Math.floor(Math.random() * 2) : null,
        createdAt: createdDate,
        updatedAt: timestamp,
      });
      console.log(`  Created maintenance request: ${maint.title} (${maint.status})`);
    }
  }

  // ========================================
  // MAINTENANCE COMMENTS
  // ========================================
  console.log('\nCreating maintenance comments...');

  const commentsData = [
    // AC not cooling - conversation thread
    { id: 'comment-1', requestId: 'maint-2', authorId: 'renter-2', content: 'The temperature is getting worse. Can someone come today?', isInternal: false, daysAgo: 3 },
    { id: 'comment-2', requestId: 'maint-2', authorId: 'manager-2', content: 'I\'ve assigned Joe to look at this today. He should arrive between 2-4pm.', isInternal: false, daysAgo: 3 },
    { id: 'comment-3', requestId: 'maint-2', authorId: 'maintenance-1', content: 'Checked the unit, compressor needs refrigerant. Will return tomorrow with supplies.', isInternal: false, daysAgo: 2 },
    { id: 'comment-4', requestId: 'maint-2', authorId: 'manager-1', content: 'Please prioritize this - tenant mentioned they have health concerns.', isInternal: true, daysAgo: 2 },
    { id: 'comment-5', requestId: 'maint-2', authorId: 'maintenance-1', content: 'Returning at 10am tomorrow to add refrigerant.', isInternal: false, daysAgo: 1 },
    // Dishwasher - parts pending
    { id: 'comment-6', requestId: 'maint-5', authorId: 'maintenance-1', content: 'Diagnosed the issue - drain pump motor is failing. Need to order replacement part.', isInternal: false, daysAgo: 5 },
    { id: 'comment-7', requestId: 'maint-5', authorId: 'maintenance-1', content: 'Ordered replacement pump, expected in 3-5 days.', isInternal: false, daysAgo: 4 },
    { id: 'comment-8', requestId: 'maint-5', authorId: 'renter-5', content: 'Thanks for the update! Is there anything I should avoid doing with the dishwasher in the meantime?', isInternal: false, daysAgo: 4 },
    { id: 'comment-9', requestId: 'maint-5', authorId: 'maintenance-1', content: 'Best to not use it until we can replace the pump. I\'ll update you when the part arrives.', isInternal: false, daysAgo: 3 },
    // Completed request - full thread
    { id: 'comment-10', requestId: 'maint-1', authorId: 'maintenance-1', content: 'Heading over now to assess the leak.', isInternal: false, daysAgo: 14 },
    { id: 'comment-11', requestId: 'maint-1', authorId: 'maintenance-1', content: 'Found the issue - worn washer in the faucet. Replaced it and tested. No more leak!', isInternal: false, daysAgo: 13 },
    { id: 'comment-12', requestId: 'maint-1', authorId: 'renter-1', content: 'Perfect, thank you so much! All fixed now.', isInternal: false, daysAgo: 13 },
    // Pest control - internal notes
    { id: 'comment-13', requestId: 'maint-6', authorId: 'manager-3', content: 'Scheduling pest control service for Wednesday.', isInternal: true, daysAgo: 3 },
    { id: 'comment-14', requestId: 'maint-6', authorId: 'manager-3', content: 'Tenant notified. Pest control confirmed for Wed 9am.', isInternal: false, daysAgo: 2 },
    // Renovation project updates
    { id: 'comment-15', requestId: 'maint-4', authorId: 'maintenance-1', content: 'Started prep work. Walls need patching in living room and bedroom.', isInternal: false, daysAgo: 8 },
    { id: 'comment-16', requestId: 'maint-4', authorId: 'landlord-1', content: 'Please also check the bathroom grout while you\'re there.', isInternal: false, daysAgo: 7 },
    { id: 'comment-17', requestId: 'maint-4', authorId: 'maintenance-1', content: 'Good call - grout needs resealing. Adding to the list.', isInternal: false, daysAgo: 7 },
  ];

  for (const comment of commentsData) {
    const existing = await db.select().from(maintenanceComments).where(eq(maintenanceComments.id, comment.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(maintenanceComments).values({
        id: comment.id,
        requestId: comment.requestId,
        authorId: comment.authorId,
        content: comment.content,
        isInternal: comment.isInternal,
        createdAt: daysAgo(comment.daysAgo),
      });
    }
  }
  console.log(`  Created ${commentsData.length} maintenance comments`);

  // ========================================
  // AUDIT LOGS
  // ========================================
  console.log('\nCreating audit logs...');

  const auditLogsData = [
    // Recent login activity
    { id: 'audit-1', userId: 'renter-1', action: 'auth.login' as const, entityType: 'user' as const, entityId: 'renter-1', description: 'User logged in successfully', daysAgo: 0 },
    { id: 'audit-2', userId: 'landlord-1', action: 'auth.login' as const, entityType: 'user' as const, entityId: 'landlord-1', description: 'User logged in successfully', daysAgo: 0 },
    { id: 'audit-3', userId: 'manager-1', action: 'auth.login' as const, entityType: 'user' as const, entityId: 'manager-1', description: 'User logged in successfully', daysAgo: 1 },
    { id: 'audit-4', userId: 'maintenance-1', action: 'auth.login' as const, entityType: 'user' as const, entityId: 'maintenance-1', description: 'User logged in successfully', daysAgo: 1 },
    // Application workflow
    { id: 'audit-5', userId: 'renter-10', action: 'application.submitted' as const, entityType: 'application' as const, entityId: 'app-1', description: 'Application submitted for unit 201', daysAgo: 3 },
    { id: 'audit-6', userId: 'manager-1', action: 'application.reviewed' as const, entityType: 'application' as const, entityId: 'app-2', description: 'Application moved to under review', daysAgo: 5 },
    { id: 'audit-7', userId: 'landlord-1', action: 'application.approved' as const, entityType: 'application' as const, entityId: 'app-4', description: 'Application approved - lease offer sent', daysAgo: 198 },
    { id: 'audit-8', userId: 'manager-1', action: 'application.rejected' as const, entityType: 'application' as const, entityId: 'app-6', description: 'Application rejected - income requirements not met', daysAgo: 28 },
    // Lease events
    { id: 'audit-9', userId: 'landlord-1', action: 'lease.created' as const, entityType: 'lease' as const, entityId: 'lease-1', description: 'New lease created for unit 101', daysAgo: 180 },
    { id: 'audit-10', userId: 'renter-1', action: 'lease.activated' as const, entityType: 'lease' as const, entityId: 'lease-1', description: 'Lease signed and activated', daysAgo: 179 },
    // Payment activity
    { id: 'audit-11', userId: 'renter-1', action: 'payment.recorded' as const, entityType: 'payment' as const, entityId: 'payment-lease-1-m0', description: 'Rent payment of $1,800 received', daysAgo: 2 },
    { id: 'audit-12', userId: 'renter-2', action: 'payment.recorded' as const, entityType: 'payment' as const, entityId: 'payment-lease-2-m0', description: 'Rent payment of $2,400 received', daysAgo: 3 },
    { id: 'audit-13', userId: 'manager-2', action: 'late_fee.applied' as const, entityType: 'payment' as const, entityId: 'payment-lease-2-m3', description: 'Late fee of $50 applied to payment', daysAgo: 90 },
    // Maintenance activity
    { id: 'audit-14', userId: 'renter-2', action: 'maintenance.created' as const, entityType: 'maintenance' as const, entityId: 'maint-2', description: 'New maintenance request: AC not cooling', daysAgo: 3 },
    { id: 'audit-15', userId: 'manager-2', action: 'maintenance.assigned' as const, entityType: 'maintenance' as const, entityId: 'maint-2', description: 'Request assigned to Joe Fix-It', daysAgo: 3 },
    { id: 'audit-16', userId: 'maintenance-1', action: 'maintenance.updated' as const, entityType: 'maintenance' as const, entityId: 'maint-2', description: 'Status changed to in_progress', daysAgo: 2 },
    { id: 'audit-17', userId: 'maintenance-1', action: 'maintenance.completed' as const, entityType: 'maintenance' as const, entityId: 'maint-1', description: 'Maintenance request completed', daysAgo: 13 },
    { id: 'audit-18', userId: 'maintenance-1', action: 'maintenance.comment_added' as const, entityType: 'maintenance' as const, entityId: 'maint-5', description: 'Comment added to maintenance request', daysAgo: 4 },
    // Property/unit changes
    { id: 'audit-19', userId: 'landlord-1', action: 'unit.updated' as const, entityType: 'unit' as const, entityId: 'unit-3', description: 'Unit status changed to available', daysAgo: 15 },
    { id: 'audit-20', userId: 'manager-1', action: 'property.updated' as const, entityType: 'property' as const, entityId: 'prop-3', description: 'Property description updated', daysAgo: 30 },
    // Organization events
    { id: 'audit-21', userId: 'manager-2', action: 'org.member_added' as const, entityType: 'organization' as const, entityId: 'org-pm-only', description: 'Maria Santos added as manager', daysAgo: 60, orgId: 'org-pm-only' },
    { id: 'audit-22', userId: 'landlord-2', action: 'org.member_added' as const, entityType: 'organization' as const, entityId: 'org-landlord-pm', description: 'Lisa Chen added as manager', daysAgo: 90, orgId: 'org-landlord-pm' },
  ];

  for (const log of auditLogsData) {
    const existing = await db.select().from(auditLogs).where(eq(auditLogs.id, log.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(auditLogs).values({
        id: log.id,
        userId: log.userId,
        userEmail: `${log.userId.replace('-', '.')}@demo.com`,
        organizationId: (log as any).orgId || null,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        description: log.description,
        ipAddress: '192.168.1.' + Math.floor(Math.random() * 255),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        createdAt: daysAgo(log.daysAgo),
      });
    }
  }
  console.log(`  Created ${auditLogsData.length} audit log entries`);

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
