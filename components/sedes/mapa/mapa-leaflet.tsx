"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

import {
  colorOcupacion,
  formatoNumero,
  formatoPct,
  type SedeMapa,
} from "@/lib/sedes/ocupacion-utils"

const CENTRO_COLOMBIA: L.LatLngTuple = [4.5701, -74.2973]
const ZOOM_INICIAL = 6
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
const ATRIBUCION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

type SedeConUbicacion = SedeMapa & { latitud: number; longitud: number }

function tieneUbicacion(sede: SedeMapa): sede is SedeConUbicacion {
  return sede.latitud != null && sede.longitud != null
}

function escapar(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function htmlTooltip(sede: SedeMapa): string {
  const color = colorOcupacion(sede.ocupacion)
  const ancho = Math.min(sede.ocupacion ?? 0, 100)
  const ubicacion =
    [sede.regional, sede.zonal].filter(Boolean).join(" · ") || "Sin regional/zonal"
  const eps =
    sede.aseguradores.length > 0
      ? `<span style="font-weight:400;color:#6b7280"> · ${sede.aseguradores.length} EPS</span>`
      : ""

  return `
    <div style="display:flex;min-width:12rem;flex-direction:column;gap:6px">
      <p style="margin:0;font-size:14px;line-height:1;font-weight:600">${escapar(sede.nombre)}</p>
      <p style="margin:0;font-size:12px;color:#6b7280">${escapar(ubicacion)}</p>
      <dl style="margin:0;display:grid;grid-template-columns:1fr auto;column-gap:12px;row-gap:2px;font-size:12px">
        <dt style="color:#6b7280">Población</dt>
        <dd style="margin:0;text-align:right;font-weight:500;font-variant-numeric:tabular-nums">${formatoNumero(sede.poblacion)}</dd>
        <dt style="color:#6b7280">Capacidad</dt>
        <dd style="margin:0;text-align:right;font-weight:500;font-variant-numeric:tabular-nums">${formatoNumero(sede.capacidad_usuarios)}</dd>
        <dt style="color:#6b7280">Ocupación</dt>
        <dd style="margin:0;text-align:right;font-weight:600;font-variant-numeric:tabular-nums">${formatoPct(sede.ocupacion)}</dd>
      </dl>
      <div style="height:6px;overflow:hidden;border-radius:9999px;background:#e5e7eb">
        <div style="height:100%;border-radius:9999px;width:${ancho}%;background-color:${color.hex}"></div>
      </div>
      <p style="margin:0;display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500">
        <span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background-color:${color.hex}"></span>
        ${color.etiqueta}${eps}
      </p>
    </div>
  `
}

function htmlPopup(sede: SedeMapa): string {
  return `
    <div style="display:flex;flex-direction:column;gap:4px">
      <p style="margin:0;font-weight:600">${escapar(sede.nombre)}</p>
      <p style="margin:0;font-size:12px">
        Ocupación: ${formatoPct(sede.ocupacion)} (${formatoNumero(sede.poblacion)} de ${formatoNumero(sede.capacidad_usuarios)})
      </p>
      <a href="/sedes/${sede.id}" style="font-size:12px;text-decoration:underline">Ver detalle de la sede</a>
    </div>
  `
}

export default function MapaLeaflet({ sedes }: { sedes: SedeMapa[] }) {
  const contenedorRef = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<L.Map | null>(null)
  const capaRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor) return

    const mapa = L.map(contenedor, {
      center: CENTRO_COLOMBIA,
      zoom: ZOOM_INICIAL,
      scrollWheelZoom: true,
    })

    L.tileLayer(TILE_URL, { attribution: ATRIBUCION }).addTo(mapa)

    mapaRef.current = mapa
    capaRef.current = L.layerGroup().addTo(mapa)

    return () => {
      mapa.remove()
      mapaRef.current = null
      capaRef.current = null
    }
  }, [])

  useEffect(() => {
    const mapa = mapaRef.current
    const capa = capaRef.current
    if (!mapa || !capa) return

    capa.clearLayers()

    const puntos: L.LatLngTuple[] = []

    for (const sede of sedes.filter(tieneUbicacion)) {
      puntos.push([sede.latitud, sede.longitud])

      L.circleMarker([sede.latitud, sede.longitud], {
        radius: 9,
        color: "#ffffff",
        weight: 2,
        fillColor: colorOcupacion(sede.ocupacion).hex,
        fillOpacity: 0.9,
      })
        .bindTooltip(htmlTooltip(sede), {
          direction: "top",
          offset: [0, -10],
          opacity: 1,
        })
        .bindPopup(htmlPopup(sede))
        .addTo(capa)
    }

    if (puntos.length === 1) {
      mapa.setView(puntos[0], 13)
    } else if (puntos.length > 1) {
      mapa.fitBounds(puntos, { padding: [60, 60] })
    }
  }, [sedes])

  return <div ref={contenedorRef} className="h-full w-full bg-muted" />
}
