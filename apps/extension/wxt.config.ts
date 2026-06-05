import { defineConfig } from 'wxt'

// v0.1 permission boundary (engineering governance summary §1).
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Corvus Mark',
    description: 'AI-powered organizer for native browser bookmarks. AI suggests, you preview, local code executes.',
    permissions: ['bookmarks', 'storage'],
    optional_host_permissions: [
      'https://api.deepseek.com/*',
      'https://api.openai.com/*',
      'https://openrouter.ai/*',
      'https://api.anthropic.com/*',
      'https://generativelanguage.googleapis.com/*',
      'http://localhost/*',
      'http://127.0.0.1/*',
    ],
  },
})
