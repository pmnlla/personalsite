// @ts-check
import { defineConfig } from 'astro/config';
import bun from "@nurodev/astro-bun";

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  integrations: [mdx()],
  adapter: bun(),
  output: "server"
});