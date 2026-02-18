// src/components/ui/IncidentFeed.tsx
import { useMemo } from "react";
import type { Incident } from "../services/incidents";

type Props = {
  incidents: Incident[];
  onHover?: (id: number | string | null) => void;
};

export default function IncidentFeed({ incidents, onHover }: Props) {
  const sorted = useMemo(() => {
    return [...incidents].sort((a, b) => {
      const ta = new Date((a as any).date ?? 0).getTime();
      const tb = new Date((b as any).date ?? 0).getTime();
      return tb - ta;
    });
  }, [incidents]);

  return (
    <div className="incident-feed" onMouseLeave={() => onHover?.(null)}>
      <div className="incident-feed-header">
        <small style={{ opacity: 0.75 }}>Showing {sorted.length}</small>
      </div>

      {sorted.length === 0 && <p>No incidents found.</p>}

      {sorted.map((it) => (
        <div
          key={String((it as any).id)}
          className="incident-row"
          onMouseEnter={() => onHover?.((it as any).id)}
        >
          <b>{String((it as any).category ?? "Unknown")}</b>
          <small>{new Date((it as any).date).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}
