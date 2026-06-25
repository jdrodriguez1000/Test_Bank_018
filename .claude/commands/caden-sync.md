---
description: >-
  Comando global del motor CADEN (plano de operación). Conecta un proyecto que se venía versionando
  SOLO en local con un repositorio remoto de GitHub (transición local → local+remoto), o sincroniza
  bajo demanda el historial local con un remoto ya configurado (catch-up entre fases). Ajusta
  .caden/config.json (remote + push), registra el remoto git (origin), valida alcance/credenciales
  (preflight) y EMPUJA todo el historial local acumulado. No crea el repositorio en GitHub (eso es
  manual) ni guarda secretos. Idempotente: re-ejecutarlo solo sube los commits pendientes. Lo ejecuta
  la Instancia A. Transversal a los 6 arneses. Versionado autónomo (T-035, D-025).
argument-hint: "[\"<url del repositorio remoto>\"]  (omítela para sincronizar un remoto ya configurado)"
allowed-tools: Read, Write, Edit, Bash, PowerShell
model: opus
---

# /caden-sync — Conecta/sincroniza el proyecto con GitHub (comando global del motor)

El proyecto se venía versionando **solo en local** y ahora quieres trabajar **también con un repositorio
de GitHub**, o ya está conectado y quieres **poner el remoto al día** con los commits locales acumulados.
Tu trabajo (Instancia A — Governor) es **cerrar la brecha entre las dos capas del versionado** —la de git
(remoto `origin`) y la de CADEN (`.caden/config.json`)— y **empujar el historial**, sin tocar las
definiciones del motor ni reescribir nada.

> **Plano de operación (L-001).** Corre sobre la **carpeta del cliente**. Escribe solo en el runtime del
> cliente (`.caden/config.json`, la config de git local, `<fase>/project-progress.txt`). **Nunca** en
> `720_build/` ni en `800_persistence/`.

> **Definición canónica** de la transición/sincronización local → remoto (T-035, D-025). No confundir con
> `caden-setup -Remote` (terminal, bootstrap del proyecto): `/caden-sync` es el camino **en sesión** para
> conectar o poner al día un proyecto que ya existe, sin reinstalar agentes/comandos/settings.

## Por qué hace falta este comando (las dos capas)

Editar solo `.caden/config.json` **no basta**: CADEN la lee para *decidir* si empuja, pero el `git push`
real necesita que exista el remoto **`origin`** a nivel de git (en `.git/config`, no en `.caden/`). Si
solo cambias el config, el playbook intentará empujar, no hallará `origin` y se quedará en local. Este
comando ajusta **las dos capas a la vez** y, además, **empuja** (lo que un "sync" debe hacer).

## Precondición — el repositorio remoto ya existe (creación manual)

`/caden-sync` **no crea** el repositorio en GitHub (decisión: sin dependencia de `gh`). Debe existir y
estar **vacío** (sin README/licencia/.gitignore): un repo con commit inicial **diverge** de tu historia
local y el push se rechaza. Si el remoto no existe, el preflight lo detectará y te pedirá crearlo vacío
primero.

## Timestamp real (no lo inventes)
Marca real en UTC con `(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")` (herramienta
`PowerShell`). Si no puedes, pide la hora al humano; **no fabriques timestamps**.

## Pasos

### 1. Precondiciones
- **Es un proyecto CADEN:** debe existir `.caden/config.json`. Si **no** existe → el bootstrap no se ha
  corrido; dile al humano que ejecute **`caden-setup`** y **detente**.
- **git disponible:** comprueba que `git` esté en el PATH y que estés dentro de un repo
  (`git rev-parse --is-inside-work-tree`). Si **no** hay repo local pero `git` está → `git init -b main`
  (el versionado local debería existir ya desde `caden-setup`; esto es una red de seguridad). Si `git`
  **no** está en el PATH → avísalo y **detente** (sin git no hay sincronización posible).
- **Versionado local activo:** lee `.caden/config.json`. Si `git.local_versioning == false`, el versionado
  está desactivado a propósito → pregunta al humano si quiere reactivarlo; si no, **detente**.

### 2. Resuelve la URL del remoto
- **Con argumento** (`/caden-sync "https://github.com/usuario/proyecto.git"`): esa es la URL a usar.
- **Sin argumento:** usa el `git.remote` que ya esté en `.caden/config.json`. Si está **vacío** → no hay
  remoto que sincronizar; pide la URL (o que la pases como argumento) y **detente**.

