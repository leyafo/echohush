// vite.config.website.js
import { defineConfig } from 'vite';
import tailwindcss from '@vituum/vite-plugin-tailwindcss'
import vituum from 'vituum';
import handlebars from '@vituum/vite-plugin-handlebars';

export default defineConfig({
    plugins: [
        tailwindcss(),
        vituum(),
        handlebars({
            root: './src',
        }),
    ],
    build: {
        outDir: './website', 
        rollupOptions: {
            input: ['./src/pages/**/*.hbs']
        }
    },
});
