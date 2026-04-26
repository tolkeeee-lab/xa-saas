'use client';

type Props = {
  statut: 'preparation' | 'en_route' | 'livree' | 'retournee';
};

const STEPS: Array<{
  key: string;
  label: string;
  icon: string;
}> = [
  { key: 'preparation', label: 'Préparation', icon: '📦' },
  { key: 'en_route', label: 'En route', icon: '🚚' },
  { key: 'livree', label: 'Livrée', icon: '✅' },
];

const STATUT_ORDER: Record<Props['statut'], number> = {
  preparation: 0,
  en_route: 1,
  livree: 2,
  retournee: -1,
};

export default function StatutTimeline({ statut }: Props) {
  const currentStep = STATUT_ORDER[statut];
  const isReturnee = statut === 'retournee';

  if (isReturnee) {
    return (
      <div className="flex items-center justify-center gap-2 py-3">
        <span className="text-2xl">↩️</span>
        <span className="text-sm font-medium text-red-600">Retournée</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, idx) => {
        const isDone = currentStep > idx;
        const isActive = currentStep === idx;
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all ${
                  isDone
                    ? 'bg-green-500 text-white'
                    : isActive
                      ? 'bg-xa-primary/10 border-2 border-xa-primary text-xa-primary'
                      : 'bg-xa-border text-xa-muted'
                }`}
              >
                {isDone ? '✓' : step.icon}
              </div>
              <span
                className={`text-xs mt-1 whitespace-nowrap ${
                  isActive ? 'text-xa-primary font-semibold' : isDone ? 'text-green-600' : 'text-xa-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 rounded ${
                  isDone ? 'bg-green-400' : 'bg-xa-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
