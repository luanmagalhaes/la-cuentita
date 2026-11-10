"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CardRail } from "@/components/cards/CardRail";
import { TableCard } from "@/components/cards/TableCard";
import { Balloons } from "@/components/fx/Balloons";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { computeBill, premiumCount, sitOutIds, splitBill } from "@/lib/game/bill";
import { dishFor, kindLabels, kindOrder, menuFor } from "@/lib/game/menu";
import { burntValues, cakeValue, deckLimits, wineValue } from "@/lib/game/rules";
import { sound } from "@/lib/sound";
import {
  SplitMode,
  type BillDraft,
  type BillShareRow,
  type BillSplit,
  type BurntPick,
  type PlayerView,
  type TapaKind,
  type TapaPick,
} from "@/types/room";

interface BillSheetProps {
  roundNumber: number;
  meId: string;
  players: PlayerView[];
  initial?: BillDraft;
  refunds?: BillShareRow[];
  busy: boolean;
  error: string | null;
  onSave: (draft: BillDraft) => void;
  onBack: () => void;
}

const splitOptions: Array<{ mode: SplitMode; label: string; hint: string }> = [
  { mode: SplitMode.Solo, label: "Só quem pediu", hint: "Paga tudo" },
  { mode: SplitMode.Half, label: "Meio a meio", hint: "Cincuenta-cincuenta" },
  { mode: SplitMode.Dutch, label: "Cada um paga", hint: "Racha geral" },
];

const sitOutReasons = {
  bathroom: { icon: "🚽", label: "No banheiro" },
  coffee: { icon: "☕", label: "Tomando café" },
  birthday: { icon: "🎂", label: "Aniversário" },
} as const;

type SitOutReason = (typeof sitOutReasons)[keyof typeof sitOutReasons];

function euros(value: number): string {
  return `${value < 0 ? "−" : ""}${Math.abs(value)}€`;
}

function tapaLabel(tapa: TapaPick): string {
  return dishFor(tapa.kind, tapa.price).name ?? `${kindLabels[tapa.kind]} ${tapa.price}€`;
}

function burntName(value: number): string {
  return value === 0 ? "prato queimado de 0 euro" : `prato queimado de menos ${value} euros`;
}

function withCount(base: string, count: number): string {
  return count > 0 ? `${base}, ${count} na conta` : base;
}

