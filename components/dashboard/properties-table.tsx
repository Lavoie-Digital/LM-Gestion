import { BUILDINGS } from "@/lib/data";
import { formatCAD } from "@/lib/utils";
import { Sparkline } from "@/components/charts/sparkline";

export type PropertyRow = {
  id?: string;
  name: string;
  neighborhood: string;
  occupied: number;
  units: number;
  occupancy: number;
  monthlyRevenue: number;
  spark?: number[];
};

const DEMO_ROWS: PropertyRow[] = BUILDINGS.map((b) => ({
  name: b.name,
  neighborhood: b.neighborhood,
  occupied: b.occupied,
  units: b.units,
  occupancy: b.occupancy,
  monthlyRevenue: b.monthlyRevenue,
  spark: b.spark,
}));

export function PropertiesTable({
  rows = DEMO_ROWS,
  updatedLabel = "Mis à jour à l'instant",
  onRowClick,
}: {
  rows?: PropertyRow[];
  updatedLabel?: string;
  onRowClick?: (row: PropertyRow) => void;
}) {
  const clickable = Boolean(onRowClick);
  return (
    <section
      id="immeubles"
      className="scroll-mt-24 overflow-hidden rounded-[4px] border border-line bg-white"
    >
      <div className="flex items-center justify-between border-b border-line px-6 py-5">
        <div>
          <h2 className="font-display text-xl tracking-tight">Immeubles</h2>
          <p className="mt-1 text-xs text-smoke">{rows.length} actifs sous gestion</p>
        </div>
        <span className="mono text-[0.6rem] uppercase tracking-[0.16em] text-smoke">
          {updatedLabel}
        </span>
      </div>

      <div className="max-h-[26rem] overflow-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="text-[0.6rem] uppercase tracking-[0.14em] text-smoke">
              <th className="sticky top-0 z-10 border-b border-line bg-white px-6 py-3 font-medium">Immeuble</th>
              <th className="sticky top-0 z-10 border-b border-line bg-white px-6 py-3 font-medium">Logements</th>
              <th className="sticky top-0 z-10 border-b border-line bg-white px-6 py-3 font-medium">Occupation</th>
              <th className="sticky top-0 z-10 border-b border-line bg-white px-6 py-3 text-right font-medium">Revenu mensuel</th>
              <th className="sticky top-0 z-10 border-b border-line bg-white px-6 py-3 text-right font-medium">Tendance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr
                key={b.id ?? b.name}
                onClick={clickable ? () => onRowClick?.(b) : undefined}
                className={`border-b border-line-soft transition-colors last:border-0 hover:bg-paper-2/60 ${clickable ? "cursor-pointer" : ""}`}
              >
                <td className="px-6 py-4">
                  <p className="font-medium text-ink">{b.name}</p>
                  <p className="mt-0.5 text-xs text-smoke">{b.neighborhood}</p>
                </td>
                <td className="px-6 py-4 text-sm text-ink/80 tabular">
                  {b.occupied}
                  <span className="text-smoke">/{b.units}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-paper-3">
                      <div
                        className="h-full rounded-full bg-ink"
                        style={{ width: `${b.occupancy}%` }}
                      />
                    </div>
                    <span className="text-xs text-ink/70 tabular">
                      {b.occupancy.toFixed(1).replace(".", ",")} %
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium text-ink tabular">
                  {formatCAD(b.monthlyRevenue)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end">
                    {b.spark ? (
                      <Sparkline data={b.spark} width={84} height={26} className="text-ink/40" />
                    ) : (
                      <span className="text-xs text-smoke/50">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
