'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMobileMenu } from './MobileMenuProvider';

interface NavItem {
  label: string;
  href?: string;
  icon: string;
  children?: { label: string; href: string; isQuickAction?: boolean }[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/renter',
    icon: '\u2302', // House
  },
  {
    label: 'Browse Listings',
    href: '/renter/browse',
    icon: '\u2606', // Star
  },
  {
    label: 'My Applications',
    href: '/renter/applications',
    icon: '\u2709', // Envelope
  },
  {
    label: 'My Lease',
    href: '/renter/lease',
    icon: '\u270D', // Writing hand
  },
  {
    label: 'Payments',
    href: '/renter/payments',
    icon: '\u00A4', // Currency
  },
  {
    label: 'Maintenance',
    icon: '\u2692', // Hammer and wrench
    children: [
      { label: 'My Requests', href: '/renter/maintenance' },
      { label: 'New Request', href: '/renter/maintenance/new', isQuickAction: true },
    ],
  },
  {
    label: 'Documents',
    href: '/renter/documents',
    icon: '\u2630', // Document
  },
  {
    label: 'Settings',
    href: '/renter/settings',
    icon: '\u2699', // Gear
  },
];

interface RenterSidebarProps {
  pathname: string;
}

const STORAGE_KEY = 'renter-sidebar-collapsed';

export default function RenterSidebar({ pathname }: RenterSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const { isOpen: isMobileOpen, close: closeMobile } = useMobileMenu();

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }

    navItems.forEach(item => {
      if (item.children) {
        const isChildActive = item.children.some(child =>
          pathname === child.href || pathname.startsWith(child.href + '/')
        );
        if (isChildActive) {
          setExpandedMenus(prev => new Set(prev).add(item.label));
        }
      }
    });
  }, [pathname]);

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
    if (href === '/renter') {
      return pathname === '/renter';
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
            Renter Portal
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
          {navItems.map((item) => (
            <li key={item.label}>
              {item.children ? (
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
                            {child.isQuickAction && (
                              <span
                                style={{
                                  fontSize: '0.625rem',
                                  padding: '0.125rem 0.375rem',
                                  backgroundColor: 'var(--accent)',
                                  color: 'var(--accent-foreground)',
                                  borderRadius: '4px',
                                  fontWeight: 500,
                                }}
                              >
                                +
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
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
