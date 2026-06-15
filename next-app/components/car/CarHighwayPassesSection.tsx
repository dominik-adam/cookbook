import HighwayPassCard, { HighwayPassData } from './HighwayPassCard';
import styles from '@/styles/car.module.css';

interface CarHighwayPassesSectionProps {
  passes: HighwayPassData[];
  onAdd: () => void;
  onEdit: (id: string) => void;
}

export default function CarHighwayPassesSection({ passes, onAdd, onEdit }: CarHighwayPassesSectionProps) {
  return (
    <>
      <p className={styles.sectionLabel}>Highway Passes</p>
      <div className={styles.widgetRow}>
        {passes.map(pass => (
          <HighwayPassCard key={pass.id} pass={pass} onEdit={onEdit} />
        ))}
        <div className={styles.addPassWidget} onClick={onAdd}>
          <span className={styles.addIcon}>+</span>
          <span className={styles.addLabel}>Add pass</span>
        </div>
      </div>
    </>
  );
}
