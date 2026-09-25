// Максимальный кадр (фриз) вокруг действий: первый выстрел, перезарядка, смена дня/ночи, смена модуля
export default async (page, shot, log) => {
  const r = await page.evaluate(async () => {
    const a = __app; a.setQuality("low");
    await new Promise((r) => setTimeout(r, 2500));
    const worst = async (fn, ms = 1500) => {
      let mx = 0, last = performance.now(); const t0 = last; let run = true;
      const f = () => { const n = performance.now(); mx = Math.max(mx, n - last); last = n; if (run) requestAnimationFrame(f); };
      requestAnimationFrame(f);
      await new Promise((r) => setTimeout(r, 50));
      const s = performance.now(); fn(); const sync = performance.now() - s;
      await new Promise((r) => setTimeout(r, ms)); run = false;
      return { maxFrame: Math.round(mx), syncCall: Math.round(sync) };
    };
    const out = {};
    out.firstShot = await worst(() => { a.audio.init(); a.triggerDown(); setTimeout(() => a.triggerUp(), 60); });
    out.secondShot = await worst(() => { a.triggerDown(); setTimeout(() => a.triggerUp(), 60); });
    out.reload = await worst(() => a.reload(), 3000);
    out.night = await worst(() => a.cycleTime());
    out.day = await worst(() => a.cycleTime());
    const slot = a.def.slots.find((s) => s.id === "muzzle");
    const alt = slot && a.asm.slotOptions(slot).find((p) => p.id !== a.cfg.muzzle?.id);
    if (alt) out.partChange = await worst(() => a.setPart("muzzle", alt.id));
    return out;
  });
  log(JSON.stringify(r));
};
