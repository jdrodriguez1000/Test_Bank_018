---
description: >-
  Comando global del motor CADEN (plano de operación). Inicializa el ESTADO DE RUNTIME del
  proyecto cliente una vez que caden-setup (terminal) ya instaló las definiciones: instancia
  harness-state.json desde su molde, fija el nombre del proyecto desde scope.md, valida que el
  scope esté lleno, asegura el repositorio git local según .caden/config.json (versionado autónomo,
  T-035) y deja el motor listo para arrancar la primera fase (/caden-discovery). Es
  idempotente y no destructivo: no pisa una corrida ya en curso. Lo ejecuta la Instancia A.
  Transversal a los 6 arneses. Ciclo de vida (T-011).
argument-hint: "(sin argumentos — inicializa el runtime sobre la carpeta actual)"
allowed-tools: Read, Write, Edit, Bash, PowerShell
model: opus
---

# /caden-init — Inicialización del runtime del proyecto (comando global del motor)

`caden-setup` (terminal) ya instaló en esta carpeta las **definiciones** del motor (`.claude/agents`,
`.claude/commands`, `settings`, `CLAUDE.md`) y los **moldes** de runtime (`.caden/templates/`). Tu
trabajo aquí (Instancia A — Governor) es **instanciar el estado de runtime** del proyecto y dejarlo
**listo para operar**: crear `harness-state.json` (el orquestador maestro transversal), fijar el
**nombre del proyecto** desde `scope.md` y verificar que el insumo esté completo. Este comando **no
ejecuta ninguna fase**: solo prepara el terreno para `/caden-discovery`.

> **Plano de operación (L-001).** Corre sobre la **carpeta del cliente**. Escribe solo en el runtime
> del cliente (`harness-state.json`). **Nunca** en `720_build/` ni en `800_persistence/`.

> **Definición canónica** del arranque del runtime (C-12, T-011), transversal a los 6 arneses. Es el
> puente entre el bootstrap de terminal (`caden-setup`) y la primera fase (`/caden-discovery`).

## Timestamp real (no lo inventes)
Toda marca de tiempo es **real**, en UTC, con la única orden permitida en `settings.json`:
`(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")` (herramienta `PowerShell`). Si no
puedes ejecutarla, pide la hora al humano; **no fabriques timestamps**.

## Pasos

### 1. Precondiciones — verifica el bootstrap
- **Moldes presentes:** debe existir `.caden/templates/schemas/harness-state.template.json` (y el
  resto del kit). Si **no** existe → el bootstrap de terminal no se ha corrido: dile al humano que
  ejecute **`caden-setup`** desde la terminal en esta carpeta y **detente**.
- **Insumo presente y lleno:** debe existir `900_documents/scope.md`. Léelo y comprueba que está
  **realmente lleno**, no el esqueleto: si conserva los marcadores `<...>` o el banner de
  instrucciones ("Describe QUE quieres construir…"), está **vacío de facto** → pídele al humano que lo
  complete antes de inicializar y **detente** (no inventes el scope).

### 2. Idempotencia — no pises una corrida en curso
Si **ya existe** `harness-state.json`:
- Si **alguna** fase tiene `status` distinto de `NOT_STARTED` (la corrida ya avanzó) → **no
  reinicialices**. Reporta el estado actual (fase activa + status) e indica el comando correcto:
  **`/caden-continue`** para reanudar, o **`/caden-restart`** si de verdad quiere empezar de cero
  (destructivo). **Detente.**
- Si existe pero **todas** las fases están en `NOT_STARTED` (init previo sin arrancar) → es seguro
  **refrescar** el nombre del proyecto y `updated_at`, sin tocar nada más. Continúa al paso 3.

### 3. Instancia `harness-state.json`
Copia `.caden/templates/schemas/harness-state.template.json` → `harness-state.json` (sin sufijo
`.template`, eliminando las claves de comentario `_*` que solo orientan el molde) y fíjalo así:
- **`project`** = nombre del producto tomado del `scope.md` (1–2 palabras o frase corta del título).
  **Es la fuente única del nombre** (T-020): preserva tildes/acentos del idioma del cliente; los demás
  artefactos lo copiarán verbatim de aquí.
