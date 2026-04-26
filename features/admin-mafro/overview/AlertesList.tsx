import Link from 'next/link';
import { AlertTriangle, Clock, Package } from 'lucide-react';

type AlerteSeverity = 'warning' | 'danger';
type AlerteType = 'commande' | 'livraison' | 'stock';

type Alerte = {
  id: string;
  type: AlerteType;
  message: string;
  href: string;
  severity: AlerteSeverity;
};

type Props = {
  alertes: Alerte[];
};

const TYPE_ICONS: Record<AlerteType, React.ComponentType<{ size: number }>> = {
  commande: Clock,
  livraison: AlertTriangle,
  stock: Package,
};

export default function AlertesList({ alertes }: Props) {
  if (alertes.length === 0) {
    return (
      <div className="xa-alertes-empty">
        <span>✅ Aucune alerte — tout est sous contrôle</span>
      </div>
    );
  }

  return (
    <ul className="xa-alertes-list">
      {alertes.map((alerte) => {
        const Icon = TYPE_ICONS[alerte.type];
        return (
          <li key={alerte.id} className={`xa-alerte xa-alerte--${alerte.severity}`}>
            <Icon size={16} />
            <span className="xa-alerte__message">{alerte.message}</span>
            <Link href={alerte.href} className="xa-alerte__cta">
              Traiter →
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
