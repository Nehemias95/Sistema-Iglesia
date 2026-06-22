const { execSync } = require('child_process')
const { existsSync } = require('fs')
const { join } = require('path')

const backendDir = join(__dirname, 'backend')
const frontendDir = join(__dirname, 'frontend')

console.log('=== Post-Instalación Iglesia EFESO ===')
console.log('')

try {
  // 1. Instalar dependencias del backend
  console.log('[1/3] Instalando dependencias del backend...')
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  execSync(`${npm} install`, { cwd: backendDir, stdio: 'inherit' })

  // 2. Construir frontend
  console.log('[2/3] Construyendo frontend...')
  if (existsSync(join(frontendDir, 'package.json'))) {
    execSync(`${npm} install`, { cwd: frontendDir, stdio: 'inherit' })
    execSync(`${npm} run build`, { cwd: frontendDir, stdio: 'inherit' })
  }

  // 3. Ejecutar migración
  console.log('[3/3] Ejecutando migración de base de datos...')
  execSync(`node src/migrate.js`, { cwd: backendDir, stdio: 'inherit' })

  console.log('')
  console.log('=== Instalación completada exitosamente ===')
  console.log('Ejecute start.bat para iniciar el sistema.')
} catch (err) {
  console.error('Error durante la post-instalación:', err.message)
  process.exit(1)
}
