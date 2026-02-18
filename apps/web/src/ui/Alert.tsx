export function Alert(props: { title?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
            {props.title ? <div className="font-semibold">{props.title}</div> : null}
            <div className="text-sm">{props.children}</div>
        </div>
    );
}
