"use client"

import { useEffect, useRef } from "react"
import {
  AttributionControl,
  LngLatBounds,
  Map as MapLibreMap,
  NavigationControl,
  Popup,
  setWorkerUrl,
  type GeoJSONSource,
  type MapGeoJSONFeature,
  type MapLayerMouseEvent,
} from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

import {
  colorOcupacion,
  formatoNumero,
  formatoPct,
  type SedeMapa,
} from "@/lib/sedes/ocupacion-utils"

// El worker se sirve desde /public (ver scripts/copy-maplibre-worker.mjs).
setWorkerUrl("/maplibre-gl-worker.mjs")

const CENTRO_COLOMBIA: [number, number] = [-74.2973, 4.5701]
const ZOOM_INICIAL = 5.2
// Estilo claro de OpenFreeMap (datos de OpenStreetMap). Sin API key.
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron"

const FUENTE_SEDES = "sedes"
const CAPA_SEDES = "sedes-puntos"

type SedeConUbicacion = SedeMapa & { latitud: number; longitud: number }

type PropiedadesSede = {
  id: string
  nombre: string
  color: string
  tooltip: string
  popup: string
}

type ColeccionSedes = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  PropiedadesSede
>

const COLECCION_VACIA: ColeccionSedes = {
  type: "FeatureCollection",
  features: [],
}

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

function aColeccion(sedes: SedeMapa[]): ColeccionSedes {
  return {
    type: "FeatureCollection",
    features: sedes.filter(tieneUbicacion).map((sede) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [sede.longitud, sede.latitud],
      },
      properties: {
        id: sede.id,
        nombre: sede.nombre,
        color: colorOcupacion(sede.ocupacion).hex,
        tooltip: htmlTooltip(sede),
        popup: htmlPopup(sede),
      },
    })),
  }
}

function ajustarVista(mapa: MapLibreMap, sedes: SedeMapa[]) {
  const puntos = sedes.filter(tieneUbicacion)
  if (puntos.length === 0) return

  if (puntos.length === 1) {
    mapa.jumpTo({
      center: [puntos[0].longitud, puntos[0].latitud],
      zoom: 13,
    })
    return
  }

  const limites = new LngLatBounds()
  for (const punto of puntos) {
    limites.extend([punto.longitud, punto.latitud])
  }
  mapa.fitBounds(limites, { padding: 60, maxZoom: 13 })
}

export default function MapaMapLibre({ sedes }: { sedes: SedeMapa[] }) {
  const contenedorRef = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<MapLibreMap | null>(null)
  const tooltipRef = useRef<Popup | null>(null)
  const popupRef = useRef<Popup | null>(null)
  const datosRef = useRef<ColeccionSedes>(COLECCION_VACIA)
  const sedesRef = useRef<SedeMapa[]>(sedes)

  useEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor) return

    const mapa = new MapLibreMap({
      container: contenedor,
      style: STYLE_URL,
      center: CENTRO_COLOMBIA,
      zoom: ZOOM_INICIAL,
      scrollZoom: true,
      attributionControl: false,
    })

    mapa.addControl(
      new NavigationControl({ showCompass: false }),
      "top-right"
    )
    mapa.addControl(
      new AttributionControl({ compact: true }),
      "bottom-right"
    )

    const tooltip = new Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 14,
      className: "mapa-tooltip",
      maxWidth: "280px",
    })
    const popup = new Popup({
      closeButton: true,
      offset: 14,
      className: "mapa-popup",
      maxWidth: "320px",
    })

    mapaRef.current = mapa
    tooltipRef.current = tooltip
    popupRef.current = popup

    mapa.on("load", () => {
      mapa.addSource(FUENTE_SEDES, {
        type: "geojson",
        data: datosRef.current,
      })

      mapa.addLayer({
        id: CAPA_SEDES,
        type: "circle",
        source: FUENTE_SEDES,
        paint: {
          "circle-radius": 8,
          "circle-color": ["get", "color"],
          "circle-opacity": 0.92,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      })

      mapa.on("mouseenter", CAPA_SEDES, (evento: MapLayerMouseEvent) => {
        mapa.getCanvas().style.cursor = "pointer"
        const feature = evento.features?.[0] as
          | MapGeoJSONFeature
          | undefined
        if (!feature) return
        const propiedades = feature.properties as PropiedadesSede
        tooltip
          .setLngLat(evento.lngLat)
          .setHTML(propiedades.tooltip)
          .addTo(mapa)
      })

      mapa.on("mouseleave", CAPA_SEDES, () => {
        mapa.getCanvas().style.cursor = ""
        tooltip.remove()
      })

      mapa.on("click", CAPA_SEDES, (evento: MapLayerMouseEvent) => {
        const feature = evento.features?.[0] as
          | MapGeoJSONFeature
          | undefined
        if (!feature) return
        const propiedades = feature.properties as PropiedadesSede
        tooltip.remove()
        popup
          .setLngLat(evento.lngLat)
          .setHTML(propiedades.popup)
          .addTo(mapa)
      })

      ajustarVista(mapa, sedesRef.current)
    })

    const observador = new ResizeObserver(() => mapa.resize())
    observador.observe(contenedor)

    return () => {
      observador.disconnect()
      tooltip.remove()
      popup.remove()
      mapa.remove()
      mapaRef.current = null
      tooltipRef.current = null
      popupRef.current = null
    }
  }, [])

  useEffect(() => {
    sedesRef.current = sedes
    const datos = aColeccion(sedes)
    datosRef.current = datos

    const mapa = mapaRef.current
    const fuente = mapa?.getSource(FUENTE_SEDES) as GeoJSONSource | undefined
    if (!mapa || !fuente) return

    tooltipRef.current?.remove()
    popupRef.current?.remove()
    fuente.setData(datos)
    ajustarVista(mapa, sedes)
  }, [sedes])

  return (
    <div
      ref={contenedorRef}
      className="mapa-dashboard h-full w-full bg-muted"
    />
  )
}
