import { FlatCompat } from "@eslint/eslintrc";
import { pathToFileURL } from "url";

const compat = new FlatCompat({
  baseDirectory: new URL(".", pathToFileURL(import.meta.url)).pathname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