export function BillSheet({
  roundNumber,
  meId,
  players,
  initial,
  refunds = [],
  busy,
  error,
  onSave,
  onBack,
}: BillSheetProps) {
  const [tapas, setTapas] = useState<TapaPick[]>(initial?.tapas ?? []);
  const [burnts, setBurnts] = useState<BurntPick[]>(initial?.burnts ?? []);
  const [wine, setWine] = useState(initial?.wine ?? 0);
  const [cake, setCake] = useState(initial?.cake ?? false);
  const [tips, setTips] = useState(initial?.tips ?? 0);
  const [payerId, setPayerId] = useState(initial?.payerId ?? meId);
  const [mode, setMode] = useState<SplitMode>(initial?.split.mode ?? SplitMode.Solo);
  const [partnerId, setPartnerId] = useState<string | null>(
    initial?.split.mode === SplitMode.Half ? initial.split.partnerId : null,
  );
  const [bathroomIds, setBathroomIds] = useState<string[]>(initial?.bathroomIds ?? []);
  const [coffeeIds, setCoffeeIds] = useState<string[]>(initial?.coffeeIds ?? []);
  const [birthdayId, setBirthdayId] = useState<string | null>(initial?.birthdayId ?? null);
  const [picking, setPicking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [checklist, setChecklist] = useState<null | { step: number; full: boolean }>(null);
  const [birthdayBurst, setBirthdayBurst] = useState(0);

  const cards = { tapas, burnts, wine, cake, tips };
  const breakdown = computeBill(cards);
  const premiumsLeft = deckLimits.premium - premiumCount({ tapas, burnts });
  const payer = players.find((person) => person.id === payerId) ?? null;
  const others = players.filter((person) => person.id !== payerId);
  const bathroom = bathroomIds.filter((id) => others.some((person) => person.id === id));
  const coffee = coffeeIds.filter(
    (id) => others.some((person) => person.id === id) && !bathroom.includes(id),
  );
  const birthday = cake && others.some((person) => person.id === birthdayId) ? birthdayId : null;
  const outIds = sitOutIds({ bathroomIds: bathroom, coffeeIds: coffee, birthdayId: birthday });
  const reasonFor = (id: string): SitOutReason | null =>
    birthday === id
      ? sitOutReasons.birthday
      : bathroom.includes(id)
        ? sitOutReasons.bathroom
        : coffee.includes(id)
          ? sitOutReasons.coffee
          : null;
  const partner = others.find((person) => person.id === partnerId && !outIds.includes(person.id)) ?? null;
  const birthdayPerson = others.find((person) => person.id === birthday) ?? null;
  const split: BillSplit =
    mode === SplitMode.Half && partner
      ? { mode: SplitMode.Half, partnerId: partner.id }
      : mode === SplitMode.Dutch
        ? { mode: SplitMode.Dutch, excludedIds: outIds }
        : { mode: SplitMode.Solo };
  const shares = splitBill({
    total: breakdown.total,
    split,
    payerId,
    playerIds: players.map((person) => person.id),
  });
  const blocker =
    mode === SplitMode.Half && !partner
      ? "Escolha com quem rachar"
      : cake && !birthday && others.length > 0
        ? "Diga de quem é o aniversário"
        : null;
  const counts = useMemo(() => {
    const tally = new Map<string, number>();

    tapas.forEach((tapa) => {
      const key = `${tapa.kind}-${tapa.price}`;
      tally.set(key, (tally.get(key) ?? 0) + 1);
    });

    return tally;
  }, [tapas]);

  const addTapa = (kind: TapaKind, price: number) => {
    if (tapas.length >= deckLimits.tapas) {
      return;
    }

    sound.pick();
    setTapas((current) => [...current, { kind, price, premium: false }]);
  };

  const removeTapa = (index: number) => {
    sound.tap();
    setTapas((current) => current.filter((_, at) => at !== index));
  };

  const dropTapaOf = (kind: TapaKind, price: number) => {
    const matches = (tapa: TapaPick) => tapa.kind === kind && tapa.price === price;
    const plain = tapas.findLastIndex((tapa) => matches(tapa) && !tapa.premium);
    const any = tapas.findLastIndex(matches);
    const index = plain >= 0 ? plain : any;

    if (index >= 0) {
      setTapas((current) => current.filter((_, at) => at !== index));
    }
  };

  const togglePremium = (index: number) => {
    const target = tapas[index];

    if (!target || (!target.premium && premiumsLeft <= 0)) {
      return;
    }

    sound.tap();
    setTapas((current) =>
      current.map((tapa, at) => (at === index ? { ...tapa, premium: !tapa.premium } : tapa)),
    );
  };

  const addBurnt = (value: number) => {
    if (burnts.length >= deckLimits.burnt) {
      return;
    }

    sound.pick();
    setBurnts((current) => [...current, { value, premium: false }]);
  };

  const dropBurntOf = (value: number) => {
    const plain = burnts.findLastIndex((pick) => pick.value === value && !pick.premium);
    const any = burnts.findLastIndex((pick) => pick.value === value);
    const index = plain >= 0 ? plain : any;

    if (index >= 0) {
      setBurnts((current) => current.filter((_, at) => at !== index));
    }
  };

  const toggleBurntPremium = (index: number) => {
    const target = burnts[index];

    if (!target || target.value === 0 || (!target.premium && premiumsLeft <= 0)) {
      return;
    }

    sound.tap();
    setBurnts((current) => current.map((pick, at) => (at === index ? { ...pick, premium: !pick.premium } : pick)));
  };

  const removeBurnt = (index: number) => {
    sound.tap();
    setBurnts((current) => current.filter((_, at) => at !== index));
  };

  const toggleBathroom = (id: string) => {
    if (!bathroom.includes(id) && bathroom.length >= deckLimits.bathroom) {
      return;
    }

    sound.tap();
    setCoffeeIds((current) => current.filter((kept) => kept !== id));
    setBathroomIds((current) =>
      current.includes(id) ? current.filter((kept) => kept !== id) : [...current, id],
    );
  };

  const toggleCoffee = (id: string) => {
    if (!coffee.includes(id) && coffee.length >= deckLimits.coffee) {
      return;
    }

    sound.tap();
    setBathroomIds((current) => current.filter((kept) => kept !== id));
    setCoffeeIds((current) =>
      current.includes(id) ? current.filter((kept) => kept !== id) : [...current, id],
    );
  };

  const pickPartner = (id: string) => {
    sound.tap();
    setPartnerId(id);
    setMode(SplitMode.Half);
    setPicking(false);
  };

  const pickBirthday = (id: string) => {
    sound.lucky();
    setBirthdayId(id);
    setCake(true);
    setBathroomIds((current) => current.filter((kept) => kept !== id));
    setCoffeeIds((current) => current.filter((kept) => kept !== id));
    setBirthdayBurst((current) => current + 1);
  };

  const dropCake = () => {
    setCake(false);
    setBirthdayId(null);
  };

  const deckWarning =
    tapas.length >= deckLimits.tapas
      ? "Acabaram as tapas do baralho"
      : burnts.length >= deckLimits.burnt
        ? "Acabaram os pratos queimados do baralho"
        : wine >= deckLimits.wine
          ? "Acabou o vinho do baralho"
          : tips >= deckLimits.tips
            ? "Acabaram as gorjetas do baralho"
            : null;

  const advanceChecklist = () => {
    if (!checklist) {
      return;
    }

    if (checklist.full && checklist.step < 2) {
      setChecklist({ step: checklist.step + 1, full: true });

      return;
    }

    setChecklist(null);

    if (checklist.full) {
      setConfirming(true);
    }
  };

  const backChecklist = () => {
    if (checklist?.full && checklist.step > 0) {
      setChecklist({ step: checklist.step - 1, full: true });

      return;
    }

    setChecklist(null);
  };

  const draft: BillDraft = {
    roundNumber,
    payerId,
    split,
    bathroomIds: bathroom,
    coffeeIds: coffee,
    birthdayId: birthday,
    ...cards,
  };

  return (
    <>
      {birthdayBurst > 0 ? <Balloons key={birthdayBurst} /> : null}

      {checklist && others.length > 0 ? (
        <SitOutChecklist
          step={checklist.step}
          full={checklist.full}
          people={others}
          bathroom={bathroom}
          coffee={coffee}
          birthdayId={birthday}
          total={breakdown.total}
          onToggleBathroom={toggleBathroom}
          onToggleCoffee={toggleCoffee}
          onPickBirthday={pickBirthday}
          onNoBirthday={dropCake}
          onNext={advanceChecklist}
          onBack={backChecklist}
        />
      ) : null}

      {picking ? (
        <PartnerPicker
          people={others}
          partnerId={partner?.id ?? null}
          reasonFor={reasonFor}
          onPick={pickPartner}
          onCancel={() => setPicking(false)}
        />
      ) : null}

      {confirming ? (
        <ConfirmModal
          title={`Fechar a conta do bar ${roundNumber}?`}
          confirmLabel={`Isso, ${euros(breakdown.total)}`}
          cancelLabel="Deixa eu conferir"
          busy={busy}
          body={
            <div className="flex flex-col gap-2">
              <p>
                Conta de <strong className="text-ink">{euros(breakdown.total)}</strong>
                {breakdown.raw < 0 ? " (os queimados zeraram a conta)" : ""}.
              </p>
              <ul className="flex flex-col gap-1 rounded-2xl bg-cream px-3 py-2 text-xs">
                {[
                  ...shares,
                  ...refunds
                    .filter((item) => !shares.some((share) => share.playerId === item.player_id))
                    .map((item) => ({ playerId: item.player_id, amount: 0 })),
                ].map((share) => {
                  const person = players.find((item) => item.id === share.playerId);
                  const refund = refunds.find((item) => item.player_id === share.playerId)?.amount ?? 0;

                  if (!person) {
                    return null;
                  }

                  return (
                    <li key={share.playerId} className="flex justify-between gap-2">
                      <span className="truncate">{person?.name ?? "Alguém"}</span>
                      <span className="font-semibold tabular-nums">
                        −{share.amount}€ · fica com {(person?.savings ?? 0) + refund - share.amount}€
                      </span>
                    </li>
                  );
                })}
              </ul>
              {initial ? (
                <p className="text-xs text-ink/60">Isso entra no lugar da conta que estava lançada.</p>
              ) : null}
            </div>
          }
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            onSave(draft);
          }}
        />
      ) : null}

      <div className="fixed inset-0 z-[55] flex items-end justify-center bg-ink/75 p-2 sm:items-center sm:p-3">
        <div className="animate-card-pop flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col overflow-hidden rounded-[1.75rem] border-4 border-ink bg-paper shadow-[0_14px_0_var(--color-ink)]">
          <div className="stage-orange shrink-0 border-b-4 border-ink px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <span className="display block text-2xl leading-tight text-ink">
                  {initial ? `Corrigir o bar ${roundNumber}` : `Conta do bar ${roundNumber}`}
                </span>
                <span
                  role="status"
                  aria-live="polite"
                  className={`block text-xs font-semibold ${deckWarning ? "text-flame" : "text-ink/75"}`}
                >
                  {deckWarning ?? "Toque para somar, use o −1 embaixo da carta para tirar"}
                </span>
              </div>
              <button
                type="button"
                onClick={onBack}
                className="display shrink-0 rounded-xl bg-paper/80 px-3 py-1.5 text-sm text-ink"
              >
                Voltar
              </button>
            </div>
          </div>

          <div className="soft-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
            <section>
              <h3 className="display mb-1.5 px-1 text-sm uppercase tracking-[0.14em] text-ink/60">
                Quem pediu a conta
              </h3>
              <CardRail>
                {players.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => {
                      sound.tap();
                      setPayerId(person.id);
                    }}
                    aria-pressed={person.id === payerId}
                    className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl border-2 px-2 py-1.5 ${
                      person.id === payerId ? "border-ink bg-gold" : "border-transparent bg-cream"
                    }`}
                  >
                    <Avatar name={person.name} photo={person.avatar} emoji={person.emoji} size="sm" />
                    <span className="max-w-[4.5rem] truncate text-[0.7rem] font-semibold">
                      {person.id === meId ? "Eu" : person.name}
                    </span>
                  </button>
                ))}
              </CardRail>
            </section>

            {kindOrder.map((kind) => {
              const used = tapas.some((tapa) => tapa.kind === kind);

              return (
                <section key={kind} className="mt-3">
                  <h3 className="display mb-1.5 px-1 text-sm uppercase tracking-[0.14em] text-ink/60">
                    {kindLabels[kind]}
                  </h3>
                  <CardRail>
                    {menuFor(kind).map((dish) => {
                      const count = counts.get(`${kind}-${dish.price}`) ?? 0;
                      const name = `${dish.name ?? kindLabels[kind]} de ${dish.price} euros`;

                      return (
                        <CardSlot key={dish.price}>
                          <TableCard
                            tone={kind}
                            corner={`${dish.price}€`}
                            title={dish.name ?? kindLabels[kind]}
                            art={dish.emoji}
                            count={count}
                            muted={tapas.length >= deckLimits.tapas}
                            onTap={() => addTapa(kind, dish.price)}
                            label={withCount(`Somar ${name}`, count)}
                          />
                          {used ? (
                            <RemoveButton
                              count={count}
                              onTap={() => dropTapaOf(kind, dish.price)}
                              label={`Tirar ${name}, ${count} na conta`}
                            />
                          ) : null}
                        </CardSlot>
                      );
                    })}
                  </CardRail>
                </section>
              );
            })}

            <section className="mt-3">
              <h3 className="display mb-1.5 px-1 text-sm uppercase tracking-[0.14em] text-ink/60">
                Prato queimado
              </h3>
              <CardRail>
                {burntValues.map((value) => {
                  const count = burnts.filter((pick) => pick.value === value).length;

                  return (
                    <CardSlot key={value}>
                      <TableCard
                        tone="BURNT"
                        corner={euros(-value)}
                        title="Plato quemado"
                        art="🔥"
                        count={count}
                        muted={burnts.length >= deckLimits.burnt}
                        onTap={() => addBurnt(value)}
                        label={withCount(`Somar ${burntName(value)}`, count)}
                      />
                      {burnts.length > 0 ? (
                        <RemoveButton
                          count={count}
                          onTap={() => dropBurntOf(value)}
                          label={`Tirar ${burntName(value)}, ${count} na conta`}
                        />
                      ) : null}
                    </CardSlot>
                  );
                })}
              </CardRail>
              <p className="px-1 text-[0.7rem] font-semibold text-ink/55">
                Queimado desconta da conta. O de 0€ só trava a pilha e não muda o total.
              </p>
            </section>

            <section className="mt-3">
              <h3 className="display mb-1.5 px-1 text-sm uppercase tracking-[0.14em] text-ink/60">
                Vinho e gorjeta
              </h3>
              <CardRail>
                <CardSlot>
                  <TableCard
                    tone="WINE"
                    corner={wine > 0 ? euros(wineValue(wine)) : "30€+"}
                    title="Vino tinto"
                    art="🍷"
                    count={wine}
                    muted={wine >= deckLimits.wine}
                    onTap={() => {
                      if (wine < deckLimits.wine) {
                        sound.pick();
                        setWine(wine + 1);
                      }
                    }}
                    label={withCount("Somar vinho", wine)}
                  />
                  {wine > 0 ? (
                    <RemoveButton
                      count={wine}
                      onTap={() => setWine(wine - 1)}
                      label={`Tirar vinho, ${wine} na conta`}
                    />
                  ) : null}
                </CardSlot>
                <CardSlot>
                  <TableCard
                    tone="TIP"
                    corner={breakdown.cheapestTapa ? `+${breakdown.cheapestTapa}€` : "+?"}
                    title="Propina"
                    art="💶"
                    count={tips}
                    muted={tips >= deckLimits.tips}
                    onTap={() => {
                      if (tips < deckLimits.tips) {
                        sound.pick();
                        setTips(tips + 1);
                      }
                    }}
                    label={withCount("Somar gorjeta", tips)}
                  />
                  {tips > 0 ? (
                    <RemoveButton
                      count={tips}
                      onTap={() => setTips(tips - 1)}
                      label={`Tirar gorjeta, ${tips} na conta`}
                    />
                  ) : null}
                </CardSlot>
              </CardRail>
              <p className="px-1 text-[0.7rem] font-semibold text-ink/55">
                Vinho vale pelo conjunto: 1 = 30€, 2 = 60€, 3 = 120€, 4 = 180€, 5 = 240€. Gorjeta soma a
                tapa mais barata.
              </p>
            </section>

            <section className="mt-3">
              <h3 className="display mb-1.5 px-1 text-sm uppercase tracking-[0.14em] text-ink/60">
                Bolo e aniversário
              </h3>
              <div className="rounded-2xl bg-cream p-2">
                <div className="flex items-start gap-3">
                  <CardSlot>
                    <TableCard
                      tone="CAKE"
                      corner={euros(cakeValue)}
                      title="Pastel de cumpleaños"
                      art="🎂"
                      count={cake ? 1 : 0}
                      muted={cake}
                      onTap={() => {
                        sound.pick();
                        setChecklist({ step: 2, full: false });
                      }}
                      label={cake ? "Trocar o aniversariante" : `Somar o bolo de aniversário de ${cakeValue} euros`}
                    />
                    {cake ? <RemoveButton count={1} onTap={dropCake} label="Tirar o bolo de aniversário" /> : null}
                  </CardSlot>
                  <div className="flex-1 pt-1">
                    {birthdayPerson ? (
                      <>
                        <span className="block text-xs font-semibold text-ink/60">Aniversário de</span>
                        <span className="display block truncate text-lg leading-tight text-ink">
                          {birthdayPerson.name}
                        </span>
                        <span className="block text-[0.7rem] font-semibold text-ink/55">
                          Não paga, não racha e não pede a conta.
                        </span>
                      </>
                    ) : (
                      <p className="text-xs font-semibold text-ink/60">
                        Entrou bolo na mesa? Toque na carta e diga de quem é o aniversário.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-4">
              <div className="mb-1.5 flex items-baseline justify-between px-1">
                <h3 className="display text-sm uppercase tracking-[0.14em] text-ink/60">Na conta</h3>
                <span className="text-[0.7rem] font-semibold text-ink/55">
                  ⭐ = Premium (dobra) · restam {premiumsLeft}
                </span>
              </div>
              {tapas.length + burnts.length === 0 ? (
                <p className="rounded-2xl border-2 border-dashed border-ink/25 px-3 py-3 text-center text-xs font-semibold text-ink/50">
                  Nenhuma tapa ainda. Toque nas cartas acima.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-1.5 px-1">
                  {tapas.map((tapa, index) => (
                    <li
                      key={`${tapa.kind}-${tapa.price}-${index}`}
                      className={`flex items-center gap-1 rounded-full border-2 border-ink py-0.5 pl-2.5 pr-1 text-xs font-semibold ${
                        tapa.kind === "MEAT" ? "bg-meat" : tapa.kind === "FISH" ? "bg-fish" : "bg-veg"
                      }`}
                    >
                      <span>
                        {tapaLabel(tapa)} {tapa.premium ? `${tapa.price * 2}€` : `${tapa.price}€`}
                      </span>
                      <Chip active={tapa.premium} onTap={() => togglePremium(index)} label="⭐" />
                      <Chip active={false} onTap={() => removeTapa(index)} label="✕" />
                    </li>
                  ))}
                  {burnts.map((pick, index) => {
                    const starred = pick.premium;

                    return (
                      <li
                        key={`burnt-${pick.value}-${index}`}
                        className="chalkboard flex items-center gap-1 rounded-full border-2 border-ink py-0.5 pl-2.5 pr-1 text-xs font-semibold text-paper"
                      >
                        <span>Queimado {euros(-(starred ? pick.value * 2 : pick.value))}</span>
                        <Chip active={starred} onTap={() => toggleBurntPremium(index)} label="⭐" />
                        <Chip active={false} onTap={() => removeBurnt(index)} label="✕" />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {others.length > 0 ? (
              <section className="mt-4">
                <h3 className="display mb-1.5 px-1 text-sm uppercase tracking-[0.14em] text-ink/60">
                  Quem não paga
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    sound.tap();
                    setChecklist({ step: 0, full: false });
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl bg-cream p-2 text-left"
                >
                  <span className="min-w-0 flex-1">
                    {outIds.length === 0 ? (
                      <>
                        <span className="display block text-lg leading-tight text-ink">Todo mundo paga</span>
                        <span className="block text-xs font-semibold text-ink/60">
                          Alguém foi ao banheiro ou tomar café? Toque para marcar.
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="mb-1 flex flex-wrap gap-1.5">
                          {others
                            .filter((person) => outIds.includes(person.id))
                            .map((person) => (
                              <PersonTag key={person.id} person={person} reason={reasonFor(person.id)} />
                            ))}
                        </span>
                        <span className="block text-[0.7rem] font-semibold text-ink/55">
                          Quem está no banheiro, no café ou de aniversário não paga nem racha a conta.
                        </span>
                      </>
                    )}
                  </span>
                  <span className="display shrink-0 rounded-xl border-2 border-ink bg-paper px-3 py-1 text-sm text-ink">
                    {outIds.length === 0 ? "Marcar" : "Mudar"}
                  </span>
                </button>
              </section>
            ) : null}

            <section className="mt-4">
              <h3 className="display mb-1.5 px-1 text-sm uppercase tracking-[0.14em] text-ink/60">
                Como vai pagar
              </h3>
              <div className="grid grid-cols-3 gap-1.5">
                {splitOptions.map((option) => (
                  <button
                    key={option.mode}
                    type="button"
                    onClick={() => {
                      sound.tap();

                      if (option.mode === SplitMode.Half) {
                        setPicking(true);
                        return;
                      }

                      setMode(option.mode);
                    }}
                    aria-pressed={mode === option.mode}
                    className={`rounded-2xl border-2 border-ink px-1.5 py-2 text-center ${
                      mode === option.mode ? "bg-ink text-paper shadow-[0_3px_0_var(--color-flame)]" : "bg-paper text-ink"
                    }`}
                  >
                    <span className="display block text-sm leading-tight">{option.label}</span>
                    <span className="mt-0.5 block text-[0.6rem] font-semibold opacity-70">{option.hint}</span>
                  </button>
                ))}
              </div>

              {mode === SplitMode.Half ? (
                <button
                  type="button"
                  onClick={() => {
                    sound.tap();
                    setPicking(true);
                  }}
                  className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-cream p-2 text-left"
                >
                  {partner ? (
                    <>
                      <Avatar name={partner.name} photo={partner.avatar} emoji={partner.emoji} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-ink/60">Rachando com</span>
                        <span className="display block truncate text-lg leading-tight text-ink">{partner.name}</span>
                      </span>
                    </>
                  ) : (
                    <span className="min-w-0 flex-1 px-1 text-sm font-semibold text-flame">
                      Escolha com quem rachar
                    </span>
                  )}
                  <span className="display shrink-0 rounded-xl border-2 border-ink bg-paper px-3 py-1 text-sm text-ink">
                    {partner ? "Trocar" : "Escolher"}
                  </span>
                </button>
              ) : null}

              {mode === SplitMode.Dutch ? (
                <div className="mt-2 rounded-2xl bg-cream p-2">
                  <p className="mb-1.5 px-1 text-xs font-semibold text-ink/70">Quem racha a conta</p>
                  <div className="flex flex-wrap gap-1.5">
                    {players.map((person) => (
                      <PersonTag key={person.id} person={person} reason={reasonFor(person.id)} />
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          </div>

          <div className="shrink-0 border-t-4 border-ink bg-cream px-4 pb-4 pt-3">
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[0.7rem] font-semibold text-ink/70">
              <span>Tapas {euros(breakdown.tapas)}</span>
              {breakdown.premiumBonus !== 0 ? <span>Premium {euros(breakdown.premiumBonus)}</span> : null}
              {breakdown.burnt !== 0 ? <span>Queimado {euros(breakdown.burnt)}</span> : null}
              {breakdown.wine > 0 ? <span>Vinho {euros(breakdown.wine)}</span> : null}
              {breakdown.cake > 0 ? <span>Bolo {euros(breakdown.cake)}</span> : null}
              {breakdown.tips > 0 ? <span>Gorjeta {euros(breakdown.tips)}</span> : null}
            </div>
            <div className="mt-1 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <span className={`block text-xs font-semibold ${blocker ? "text-flame" : "text-ink/60"}`}>
                  {blocker ??
                    (split.mode === SplitMode.Solo
                      ? `${payer?.id === meId ? "Você paga" : `${payer?.name ?? "Alguém"} paga`}`
                      : shares.length === 1
                        ? "Só uma pessoa paga"
                        : `${shares.length} pessoas dividem`)}
                </span>
                <span key={breakdown.total} className="display animate-score-bump block text-4xl leading-none text-flame">
                  {euros(breakdown.total)}
                </span>
              </div>
              <Button
                variant="ink"
                size="lg"
                disabled={busy || blocker !== null}
                onClick={() => (others.length > 0 ? setChecklist({ step: 0, full: true }) : setConfirming(true))}
              >
                {busy ? "Salvando..." : "Fechar a conta"}
              </Button>
            </div>
            {error ? (
              <p role="alert" className="mt-2 rounded-2xl border-2 border-ink bg-flame-soft px-3 py-2 text-sm font-semibold">
                Não salvou: {error}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

function CardSlot({ children }: { children: ReactNode }) {
  return <div className="flex w-[4.2rem] shrink-0 flex-col items-center gap-2">{children}</div>;
}

function RemoveButton({ count, onTap, label }: { count: number; onTap: () => void; label: string }) {
  const empty = count === 0;

  return (
    <button
      type="button"
      onClick={() => {
        sound.tap();
        onTap();
      }}
      disabled={empty}
      aria-hidden={empty}
      aria-label={empty ? undefined : label}
      className={`display animate-rise-in h-11 w-full rounded-xl border-2 text-base leading-none ${
        empty
          ? "border-dashed border-ink/25 text-ink/25"
          : "border-ink bg-paper text-ink shadow-[0_2px_0_var(--color-ink)] active:translate-y-0.5 active:bg-ink active:text-paper active:shadow-none"
      }`}
    >
      −1
    </button>
  );
}

function Chip({ active, onTap, label }: { active: boolean; onTap: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onTap}
      className={`flex h-6 w-6 items-center justify-center rounded-full border text-[0.7rem] ${
        active ? "border-ink bg-gold" : "border-ink/40 bg-paper/80"
      }`}
    >
      {label}
    </button>
  );
}

function PersonTag({ person, reason }: { person: PlayerView; reason: SitOutReason | null }) {
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full border-2 py-0.5 pl-0.5 pr-2.5 text-xs font-semibold ${
        reason ? "border-ink/30 bg-paper opacity-60" : "border-ink bg-gold"
      }`}
    >
      <Avatar name={person.name} photo={person.avatar} emoji={person.emoji} size="sm" />
      <span className={reason ? "line-through" : ""}>{person.name}</span>
      {reason ? <span aria-label={reason.label}>{reason.icon}</span> : null}
    </span>
  );
}

