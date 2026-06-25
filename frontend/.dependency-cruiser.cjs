/** @type {import('dependency-cruiser').IConfiguration} */
// Reglas de gobernanza frontend — governance-weaver CP-03
// Traduce architecture_style.md §3 a contratos ejecutables.
// Layout frontend (T-045d): frontend/src/features/, frontend/src/components/ui/, frontend/src/lib/
module.exports = {
  forbidden: [
    {
      // Una feature no puede importar directamente de otra feature (estilo §3).
      // Cada feature es una unidad aislada; la comunicación entre features debe pasar
      // por src/lib/, estado global, o una feature orquestadora explícita.
      name: "no-cross-feature",
      comment: "Una feature no importa de otra feature (estilo §3)",
      severity: "error",
      from: { path: "(^src/features/)([^/]+)/" },
      to: { path: "^src/features/", pathNot: "$1$2" },
    },
    {
      // Los primitivos de UI compartidos (shadcn/ui) no deben conocer ninguna feature.
      // Son primitivos sin estado de negocio; la dependencia debe ir hacia arriba, no abajo.
      name: "ui-no-features",
      comment: "components/ui no depende de features (estilo §3)",
      severity: "error",
      from: { path: "^src/components/ui/" },
      to: { path: "^src/features/" },
    },
    {
      // lib/ es utilidades compartidas sin estado de features; no puede importar features.
      name: "lib-no-features",
      comment: "src/lib no depende de features (higiene de utilidades compartidas)",
      severity: "error",
      from: { path: "^src/lib/" },
      to: { path: "^src/features/" },
    },
    {
      // Sin dependencias circulares en ningún módulo del frontend.
      name: "no-circular",
      comment: "sin dependencias circulares",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      // Advertencia de higiene: módulos huérfanos (no importados ni importan a nadie).
      name: "no-orphans",
      comment: "higiene: sin módulos huérfanos",
      severity: "warn",
      from: { orphan: true, pathNot: "\\.d\\.ts$" },
      to: {},
    },
  ],
  options: {
    tsConfig: { fileName: "./tsconfig.json" },
    doNotFollow: { path: "node_modules" },
    // Resuelve alias @/* → src/* y @app/* → app/* (tsconfig.json paths)
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
  },
};
