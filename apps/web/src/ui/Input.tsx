type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...rest }: Props) {
  return (
    <input
      className={[
        "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900",
        "placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}
