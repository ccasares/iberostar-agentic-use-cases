// Hand-curated summary panel content per use case (persona & purpose, business
// pain, up to four objectives and the agent flow). Kept outside the generated
// lib/use-cases.json so `scripts/generate-data.mjs` never overwrites it.
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Building2,
  CalendarCheck,
  Calculator,
  ChefHat,
  CircleCheck,
  ClipboardList,
  Coins,
  ConciergeBell,
  Database,
  Droplets,
  Ear,
  FileCheck,
  FileSearch,
  FileText,
  Gauge,
  Globe,
  GraduationCap,
  HeartHandshake,
  Leaf,
  ListChecks,
  ListFilter,
  MapPin,
  Package,
  Palmtree,
  Plane,
  Receipt,
  Recycle,
  Scale,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Split,
  Star,
  Target,
  Thermometer,
  TrendingUp,
  UserCheck,
  Users,
  UsersRound,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";

export interface OverviewObjective {
  icon: LucideIcon;
  title: string;
  text: string;
}

export interface OverviewStep {
  icon: LucideIcon;
  label: string;
}

export interface UseCaseOverview {
  eyebrow: string;
  heroIcon: LucideIcon;
  personaTitle: string;
  personaText: string;
  stakeholders: string[];
  pains: string[];
  objectives: OverviewObjective[]; // max 4
  flow: OverviewStep[];
  footnote?: string;
}

