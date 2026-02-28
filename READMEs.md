# Clinical Rule Engine – NTS & MBE

Aplicación clínica basada en Normas Técnicas de Salud (NTS) y Medicina Basada en Evidencia (MBE).

Permite:

- Ingresar datos clínicos del paciente
- Clasificar diagnósticos según reglas configurables
- Ajustar decisiones según nivel resolutivo
- Considerar medicamentos y equipos disponibles
- Generar plan terapéutico con posología automática
- Permitir edición dinámica de reglas clínicas

Stack tecnológico:
- JavaScript
- React
- Arquitectura modular
- Reglas en JSON editable

---

## 🎯 Objetivo

Crear una herramienta clínica adaptable a establecimientos de salud que:

- Respete normativa técnica vigente
- Sea modificable sin cambiar el código fuente
- Permita actualización constante
- Sea usable en PC y celular (web responsive)

---

## 🏗 Arquitectura General
src/
├── engine/
│ ├── ruleEngine.js
│ ├── ruleEvaluator.js
│ ├── dosageCalculator.js
│
├── rules/
│ ├── deshidratacion.js
│ ├── anemia.js
│ ├── parasitosis.js
│
├── components/
│ ├── RuleEditor.jsx
│ ├── ConditionBuilder.jsx
│ ├── RuleList.jsx
│
├── data/
│ ├── inventory.js
│
├── types/
│ ├── ruleSchema.js

---

## 🧠 Lógica de Funcionamiento

1. Usuario ingresa datos clínicos.
2. Motor evalúa reglas activas.
3. Se valida:
   - Criterios clínicos
   - Laboratorio
   - Nivel resolutivo
   - Inventario disponible
4. Se devuelve:
   - Diagnóstico probable
   - Clasificación
   - Tratamiento de elección
   - Alternativa
   - Posología calculada
   - Criterios de referencia

---

## 🔐 Principios del Sistema

- Separación estricta entre reglas y motor.
- Reglas editables sin tocar el motor.
- Evaluación determinística.
- Escalable a múltiples establecimientos.
- Preparado para futura base de datos.

---

## 📌 Patologías Iniciales

- Deshidratación
- Anemia
- Parasitosis intestinal

---

## 🚀 Futuras Mejoras

- Soporte multi-establecimiento
- Persistencia en base de datos
- Versionado de NTS
- Auditoría de decisiones
- Exportación PDF de indicaciones
