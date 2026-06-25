# design_system.md — Identidad visual / Design System de referencia (Arnés 020_architecture)

> **Qué es este archivo.** La definición del **sistema de identidad visual estándar** (design system) con el
> que CADEN dará apariencia al software que fabrica: design tokens, theming claro/oscuro, convenciones de
> componentes, accesibilidad y —sobre todo— **cómo se combina la marca del cliente con un default**. Es el
> **bloque C** de los tres bloques de entrada del Arnés `020_architecture` (ver `stack_tec.md` §9 y D-027).
> Materializa la idea de backlog **I-001**.
>
> **Qué NO es.** No define el **stack tecnológico** (bloque A, `stack_tec.md`) ni el **estilo arquitectónico**
> (bloque B, `architecture_style.md`). Aquí se decide *cómo se ve* el producto, no *con qué* se construye
> ni *cómo se organiza* el código.
>
> **Relación con el stack.** Presupone el bloque A §6: **Tailwind CSS v4** (configuración CSS-first, tokens en
> `@theme`), **shadcn/ui** (Radix + Tailwind, theming por variables CSS) y `lucide-react` (iconos). Este
> documento **da contenido** a esa capa: define los tokens concretos y el modelo de marca.
>
> **Nota de verificación.** La mecánica de tokens (`@theme` de Tailwind v4 y las variables de theming de
> shadcn/ui) se **verificó contra la documentación oficial vigente el 2026-06-21**.

---

## 0. Naturaleza de la identidad: default adaptable, con la marca normalmente del cliente

Igual que el stack (D-027) y el estilo (bloque B §0), la identidad visual es una **base por defecto
adaptable por proyecto** con firma humana en el gate. Pero tiene una **inversión** importante:

- En el **stack**, el default aplica casi siempre y el cliente rara vez aporta.
- En la **identidad visual**, la marca **suele ser del cliente** (es su negocio); el **default es la red de
  seguridad** para cuando el cliente no la tiene o la aporta incompleta.

Por eso el aporte del cliente **no es binario** (todo o nada): es un **espectro** que el 020 clasifica en
niveles (§7) y resuelve por **mezcla a nivel de token** (§2), rellenando lo que falte con el default.

---

## 1. Principios

1. **Token como fuente única.** Toda decisión visual (color, tipografía, espaciado, radios, sombras) se
   expresa como **design token**. Ningún color/tamaño "suelto" en componentes.
2. **Semántica antes que valor.** Los componentes consumen tokens **semánticos** (`primary`, `background`,
   `destructive`…), no colores crudos. Cambiar la marca = cambiar el valor del token, no el componente.
3. **El default siempre completo.** El sistema por defecto rellena **todos** los tokens; el aporte del
   cliente **sobrescribe token a token** (precedencia cliente > default).
4. **Accesible por defecto.** Contraste WCAG AA, estados de foco visibles y soporte de teclado vienen de
   fábrica (heredado de Radix/shadcn) y no se degradan al aplicar marca.
5. **Opinión fuerte, varianza baja.** Un único default sobrio (no una galería de temas) para reducir
   varianza; la personalización entra por la marca del cliente, no por elegir entre plantillas.

---

## 2. Arquitectura de tokens — el mecanismo de la mezcla (D-J)

shadcn/ui sobre Tailwind v4 usa **dos capas**, y esa separación es justo lo que hace operable la mezcla
cliente/default **por token**:

- **Capa de primitivas semánticas** (`:root` y `.dark` en el CSS global): los valores reales en **OKLCH**
  (`--primary`, `--background`, `--foreground`, `--border`, `--radius`, …). **Aquí —y solo aquí— sobrescribe
  el cliente.**
- **Capa de mapeo** (`@theme inline` de Tailwind v4): expone las primitivas como tokens de Tailwind
  (`--color-primary: var(--primary)`, etc.) para las utilidades y los componentes. **No se toca al aplicar
  marca.**

```css
/* globals.css (forma de referencia, verificada 2026-06-21) */
@import "tailwindcss";
@custom-variant dark (&:is(.dark *));

@theme inline {                 /* MAPEO — estable, no se toca por marca */
  --color-background: var(--background);
  --color-primary:    var(--primary);
  --radius-lg:        var(--radius);
  /* … resto del set semántico … */
}

:root {                         /* DEFAULT (modo claro) — el cliente sobrescribe AQUÍ */
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --primary:    oklch(0.205 0 0);
  /* … */
}
.dark { /* DEFAULT (modo oscuro) — el cliente sobrescribe AQUÍ */ }
```

**Consecuencia operativa:** "lo aporta el cliente" y "por defecto" dejan de ser estados globales; son una
**precedencia por token**. Un cliente que solo trae el color primario obtiene su acento + un sistema
coherente, sin diseñar nada más.

