export function TableShell(props: { headers: [string, string, string]; children: React.ReactNode }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
                <div className="col-span-6">{props.headers[0]}</div>
                <div className="col-span-3">{props.headers[1]}</div>
                <div className="col-span-3">{props.headers[2]}</div>
            </div>
            <div className="divide-y divide-slate-100">{props.children}</div>
        </div>
    );
}

export function Row3Cols(props: { col1: React.ReactNode; col2: React.ReactNode; col3: React.ReactNode }) {
    return (
        <div className="grid grid-cols-12 px-4 py-3 text-sm">
            <div className="col-span-6 text-slate-900">{props.col1}</div>
            <div className="col-span-3 text-slate-700">{props.col2}</div>
            <div className="col-span-3 text-slate-700">{props.col3}</div>
        </div>
    );
}
