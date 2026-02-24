import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Alert } from "./ui/Alert";
import { Pill } from "./ui/Pill";
import { TableShell, Row3Cols } from "./ui/Table";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_HOUSEHOLD_ID,
  acceptSuggestion,
  getIngredientsByIds,
  getInventory,
  getPlanToday,
  searchIngredients,
  updateInventory,
  type Ingredient,
  type MealSlot,
  type CookingPlan,
  type CookingPlanSuggestion,
  type InventoryDto,
} from "./api/endpoints";

export default function App() {
  const [householdId] = useState(DEFAULT_HOUSEHOLD_ID);

  // Inventory view
  const [inventory, setInventory] = useState<InventoryDto | null>(null);
  const [ingredientNames, setIngredientNames] = useState<Record<string, string>>({});

  // Add ingredient (autocomplete)
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Ingredient[]>([]);
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [amount, setAmount] = useState<number>(1);
  const [expirationDate, setExpirationDate] = useState<string>("");

  // Plan
  const [date, setDate] = useState("2026-02-03");
  const [slot, setSlot] = useState<MealSlot>("CENA");
  const [plan, setPlan] = useState<CookingPlan | null>(null);

  // Selected recipe inside current suggestion
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");

  // UI
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");

  const canSearch = useMemo(() => q.trim().length >= 2, [q]);

  async function refreshInventory() {
    const inv = await getInventory(householdId);
    setInventory(inv);

    const ids = Array.from(new Set(inv.items.map((i) => i.ingredientId)));
    if (ids.length > 0) {
      const res = await getIngredientsByIds(ids);
      const map: Record<string, string> = {};
      for (const it of res.items) map[it.id] = it.name;
      setIngredientNames((prev) => ({ ...prev, ...map }));
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        await refreshInventory();
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load inventory");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autocomplete
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!canSearch) {
        setResults([]);
        return;
      }
      try {
        const res = await searchIngredients(q.trim(), 10);
        if (!cancelled) setResults(res.items);
      } catch {
        if (!cancelled) setResults([]);
      }
    }

    const t = setTimeout(run, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, canSearch]);

  useEffect(() => {
    if (!plan || plan.kind !== "SUGGESTION") {
      setSelectedRecipeId("");
      return;
    }

    const sug = plan as CookingPlanSuggestion;

    // Si el plan está aceptado => fija selection al acceptedRecipeId
    if (sug.status === "ACEPTADA" && sug.acceptedRecipeId) {
      setSelectedRecipeId(sug.acceptedRecipeId);
      return;
    }

    // Si el usuario ya tiene una selección válida en esta suggestion, NO la machaques
    const stillValid =
      selectedRecipeId &&
      sug.recipes.some((r) => r.recipeId === selectedRecipeId);

    if (stillValid) return;

    // Si no hay selección válida, elige la primera por position
    const first =
      sug.recipes.slice().sort((a, b) => a.position - b.position)[0]?.recipeId ?? "";

    setSelectedRecipeId(first);
    // 👇 añade selectedRecipeId a deps
  }, [plan, selectedRecipeId]);


  async function addToInventory() {
    if (!selected) return;
    setBusy(true);
    setErr("");
    try {
      const body: any = {
        householdId,
        operations: [
          {
            type: "ADD",
            ingredientId: selected.id,
            amount,
            ...(expirationDate ? { expirationDate } : {}),
          },
        ],
      };
      await updateInventory(body);

      setSelected(null);
      setQ("");
      setResults([]);
      setAmount(1);
      setExpirationDate("");

      await refreshInventory();

      // If you add inventory, plan might change, so we clear it.
      setPlan(null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update inventory");
    } finally {
      setBusy(false);
    }
  }

  async function computePlan() {
    setBusy(true);
    setErr("");
    try {
      const out = await getPlanToday({
        householdId,
        date,
        slot,
        maxSuggestions: 3,
      });

      setPlan(out);

      if (out.kind === "NEEDS_SHOPPING") {
        const ids = Array.from(new Set(out.shoppingList.items.map((i) => i.ingredientId)));
        if (ids.length > 0) {
          const res = await getIngredientsByIds(ids);
          const map: Record<string, string> = {};
          for (const it of res.items) map[it.id] = it.name;
          setIngredientNames((prev) => ({ ...prev, ...map }));
        }
      }
    } catch (e: any) {
      setErr(e?.message ?? "Failed to compute plan");
    } finally {
      setBusy(false);
    }
  }

  async function acceptCurrentSuggestion() {
    if (!plan || plan.kind !== "SUGGESTION") return;

    // If already accepted, do nothing (idempotent UX)
    if (plan.status === "ACEPTADA") return;

    const chosenId = selectedRecipeId || plan.recipes[0]?.recipeId;
    if (!chosenId) {
      setErr("Select a recipe first");
      return;
    }

    setBusy(true);
    setErr("");
    try {
      await acceptSuggestion({
        suggestionId: plan.suggestionId,
        recipeId: chosenId,
      });

      // Refresh inventory because accept consumes
      await refreshInventory();

      // Recompute plan: now it should come back as SUGGESTION with status ACEPTADA (and acceptedRecipeId)
      const out = await getPlanToday({
        householdId,
        date,
        slot,
        maxSuggestions: 3,
      });

      setPlan(out);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to accept suggestion");
    } finally {
      setBusy(false);
    }
  }

  const invRows = inventory?.items ?? [];

  const selectedRecipeName =
    plan?.kind === "SUGGESTION"
      ? plan.recipes.find((r) => r.recipeId === selectedRecipeId)?.name ?? "(none)"
      : "(none)";

  const isAccepted = plan?.kind === "SUGGESTION" && plan.status === "ACEPTADA";

  const visibleRecipes =
    plan?.kind === "SUGGESTION"
      ? isAccepted && plan.acceptedRecipeId
        ? plan.recipes.filter(
          (r) => r.recipeId === plan.acceptedRecipeId
        )
        : plan.recipes
      : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Home Meal Planning</h1>
              <p className="mt-1 text-sm text-slate-600">
                Uses your household inventory to suggest what you can cook today (or the minimal shopping list to unlock a recipe).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill>{slot}</Pill>
              <Pill tone="neutral">{date}</Pill>
              <code className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                {householdId}
              </code>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {err ? (
          <div className="mb-6">
            <Alert title="Error">{err}</Alert>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card
            title="1) Your household inventory"
            subtitle="Search ingredients in the catalog and add them to your household inventory."
            right={
              <Button variant="secondary" onClick={refreshInventory} disabled={busy}>
                Refresh
              </Button>
            }
          >
            {/* Add ingredient */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-6">
                <label className="mb-1 block text-xs font-medium text-slate-600">Search ingredient</label>
                <div className="relative">
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="e.g. leche, arroz, huevos..."
                  />

                  {results.length > 0 ? (
                    <div className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
                      {results.map((i) => (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => {
                            setSelected(i);
                            setQ(i.name);
                            setResults([]);
                          }}
                          className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{i.name}</div>
                            <div className="truncate text-xs text-slate-500">{i.category ?? ""}</div>
                          </div>
                          <span className="mt-0.5 shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                            Select
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  Selected:{" "}
                  <span className="font-semibold text-slate-900">
                    {selected ? selected.name : "(none)"}
                  </span>
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="mb-1 block text-xs font-medium text-slate-600">Amount</label>
                <Input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </div>

              <div className="md:col-span-3">
                <label className="mb-1 block text-xs font-medium text-slate-600">Expiration (optional)</label>
                <Input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">Add what you have at home; the plan will change accordingly.</div>
              <Button onClick={addToInventory} disabled={!selected || busy}>
                {busy ? "Saving..." : "Add to inventory"}
              </Button>
            </div>

            {/* Inventory table */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Current items</div>
                <Pill tone={invRows.length === 0 ? "warn" : "success"}>{invRows.length} items</Pill>
              </div>

              {invRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600">
                  Inventory is empty. Add a few ingredients to start.
                </div>
              ) : (
                <TableShell headers={["Ingredient", "Quantity", "Expiration"]}>
                  {invRows.map((row, idx) => (
                    <div key={row.ingredientId} className={idx % 2 === 1 ? "bg-slate-50/40" : ""}>
                      <Row3Cols
                        col1={
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {ingredientNames[row.ingredientId] ?? row.ingredientId}
                            </span>
                            <span className="text-xs text-slate-500">{row.ingredientId}</span>
                          </div>
                        }
                        col2={<span className="font-semibold">{row.quantity}</span>}
                        col3={<span>{row.expirationDate ?? "-"}</span>}
                      />
                    </div>
                  ))}
                </TableShell>
              )}
            </div>
          </Card>

          <Card
            title="2) What can I cook today?"
            subtitle="Click to get suggestions based on what you already have. If none are possible, you’ll get the minimal shopping list to unlock 1 recipe."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-6">
                <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>

              <div className="md:col-span-6">
                <label className="mb-1 block text-xs font-medium text-slate-600">Meal</label>
                <Select value={slot} onChange={(e) => setSlot(e.target.value as MealSlot)}>
                  <option value="DESAYUNO">Breakfast</option>
                  <option value="COMIDA">Lunch</option>
                  <option value="CENA">Dinner</option>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                Status:{" "}
                {!plan ? (
                  <Pill>no plan</Pill>
                ) : plan.kind === "SUGGESTION" ? (
                  <Pill tone={plan.status === "ACEPTADA" ? "success" : "neutral"}>
                    {plan.status}
                  </Pill>
                ) : (
                  <Pill tone="warn">NEEDS_SHOPPING</Pill>
                )}
              </div>
              <Button onClick={computePlan} disabled={busy}>
                {busy ? "Working..." : "Show me a plan"}
              </Button>
            </div>

            <div className="mt-6">
              {!plan ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600">
                  Click <span className="font-semibold">Show me a plan</span> to get suggestions.
                </div>
              ) : plan.kind === "SUGGESTION" ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone="success">{isAccepted ? "✅ Plan accepted" : "✅ You can cook now"}</Pill>
                      <span className="text-xs text-slate-500">(stored as {plan.status})</span>
                    </div>

                    <div className="text-sm text-slate-700">
                      {isAccepted ? (
                        <>
                          Accepted recipe: <span className="font-semibold">{selectedRecipeName}</span>
                        </>
                      ) : (
                        <>
                          Selected recipe: <span className="font-semibold">{selectedRecipeName}</span>
                        </>
                      )}
                    </div>

                    <Button
                      variant="success"
                      onClick={acceptCurrentSuggestion}
                      disabled={busy || isAccepted}
                      type="button"
                    >
                      {isAccepted ? "Already accepted" : busy ? "Accepting..." : "Accept selected recipe"}
                    </Button>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
                      Suggested recipes
                    </div>
                    <div className="divide-y divide-slate-100">
                      {visibleRecipes
                        .slice()
                        .sort((a, b) => a.position - b.position)
                        .map((r) => (
                          <button
                            key={r.recipeId}
                            type="button"
                            onClick={() => {
                              // If accepted, keep selection locked to accepted recipe
                              if (isAccepted) return;
                              setSelectedRecipeId(r.recipeId);
                            }}
                            className={[
                              "w-full text-left px-4 py-3 flex items-start justify-between gap-4",
                              selectedRecipeId === r.recipeId ? "bg-emerald-50" : "hover:bg-slate-50",
                              isAccepted ? "cursor-default" : "",
                            ].join(" ")}
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">{r.name}</div>
                              <div className="truncate text-xs text-slate-500">recipeId: {r.recipeId}</div>
                            </div>

                            {selectedRecipeId === r.recipeId ? (
                              <Pill tone="success">{isAccepted ? "Accepted" : "Selected"}</Pill>
                            ) : (
                              <Pill>#{r.position + 1}</Pill>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">
                    suggestionId:{" "}
                    <code className="rounded bg-slate-100 px-1 py-0.5">{plan.suggestionId}</code>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Pill tone="warn">🛒 No recipes possible</Pill>
                    <div className="text-sm font-semibold text-slate-900">
                      Recommended recipe:{" "}
                      {plan.targetRecipe?.name ?? "(unknown recipe)"}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
                      Minimal shopping list
                    </div>
                    <div className="divide-y divide-slate-100">
                      {plan.shoppingList.items.map((it, idx) => (
                        <div key={it.ingredientId} className={idx % 2 === 1 ? "bg-slate-50/40" : ""}>
                          <div className="flex items-center justify-between gap-4 px-4 py-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-slate-900">
                                {ingredientNames[it.ingredientId] ?? it.ingredientId}
                              </div>
                              <div className="truncate text-xs text-slate-500">{it.ingredientId}</div>
                            </div>
                            <Pill tone="warn">x {it.missingAmount}</Pill>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    After shopping, add the purchased ingredients to your inventory and click{" "}
                    <span className="font-semibold">Show me a plan</span> again.
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <footer className="mt-6 text-xs text-slate-500">
          Household: <code className="rounded bg-slate-100 px-1 py-0.5">{householdId}</code>
        </footer>
      </main>
    </div>
  );
}