// Разбивка кадра по проходам (gl.finish после каждого) + draw calls
export default async (page, shot, log) => {
  const Q = process.env.PQ || "low";
  const r = await page.evaluate(async (Q) => {
    const a = __app; a.setQuality(Q);
    await new Promise((r) => setTimeout(r, 1200));
    window.__pause = true;
    const S = a.S, R = S.renderer, gl = R.getContext(), c = S.post.composer;
    R.info.autoReset = false;
    const T = {}; const px = new Uint8Array(4); const sync = () => { R.setRenderTarget(null); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); };
    const time = (k, f) => { sync(); const t = performance.now(); f(); sync(); T[k] = (T[k] || 0) + performance.now() - t; };
    const N = 4;
    for (let i = 0; i < N; i++) {
      R.info.reset();
      R.shadowMap.needsUpdate = true;
      // тени отдельно: рендер с обновлением теней минус без
      time("full", () => S.render());
      const calls = R.info.render.calls; T.calls = calls; T.tris = R.info.render.triangles;
      time("full_noShadow", () => S.render());
      for (const p of c.passes) p.__on = p.enabled;
      const passTime = {};
      for (let k = 0; k < c.passes.length; k++) {
        c.passes.forEach((p, j) => p.enabled = j <= k);
        time("upto" + k + ":" + c.passes[k].constructor.name, () => c.render());
      }
      c.passes.forEach((p) => p.enabled = p.__on);
    }
    for (const k in T) if (k !== "calls" && k !== "tris") T[k] = +(T[k] / N).toFixed(1);
    window.__pause = false; R.info.autoReset = true;
    return T;
  }, Q);
  log(JSON.stringify(r));
};
