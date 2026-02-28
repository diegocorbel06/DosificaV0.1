# Clinical Rule Engine – NTS & MBE

Aplicación React para evaluación clínica basada en reglas NTS/MBE, con:

- Editor visual de reglas
- Motor de evaluación clínica
- Gestión multi-establecimiento e inventario
- Versionado de reglas NTS
- Auditoría clínica y decision log
- Dashboard de estado del sistema

---

## Requisitos

- Node.js 18+
- npm 9+

---

## Instalación

```bash
npm install
```

---

## Ejecución en desarrollo

```bash
npm run dev
```

Luego abre la URL mostrada por Vite (por defecto `http://localhost:5173`).

---

## Build de producción

```bash
npm run build
```

## Vista previa del build

```bash
npm run preview
```

---

## Pruebas

```bash
npm run test
```

Incluye pruebas básicas de:

- Evaluación de regla (`evaluateRule`)
- Cálculo de dosis (`calculateDosage`)

Archivo: `src/tests/engine.test.js`.

---

## Configuración principal

- `vite.config.js`: configuración de Vite + Vitest
- `src/main.jsx`: bootstrap de React
- `src/App.jsx`: entrada principal de UI

---

## Reglas por defecto (JSON)

El sistema carga reglas iniciales desde:

- `src/data/defaultRules.json`

Estas reglas se normalizan al iniciar `clinicalStore` y quedan listas para evaluación.

---

## Script de ejemplo de motor (Node)

```bash
node --experimental-default-type=module src/engine/example.js
```