---

## 3. Design system por defecto (D-L, D-M)

### 3.1 Color — set semántico de tokens
Espacio de color **OKLCH** (uniforme perceptualmente, facilita generar escalas accesibles). Set semántico
(el de shadcn/ui, que cubre la mayoría de UIs):

`background`/`foreground` · `card`/`card-foreground` · `popover`/`popover-foreground` ·
`primary`/`primary-foreground` · `secondary`/`secondary-foreground` · `muted`/`muted-foreground` ·
`accent`/`accent-foreground` · `destructive` · `border` · `input` · `ring` · `chart-1..5` · `sidebar-*`.

- **Default = tema sobrio neutro** (grises OKLCH, primario casi-negro) — profesional y agnóstico de dominio.
- **Generación desde color semilla:** dado **un solo color de marca** (nivel L1, §7), el 020 deriva una
  paleta semántica coherente y **accesible** (ajustando lightness/chroma en OKLCH para cumplir contraste),
  poblando `primary` + estados y dejando el resto del default.

### 3.2 Modo claro y oscuro (D-M)
**Ambos desde el inicio.** El modo oscuro se define en `.dark` (variante `@custom-variant dark`); el cliente
que aporta marca puede dar valores para ambos modos o solo para claro (el oscuro se deriva del default).

### 3.3 Tipografía
- Tokens `--font-sans` / `--font-serif` / `--font-mono`. Default: stack de sistema (`ui-sans-serif,
  system-ui, …`) para cero coste de carga.
- Integración con `next/font` (stack §6) cuando el cliente aporta una tipografía de marca.

### 3.4 Espaciado, radios, sombras, breakpoints
- **Radios:** token base `--radius` (default `0.625rem`) del que se derivan `sm/md/lg/xl/…` por cálculo.
- **Espaciado / breakpoints / sombras:** se parte de la **escala por defecto de Tailwind v4** (tokens
  `--spacing-*`, `--breakpoint-*`, `--shadow-*`); se sobrescriben solo si la marca lo exige.

---

## 4. Accesibilidad (baseline, no opcional)
- **Contraste WCAG AA** como mínimo para texto y componentes; la generación desde semilla (§3.1) lo respeta.
- **Foco visible** (`ring`) y navegación por teclado: heredados de Radix/shadcn, no se eliminan.
- **Movimiento reducido:** respetar `prefers-reduced-motion` en animaciones.
- Esta baseline es **invariante**: la marca puede cambiar valores, pero no puede romper el contraste mínimo
  (el 020 lo verifica al aplicar marca y lo reporta en el gate).

---

## 5. Convenciones de componentes
- **Base:** shadcn/ui (los componentes se **copian** al proyecto, no se instalan como dependencia opaca —
  bloque A §12), Radix para accesibilidad, `lucide-react` para iconos.
- Los componentes **solo consumen tokens semánticos**; no se hardcodean colores.
- Variantes con CVA (class-variance-authority, dependencia habitual de shadcn) — un patrón, no N estilos
  ad-hoc.
- Encaja con el bloque B §3: los componentes de marca viven en `components/ui` (primitivos compartidos) y no
  dependen de las features.

---

## 6. Modelo de intake de marca + precedencia (D-K)

### 6.1 Cómo aporta el cliente (formato) — un solo archivo
- **`900_documents/brand.md`** — **único** archivo de marca. `caden-setup` lo deja como **esqueleto opcional**
  (formulario derivado del checklist §7), **exactamente igual que `scope.md`**: el cliente lo **llena en su
  sitio** si tiene marca. No hay archivo "template" aparte (se descartó el patrón `*.example`→real por
  confuso e innecesario: `scope.md` tampoco lo usa).
- **Si el cliente no lo toca** (mantiene los `<...>`/instrucciones) o lo borra → el 020 lo trata como **L0**
  y usa el **default** de este documento.
- **Opcionales:** `tokens.json` (si el cliente ya tiene tokens formales) y assets (`logo.svg`, favicon) en
  `900_documents/`.
- **Referencias** (Figma, sitio web, capturas): **insumo humano de inspiración**, NO import automático (se
  interpretan, no se parsean).

> Paralelo a `scope.md` del Arnés 010: un insumo declarativo del cliente, **un solo archivo**, que
> `caden-setup` deja como esqueleto y el harness interpreta.

