import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  primaryAction,
  secondaryActions,
}) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Title and Subtitle */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">{title}</h1>
          {subtitle && (
            <p className="text-base text-neutral-600">{subtitle}</p>
          )}
        </div>

        {/* Actions */}
        {(primaryAction || secondaryActions) && (
          <div className="flex items-center gap-3 flex-wrap">
            {secondaryActions && (
              <div className="flex items-center gap-2">{secondaryActions}</div>
            )}
            {primaryAction && <div>{primaryAction}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;

