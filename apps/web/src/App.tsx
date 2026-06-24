import { logout as apiLogout } from "./api/endpoints";
import { getAccessToken, setAccessToken, clearAccessToken } from "./api/client";
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
  login,
  register,
  me,
  type AuthUser,
  type Ingredient,
  type MealSlot,
  type RecipePortion,
  type CookingPlan,
  type CookingPlanSuggestion,
  type CookingPlanNeedsShopping,
  type InventoryDto,
} from "./api/endpoints";

type MobileTab = "plan" | "inventory";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function App() {
  const [householdId, setHouseholdId] = useState<string>(DEFAULT_HOUSEHOLD_ID);

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authBusy, setAuthBusy] = useState(false);
  const [authErr, setAuthErr] = useState("");

  const [authEmail, setAuthEmail] = useState("demo@tfm.local");
  const [authPassword, setAuthPassword] = useState("Password123!");
  const [authName, setAuthName] = useState("Demo User");

  const [tab, setTab] = useState<MobileTab>("plan");

  const [inventory, setInventory] = useState<InventoryDto | null>(null);
  const [ingredientNames, setIngredientNames] = useState<Record<string, string>>({});

  const [q, setQ] = useState("");
  const [results, setResults] = useState<Ingredient[]>([]);
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [amount, setAmount] = useState<number>(1);
  const [expirationDate, setExpirationDate] = useState<string>("");

  const [date, setDate] = useState("2026-02-03");
  const [slot, setSlot] = useState<MealSlot>("CENA");
  const [plan, setPlan] = useState<CookingPlan | null>(null);

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [selectedPortion, setSelectedPortion] = useState<RecipePortion>("FULL");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");

  const canSearch = useMemo(() => q.trim().length >= 2, [q]);

  function localLogout(message = "") {
    clearAccessToken();
    setAuthUser(null);
    setPlan(null);
    setInventory(null);
    setErr("");
    setAuthErr(message);
    setTab("plan");
  }

  async function logout() {
    try {
      await apiLogout();
    } catch {
      // aunque falle backend, cerramos sesión en frontend
    }
    localLogout();
  }

  useEffect(() => {
    const handler = () => {
      localLogout("Session expired. Please login again.");
    };
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, []);

  async function refreshInventory(hhId: string = householdId) {
    if (!hhId) return;

    const inv = await getInventory(hhId);
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
        setAuthErr("");

        const token = getAccessToken();
        if (!token) return;

        const out = await me();
        setAuthUser(out.user);

        const firstHouseholdId = out.households?.[0]?.id;
        if (!firstHouseholdId) {
          throw new Error("No household assigned to this user. Please contact admin or re-register.");
        }

        setHouseholdId(firstHouseholdId);
        await refreshInventory(firstHouseholdId);
      } catch (error: unknown) {
        localLogout(errorMessage(error, "Session expired. Please login again."));
      }
    })();
    // The initial session restoration intentionally runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setSelectedPortion("FULL");
      return;
    }

    const sug = plan as CookingPlanSuggestion;

    if (sug.status === "ACEPTADA" && sug.acceptedRecipeId) {
      setSelectedRecipeId(sug.acceptedRecipeId);
      setSelectedPortion(sug.acceptedPortion ?? "FULL");
      return;
    }

    const stillValid =
      selectedRecipeId && sug.recipes.some((r) => r.recipeId === selectedRecipeId);
    if (stillValid) return;

    const first =
      sug.recipes.slice().sort((a, b) => a.position - b.position)[0]?.recipeId ?? "";
    setSelectedRecipeId(first);
  }, [plan, selectedRecipeId]);

  async function addToInventory() {
    if (!selected) return;
    setBusy(true);
    setErr("");
    try {
      const body = {
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
      setPlan(null);
      setTab("inventory");
    } catch (error: unknown) {
      setErr(errorMessage(error, "Failed to update inventory"));
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
      setTab("plan");

      if (out.kind === "NEEDS_SHOPPING") {
        const ids = Array.from(new Set(out.shoppingList.items.map((i) => i.ingredientId)));
        if (ids.length > 0) {
          const res = await getIngredientsByIds(ids);
          const map: Record<string, string> = {};
          for (const it of res.items) map[it.id] = it.name;
          setIngredientNames((prev) => ({ ...prev, ...map }));
        }
      }
    } catch (error: unknown) {
      setErr(errorMessage(error, "Failed to compute plan"));
    } finally {
      setBusy(false);
    }
  }

  async function acceptCurrentSuggestion() {
    if (!plan) return;
    if (plan.kind === "ACCEPTED") return;
    if (plan.kind !== "SUGGESTION") return;
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
        portion: selectedPortion,
      });

      await refreshInventory();

      const out = await getPlanToday({
        householdId,
        date,
        slot,
        maxSuggestions: 3,
      });

      setPlan(out);
      setTab("plan");
    } catch (error: unknown) {
      setErr(errorMessage(error, "Failed to accept suggestion"));
    } finally {
      setBusy(false);
    }
  }

  const invRows = inventory?.items ?? [];

  const isAccepted =
    (plan?.kind === "SUGGESTION" && plan.status === "ACEPTADA") ||
    plan?.kind === "ACCEPTED";

  const selectedRecipeName =
    plan?.kind === "SUGGESTION"
      ? plan.recipes.find((r) => r.recipeId === selectedRecipeId)?.name ?? "(none)"
      : plan?.kind === "ACCEPTED"
        ? plan.acceptedRecipe.name
        : "(none)";

  const visibleRecipes =
    plan?.kind === "SUGGESTION"
      ? isAccepted && plan.acceptedRecipeId
        ? plan.recipes.filter((r) => r.recipeId === plan.acceptedRecipeId)
        : plan.recipes
      : plan?.kind === "ACCEPTED"
        ? [{ ...plan.acceptedRecipe, position: 0 }, ...plan.alternatives]
        : [];

  async function submitAuth() {
    setAuthBusy(true);
    setAuthErr("");
    try {
      const res =
        authMode === "login"
          ? await login({ email: authEmail, password: authPassword })
          : await register({ email: authEmail, password: authPassword, name: authName });

      setAccessToken(res.accessToken);
      setAuthUser(res.user);

      const out = await me();
      const firstHouseholdId = out.households?.[0]?.id;
      if (!firstHouseholdId) {
        throw new Error("No household assigned to this user. Please contact admin or re-register.");
      }

      setHouseholdId(firstHouseholdId);
      await refreshInventory(firstHouseholdId);
      setTab("plan");
    } catch (error: unknown) {
      setAuthErr(errorMessage(error, "Authentication failed"));
    } finally {
      setAuthBusy(false);
    }
  }

  function renderInventorySection() {
    return (
      <div className="space-y-4">
        <Card
          title="Inventory"
          subtitle="Search ingredients and add them to your household inventory."
          right={
            <Button variant="secondary" onClick={() => refreshInventory()} disabled={busy}>
              Refresh
            </Button>
          }
        >
          <div className="grid grid-cols-1 gap-4">
            <div>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Amount</label>
                <Input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Expiration</label>
                <Input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={addToInventory} disabled={!selected || busy}>
              {busy ? "Saving..." : "Add to inventory"}
            </Button>
          </div>
        </Card>

        <Card title="Current items" subtitle={`${invRows.length} item(s) in your household`}>
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
        </Card>
      </div>
    );
  }

  function renderPlanSection() {
    return (
      <div className="space-y-4">
        <Card title="Today’s plan" subtitle="Get recipe suggestions based on what you already have.">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Meal</label>
              <Select value={slot} onChange={(e) => setSlot(e.target.value as MealSlot)}>
                <option value="DESAYUNO">Breakfast</option>
                <option value="COMIDA">Lunch</option>
                <option value="CENA">Dinner</option>
              </Select>
            </div>

            <Button onClick={computePlan} disabled={busy}>
              {busy ? "Working..." : "Show me a plan"}
            </Button>
          </div>
        </Card>

        <Card
          title="Plan result"
          subtitle={
            !plan
              ? "No plan loaded yet."
              : plan.kind === "SUGGESTION"
                ? `Status: ${plan.status}`
                : plan.kind === "ACCEPTED"
                  ? "Status: ACEPTADA"
                  : "Status: NEEDS_SHOPPING"
          }
        >
          {!plan ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600">
              Tap <span className="font-semibold">Show me a plan</span> to get suggestions.
            </div>
          ) : plan.kind === "SUGGESTION" ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Pill tone={isAccepted ? "success" : "neutral"}>
                    {isAccepted ? "ACEPTADA" : "SUGGESTION"}
                  </Pill>
                </div>

                <div className="text-sm text-slate-500">Selected recipe</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {selectedRecipeName}
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Recipe portion
                  </label>
                  <Select
                    value={
                      isAccepted && plan.acceptedPortion
                        ? plan.acceptedPortion
                        : selectedPortion
                    }
                    onChange={(event) =>
                      setSelectedPortion(event.target.value as RecipePortion)
                    }
                    disabled={busy || isAccepted}
                  >
                    <option value="FULL">Receta completa</option>
                    <option value="HALF">Media receta</option>
                  </Select>
                </div>

                <div className="mt-4">
                  <Button
                    variant="success"
                    onClick={acceptCurrentSuggestion}
                    disabled={busy || isAccepted}
                    type="button"
                  >
                    {isAccepted ? "Already accepted" : busy ? "Accepting..." : "Accept selected recipe"}
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
                  Recipe options
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
          ) : plan.kind === "ACCEPTED" ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2">
                  <Pill tone="success">ACEPTADA</Pill>
                </div>
                <div className="mt-2 text-sm text-slate-500">Accepted recipe</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {plan.acceptedRecipe.name}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {plan.acceptedPortion === "HALF" ? "Media receta" : "Receta completa"}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
                  Alternatives
                </div>
                <div className="divide-y divide-slate-100">
                  {[{ ...plan.acceptedRecipe, position: 0 }, ...plan.alternatives]
                    .sort((a, b) => a.position - b.position)
                    .map((r) => (
                      <div
                        key={r.recipeId}
                        className={[
                          "w-full text-left px-4 py-3 flex items-start justify-between gap-4",
                          r.recipeId === plan.acceptedRecipe.recipeId ? "bg-emerald-50" : "",
                        ].join(" ")}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">{r.name}</div>
                          <div className="truncate text-xs text-slate-500">recipeId: {r.recipeId}</div>
                        </div>

                        {r.recipeId === plan.acceptedRecipe.recipeId ? (
                          <Pill tone="success">Accepted</Pill>
                        ) : (
                          <Pill>#{r.position + 1}</Pill>
                        )}
                      </div>
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
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2">
                  <Pill tone="warn">NEEDS_SHOPPING</Pill>
                </div>
                <div className="mt-2 text-sm text-slate-500">Recommended recipe</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {plan.targetRecipe?.name ?? "(unknown recipe)"}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
                  Minimal shopping list
                </div>
                <div className="divide-y divide-slate-100">
                  {(plan as CookingPlanNeedsShopping).shoppingList.items.map((it, idx) => (
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
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (!getAccessToken() || !authUser) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-md px-4 py-5">
            <h1 className="text-xl font-bold text-slate-900">Home Meal Planning</h1>
            <p className="mt-1 text-sm text-slate-600">
              Login/Register to access your household inventory and daily cooking plan.
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-md px-4 py-6">
          {authErr ? (
            <div className="mb-6">
              <Alert title="Auth error">{authErr}</Alert>
            </div>
          ) : null}

          <Card
            title={authMode === "login" ? "Login" : "Register"}
            subtitle="Authenticate to call the protected API."
            right={
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setAuthMode("login")}
                  type="button"
                >
                  Login
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setAuthMode("register")}
                  type="button"
                >
                  Register
                </Button>
              </div>
            }
          >
            <div className="space-y-3">
              {authMode === "register" ? (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
                  <Input value={authName} onChange={(e) => setAuthName(e.target.value)} />
                </div>
              ) : null}

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
                <Input value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Password</label>
                <Input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </div>

              <Button onClick={submitAuth} disabled={authBusy} type="button">
                {authBusy ? "Working..." : authMode === "login" ? "Login" : "Create account"}
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-md px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Home Meal Planning</h1>
              <p className="mt-1 text-xs text-slate-500">{authUser.email}</p>
            </div>

            <Button variant="secondary" onClick={() => logout()} type="button">
              Logout
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Pill>{slot}</Pill>
            <Pill tone="neutral">{date}</Pill>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4 pb-24">
        {err ? (
          <div className="mb-4">
            <Alert title="Error">{err}</Alert>
          </div>
        ) : null}

        {tab === "plan" ? renderPlanSection() : renderInventorySection()}
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-md">
          <button
            type="button"
            onClick={() => setTab("plan")}
            className={[
              "flex-1 px-4 py-3 text-sm font-medium",
              tab === "plan" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            🍽️ Plan
          </button>

          <button
            type="button"
            onClick={() => setTab("inventory")}
            className={[
              "flex-1 px-4 py-3 text-sm font-medium",
              tab === "inventory" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            🧺 Inventory
          </button>
        </div>
      </nav>
    </div>
  );
}
