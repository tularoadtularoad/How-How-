export default async (page, shot, log) => {
  const r = await page.evaluate(async () => {
    const a = __app, w = (ms) => new Promise((r) => setTimeout(r, ms)), out = {};
    for (const s of a.def.slots) if (/rear|front|optic|irons/i.test(s.id) && a.cfg[s.id]) a.setPart(s.id, null);
    out.sights = a.sights.map((s) => s.id + (s.eye ? "@" + s.eye.y.toFixed(0) + "mm" : ""));
    a.setADS(true); await w(3000);
    out.fov1 = a.S.camera.fov.toFixed(1);
    for (let i = 0; i < 3; i++) document.querySelector("canvas").dispatchEvent(new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true }));
    await w(1500);
    out.fov2 = a.S.camera.fov.toFixed(1);
    out.hint = document.querySelector(".ads-hint")?.textContent;
    return out;
  });
  log(JSON.stringify(r));
  await shot("ads_" + (await page.evaluate(() => __app.def.id)));
};
