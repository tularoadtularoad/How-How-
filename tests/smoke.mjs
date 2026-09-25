// Сквозной тест: загрузка, стрельба, перезарядка, прицеливание, кратность, ночь, PiP — без ошибок в консоли
export default async (page, shot, log) => {
  const r = await page.evaluate(async () => {
    const a = __app, w = (ms) => new Promise((r) => setTimeout(r, ms)), out = {};
    a.audio.init();
    a.triggerDown(); await w(400); a.triggerUp();
    a.reload(); await w(3500);
    out.mag = a.st.mag + "/" + a.st.cap;
    a.setADS(true); await w(700);
    const f0 = a.S.camera.fov; a.st.zoomMul = 1; document.querySelector("canvas").dispatchEvent(new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true })); await w(400);
    out.zoom = f0.toFixed(1) + "→" + a.S.camera.fov.toFixed(1);
    out.sight = a.sights[a.st.sightIdx]?.id;
    a.triggerDown(); await w(200); a.triggerUp(); a.setADS(false); await w(700);
    a.cycleTime(); await w(500); a.cycleTime();
    return out;
  });
  log(JSON.stringify(r));
  await shot("smoke_" + (await page.evaluate(() => __app.def.id)));
};
