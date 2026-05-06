# Backend contabilidad neumaticos

Backend base en Node.js, Express y SQL Server para una aplicacion web de contabilidad de talleres de neumaticos.

No usa ORM. Los repositories usan `mssql` parametrizado; actualmente hay mezcla de procedimientos almacenados reales y queries directas parametrizadas.

## Stack

- Node.js
- Express
- SQL Server
- `mssql`
- `zod`
- `pino`
- `pino-http`
- Procedimientos almacenados
- Arquitectura modular por dominio
- CORS configurable para frontend React
- JWT
- Multiempresa por `IDEmpresa`

## Estructura

```text
src/
|-- config/
|   |-- db.js
|   `-- logger.js
|-- middlewares/
|   `-- errorHandler.js
|-- modules/
|   |-- auth/
|   |-- common/
|   |-- dashboard/
|   |-- ingresos/
|   |-- gastos/
|   `-- talleres/
|-- utils/
|   `-- AppError.js
|-- app.js
`-- server.js
```

## Instalacion

```bash
npm install
```

Si el comando `npm` de Windows apunta a un shim roto, puedes usar:

```bash
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install
```

Copia el archivo de entorno:

```bash
copy .env.example .env
```

Configura `.env`:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
DB_USER=sa
DB_PASSWORD=tu_password
DB_SERVER=localhost
DB_DATABASE=contabilidad_neumaticos
DB_PORT=1433
DB_TRUST_SERVER_CERTIFICATE=true
DB_ENCRYPT=false
JWT_SECRET=una_clave_larga_segura
JWT_EXPIRES_IN=8h
```

En produccion configura siempre `CORS_ORIGIN`; si no se define, no queda abierto por defecto.

## Ejecutar

```bash
npm run dev
```

o:

```bash
npm start
```

Health check:

```http
GET http://localhost:3000/api/health
```

## Autenticacion y multiempresa

La aplicacion usa login con JWT. Todas las rutas financieras estan protegidas y el aislamiento de datos se hace por `IDEmpresa`, nunca por `IDUsuario`.

Roles previstos:

- `SUPER_ADMIN`: reservado para administracion global futura del SaaS.
- `OWNER`: cliente propietario de una empresa.
- `EMPLOYEE`: rol futuro para empleados.

Usuario inicial del cliente:

```txt
Email: neumaticosidriss@email.com
Password temporal: Cambiar123!
Rol: OWNER
IDEmpresa: 1
Empresa: Neumaticos Idriss
Slug: neumaticos-idriss
```

Login:

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json
```

```json
{
  "email": "neumaticosidriss@email.com",
  "password": "Cambiar123!"
}
```

El JWT incluye:

```json
{
  "id": 1,
  "empresaId": 1,
  "email": "neumaticosidriss@email.com",
  "rol": "OWNER"
}
```

Para inicializar/migrar tenant:

```bash
npm run migrate:tenant
npm run create:owner
```

El frontend no debe enviar `IDEmpresa`, `empresaId` ni `IDUsuario`; el backend siempre usa `req.user.empresaId`.

## Base de datos

Tablas principales conocidas:

- `dbo.Empresa`
- `dbo.Usuario`
- `dbo.Taller`
- `dbo.Ingreso`
- `dbo.Gasto`
- `dbo.TipoIngreso`
- `dbo.TipoGasto`

Todos los datos privados deben filtrar por:

```sql
WHERE IDEmpresa = @IDEmpresa
```

Los datos llegan ya validados y normalizados desde los services/schemas para ser compatibles con:

- `sql.Int`
- `sql.Date`
- `sql.Decimal(18, 2)`
- `sql.VarChar(50)`

## Formato de errores

Error de validacion:

```json
{
  "success": false,
  "message": "Error de validacion",
  "errors": [
    {
      "field": "monto",
      "message": "monto debe ser mayor que 0"
    }
  ]
}
```

Error general:

```json
{
  "success": false,
  "message": "Error interno del servidor"
}
```

## Metodos de pago permitidos

- `Efectivo`
- `Tarjeta`
- `Transferencia`
- `Bizum`

## Pruebas en Postman

### GET dashboard valido

```http
GET http://localhost:3000/api/dashboard?tallerId=1&fechaInicio=2026-05-01&fechaFin=2026-05-31
```

### GET dashboard con error de validacion

```http
GET http://localhost:3000/api/dashboard?tallerId=abc&fechaInicio=2026-05-01&fechaFin=2026-05-31
```

Respuesta esperada:

```json
{
  "success": false,
  "message": "Error de validacion",
  "errors": [
    {
      "field": "tallerId",
      "message": "tallerId debe ser numerico"
    }
  ]
}
```

Error de rango de fechas:

```http
GET http://localhost:3000/api/dashboard?fechaInicio=2026-05-31&fechaFin=2026-05-01
```

### GET ingresos valido

```http
GET http://localhost:3000/api/ingresos?tallerId=1&fechaInicio=2026-05-01&fechaFin=2026-05-31&metodoPago=Tarjeta
```

### GET ingresos con error de metodo de pago

```http
GET http://localhost:3000/api/ingresos?metodoPago=Cheque
```

Respuesta esperada:

```json
{
  "success": false,
  "message": "Error de validacion",
  "errors": [
    {
      "field": "metodoPago",
      "message": "Metodo de pago no permitido"
    }
  ]
}
```

### POST ingreso valido

```http
POST http://localhost:3000/api/ingresos
Content-Type: application/json
```

Body:

```json
{
  "descripcion": "Venta de 4 neumaticos Michelin",
  "fecha": "2026-05-04",
  "monto": 420.5,
  "cantidad": 4,
  "metodoPago": "Tarjeta",
  "categoriaId": 1,
  "tallerId": 1
}
```

### POST ingreso con errores

```json
{
  "descripcion": "",
  "fecha": "fecha-invalida",
  "monto": 0,
  "cantidad": -2,
  "metodoPago": "Cheque",
  "categoriaId": "abc",
  "tallerId": 1
}
```

### GET gastos valido

```http
GET http://localhost:3000/api/gastos?tallerId=1&fechaInicio=2026-05-01&fechaFin=2026-05-31&metodoPago=Transferencia
```

### GET gastos con error de fecha

```http
GET http://localhost:3000/api/gastos?fechaInicio=no-es-fecha
```

### POST gasto valido

```http
POST http://localhost:3000/api/gastos
Content-Type: application/json
```

Body:

```json
{
  "descripcion": "Compra de stock de neumaticos",
  "fecha": "2026-05-04",
  "monto": 1200,
  "cantidad": 20,
  "metodoPago": "Transferencia",
  "tipoGastoId": 1,
  "tallerId": 1
}
```

### POST gasto con errores

```json
{
  "descripcion": "Pago incorrecto",
  "fecha": "2026-05-04",
  "monto": -10,
  "cantidad": 0,
  "metodoPago": "PayPal",
  "tipoGastoId": 1,
  "tallerId": "x"
}
```

## Responsabilidades

- `routes`: define endpoints HTTP.
- `controller`: lee `req`, responde `res` y delega.
- `service`: valida, normaliza y aplica reglas de negocio.
- `schema`: define validaciones Zod por modulo.
- `repository`: llama a stored procedures de SQL Server.

Para exportacion futura a PDF, crea un modulo `reportes` o `exports` que reutilice services existentes sin duplicar consultas.

## Frontend React

El frontend inicial esta en la carpeta `frontend`.

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

URL del frontend:

```text
http://localhost:5173
```

El frontend consume este backend mediante:

```env
VITE_API_URL=http://localhost:3000/api
```
