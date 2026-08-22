# EPP Inventory - Sistema de Control de Inventario de EPP

Sistema profesional para administrar inventario de equipos de protección personal (EPP), con control por períodos, trazabilidad completa, roles de usuario y exportación a Excel.

## 🚀 Tecnologías

- **Backend:** Node.js + Express
- **Base de Datos:** MySQL 8.0+
- **Frontend:** HTML5, CSS3, JavaScript Vanilla
- **UI Framework:** Bootstrap 5 (compatible) + CSS Personalizado
- **Gráficos:** Chart.js
- **Exportación:** ExcelJS
- **Seguridad:** bcrypt (contraseñas), AES-256-GCM (DNI), JWT (autenticación)

## 📋 Prerrequisitos

- Node.js v18+
- MySQL 8.0+ (o MariaDB 10.5+)
- MySQL Workbench (opcional, para gestión visual de BD)
- npm o yarn

## ⚙️ Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd epp-inventory
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar el archivo `.env` con tus datos de MySQL:

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=epp_inventory
JWT_SECRET=generar_con_openssl_rand_hex_32
JWT_EXPIRES_IN=24h
DNI_ENCRYPTION_KEY=generar_con_openssl_rand_hex_32
BCRYPT_ROUNDS=10
```

**⚠️ Importante:** Cambiar `JWT_SECRET` y `DNI_ENCRYPTION_KEY` por valores seguros y únicos.

#### Conexión a base de datos en la nube (Aiven, Render, etc.)

Si usas una base de datos MySQL en la nube, configura:

```env
DB_HOST=tu-host-de-aiven.aivencloud.com
DB_PORT=12345
DB_USER=defaultdb
DB_PASSWORD=tu_password_de_aiven
db_NAME=epp_inventory
DB_SSL=true
```

El valor `DB_SSL=true` habilita la conexión segura SSL requerida por Aiven y otros proveedores.

### 4. Crear la base de datos

Opción A - Desde MySQL Workbench:
1. Abrir MySQL Workbench
2. Conectar al servidor MySQL
3. Abrir el archivo `database/schema.sql`
4. Ejecutar todo el script (⚡ Run)

Opción B - Desde línea de comandos:
```bash
mysql -u root -p < database/schema.sql
```

### 5. Iniciar el servidor

```bash
# Modo producción
npm start

# Modo desarrollo (con auto-reload)
npm run dev
```

### 6. Acceder a la aplicación

Abrir el navegador en:
```
http://localhost:3000/html/login.html
```

## 👤 Usuario Inicial

Después de crear la base de datos, crear el usuario admin ejecutando este script SQL:

```sql
USE epp_inventory;
INSERT INTO users (username, password_hash, full_name, email, role_id)
VALUES ('admin', '$(node -e "console.log(require('bcryptjs').hashSync('TU_PASSWORD_AQUI', 10))")', 'Administrador', 'admin@tudominio.com', 1);
```

O crearlo desde la interfaz después de registrar el primer usuario.

**⚠️ Cambiar la contraseña inmediatamente después del primer acceso.**

## 📁 Estructura del Proyecto

```
├── backend/
│   ├── config/          # Configuración (DB, variables)
│   ├── controllers/     # Controladores HTTP
│   ├── middleware/       # Auth, roles, validación, errores
│   ├── model/           # Modelos de acceso a datos
│   ├── routes/          # Rutas API REST
│   ├── services/        # Lógica de negocio
│   ├── app.js           # Express app
│   └── server.js        # Punto de entrada
├── database/
│   └── schema.sql       # Script SQL completo
├── frontend/
│   ├── assets/          # Imágenes, iconos
│   ├── css/             # Estilos (variables, layout, componentes)
│   ├── html/            # Páginas HTML
│   └── js/              # Módulos JavaScript (API, auth, utils)
├── .env.example         # Plantilla de variables
└── package.json
```

## 📊 Módulos

| Módulo | Descripción | Permisos |
|--------|-------------|----------|
| Dashboard | KPIs, gráficos, resumen del período | Admin + Lector |
| Períodos | Crear, activar, eliminar períodos | Solo Admin |
| EPP Limpio | Matriz de inventario sistemático | Admin + Lector |
| EPP Sucio/Lavado | Gestión de lavado y transferencia | Admin + Lector |
| Ingresos | Registro de ingresos de EPP | Solo Admin |
| Entregas | Entregas a trabajadores | Solo Admin |
| Devoluciones | Devoluciones de trabajadores | Solo Admin |
| Consultas | Kardex, auditoría, reportes | Admin + Lector |
| Administración | Usuarios, catálogos, apariencia | Solo Admin |

## 🔒 Seguridad

- **Autenticación JWT** con expiración configurable
- **Contraseñas** hasheadas con bcrypt
- **DNI** cifrado con AES-256-GCM, solo visible para admins
- **Roles:** Administrador (acceso total) y Lector (solo lectura)
- **Validación** tanto en frontend como backend
- **Auditoría** completa de todas las operaciones

## 📌 Reglas de Negocio

1. Todo movimiento requiere un período activo
2. Stock sistemático = Stock Inicial + Ingresos + Lavados - Entregas
3. Las devoluciones incrementan EPP sucio (para lavar)
4. Envío a lavar reduce sucio; marcar lavado agrega a limpio
5. Eliminar período elimina en cascada todos sus registros
6. Stock nunca puede ser negativo
7. Cantidades son enteros no negativos

## 🧪 Pruebas Manuales

### Flujo completo:
1. Login con credenciales de admin
2. Crear un período nuevo (ej: "Periodo 2024-01")
3. Activar el período
4. Ir a EPP Limpio → Establecer stock inicial (ej: Casco M = 10)
5. Ir a Ingresos → Registrar ingreso (ej: Chaleco L = 5)
6. Ir a Entregas → Registrar entrega (ej: Botas S a trabajador = 2)
7. Ir a Devoluciones → Registrar devolución (ej: Polo M = 1)
8. Ir a EPP Sucio → Ver devolución como "Para lavar"
9. Enviar a lavar → Estado cambia a "En proceso"
10. Marcar lavado → Transfiere a EPP Limpio
11. Ir a EPP Limpio → Registrar inventario físico
12. Verificar diferencia/conciliación
13. Ir a Consultas → Ver kardex completo
14. Exportar datos a Excel
15. Ir a Administración → Gestionar usuarios y catálogos
16. Probar con usuario Lector (solo lectura)

### Verificaciones de permisos:
- Login como Lector → No ver menús de edición
- Intentar acceder a URLs de admin → Redirige a dashboard
- Verificar que DNI aparece como "***" para lector

## 📝 Licencia

ISC
