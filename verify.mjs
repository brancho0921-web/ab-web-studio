import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile('index.html', 'utf8');
const required = [
  'AB Web Studio',
  'https://wa.me/584269726771?text=',
  'mailto:contacto.abwebstudio@gmail.com',
  'https://www.instagram.com/estudioabweb/',
  'https://brancho0921-web.github.io/navaja-58-demo/',
  'https://brancho0921-web.github.io/brasa-nativa-demo/',
  'https://brancho0921-web.github.io/lumina-dental-demo/',
  '+58 426 972 6771',
  '3 y 6 días hábiles'
];

for (const value of required) {
  if (!html.includes(value)) throw new Error(`Falta contenido requerido: ${value}`);
}

for (const asset of ['assets/favicon.svg', 'assets/ab-web-studio-logo.png', 'assets/navaja-58-mockup.png', 'assets/brasa-nativa-mockup-v3.webp', 'assets/lumina-dental-mockup.png']) {
  const info = await stat(asset);
  if (!info.isFile() || info.size === 0) throw new Error(`Activo inválido: ${asset}`);
}

const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if (!script) throw new Error('No se encontró el script principal');
new vm.Script(script);

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Hay identificadores HTML duplicados');

const targets = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
for (const target of targets) {
  if (!ids.includes(target)) throw new Error(`Destino interno inexistente: #${target}`);
}

console.log('Verificación correcta: contenido, enlaces, activos, destinos internos y JavaScript.');
