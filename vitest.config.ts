import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        deps: {
            interopDefault: true
        },
        include: ['tests/**/*.test.ts']
    }
});
