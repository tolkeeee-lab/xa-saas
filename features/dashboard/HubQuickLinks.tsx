import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export type HubQuickLinkItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  isCurrent?: boolean;
};

type HubQuickLinksProps = {
  items: HubQuickLinkItem[];
};

export default function HubQuickLinks({ items }: HubQuickLinksProps) {
  return (
    <div className="xa-hub-quicklinks">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`xa-hub-card${item.isCurrent ? ' xa-hub-card--current' : ''}`}
            aria-current={item.isCurrent ? 'page' : undefined}
          >
            <Icon size={22} className="xa-hub-card-icon" aria-hidden />
            <span className="xa-hub-card-label">{item.label}</span>
            {item.description && (
              <span className="xa-hub-card-desc">{item.description}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
