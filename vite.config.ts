import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import type { Connect } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(), 
    reactRouter(), 
    tsconfigPaths(),
    {
      name: 'ignore-chrome-devtools',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/.well-known/')) {
            res.writeHead(204);
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
});