### 6.2 Niveles de aporte (el espectro)
| Nivel | Qué trae el cliente | Qué hace el 020 |
|-------|---------------------|-----------------|
| **L0** | Nada | 100% default (tema sobrio claro+oscuro) |
| **L1** | Color primario y/o logo | Default + **genera paleta desde el color semilla** (§3.1) |
| **L2** | Paleta + tipografía | Sobrescribe tokens de color/tipo; el resto, default |
| **L3** | Guía de marca completa | Mapeo completo de tokens a primitivas `:root`/`.dark` |
| **L4** | Design system propio existente | Integrar/adaptar (caso límite; puede requerir trabajo extra y firma explícita) |

### 6.3 Precedencia
**Cliente > default, por token.** Todo token no aportado por el cliente conserva el valor del default. La
accesibilidad (§4) es un piso que ni el cliente ni el default pueden cruzar a la baja.

---

## 7. Checklist / cuestionario de marca (lo que el 020 recoge o pregunta)
1. ¿Hay logo? (claro/oscuro, formato vectorial, zona de seguridad).
2. **Color primario** de marca (o paleta completa); colores de estado si los hay.
3. ¿Modo oscuro requerido / valores propios, o se deriva?
4. **Tipografía** de marca (display + cuerpo) o uso del stack de sistema.
5. **Tono visual** (sobrio / vibrante / minimalista / denso) y radios (cuadrado vs redondeado).
6. **Densidad** (compacta vs amplia) y necesidades específicas (sidebar, dashboards/charts).
7. Referencias de inspiración (Figma/sitios) — interpretadas, no importadas.
8. **Restricciones de accesibilidad** adicionales (p. ej. AAA, daltonismo).

> Lo que el cliente **no** define se marca como "default" explícito (no como hueco abierto): el sistema
> siempre queda completo.

---

## 8. Modelo de operación del 020 (paralelo a D-027)
Cuando el Arnés 020 se ejecuta sobre un proyecto:
1. **Detectar** el nivel de aporte (L0–L4) a partir de `brand.md`/tokens/assets (§6). Si `brand.md` falta o
   sigue siendo el **esqueleto sin tocar** (solo placeholders `<...>`), se trata como **L0** (default).
2. **Mapear** lo aportado a primitivas semánticas (`:root`/`.dark`); para L1, **generar la paleta** desde el
   color semilla respetando contraste (§3.1).
3. **Rellenar** los tokens faltantes con el default (precedencia por token).
4. **Verificar** accesibilidad (§4) y reportar.
5. **Presentar y firmar** en el gate: **identidad efectiva = marca aportada + default en lo no cubierto**.

---

## 9. Cómo sirve este bloque a los 6 arneses
| Arnés | Qué consume de este bloque |
|-------|-----------------------------|
| 010 Discovery | (Agnóstico; sin dependencia.) |
| **020 Architecture** | **Genera** `globals.css` (tokens `@theme inline` + `:root`/`.dark`), instala shadcn/ui y aplica la marca (L0–L4) con firma en el gate. |
| 030 Contract & Mold | UI desacoplada del contrato; los tokens no afectan los schemas. |
| 040 Tactical Planning | Tareas de UI se apoyan en componentes ya tematizados. |
| 050/070 Execution | Programa componentes que consumen tokens semánticos (sin colores hardcodeados). |
| 060 Validation | E2E (Playwright) sobre una UI con theming estable; baseline de accesibilidad verificable. |

---

## 10. Decisiones de este bloque
| ID | Decisión | Estado | Resumen |
|----|----------|--------|---------|
| D-J | Mezcla cliente/default | FIRME | **Override por token** (capa de primitivas `:root`/`.dark`); soporta aporte parcial L1–L3 |
| D-K | Formato de intake de marca | FIRME | **`brand.md` guiado** + `tokens.json`/assets opcionales; Figma/web como referencia humana, no import |
| D-L | Naturaleza del default | FIRME | **Tema sobrio neutro** + **generación de paleta desde color semilla** (cubre L0/L1) |
| D-M | Theming | FIRME | **Claro y oscuro** desde el inicio vía tokens semánticos OKLCH (`.dark`) |

> Las D-J..D-M son **locales de este documento** (como D-A..D-E del bloque A y D-F..D-I del bloque B), no
> `D-xxx` de la persistencia del proyecto. **D-027** cubre el encuadre (input de 3 bloques + base adaptable).

### Decisiones abiertas (a cerrar en el brief/diseño del 020)
- **D-O — Generación de paleta desde semilla:** ¿algoritmo propio en OKLCH o apoyarse en una utilidad/registro
  de temas de shadcn? (afecta cómo se materializa L1).
- **D-P — Cambio de tema en runtime:** ¿el producto final expone selector claro/oscuro al usuario por defecto,
  o es decisión por proyecto?
- **D-Q — Caso L4 (design system propio):** alcance de la integración (¿adaptar a tokens shadcn o convivir?) —
  probablemente excepción firmada caso por caso.
