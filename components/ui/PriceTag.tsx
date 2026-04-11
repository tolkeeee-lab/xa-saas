import { formatPrice } from '@/lib/format';

interface PriceTagProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'accent' | 'danger' | 'default';
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base font-semibold',
  lg: 'text-2xl font-bold',
};

const colorClasses = {
  primary: 'text-xa-primary',
  accent:  'text-xa-accent',
  danger:  'text-xa-danger',
  default: 'text-gray-900',
};

export default function PriceTag({ amount, size = 'md', color = 'default' }: PriceTagProps) {
  return (
    <span className={[sizeClasses[size], colorClasses[color]].join(' ')}>
      {formatPrice(amount)}
    </span>
  );
}
