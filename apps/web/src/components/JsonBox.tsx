export function JsonBox({ data }: { data: unknown }) {
    return (
        <pre style={{ background: "#111", color: "#eee", padding: 12, borderRadius: 8, overflowX: "auto" }}>
            {JSON.stringify(data, null, 2)}
        </pre>
    );
}
