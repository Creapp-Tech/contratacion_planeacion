import { copyFile, mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

// MapLibre necesita su worker como archivo estático. Next/Turbopack no resuelve
// la URL dinámica que trae el paquete, así que lo copiamos a /public y lo
// registramos con setWorkerUrl desde el componente del mapa.
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const origen = resolve(
  raiz,
  "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs"
)
const destino = resolve(raiz, "public/maplibre-gl-worker.mjs")

await mkdir(dirname(destino), { recursive: true })
await copyFile(origen, destino)
