type Props = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", ...rest }: Props) {
    return (
        <select
            className={[
                "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900",
                "focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300",
                className,
            ].join(" ")}
            {...rest}
        />
    );
}