function PartnerPicker({
  people,
  partnerId,
  reasonFor,
  onPick,
  onCancel,
}: {
  people: PlayerView[];
  partnerId: string | null;
  reasonFor: (id: string) => SitOutReason | null;
  onPick: (id: string) => void;
  onCancel: () => void;
}) {
  const nobody = people.every((person) => reasonFor(person.id) !== null);

  return (
    <div className="fixed inset-0 z-[58] flex items-end justify-center bg-ink/75 p-3 sm:items-center sm:p-4">
      <div className="animate-card-pop flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col overflow-hidden rounded-[1.75rem] border-4 border-ink bg-paper shadow-[0_14px_0_var(--color-ink)]">
        <div className="shrink-0 bg-teal px-5 py-4 text-paper">
          <span className="display block text-xl leading-tight">Rachar com quem?</span>
          <span className="block text-xs font-semibold opacity-80">Quem você tocar paga metade da conta</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {nobody ? (
            <p className="mb-3 text-sm text-ink/75">
              Ninguém pode rachar agora: quem sobrou está no banheiro ou faz aniversário.
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            {people.map((person) => {
              const reason = reasonFor(person.id);

              return (
                <button
                  key={person.id}
                  type="button"
                  disabled={reason !== null}
                  onClick={() => onPick(person.id)}
                  aria-pressed={partnerId === person.id}
                  className={`flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 transition-transform ${
                    reason
                      ? "border-ink/20 bg-cream opacity-55"
                      : partnerId === person.id
                        ? "border-ink bg-gold active:scale-95"
                        : "border-ink bg-paper active:scale-95"
                  }`}
                >
                  <Avatar name={person.name} photo={person.avatar} emoji={person.emoji} size="lg" />
                  <span className="display max-w-full truncate text-base leading-tight text-ink">{person.name}</span>
                  {reason ? (
                    <span className="text-[0.7rem] font-semibold text-ink/70">
                      {reason.icon} {reason.label}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 border-t-2 border-ink/10 px-5 pb-5 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="display w-full cursor-pointer rounded-xl px-3 py-2 text-sm text-ink/55 transition-colors hover:text-ink"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

function SitOutChecklist({
  step,
  full,
  people,
  bathroom,
  coffee,
  birthdayId,
  total,
  onToggleBathroom,
  onToggleCoffee,
  onPickBirthday,
  onNoBirthday,
  onNext,
  onBack,
}: {
  step: number;
  full: boolean;
  people: PlayerView[];
  bathroom: string[];
  coffee: string[];
  birthdayId: string | null;
  total: number;
  onToggleBathroom: (id: string) => void;
  onToggleCoffee: (id: string) => void;
  onPickBirthday: (id: string) => void;
  onNoBirthday: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const steps = [
    {
      icon: sitOutReasons.coffee.icon,
      title: "Alguém foi tomar um café?",
      hint: "Quem está no café não paga nem racha esta conta",
      note: "Toque em quem saiu da mesa para o cafezinho. Se ninguém saiu, é só seguir.",
      chosen: coffee,
      onTap: onToggleCoffee,
    },
    {
      icon: sitOutReasons.bathroom.icon,
      title: "Alguém está no banheiro?",
      hint: "Quem está no banheiro não paga nem racha esta conta",
      note: "Toque em quem está no banheiro. Se ninguém está, é só seguir.",
      chosen: bathroom,
      onTap: onToggleBathroom,
    },
    {
      icon: sitOutReasons.birthday.icon,
      title: "É aniversário de alguém?",
      hint: "Quem faz aniversário não paga, e o bolo entra na conta",
      note: `Escolher o aniversariante põe a carta do bolo na conta: +${cakeValue}€.`,
      chosen: birthdayId ? [birthdayId] : [],
      onTap: onPickBirthday,
    },
  ];

  const current = steps[Math.min(step, steps.length - 1)];
  const birthdayStep = step === 2;

  return (
    <div className="fixed inset-0 z-[58] flex items-end justify-center bg-ink/75 p-3 sm:items-center sm:p-4">
      <div className="animate-card-pop flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col overflow-hidden rounded-[1.75rem] border-4 border-ink bg-paper shadow-[0_14px_0_var(--color-ink)]">
        <div className="shrink-0 bg-teal px-5 py-4 text-paper">
          {full ? (
            <span className="mb-1 flex gap-1.5">
              {steps.map((item, index) => (
                <span
                  key={item.title}
                  className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-paper" : "bg-paper/35"}`}
                />
              ))}
            </span>
          ) : null}
          <span className="display block text-xl leading-tight">
            {current.icon} {current.title}
          </span>
          <span className="block text-xs font-semibold opacity-80">{current.hint}</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <p className="mb-3 text-xs font-semibold text-ink/60">{current.note}</p>
          <div className="grid grid-cols-2 gap-2">
            {people.map((person) => {
              const active = current.chosen.includes(person.id);

              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => current.onTap(person.id)}
                  aria-pressed={active}
                  className={`flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 transition-transform active:scale-95 ${
                    active ? "border-ink bg-gold" : "border-ink bg-paper"
                  }`}
                >
                  <Avatar name={person.name} photo={person.avatar} emoji={person.emoji} size="lg" />
                  <span className="display max-w-full truncate text-base leading-tight text-ink">{person.name}</span>
                  <span className="text-[0.7rem] font-semibold text-ink/60">
                    {active ? `${current.icon} marcado` : "toca para marcar"}
                  </span>
                </button>
              );
            })}
          </div>

          {birthdayStep && birthdayId ? (
            <button
              type="button"
              onClick={onNoBirthday}
              className="mt-3 w-full rounded-2xl border-2 border-dashed border-ink/30 px-3 py-2 text-xs font-semibold text-ink/60"
            >
              Ninguém faz aniversário hoje, tira o bolo da conta
            </button>
          ) : null}
        </div>

        <div className="shrink-0 border-t-2 border-ink/10 px-5 pb-5 pt-3">
          <Button variant="ink" size="lg" fullWidth onClick={onNext}>
            {full && step < 2 ? "Seguir" : full ? `Fechar a conta · ${euros(total)}` : "Pronto"}
          </Button>
          <button
            type="button"
            onClick={onBack}
            className="display mt-1 w-full cursor-pointer rounded-xl px-3 py-2 text-sm text-ink/55 transition-colors hover:text-ink"
          >
            {full && step > 0 ? "Voltar" : "Cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}