### 3. Ajusta `.caden/config.json` (capa CADEN)
Edita **solo** estos campos (no toques `local_versioning` ni `branch` salvo que el humano lo pida):
- `git.remote` = la URL resuelta.
- `git.push` = `true`.
Conserva el resto del archivo intacto (incluido el `_comment`). Registra el cambio en la bitácora.

### 4. Registra el remoto en git (capa git)
- Comprueba si ya hay `origin` (`git remote get-url origin`):
  - **No existe** → `git remote add origin <url>`.
  - **Existe y coincide** → nada que hacer.
  - **Existe y difiere** → `git remote set-url origin <url>` (avisa del cambio en la bitácora).

### 5. Preflight — alcance y credenciales (no bloquea con datos inventados)
- `git ls-remote origin` para validar que el remoto es **alcanzable** y que la **auth** funciona **antes**
  de empujar.
- Si falla:
  - *"repository not found"* / 404 → el repo no existe: dile al humano que **lo cree vacío** en GitHub y
    re-ejecute `/caden-sync`. **Detente** (no dejes `push:true` apuntando a la nada sin avisar — pero el
    config ya quedó listo para cuando exista).
  - *auth / permiso* → sugiere revisar el credential helper **ambiental** (`gh auth login` / Git Credential
    Manager / llave SSH). **Detente** con el aviso; **no** pidas ni guardes tokens.
  - *red / otro* → repórtalo y **detente** sin dañar nada.
- Si responde OK, continúa.

### 6. Sincroniza el historial — EMPUJA (el corazón del comando)
- Si hay cambios sin commitear que pertenezcan a un estado firme ya cerrado, **no** improvises commits
  aquí: `/caden-sync` sincroniza historia **ya existente**; los commits los crean los playbooks en
  `PHASE_COMPLETE`/re-firma (T-035). (Un working tree sucio no impide el push de lo ya commiteado.)
- `git push -u origin <git.branch>` (por defecto `main`) → sube **todo** el historial local acumulado de
  una vez. **Si falla**, **reintenta una vez**; si vuelve a fallar:
  - **Divergencia** (el remoto tenía commits, p. ej. un README) → **no** uses `--force`. Explica que el
    repo no estaba vacío y ofrece las salidas seguras (crear el repo vacío y reintentar, o que el humano
    reconcilie con `git pull --rebase` bajo su criterio). **Detente**.
  - **auth / red** → avisa (credential helper ambiental) y **detente**; el historial sigue intacto en local.
- Si el push tiene éxito, captura el estado (`git rev-parse --short HEAD` y la rama remota).

### 7. Traza y reporta
- Añade a `<fase>/project-progress.txt` (la fase activa según `harness-state.current_phase`) una línea con
  el resultado: `remote` fijado, `push:true`, y el estado del push (`pushed <hash> → origin/<branch>` /
  `local-only: <razón>`). Marca `updated_at` donde corresponda.
- Reporta al humano en pocas líneas: remoto conectado, config actualizada, y si el historial quedó al día
  en GitHub o por qué no.

## Idempotencia y usos

- **Transición local → remoto** (1ª vez): pasa la URL; ajusta las dos capas y empuja todo el historial.
- **Catch-up entre fases** (ya conectado): re-ejecútalo **sin argumento** para subir los commits locales
  pendientes sin esperar al próximo `PHASE_COMPLETE`. Re-ejecutarlo cuando ya está al día es **inocuo**
  (push sin cambios).
- **Cambio de remoto:** pasa una URL distinta; actualiza `origin` y el config, y empuja al nuevo destino
  (sujeto al preflight y a la regla de no-divergencia).

## Reglas inviolables
- **No crea el repositorio en GitHub:** la creación es manual y vacía (sin dependencia de `gh`).
- **Sin secretos:** el push usa el credential helper **ambiental** ya configurado en la máquina; el motor
  **no** guarda ni pide tokens.
- **Nunca `--force`** ni reescritura de historial: ante divergencia, detente y ofrece salidas seguras.
- **No commitea estados no firmes:** `/caden-sync` empuja historia ya existente; los commits autónomos son
  exclusivos de `PHASE_COMPLETE` y la re-firma del Modo Ajuste (T-035), no de este comando.
- **No bloquees con datos inventados:** si el preflight o el push fallan, reporta la causa y detente; nunca
  fabriques un éxito ni un token.
- **Respeta los planos:** escribe solo en el runtime del cliente (`.caden/config.json`, git local,
  bitácora); **nunca** en `720_build/` ni en `800_persistence/`.
- **Timestamps reales**, nunca fabricados.
