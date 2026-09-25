export default async (page, shot, log) => {
  await page.evaluate(() => {
    const a = __app; a.setQuality("high"); a.setView("back", 1.5);
    const S = a.S, THREE = Object.getPrototypeOf(S.scene).constructor; // Scene
    const m = S.scene.children.find((o) => o.isMesh);
    const Mesh = m.constructor, geo = m.geometry.constructor;
    // маленький квад с шейдером, отдающим 1e30 (→ Inf в half float) — модель пересвеченного блика
    const mat = a.fx.tracers.mesh.material.clone();
    mat.vertexShader = "void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }";
    mat.fragmentShader = "void main(){ float z = gl_FragCoord.x * 0.0; gl_FragColor = vec4(vec3(z / z), 1.0); }";
    mat.blending = 1; mat.transparent = false;
    const q = new Mesh(a.fx.holeGeo, mat); q.scale.setScalar(0.5); q.frustumCulled = false;
    q.position.set(2.5, 1.75, 0.4); q.rotation.y = -Math.PI / 2;
    S.scene.add(q);
    a.invalidate();
  });
  await page.waitForTimeout(1500);
  await shot(process.env.NAME || "inf");
};
