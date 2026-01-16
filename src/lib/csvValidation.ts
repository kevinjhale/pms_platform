// Property types (defined inline to avoid importing from @/db which has server deps)
type PropertyType = 'single_family' | 'multi_family' | 'condo' | 'apartment' | 'townhouse' | 'other';
type UnitStatus = 'available' | 'occupied' | 'maintenance' | 'unlisted';

export interface ParsedRow {
  rowNumber: number;
  property_name: string;
  property_type: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  year_built?: string;
  property_description?: string;
  unit_number?: string;
  bedrooms: string;
  bathrooms: string;
  sqft?: string;
  rent_amount: string;
  deposit_amount?: string;
  status?: string;
  features?: string;
  unit_description?: string;
}

export interface ValidationError {
  row: number;
  column: string;
  value: string;
  message: string;
  severity: 'error' | 'warning';
}

const PROPERTY_TYPES: PropertyType[] = [
  'single_family', 'multi_family', 'apartment', 'condo', 'townhouse', 'other'
];

const UNIT_STATUSES: UnitStatus[] = [
  'available', 'occupied', 'maintenance', 'unlisted'
];

const STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

export function validateRows(rows: ParsedRow[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const propertyKeys = new Map<string, number>(); // Track first occurrence of each property

  for (const row of rows) {
    const rowErrors = validateRow(row);
    errors.push(...rowErrors);

    // Check property consistency
    const propertyKey = `${row.property_name}|${row.address}|${row.city}|${row.state}|${row.zip}`;
    const firstOccurrence = propertyKeys.get(propertyKey);

    if (firstOccurrence === undefined) {
      propertyKeys.set(propertyKey, row.rowNumber);
    }
  }

  // Check for properties with same name but different addresses
  const propertyNames = new Map<string, string[]>();
  for (const row of rows) {
    const key = `${row.address}|${row.city}|${row.state}|${row.zip}`;
    const existing = propertyNames.get(row.property_name);
    if (existing) {
      if (!existing.includes(key)) {
        existing.push(key);
        if (existing.length === 2) {
          errors.push({
            row: row.rowNumber,
            column: 'property_name',
            value: row.property_name,
            message: `Property "${row.property_name}" has multiple addresses. Each property name should have a consistent address.`,
            severity: 'warning',
          });
        }
      }
    } else {
      propertyNames.set(row.property_name, [key]);
    }
  }

  return errors;
}

function validateRow(row: ParsedRow): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!row.property_name?.trim()) {
    errors.push({
      row: row.rowNumber,
      column: 'property_name',
      value: row.property_name || '',
      message: 'Property name is required',
      severity: 'error',
    });
  }

  if (!row.property_type?.trim()) {
    errors.push({
      row: row.rowNumber,
      column: 'property_type',
      value: row.property_type || '',
      message: 'Property type is required',
      severity: 'error',
    });
  } else if (!PROPERTY_TYPES.includes(row.property_type.toLowerCase().trim() as PropertyType)) {
    errors.push({
      row: row.rowNumber,
      column: 'property_type',
      value: row.property_type,
      message: `Invalid property type. Must be one of: ${PROPERTY_TYPES.join(', ')}`,
      severity: 'error',
    });
  }

  if (!row.address?.trim()) {
    errors.push({
      row: row.rowNumber,
      column: 'address',
      value: row.address || '',
      message: 'Address is required',
      severity: 'error',
    });
  }

  if (!row.city?.trim()) {
    errors.push({
      row: row.rowNumber,
      column: 'city',
      value: row.city || '',
      message: 'City is required',
      severity: 'error',
    });
  }

  if (!row.state?.trim()) {
    errors.push({
      row: row.rowNumber,
      column: 'state',
      value: row.state || '',
      message: 'State is required',
      severity: 'error',
    });
  } else {
    const stateUpper = row.state.toUpperCase().trim();
    if (!STATE_CODES.includes(stateUpper)) {
      errors.push({
        row: row.rowNumber,
        column: 'state',
        value: row.state,
        message: 'Invalid state code. Must be a 2-letter US state code (e.g., CA, NY)',
        severity: 'error',
      });
    }
  }

  if (!row.zip?.trim()) {
    errors.push({
      row: row.rowNumber,
      column: 'zip',
      value: row.zip || '',
      message: 'ZIP code is required',
      severity: 'error',
    });
  } else if (!/^\d{5}(-\d{4})?$/.test(row.zip.trim())) {
    errors.push({
      row: row.rowNumber,
      column: 'zip',
      value: row.zip,
      message: 'Invalid ZIP code. Must be 5 digits or 5+4 format (e.g., 90210 or 90210-1234)',
      severity: 'error',
    });
  }

  // Year built (optional but must be valid if provided)
  if (row.year_built?.trim()) {
    const year = parseInt(row.year_built, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1800 || year > currentYear) {
      errors.push({
        row: row.rowNumber,
        column: 'year_built',
        value: row.year_built,
        message: `Invalid year built. Must be between 1800 and ${currentYear}`,
        severity: 'error',
      });
    }
  }

  // Bedrooms (required)
  if (!row.bedrooms?.trim()) {
    errors.push({
      row: row.rowNumber,
      column: 'bedrooms',
      value: row.bedrooms || '',
      message: 'Bedrooms is required',
      severity: 'error',
    });
  } else {
    const beds = parseInt(row.bedrooms, 10);
    if (isNaN(beds) || beds < 0) {
      errors.push({
        row: row.rowNumber,
        column: 'bedrooms',
        value: row.bedrooms,
        message: 'Bedrooms must be a non-negative integer',
        severity: 'error',
      });
    }
  }

  // Bathrooms (required)
  if (!row.bathrooms?.trim()) {
    errors.push({
      row: row.rowNumber,
      column: 'bathrooms',
      value: row.bathrooms || '',
      message: 'Bathrooms is required',
      severity: 'error',
    });
  } else {
    const baths = parseFloat(row.bathrooms);
    if (isNaN(baths) || baths < 0) {
      errors.push({
        row: row.rowNumber,
        column: 'bathrooms',
        value: row.bathrooms,
        message: 'Bathrooms must be a non-negative number',
        severity: 'error',
      });
    }
  }

  // Sqft (optional but must be valid if provided)
  if (row.sqft?.trim()) {
    const sqft = parseInt(row.sqft, 10);
    if (isNaN(sqft) || sqft <= 0) {
      errors.push({
        row: row.rowNumber,
        column: 'sqft',
        value: row.sqft,
        message: 'Square footage must be a positive integer',
        severity: 'error',
      });
    }
  }

  // Rent amount (required)
  if (!row.rent_amount?.trim()) {
    errors.push({
      row: row.rowNumber,
      column: 'rent_amount',
      value: row.rent_amount || '',
      message: 'Rent amount is required',
      severity: 'error',
    });
  } else {
    const rent = parseFloat(row.rent_amount.replace(/[$,]/g, ''));
    if (isNaN(rent) || rent <= 0) {
      errors.push({
        row: row.rowNumber,
        column: 'rent_amount',
        value: row.rent_amount,
        message: 'Rent amount must be a positive number',
        severity: 'error',
      });
    }
  }

  // Deposit amount (optional but must be valid if provided)
  if (row.deposit_amount?.trim()) {
    const deposit = parseFloat(row.deposit_amount.replace(/[$,]/g, ''));
    if (isNaN(deposit) || deposit < 0) {
      errors.push({
        row: row.rowNumber,
        column: 'deposit_amount',
        value: row.deposit_amount,
        message: 'Deposit amount must be a non-negative number',
        severity: 'error',
      });
    }
  }

  // Status (optional but must be valid if provided)
  if (row.status?.trim()) {
    const status = row.status.toLowerCase().trim();
    if (!UNIT_STATUSES.includes(status as UnitStatus)) {
      errors.push({
        row: row.rowNumber,
        column: 'status',
        value: row.status,
        message: `Invalid status. Must be one of: ${UNIT_STATUSES.join(', ')}`,
        severity: 'error',
      });
    }
  }

  return errors;
}

