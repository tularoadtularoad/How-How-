// Сборка: фрагменты src/ (модули уже в общей области видимости, как их выложил esbuild)
// склеиваются по списку из build.json в автономные HTML — открываются и с file://.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(root, p), "utf8");
const manifest = JSON.parse(read("build.json"));
const tpl = read("src/template.html");
const prelude = read("src/prelude.js");
const out = join(root, "weapons");
mkdirSync(out, { recursive: true });

for (const [file, w] of Object.entries(manifest)) {
  const script = prelude + w.parts.map(read).join("");
  const html = tpl
    .replace("{{TITLE}}", () => w.title)
    .replace("{{WEAPON}}", () => w.weapon)
    .replace("{{SCRIPT}}\n", () => script);
  writeFileSync(join(out, file), html);
  console.log(`${file.padEnd(20)} ${(html.length / 1024).toFixed(0)} KB`);
}
