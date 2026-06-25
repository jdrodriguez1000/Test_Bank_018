import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Reglas de seguridad — governance-weaver CP-03 (vector 5 §2.4)
    rules: {
      // Vector 5: XSS — prohibido dangerouslySetInnerHTML en cualquier componente.
      // Usar alternativas seguras: DOMPurify o texto plano.
      "react/no-danger": "error",
      "react/no-danger-with-children": "error",

      // Higiene de código
      "no-console": "warn",
    },
  },
];

export default eslintConfig;
