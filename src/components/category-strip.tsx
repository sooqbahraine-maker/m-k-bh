import { CATEGORIES, type CategoryKey } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function CategoryStrip({
  selected,
  onSelect,
}: {
  selected: CategoryKey | null;
  onSelect: (k: CategoryKey | null) => void;
}) {
  return (
    <div className="mx-auto mt-6 max-w-6xl px-4">
      <div className="flex gap-3 overflow-x-auto pb-2 sm:justify-center">
        <CategoryButton
          label="الكل"
          active={selected === null}
          onClick={() => onSelect(null)}
          colorVar="var(--brand)"
          emoji="✨"
        />
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              onClick={() => onSelect(c.key === selected ? null : c.key)}
              className="group flex shrink-0 flex-col items-center gap-2"
            >
              <div
                className={cn(
                  "grid h-16 w-16 place-items-center rounded-full border-2 bg-card transition-all",
                  selected === c.key
                    ? "scale-110 border-transparent shadow-elegant"
                    : "border-border shadow-card hover:-translate-y-0.5",
                )}
                style={selected === c.key ? { backgroundColor: c.colorVar, color: "white" } : { color: c.colorVar }}
              >
                <Icon className="h-6 w-6" />
              </div>
              <span className={cn("text-xs font-semibold", selected === c.key ? "text-foreground" : "text-muted-foreground")}>
                {c.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CategoryButton({
  label,
  active,
  onClick,
  colorVar,
  emoji,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  colorVar: string;
  emoji: string;
}) {
  return (
    <button onClick={onClick} className="group flex shrink-0 flex-col items-center gap-2">
      <div
        className={cn(
          "grid h-16 w-16 place-items-center rounded-full border-2 bg-card text-lg transition-all",
          active ? "scale-110 border-transparent text-white shadow-elegant" : "border-border shadow-card hover:-translate-y-0.5",
        )}
        style={active ? { backgroundColor: colorVar } : undefined}
      >
        {emoji}
      </div>
      <span className={cn("text-xs font-semibold", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </button>
  );
}
