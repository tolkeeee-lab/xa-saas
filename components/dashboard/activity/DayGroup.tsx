type Props = {
  label: string;
};

export default function DayGroup({ label }: Props) {
  return (
    <div className="xa-day-label">{label}</div>
  );
}