export const useCaseOverviews: Record<string, UseCaseOverview> = {
  "conserje-digital-huesped": {
    eyebrow: "Iberostar Beachfront Resorts · 8,1 M huéspedes al año · Reglamento (UE) 1169/2011",
    heroIcon: ConciergeBell,
    personaTitle: "Huésped vacacional de resort",
    personaText:
      "Familias, parejas y adultos quieren resolver sus peticiones antes y durante la estancia en un único punto de contacto, con respuesta inmediata y sin pasar por recepción.",
    stakeholders: ["Recepción", "Housekeeping", "A&B y restaurantes a la carta", "Spa"],
    pains: [
      "Peticiones repartidas entre recepción, PMS, apps y teléfono",
      "Cada departamento ve solo su parte de la estancia",
      "8,1 M de clientes al año esperan respuesta inmediata",
    ],
    objectives: [
      { icon: ConciergeBell, title: "Un solo contacto", text: "Preestancia y estancia en la misma conversación" },
      { icon: Split, title: "Peticiones mezcladas", text: "Llegada, cena, alergia e incidencia resueltas en paralelo" },
      { icon: ShieldCheck, title: "Alérgenos seguros", text: "Dietas registradas y menús según el Reglamento 1169/2011" },
      { icon: Thermometer, title: "SLA vigilado", text: "Incidencias con estado y compensación si se supera el SLA" },
    ],
    flow: [
      { icon: Search, label: "Clasificar intención" },
      { icon: CalendarCheck, label: "Preestancia y reservas" },
      { icon: Wrench, label: "Incidencias" },
      { icon: ShieldCheck, label: "Dietas y alérgenos" },
      { icon: Send, label: "Respuesta única" },
    ],
  },

  "revenue-mix-canales": {
    eyebrow: "~80 resorts · Directo, IHG, W2M y OTA · Alianza IHG desde 2022",
    heroIcon: TrendingUp,
    personaTitle: "Revenue manager / distribución",
    personaText:
      "Fija cada día tarifa y cupos de cada hotel en cuatro canales con economía muy distinta y necesita una única recomendación que aprobar antes de publicarla en el CRS.",
    stakeholders: ["Equipo de distribución", "Canal IHG / IHG One Rewards", "W2M", "Dirección comercial"],
    pains: [
      "Precio decidido cruzando a mano CRS, channel manager, RMS, IHG y shopping",
      "Comisiones, fees de fidelización y paridad distintos por canal",
      "Tarifas mal mapeadas o cupos revendidos erosionan el ADR neto sin verse a tiempo",
    ],
    objectives: [
      { icon: TrendingUp, title: "Demanda prevista", text: "Previsión por hotel y fecha de estancia" },
      { icon: Scale, title: "Paridad vigilada", text: "Desviaciones entre directo, IHG, W2M y OTA detectadas" },
      { icon: Coins, title: "ADR neto por canal", text: "Coste real de distribución tras comisiones y fees" },
      { icon: UserCheck, title: "Aprobación humana", text: "Propuesta única que el revenue manager aprueba" },
    ],
    flow: [
      { icon: TrendingUp, label: "Demanda" },
      { icon: Scale, label: "Paridad" },
      { icon: Coins, label: "Coste de canal" },
      { icon: Target, label: "Recomendación de precio" },
      { icon: UserCheck, label: "Aprobación y CRS" },
    ],
    footnote: "Ninguna tarifa se publica en el CRS sin la aprobación del revenue manager.",
  },

  "desperdicio-alimentario-circular": {
    eyebrow: "Todo incluido · Winnow: −28 % de desperdicio en 6 meses (2023) · Wave of Change",
    heroIcon: ChefHat,
    personaTitle: "Chef ejecutivo / responsable de A&B",
    personaText:
      "Dirige la producción de los buffets de todo incluido y necesita pasar del dato de kg desperdiciados a un plan de producción por estación y a un menú de aprovechamiento.",
    stakeholders: ["Equipo de cocina", "Dirección de hotel", "Sostenibilidad · Economía circular"],
    pains: [
      "Los buffets de todo incluido generan desperdicio",
      "Los pesajes de Winnow se quedan en informes",
      "La producción no se ajusta a la ocupación ni al perfil de huéspedes",
    ],
    objectives: [
      { icon: Gauge, title: "Desperdicio medido", text: "Kg por estación de buffet y servicio" },
      { icon: Users, title: "Comensales previstos", text: "Ocupación y perfil de huéspedes del PMS" },
      { icon: ClipboardList, title: "Plan de producción", text: "Órdenes por estación y ajuste de escandallos" },
      { icon: Recycle, title: "Menú circular", text: "Platos de aprovechamiento con APPCC y alérgenos" },
    ],
    flow: [
      { icon: Gauge, label: "Medición del desperdicio" },
      { icon: Users, label: "Previsión de comensales" },
      { icon: ClipboardList, label: "Plan de producción" },
      { icon: Recycle, label: "Menú circular" },
    ],
    footnote:
      "Los menús de aprovechamiento cumplen el Reglamento (CE) 852/2004 (APPCC) y el Reglamento (UE) 1169/2011 de alérgenos.",
  },

  "reporting-wave-of-change": {
    eyebrow: "~80 hoteles · 13 países · CSRD/ESRS, TNFD y taxonomía UE",
    heroIcon: Leaf,
    personaTitle: "Oficina de la Chief Sustainability Officer",
    personaText:
      "Consolida los KPI ambientales del grupo para el Informe de Progreso Wave of Change, el informe TNFD y la declaración de sostenibilidad, con cada cifra trazada hasta su evidencia.",
    stakeholders: ["Hoteles", "Compras", "Equipos científicos de restauración costera", "Auditoría"],
    pains: [
      "Datos repartidos entre contadores, facturas, ERP, registros científicos y albaranes",
      "Consolidar para CSRD/ESRS y TNFD cuesta semanas de hojas de cálculo",
      "Cifras sin evidencia trazable ante la verificación",
    ],
    objectives: [
      { icon: Database, title: "KPI consolidados", text: "Energía, emisiones, agua, residuos y pescado de ~80 hoteles" },
      { icon: FileSearch, title: "Evidencia trazable", text: "Cada cifra hasta su factura, lectura, certificado o albarán" },
      { icon: ListChecks, title: "Cruce ESRS / TNFD", text: "Requisitos E1, E3, E4, E5, TNFD y taxonomía UE" },
      { icon: FileText, title: "Informe en borrador", text: "Lagunas y estimaciones declaradas de forma explícita" },
    ],
    flow: [
      { icon: Zap, label: "Huella de carbono" },
      { icon: Leaf, label: "Pesca y naturaleza" },
      { icon: FileSearch, label: "Auditoría de evidencias" },
      { icon: ListChecks, label: "Cruce ESRS / TNFD" },
      { icon: FileText, label: "Redacción del informe" },
    ],
    footnote: "Los datos que faltan o son estimados se declaran como tales en el informe.",
  },

  "talento-temporada": {
    eyebrow: "+40.000 personas · 95 nacionalidades · AI Act: selección de alto riesgo",
    heroIcon: UsersRound,
    personaTitle: "Responsable de RR. HH. / talento",
    personaText:
      "Cubre los picos de temporada (Baleares y Canarias en verano, el Caribe en invierno) con una selección explicable en la que cada decisión la toma y firma una persona.",
    stakeholders: ["Direcciones de hotel", "Candidatos de Build the Change", "Formación", "Cumplimiento"],
    pains: [
      "Alta rotación y picos estacionales de contratación",
      "Plantilla de 95 nacionalidades y miles de candidaturas",
      "Selección con IA de alto riesgo según el AI Act (Anexo III)",
    ],
    objectives: [
      { icon: Users, title: "Plantilla prevista", text: "Necesidades por hotel, puesto y temporada" },
      { icon: ListFilter, title: "Cribado explicable", text: "Cada puntuación de candidatura justificada" },
      { icon: GraduationCap, title: "Incorporación lista", text: "Alta y formación obligatoria preparadas" },
      { icon: Scale, title: "Equidad auditada", text: "Sesgos por sexo, edad y nacionalidad en cada campaña" },
    ],
    flow: [
      { icon: Users, label: "Necesidades de plantilla" },
      { icon: ListFilter, label: "Cribado de candidatos" },
      { icon: UserCheck, label: "Decisión de RR. HH." },
      { icon: GraduationCap, label: "Incorporación y formación" },
      { icon: Scale, label: "Auditoría de equidad" },
    ],
    footnote: "Cada decisión de selección la toma y la firma una persona de RR. HH.",
  },

  "energia-mantenimiento-predictivo": {
    eyebrow: "~80 hoteles · Wave of Change: −35 % de energía en 2030 · RD 487/2022",
    heroIcon: Zap,
    personaTitle: "Director/a técnico de mantenimiento y energía",
    personaText:
      "Vigila climatización, ACS y piscinas de toda la cartera y necesita convertir cada anomalía en una orden de trabajo antes de que llegue a la factura o a la auditoría.",
    stakeholders: ["Equipos de mantenimiento", "Dirección de hotel", "Sostenibilidad", "Proveedores de energía"],
    pains: [
      "BMS heterogéneos entre hoteles",
      "Anomalías de consumo descubiertas en la factura",
      "Incumplimientos de temperatura o cloro detectados en la auditoría",
    ],
    objectives: [
      { icon: Activity, title: "Anomalías detectadas", text: "Consumos anómalos y caídas de COP en la telemetría" },
      { icon: Droplets, title: "Legionella controlada", text: "Temperaturas y cloro según el RD 487/2022" },
      { icon: Wrench, title: "Orden de trabajo", text: "Cada alerta convertida en OT en la GMAO" },
      { icon: Target, title: "Objetivo 2030", text: "Impacto medido sobre el −35 % de energía" },
    ],
    flow: [
      { icon: Activity, label: "Detección de anomalía" },
      { icon: Search, label: "Diagnóstico" },
      { icon: Wrench, label: "Orden de trabajo" },
      { icon: Target, label: "Seguimiento 2030" },
    ],
  },

  "recuperacion-reputacion": {
    eyebrow: "TripAdvisor, Google y Booking · NPS y GRI · Líder en reputación digital",
    heroIcon: Star,
    personaTitle: "Guest relations manager",
    personaText:
      "Responde a las reseñas y encuestas de su resort y necesita conocer la causa raíz de cada queja y recuperar al huésped antes de perderlo.",
    stakeholders: ["A&B", "Pisos", "Recepción", "Mantenimiento", "Animación"],
    pains: [
      "Reseñas negativas detectadas tarde",
      "Respuestas sin conocer la causa raíz",
      "Recuperación que depende de la memoria de cada equipo",
    ],
    objectives: [
      { icon: Ear, title: "Escucha diaria", text: "Reseñas y encuestas post-estancia en un solo lugar" },
      { icon: Search, title: "Causa raíz", text: "Cada queja asignada al departamento responsable" },
      { icon: HeartHandshake, title: "Servicio recuperado", text: "Respuesta pública, contacto privado y compensación en el CRM" },
      { icon: CircleCheck, title: "Caso cerrado", text: "Trazado de la alerta al cierre, priorizando repetidores" },
    ],
    flow: [
      { icon: Ear, label: "Escucha" },
      { icon: Search, label: "Causa raíz" },
      { icon: HeartHandshake, label: "Recuperación" },
      { icon: CircleCheck, label: "Seguimiento y cierre" },
    ],
  },

  "asistente-agencias-w2m": {
    eyebrow: "W2M · 22 marcas · World2Fly · 2.731 M€ de facturación en 2025",
    heroIcon: Plane,
    personaTitle: "Agente de viajes / turoperador de W2M",
    personaText:
      "Vende paquetes de hotel Iberostar y vuelo World2Fly y necesita cotizar, validar y reservar en un único punto de contacto.",
    stakeholders: ["Contratación hotelera", "World2Fly", "Grupos e incentivos", "Receptivo"],
    pains: [
      "Hotel, vuelo y reservas en sistemas separados",
      "Release, cupo y stop sales comprobados a mano",
      "Cada cotización lenta o mal validada es margen perdido",
    ],
    objectives: [
      { icon: Package, title: "Paquete en una consulta", text: "Hotel y vuelo cotizados en paralelo" },
      { icon: FileCheck, title: "Contrato validado", text: "Cupo, release y tarifa neta antes de confirmar" },
      { icon: Plane, title: "Plazas World2Fly", text: "Disponibilidad en rutas como Madrid–Cancún" },
      { icon: Users, title: "Grupos e incentivos", text: "Reservas, modificaciones y grupos gestionados" },
    ],
    flow: [
      { icon: Building2, label: "Cotización de hotel" },
      { icon: Plane, label: "Vuelo World2Fly" },
      { icon: FileCheck, label: "Cupos y contratos" },
      { icon: Package, label: "Paquete combinado" },
      { icon: CalendarCheck, label: "Reserva" },
    ],
  },

  "planificador-the-club": {
    eyebrow: "The Club · Club vacacional · México, Caribe, Mediterráneo y Canarias",
    heroIcon: Palmtree,
    personaTitle: "Socio de The Club",
    personaText:
      "Quiere saber cuántos puntos le quedan, dónde y cuándo le rinden más, reservar su estancia y resolver sus cuotas sin llamar al call center.",
    stakeholders: ["Atención al socio", "Call center", "Facturación", "Resorts del club"],
    pains: [
      "Saldo de derechos poco claro",
      "Disponibilidad entre resorts difícil de ver",
      "Consultas de cuotas que saturan el call center",
    ],
    objectives: [
      { icon: Wallet, title: "Saldo claro", text: "Puntos y derechos disponibles al momento" },
      { icon: MapPin, title: "Mejor rendimiento", text: "Resort y temporada donde más rinden los puntos" },
      { icon: CalendarCheck, title: "Estancia reservada", text: "Propuesta y reserva en la misma conversación" },
      { icon: Receipt, title: "Cuotas resueltas", text: "Mantenimiento y facturas sin pasar por el call center" },
    ],
    flow: [
      { icon: Wallet, label: "Saldo de derechos" },
      { icon: MapPin, label: "Disponibilidad" },
      { icon: Palmtree, label: "Propuesta de estancia" },
      { icon: CalendarCheck, label: "Reserva" },
      { icon: Receipt, label: "Cuotas y facturas" },
    ],
  },

  "due-diligence-aperturas": {
    eyebrow: "Plan de inversión de 1.000 M€ hasta 2028 · Zanzíbar · Montenegro",
    heroIcon: Building2,
    personaTitle: "Director/a de expansión y comité de inversiones",
    personaText:
      "Evalúa nuevos activos en mercados con más riesgo regulatorio y necesita un memorando de inversión trazable y listo para el comité.",
    stakeholders: ["Comité de inversiones", "Consultoras técnicas", "Finanzas", "Cumplimiento (KYC)"],
    pains: [
      "Análisis repartido entre hojas de cálculo, consultoras y data rooms",
      "Mercados nuevos con más riesgo regulatorio tras la salida de Cuba",
      "Sanciones (OFAC, Helms-Burton) y ESG revisados por separado",
    ],
    objectives: [
      { icon: Globe, title: "Mercado y destino", text: "Demanda y competencia del destino analizadas" },
      { icon: Building2, title: "Activo y CAPEX", text: "Evaluación técnica y CAPEX de reforma" },
      { icon: Calculator, title: "Modelo financiero", text: "Rentabilidad del proyecto modelizada" },
      { icon: ShieldAlert, title: "Sanciones y ESG", text: "Screening de sanciones y beneficiario final previo" },
    ],
    flow: [
      { icon: Globe, label: "Mercado y destino" },
      { icon: Building2, label: "Activo y CAPEX" },
      { icon: Calculator, label: "Modelo financiero" },
      { icon: ShieldAlert, label: "Sanciones y ESG" },
      { icon: FileText, label: "Memorando de inversión" },
    ],
    footnote:
      "El screening de sanciones y de beneficiario final es requisito previo; la decisión de inversión es siempre del comité.",
  },
};

export function getUseCaseOverview(slug: string): UseCaseOverview | undefined {
  return useCaseOverviews[slug];
}
