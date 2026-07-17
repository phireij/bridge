import { cn } from "@/lib/utils";
import { labelize, TONE_CLASSES, toneFor, type Tone } from "@/lib/status";
import { Badge } from "@/components/ui/badge";

export function StatusDot({
  status,
  tone,
  pulse,
  className,
}: {
  status?: string;
  tone?: Tone;
  pulse?: boolean;
  className?: string;
}) {
  const resolved = tone ?? toneFor(status ?? "");
  return (
    <span className={cn("relative flex size-2", className)}>
      {pulse ? (
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full opacity-60",
            TONE_CLASSES[resolved].dot,
          )}
        />
      ) : null}
      <span
        className={cn(
          "relative inline-flex size-2 rounded-full",
          TONE_CLASSES[resolved].dot,
        )}
      />
    </span>
  );
}

export function StatusBadge({
  status,
  label,
  dot = true,
  className,
}: {
  status: string;
  label?: string;
  dot?: boolean;
  className?: string;
}) {
  const tone = toneFor(status);
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", TONE_CLASSES[tone].badge, className)}
    >
      {dot ? (
        <span className={cn("size-1.5 rounded-full", TONE_CLASSES[tone].dot)} />
      ) : null}
      {label ?? labelize(status)}
    </Badge>
  );
}
