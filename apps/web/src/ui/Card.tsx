export function Card(props: {
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">{props.title}</h2>
                    {props.subtitle ? (
                        <p className="mt-1 text-sm text-slate-600">{props.subtitle}</p>
                    ) : null}
                </div>
                {props.right}
            </div>
            <div className="px-5 py-4">{props.children}</div>
        </section>
    );
}