export function hasErrors(errors: ValidationError[]): boolean {
  return errors.some(e => e.severity === 'error');
}

export function getErrorsForRow(errors: ValidationError[], rowNumber: number): ValidationError[] {
  return errors.filter(e => e.row === rowNumber);
}

export const CSV_HEADERS = [
  'property_name',
  'property_type',
  'address',
  'city',
  'state',
  'zip',
  'year_built',
  'property_description',
  'unit_number',
  'bedrooms',
  'bathrooms',
  'sqft',
  'rent_amount',
  'deposit_amount',
  'status',
  'features',
  'unit_description',
];

// Types for import (client-safe versions)
export interface PropertyGroup {
  propertyKey: string;
  propertyData: {
    name: string;
    propertyType: PropertyType;
    address: string;
    city: string;
    state: string;
    zip: string;
    yearBuilt?: number;
    description?: string;
  };
  units: Array<{
    unitNumber?: string;
    bedrooms: number;
    bathrooms: number;
    sqft?: number;
    rentAmount: number;
    depositAmount?: number;
    status: UnitStatus;
    features?: string[];
    description?: string;
  }>;
}

export interface ImportResult {
  propertiesCreated: number;
  unitsCreated: number;
  propertiesFailed: number;
  errors: Array<{ propertyName: string; error: string }>;
}