- `current_phase: "010_discovery"` (hoy la única fase construida).
- Todas las `phases[*].status: "NOT_STARTED"`, `verdict: null` (las rutas `execution_state_path` quedan
  como en el molde).
- `approvals: []`, `escalations: []`.
- `knowledge` con los paths del molde (`705_knowledge/decisions_library.md`, `lessons_learned.md`).
- `updated_at` = marca real (paso de timestamp).

> **No crees aún `705_knowledge/`.** El conocimiento se construye **durante** la corrida, solo si hay
> decisiones o lecciones reales (D-016). Aquí únicamente dejas declarados sus paths.

### 4. Versionado git — asegura el repositorio (T-035)
Lee **`.caden/config.json`** (la escribió `caden-setup`). Tu trabajo aquí es **dejar el repo listo**,
**no** commitear: el commit/push autónomo ocurre **solo** en `PHASE_COMPLETE` y en la re-firma del Modo
Ajuste (lo hacen los playbooks), nunca en el init ni en un draft.

- **Sin config / instalación vieja:** si `.caden/config.json` **no existe**, el bootstrap no preparó el
  versionado → registra una nota ("versionado git no configurado") y **continúa** (no bloquees).
- **`git.local_versioning == false`:** el versionado está desactivado a propósito → omite este paso.
- **`git.local_versioning == true` (por defecto):**
  - **Asegura el repo:** comprueba `git rev-parse --is-inside-work-tree`. Si **no** es un repo y `git`
    está disponible → `git init -b main`. Si `git` **no** está en el PATH → nota ("git ausente, sin
    versionado") y **continúa**.
  - **Valida la identidad del commit (red de seguridad):** comprueba que git tenga autor configurado
    (`git config user.name` y `git config user.email`, locales o globales). Si **falta** alguno → el
    primer commit autónomo fallaría con *"Author identity unknown"*. **Avisa** al humano que configure su
    identidad una vez (`git config --global user.name "<nombre>"` y
    `git config --global user.email "<correo>"`); **no la inventes** ni la fijes por él. **No bloquees**
    el init (el versionado local se reintenta en `PHASE_COMPLETE`), pero deja la nota clara.
  - **Push opt-in:** si `git.push == true`, verifica que exista el remoto con
    `git remote get-url origin`. Si **falta** `origin` → **avisa** al humano que el push está activado
    pero no hay remoto (que conecte uno con **`/caden-sync "<url>"`** o re-corra `caden-setup -Remote <url>`);
    **no bloquees** el init. Si `git.push == false`, no toques remotos (versionado solo local); si más
    adelante quiere GitHub, el camino en sesión es **`/caden-sync`**.
- **No commitees aquí.** El primer commit lo hará `/caden-discovery` al cerrar la fase (`PHASE_COMPLETE`).

> **Credenciales (sin secretos).** El push autónomo usa el credential helper **ambiental**
> (gh / Git Credential Manager / SSH) ya configurado en la máquina. El motor nunca guarda tokens.

### 5. Reporta y entrega
Confirma al humano, en pocas líneas:
- Proyecto inicializado (`project`), fase activa lista (`010_discovery`, `NOT_STARTED`).
- **Versionado:** modo activo según `.caden/config.json` (p. ej. "local ON, push OFF" o "push ON →
  `<origin>`"), o la nota si no está configurado / git ausente. Incluye el aviso de **identidad** si
  faltaba `user.name`/`user.email`, y recuerda **`/caden-sync`** como camino para conectar GitHub si hoy
  es solo local.
- **Siguiente paso:** ejecutar **`/caden-discovery`** para arrancar la fase Discovery.

## Reglas inviolables
- **No destructivo:** si hay una corrida en curso, no la pises (paso 2); deriva a `/caden-continue` o
  `/caden-restart`.
- **No inventes el scope:** si `scope.md` está vacío/esqueleto, detente y pídelo.
- **Tú eres el único escritor** de `harness-state.json` (modelo plano).
- **Timestamps reales**, nunca fabricados.
- **No commitees ni hagas push en el init** (T-035): aquí solo aseguras el repo y validas `origin`. El
  commit/push autónomo es exclusivo de `PHASE_COMPLETE` y la re-firma del Modo Ajuste.
- **Respeta los planos:** escribe solo en el runtime del cliente.
