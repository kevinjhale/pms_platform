'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useMobileMenu } from './MobileMenuProvider';
import type { OrgRole } from '@/app/landlord/layout';

interface NavItem {
  label: string;
  href?: string;
  icon: string;
  children?: { label: string; href: string }[];
  requiredRoles?: OrgRole[]; // If set, only these roles can see this item
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/landlord/dashboard',
    icon: '\u2302', // House
  },
  {
    label: 'Assignments',
    href: '/landlord/assignments',
    icon: '\u2611', // Checkbox
    requiredRoles: ['manager', 'staff'], // Only PMs see this
  },
  {
    label: 'Properties',
    href: '/landlord/properties',
    icon: '\u2616', // Building
  },
  {
    label: 'Listings',
    href: '/landlord/listings',
    icon: '\u2606', // Star
  },
  {
    label: 'Applications',
    href: '/landlord/applications',
    icon: '\u2709', // Envelope
  },
  {
    label: 'Leases',
    href: '/landlord/leases',
    icon: '\u270D', // Writing hand
  },
  {
    label: 'Maintenance',
    href: '/landlord/maintenance',
    icon: '\u2692', // Hammer and wrench
  },
  {
    label: 'Reports',
    icon: '\u2630', // Chart bars
    children: [
      { label: 'Dashboard', href: '/landlord/reports' },
      { label: 'Rent Roll', href: '/landlord/reports/rent-roll' },
    ],
  },
  {
    label: 'Activity Log',
    href: '/landlord/activity',
    icon: '\u2022', // Bullet
  },
  {
    label: 'Screening',
    href: '/landlord/screening',
    icon: '\u2714', // Checkmark
    requiredRoles: ['owner', 'admin'], // Background checks are sensitive
  },
  {
    label: 'Settings',
    href: '/landlord/settings',
    icon: '\u2699', // Gear
    requiredRoles: ['owner', 'admin'], // Only admins can change settings
  },
];

interface LandlordSidebarProps {
  pathname: string;
  userRole: OrgRole;
}

const STORAGE_KEY = 'landlord-sidebar-collapsed';

export default function LandlordSidebar({ pathname, userRole }: LandlordSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const { isOpen: isMobileOpen, close: closeMobile } = useMobileMenu();

  // Filter nav items based on user role
  const filteredNavItems = useMemo(() =>
    navItems.filter(item => {
      if (!item.requiredRoles) return true;
      return item.requiredRoles.includes(userRole);
    }), [userRole]);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }

    // Auto-expand parent menu if current path is in a submenu
    filteredNavItems.forEach(item => {
      if (item.children) {
        const isChildActive = item.children.some(child =>
          pathname === child.href || pathname.startsWith(child.href + '/')
        );
        if (isChildActive) {
          setExpandedMenus(prev => new Set(prev).add(item.label));
        }
      }
    });
  }, [pathname, filteredNavItems]);

  const toggleCollapsed = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem(STORAGE_KEY, String(newValue));
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const isActive = (href: string) => {
    if (href === '/landlord') {
      return pathname === '/landlord';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isParentActive = (item: NavItem) => {
    if (item.href) {
      return isActive(item.href);
    }
    if (item.children) {
      return item.children.some(child => isActive(child.href));
    }
    return false;
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  const handleNavClick = () => {
    closeMobile();
  };

  return (
    <aside
      className={`sidebar-mobile ${isMobileOpen ? 'open' : ''}`}
      style={{
        width: isCollapsed ? '60px' : '250px',
        minHeight: '100vh',
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        transition: 'width var(--transition-normal)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Header with toggle */}
      <div
        style={{
          padding: isCollapsed ? '1rem 0.75rem' : '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          minHeight: '60px',
        }}
      >
        {!isCollapsed && (
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--secondary)' }}>
            Menu
          </span>
        )}
        <button
          onClick={toggleCollapsed}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--secondary)',
            transition: 'background-color var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--border)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '\u276F' : '\u276E'}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.5rem 0' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {filteredNavItems.map((item) => (
            <li key={item.label}>
              {item.children ? (
                // Parent with children
                <>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: isCollapsed ? '0.75rem' : '0.75rem 1.25rem',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      background: isParentActive(item) ? 'var(--border)' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: isParentActive(item) ? 'var(--accent)' : 'var(--surface-foreground)',
                      fontSize: '0.875rem',
                      fontWeight: isParentActive(item) ? 500 : 400,
                      transition: 'all var(--transition-fast)',
                      textAlign: 'left',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isParentActive(item)) {
                        e.currentTarget.style.backgroundColor = 'var(--border)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isParentActive(item)) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    title={isCollapsed ? item.label : undefined}
                    aria-expanded={expandedMenus.has(item.label)}
                  >
                    <span style={{ fontSize: '1.125rem', width: '1.25rem', textAlign: 'center' }}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.label}
                        </span>
                        <span
                          style={{
                            fontSize: '0.625rem',
                            transition: 'transform var(--transition-fast)',
                            transform: expandedMenus.has(item.label) ? 'rotate(90deg)' : 'rotate(0deg)',
                          }}
                        >
                          {'\u25B6'}
                        </span>
                      </>
                    )}
                  </button>
                  {/* Submenu */}
                  {!isCollapsed && (
                    <ul
                      style={{
                        listStyle: 'none',
                        margin: 0,
                        padding: 0,
                        maxHeight: expandedMenus.has(item.label) ? '200px' : '0',
                        overflow: 'hidden',
                        transition: 'max-height var(--transition-normal)',
                      }}
                    >
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={handleNavClick}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 1.25rem 0.5rem 3rem',
                              color: isActive(child.href) ? 'var(--accent)' : 'var(--secondary)',
                              fontSize: '0.8125rem',
                              fontWeight: isActive(child.href) ? 500 : 400,
                              textDecoration: 'none',
                              transition: 'all var(--transition-fast)',
                              backgroundColor: isActive(child.href) ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                              borderLeft: isActive(child.href) ? '2px solid var(--accent)' : '2px solid transparent',
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive(child.href)) {
                                e.currentTarget.style.backgroundColor = 'var(--border)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive(child.href)) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {child.label}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                // Single link item
                <Link
                  href={item.href!}
                  onClick={handleNavClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: isCollapsed ? '0.75rem' : '0.75rem 1.25rem',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    color: isActive(item.href!) ? 'var(--accent)' : 'var(--surface-foreground)',
                    fontSize: '0.875rem',
                    fontWeight: isActive(item.href!) ? 500 : 400,
                    textDecoration: 'none',
                    transition: 'all var(--transition-fast)',
                    backgroundColor: isActive(item.href!) ? 'var(--border)' : 'transparent',
                    borderLeft: isActive(item.href!) ? '3px solid var(--accent)' : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.href!)) {
                      e.currentTarget.style.backgroundColor = 'var(--border)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.href!)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span style={{ fontSize: '1.125rem', width: '1.25rem', textAlign: 'center' }}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid var(--border)',
            fontSize: '0.75rem',
            color: 'var(--secondary)',
          }}
        >
          PMS Platform
        </div>
      )}
    </aside>
  );
}
