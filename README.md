# EduManage Pro

## 🚀 AI-Powered School Management System for Indian Schools

### Features
- ✅ Student & Teacher Management
- ✅ AI-Powered Exam Generation (Gemini API)
- ✅ WhatsApp Integration for Parent Communication
- ✅ Offline-First Desktop Application
- ✅ Regional Language Support (Telugu)
- ✅ Performance Analytics & Predictions

### Quick Start

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build

# Package as desktop app
npm run desktop:package
```

### Project Structure

```
edumanage-pro/
├── apps/
│   └── desktop/          # Electron desktop app
├── packages/
│   ├── ui-components/    # Reusable UI components
│   ├── core-logic/       # Business logic
│   ├── database/         # Database models
│   ├── ai-engine/        # AI integration
│   └── whatsapp-service/ # WhatsApp automation
└── tools/                # Build tools
```

### Development

1. **Setup**: `npm run setup`
2. **Development**: `npm run dev`
3. **Testing**: `npm run test`
4. **Building**: `npm run build`

### Technologies
- **Frontend**: React + TypeScript + Material-UI
- **Desktop**: Electron
- **AI**: Google Gemini API
- **Database**: SQLite
- **Communication**: WhatsApp Business API

### License
MIT © EduManage Pro Team