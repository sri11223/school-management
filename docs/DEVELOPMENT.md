# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Git

### Installation
```bash
git clone <repository-url>
cd edumanage-pro
npm install
```

### Development Workflow
1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes
3. Run tests: `npm run test`
4. Run linter: `npm run lint`
5. Commit: `git commit -m "feat: add new feature"`
6. Push and create PR

### Adding New Features
1. Create component in `packages/ui-components`
2. Add business logic in `packages/core-logic`
3. Update desktop app in `apps/desktop`
4. Write tests
5. Update documentation

### Building for Production
```bash
npm run build
npm run desktop:package
```

This creates:
- `EduManagePro-Portable.exe` (Windows portable)
- `EduManagePro-Setup.exe` (Windows installer)
