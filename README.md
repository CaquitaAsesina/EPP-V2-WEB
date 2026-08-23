# EPP Inventory - Sistema de Control de Inventario de EPP

Sistema profesional para administrar inventario de equipos de protección personal (EPP), con control por períodos, trazabilidad completa, roles de usuario y exportación a Excel.

## 🚀 Tecnologías

- **Backend:** Node.js + Express
- **Base de Datos:** MySQL 8.0+ (Aiven Cloud)
- **Frontend:** HTML5, CSS3, JavaScript Vanilla
- **UI Framework:** Bootstrap 5 + CSS Personalizado
- **Gráficos:** Chart.js
- **Exportación:** ExcelJS
- **Seguridad:** bcrypt, AES-256-GCM, JWT

## 📋 Prerrequisitos

- Node.js v18+
- MySQL Workbench (para gestionar la BD)
- Cuenta en [Aiven](https://aiven.io/)
- Cuenta en [Render](https://render.com/)

## ⚙️ Instalación Local

### 1. Clonar e instalar

```bash
git clone <url-del-repositorio>
cd epp-inventory
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus datos de Aiven:

```env
DB_HOST=tu-host.aivencloud.com
DB_PORT=tu_puerto
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=epp_inventory
DB_SSL=true
JWT_SECRET=generar_con_openssl_rand_hex_32
DNI_ENCRYPTION_KEY=generar_con_openssl_rand_hex_32
```

### 3. Crear base de datos en Aiven

1. MySQL Workbench → conectar a Aiven
2. Ejecutar: `CREATE DATABASE epp_inventory;`
3. Ejecutar el contenido de `database/setup-aiven.sql`

### 4. Iniciar

```bash
npm start
```

Abrir: `http://localhost:3000/html/login.html`

> **⚠️ Importante:** El script `database/setup-aiven.sql` crea un usuario `admin` con una contraseña por defecto. **Cámbiala inmediatamente después del primer inicio de sesión** (módulo Perfil), y no compartas las credenciales en este repositorio.

## 🚀 Despliegue en Render

1. Subir código a GitHub
2. Render → New → Web Service → Conectar repositorio
3. Build: `npm install` | Start: `node backend/server.js`
4. Configurar variables de entorno (las mismas que Aiven):
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=epp_inventory`, `DB_SSL=true`
   - `JWT_SECRET`, `DNI_ENCRYPTION_KEY` (generar con `openssl rand -hex 32`)
   - `NODE_ENV=production`
5. Agregar IP de Render en Aiven → Settings → Allowed IPs → `0.0.0.0/0`

## 📁 Estructura

```
├── backend/
│   ├── config/          # Configuración (DB, variables)
│   ├── controllers/     # Controladores HTTP
│   ├── middleware/       # Auth, roles, validación
│   ├── model/           # Modelos de acceso a datos
│   ├── routes/          # Rutas API REST
│   ├── services/        # Lógica de negocio
│   ├── app.js           # Express app
│   └── server.js        # Punto de entrada
├── database/
│   └── setup-aiven.sql  # Script SQL para Aiven
├── frontend/
│   ├── css/             # Estilos
│   ├── html/            # Páginas HTML
│   └── js/              # Módulos JavaScript
├── .env.example
└── package.json
```

## 📊 Módulos

| Módulo | Descripción | Permisos |
|--------|-------------|----------|
| Dashboard | KPIs y gráficos | Admin + Lector |
| Períodos | Crear, activar, cerrar períodos | Solo Admin |
| EPP Limpio | Inventario sistemático | Admin + Lector |
| EPP Sucio/Lavado | Gestión de lavado | Admin + Lector |
| Ingresos | Registro de ingresos | Solo Admin |
| Entregas | Entregas a trabajadores | Solo Admin |
| Devoluciones | Devoluciones | Solo Admin |
| Consultas | Kardex y auditoría | Admin + Lector |
| Administración | Usuarios y catálogos | Solo Admin |

## 📝 Licencia

ISC
