import React from 'react';
import Link from 'next/link';
import { BreadcrumbItem } from './AdminShell';

interface AdminBreadcrumbsProps {
  items: BreadcrumbItem[];
}

const AdminBreadcrumbs: React.FC<AdminBreadcrumbsProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <li key={index} className="flex items-center gap-2">
              {!isFirst && (
                <span className="text-neutral-400" aria-hidden="true">
                  /
                </span>
              )}
              {isLast ? (
                <span className="text-neutral-900 font-medium" aria-current="page">
                  {item.icon && <span className="inline-flex items-center mr-1.5">{item.icon}</span>}
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="text-neutral-600 hover:text-neutral-900 transition-colors flex items-center gap-1.5"
                >
                  {item.icon && <span className="inline-flex items-center">{item.icon}</span>}
                  {item.label}
                </Link>
              ) : (
                <span className="text-neutral-600">
                  {item.icon && <span className="inline-flex items-center mr-1.5">{item.icon}</span>}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default AdminBreadcrumbs;

