import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "success" | "danger";
};

const styles: Record<NonNullable<Props["variant"]>, string> = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400",
    secondary:
        "bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 disabled:text-slate-400",
    success: "bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-emerald-300",
    danger: "bg-rose-600 text-white hover:bg-rose-500 disabled:bg-rose-300",
};

export function Button({ variant = "primary", className = "", ...rest }: Props) {
    return (
        <button
            className={[
                "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition",
                "focus:outline-none focus:ring-2 focus:ring-slate-300",
                "disabled:cursor-not-allowed",
                styles[variant],
                className,
            ].join(" ")}
            {...rest}
        />
    );
}
