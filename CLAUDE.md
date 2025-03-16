# CLAUDE.md - Guide for Agentic Tools

## Build Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build

## Project Structure

- Vite-based JavaScript application
- ES modules (`type: "module"` in package.json)
- No test framework installed yet

## Code Style Guidelines

- **Imports**: Group by source type (CSS, internal modules, external modules)
- **Types**: use jsdoc
- **Formatting**: Use template literals for multi-line strings/HTML
- **Functions**: Prefer arrow functions for callbacks, named functions for exports
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Event Handlers**: Use consistent naming pattern (e.g., `setupX` for initialization)
- **Variables**: Use `let` for variables that change, `const` for those that don't
- **HTML Generation**: Use template literals for generating HTML content
- **DOM Manipulation**: Cache DOM element references when reusing
- **Error Handling**: Add proper error handling for DOM operations

