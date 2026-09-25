export default async (page, shot, log) => {
  const r = await page.evaluate(async () => {
    const a = __app; window.__pause = true;
    const V = a.gun.position.constructor, M4 = a.gun.matrixWorld.constructor;
    const inv = new M4(), mm = new M4(), A = new V(), B = new V(), C = new V(), P = new V();
    const CELL = 1.0; // мм
    // точный ключ ячейки (координаты ±4 м в мм укладываются в 2^39 — без коллизий)
    const key = (x, y, z) => (Math.floor(x / CELL) + 4096) + 8192 * ((Math.floor(y / CELL) + 4096) + 8192 * (Math.floor(z / CELL) + 4096));
    const meshesIn = (o) => { const m = []; o.traverseVisible((x) => { if (x.isMesh && !x.userData.reticle && !x.isInstancedMesh && x.geometry?.attributes.position) m.push(x); }); return m; };
    // точки поверхности меша в координатах оружия (мм), шаг ≈ step
    const samples = (mesh, step, cb) => {
      mm.multiplyMatrices(inv, mesh.matrixWorld);
      const g = mesh.geometry, pos = g.attributes.position, idx = g.index;
      const n = idx ? idx.count : pos.count;
      let nan = false;
      for (let i = 0; i < n; i += 3) {
        const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
        A.fromBufferAttribute(pos, i0).applyMatrix4(mm); B.fromBufferAttribute(pos, i1).applyMatrix4(mm); C.fromBufferAttribute(pos, i2).applyMatrix4(mm);
        if (!(isFinite(A.x + A.y + A.z + B.x + B.y + B.z + C.x + C.y + C.z))) { nan = true; continue; }
        const L = Math.max(A.distanceTo(B), B.distanceTo(C), C.distanceTo(A));
        const k = Math.min(40, Math.ceil(L / step));
        for (let u = 0; u <= k; u++) for (let v = 0; v <= k - u; v++) {
          const w = k ? 1 / k : 0;
          P.set(0, 0, 0).addScaledVector(A, 1 - (u + v) * w).addScaledVector(B, u * w).addScaledVector(C, v * w);
          cb(P.x, P.y, P.z);
        }
      }
      return nan;
    };
    const def = a.def, report = [], notFit = [];
    let tested = 0;
    const tryFit = (slot, part) => {
      a.setPart(slot.id, part.id);
      if (a.asm.installed.get(slot.id)?.part.id === part.id) return true;
      // носители: перебор модулей других слотов, дающих планки/крепления
      for (const s2 of def.slots) {
        if (s2.id === slot.id || !/cover|hg|handguard|mount|rail|top|barrel|side|upper|claw|forend|scope|rs|stock/i.test(s2.id)) continue;
        for (const p2 of a.asm.slotOptions(s2)) {
          a.resetCfg(); a.setPart(s2.id, p2.id); a.setPart(slot.id, part.id);
          if (a.asm.installed.get(slot.id)?.part.id === part.id) return true;
        }
      }
      return false;
    };
    const check = (slotId, partId) => {
      const it = a.asm.installed.get(slotId);
      a.gun.updateMatrixWorld(true); inv.copy(a.gun.matrixWorld).invert();
      const mine = meshesIn(it.obj), set = new Set(mine);
      if (!mine.length) return null;
      const grid = new Set();
      let nanRest = false;
      for (const m of meshesIn(a.gun)) if (!set.has(m)) nanRest = samples(m, 1.0, (x, y, z) => grid.add(key(x, y, z))) || nanRest;
      let best = Infinity, nan = false;
      const near = (x, y, z) => { for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) if (grid.has(key(x + dx * CELL, y + dy * CELL, z + dz * CELL))) return true; return false; };
      let touching = false;
      for (const m of mine) { nan = samples(m, 1.0, (x, y, z) => { if (!touching && near(x, y, z)) touching = true; }) || nan; if (touching) break; }
      return { touching, nan };
    };
    for (const slot of def.slots) for (const part of a.asm.slotOptions(slot)) {
      a.resetCfg();
      tested++;
      if (!tryFit(slot, part)) { notFit.push(slot.id + ":" + part.id); continue; }
      const c = check(slot.id, part.id);
      if (!c) continue;
      if (!c.touching) report.push(slot.id + ":" + part.id + " — не касается оружия (зазор > ~2 мм)");
      if (c.nan) report.push(slot.id + ":" + part.id + " — NaN в геометрии");
    }
    // самопроверка: опустить магазин на 6 мм
    a.resetCfg();
    const sid = ["mag", "stock", "muzzle", "pgrip", "grip"].find((k) => a.asm.installed.get(k));
    const it = a.asm.installed.get(sid);
    let self = "n/a";
    if (it) { it.obj.position.z += 60; self = sid + (check(sid).touching ? ": НЕ пойман" : ": пойман"); it.obj.position.z -= 60; }
    a.resetCfg(); window.__pause = false;
    return { weapon: def.id, tested, notFit, report, selfTest: self };
  });
  log(JSON.stringify(r));
};
