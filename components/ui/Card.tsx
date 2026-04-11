import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export default function Card({ title, children, className = '', ...props }: CardProps) {
  return (
    <div
      {...props}
      className={['bg-white rounded-2xl shadow-sm p-4', className].join(' ')}
    >
      {title && <h3 className="text-sm font-semibold text-xa-primary mb-3">{title}</h3>}
      {children}
    </div>
  );
}
