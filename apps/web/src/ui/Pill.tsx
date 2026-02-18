export function Pill(props: { tone?: "neutral" | "success" | "warn"; children: React.ReactNode }) {
    const tone = props.tone ?? "neutral";
    const styles =
        tone === "success"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : tone === "warn"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-50 text-slate-700 border-slate-200";
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}>
            {props.children}
        </span>
    );
}
