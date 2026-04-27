'use client';

interface SyncBarProps {
  isOnline: boolean;
  lastSync?: Date | null;
}

export default function SyncBar({ isOnline, lastSync }: SyncBarProps) {
  const timeStr = lastSync
    ? lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={`v4-sync-bar${isOnline ? '' : ' offline'}`}>
      <span className={`v4-sync-dot${isOnline ? '' : ' off'}`} />
      <span>{isOnline ? '☁ Synchronisé' : '⚠ Hors-ligne'}</span>
      {timeStr && <span className="v4-sync-time">{timeStr}</span>}
    </div>
  );
}
