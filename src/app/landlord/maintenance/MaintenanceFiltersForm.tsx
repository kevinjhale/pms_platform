"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { Property, Unit } from "@/db";

const CATEGORIES = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "hvac", label: "HVAC" },
  { value: "appliance", label: "Appliance" },
  { value: "structural", label: "Structural" },
  { value: "pest", label: "Pest Control" },
  { value: "landscaping", label: "Landscaping" },
  { value: "cleaning", label: "Cleaning" },
  { value: "security", label: "Security" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending_parts", label: "Pending Parts" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITIES = [
  { value: "emergency", label: "Emergency" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const SORT_OPTIONS = [
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
  { value: "priority-asc", label: "Priority (High to Low)" },
  { value: "priority-desc", label: "Priority (Low to High)" },
  { value: "status-asc", label: "Status (Open to Completed)" },
  { value: "status-desc", label: "Status (Completed to Open)" },
];

type FilterParams = {
  status?: string;
  category?: string;
  priority?: string;
  propertyId?: string;
  unitId?: string;
  sortBy?: string;
  sortOrder?: string;
  showArchived?: string;
};

type Props = {
  currentFilters: FilterParams;
  properties: Property[];
  units: (Unit & { propertyName: string })[];
  allUnits: (Unit & { propertyName: string })[];
  hasActiveFilters: boolean;
  showArchived: boolean;
};

const selectStyle = {
  padding: "0.5rem 0.75rem",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  backgroundColor: "var(--background)",
  fontSize: "0.875rem",
  minWidth: "140px",
};

export function MaintenanceFiltersForm({
  currentFilters,
  properties,
  units,
  allUnits,
  hasActiveFilters,
  showArchived,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      // If property changes, clear unit filter
      if (key === "propertyId") {
        params.delete("unitId");
      }

      // Handle sort value which is a combined sortBy-sortOrder
      if (key === "sort") {
        const [sortBy, sortOrder] = value.split("-");
        if (sortBy && sortOrder) {
          params.set("sortBy", sortBy);
          params.set("sortOrder", sortOrder);
        } else {
          params.delete("sortBy");
          params.delete("sortOrder");
        }
        params.delete("sort");
      }

      router.push(`/landlord/maintenance?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push("/landlord/maintenance");
  }, [router]);

  const toggleArchived = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (showArchived) {
      params.delete("showArchived");
    } else {
      params.set("showArchived", "true");
    }
    router.push(`/landlord/maintenance?${params.toString()}`);
  }, [router, searchParams, showArchived]);

  // Combine sortBy and sortOrder for the select
  const currentSort = `${currentFilters.sortBy || "date"}-${currentFilters.sortOrder || "desc"}`;

  return (
    <div
      className="card"
      style={{
        padding: "1rem",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "flex-end",
        }}
      >
        {/* Category Filter */}
        <div>
          <label
            htmlFor="category-filter"
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "var(--secondary)",
              marginBottom: "0.25rem",
            }}
          >
            Category
          </label>
          <select
            id="category-filter"
            value={currentFilters.category || ""}
            onChange={(e) => updateFilter("category", e.target.value)}
            style={selectStyle}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label
            htmlFor="status-filter"
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "var(--secondary)",
              marginBottom: "0.25rem",
            }}
          >
            Status
          </label>
          <select
            id="status-filter"
            value={currentFilters.status || ""}
            onChange={(e) => updateFilter("status", e.target.value)}
            style={selectStyle}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label
            htmlFor="priority-filter"
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "var(--secondary)",
              marginBottom: "0.25rem",
            }}
          >
            Priority
          </label>
          <select
            id="priority-filter"
            value={currentFilters.priority || ""}
            onChange={(e) => updateFilter("priority", e.target.value)}
            style={selectStyle}
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>

        {/* Property Filter */}
        <div>
          <label
            htmlFor="property-filter"
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "var(--secondary)",
              marginBottom: "0.25rem",
            }}
          >
            Property
          </label>
          <select
            id="property-filter"
            value={currentFilters.propertyId || ""}
            onChange={(e) => updateFilter("propertyId", e.target.value)}
            style={selectStyle}
          >
            <option value="">All Properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>

        {/* Unit Filter - only show if property is selected */}
        <div>
          <label
            htmlFor="unit-filter"
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "var(--secondary)",
              marginBottom: "0.25rem",
            }}
          >
            Unit
          </label>
          <select
            id="unit-filter"
            value={currentFilters.unitId || ""}
            onChange={(e) => updateFilter("unitId", e.target.value)}
            style={{
              ...selectStyle,
              opacity: currentFilters.propertyId ? 1 : 0.5,
            }}
            disabled={!currentFilters.propertyId}
          >
            <option value="">All Units</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.unitNumber || `Unit ${unit.id.slice(0, 6)}`}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label
            htmlFor="sort-filter"
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "var(--secondary)",
              marginBottom: "0.25rem",
            }}
          >
            Sort By
          </label>
          <select
            id="sort-filter"
            value={currentSort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            style={selectStyle}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Show Archived Toggle */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "var(--secondary)",
              marginBottom: "0.25rem",
            }}
          >
            &nbsp;
          </label>
          <button
            type="button"
            onClick={toggleArchived}
            className="btn"
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: showArchived ? "#e0e7ff" : "transparent",
              color: showArchived ? "#4338ca" : "inherit",
              border: "1px solid var(--border)",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
          </button>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                color: "var(--secondary)",
                marginBottom: "0.25rem",
              }}
            >
              &nbsp;
            </label>
            <button
              type="button"
              onClick={clearFilters}
              className="btn"
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fecaca",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
