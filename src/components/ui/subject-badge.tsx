import { SUBJECT_PALETTE } from "@/constants/subjects";

interface SubjectBadgeProps {
  title: string;
  hexColor?: string | null;
  className?: string;
}

export function SubjectBadge({
  title,
  hexColor,
  className = "",
}: SubjectBadgeProps) {
  // Busca o tema que corresponde ao HEX salvo no banco de dados
  const theme =
    Object.values(SUBJECT_PALETTE).find((item) => item.hex === hexColor) ||
    SUBJECT_PALETTE.DESENVOLVIMENTO; // Fallback se não encontrar

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${theme.bgClass} ${theme.textClass} ${theme.borderClass} ${className}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: theme.hex }}
      />
      {title}
    </span>
  );
}