function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function groupByProperty(rows: ParsedRow[]): PropertyGroup[] {
  const groups = new Map<string, PropertyGroup>();

  for (const row of rows) {
    const propertyKey = `${row.property_name.trim()}|${row.address.trim()}|${row.city.trim()}|${row.state.toUpperCase().trim()}|${row.zip.trim()}`;

    let group = groups.get(propertyKey);
    if (!group) {
      group = {
        propertyKey,
        propertyData: {
          name: row.property_name.trim(),
          propertyType: row.property_type.toLowerCase().trim() as PropertyType,
          address: row.address.trim(),
          city: row.city.trim(),
          state: row.state.toUpperCase().trim(),
          zip: row.zip.trim(),
          yearBuilt: row.year_built ? parseInt(row.year_built, 10) : undefined,
          description: row.property_description?.trim() || undefined,
        },
        units: [],
      };
      groups.set(propertyKey, group);
    }

    let features: string[] | undefined;
    if (row.features?.trim()) {
      features = row.features
        .split(',')
        .map(f => f.trim())
        .filter(Boolean);
    }

    group.units.push({
      unitNumber: row.unit_number?.trim() || undefined,
      bedrooms: parseInt(row.bedrooms, 10),
      bathrooms: parseFloat(row.bathrooms),
      sqft: row.sqft ? parseInt(row.sqft, 10) : undefined,
      rentAmount: dollarsToCents(parseFloat(row.rent_amount.replace(/[$,]/g, ''))),
      depositAmount: row.deposit_amount ? dollarsToCents(parseFloat(row.deposit_amount.replace(/[$,]/g, ''))) : undefined,
      status: (row.status?.toLowerCase().trim() as UnitStatus) || 'unlisted',
      features,
      description: row.unit_description?.trim() || undefined,
    });
  }

  return Array.from(groups.values());
}

export function generateTemplate(includeExamples: boolean): string {
  const header = CSV_HEADERS.join(',');

  if (!includeExamples) {
    return header + '\n';
  }

  const examples = [
    'Sunset Apartments,multi_family,123 Main St,Los Angeles,CA,90001,2015,Modern apartment complex,101,2,1,850,1500,1500,available,"Dishwasher,A/C,Balcony",Corner unit with great views',
    'Sunset Apartments,multi_family,123 Main St,Los Angeles,CA,90001,2015,Modern apartment complex,102,1,1,650,1200,1200,available,"A/C,In-unit laundry",',
    'Sunset Apartments,multi_family,123 Main St,Los Angeles,CA,90001,2015,Modern apartment complex,103,2,2,950,1800,1800,unlisted,"Dishwasher,A/C,Parking",Renovated unit',
    'Oak House,single_family,456 Oak Ave,Pasadena,CA,91101,1985,,1,3,2,1400,2200,2200,available,"Garage,Yard,Central Heat",Single family home',
  ];

  return header + '\n' + examples.join('\n') + '\n';
}
