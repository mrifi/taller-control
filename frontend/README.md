# Taller Control Frontend

Frontend inicial en React + Vite para el dashboard financiero de talleres de neumaticos.

## Stack

- React
- Vite
- JavaScript
- Axios
- Recharts
- Lucide React
- CSS normal modularizado por estructura de carpetas
- Sin Tailwind
- Sin TypeScript

## Instalacion

Desde la carpeta `frontend`:

```bash
npm install
```

Copia el archivo de entorno:

```bash
copy .env.example .env
```

Variable necesaria:

```env
VITE_API_URL=http://localhost:3000/api
```

## Ejecutar

```bash
npm run dev
```

Abre:

```text
http://localhost:5173
```

## Backend esperado

El frontend consume el backend en:

```text
http://localhost:3000/api
```

Arranca primero el backend desde la carpeta raiz del proyecto:

```bash
npm run dev
```

Luego arranca el frontend desde `frontend`:

```bash
npm run dev
```

## Endpoints utilizados

- `GET /api/dashboard`
- `GET /api/ingresos`
- `GET /api/gastos`
- `GET /api/talleres`

## Filtros soportados

El dashboard envia estos query params cuando tienen valor:

- `tallerId`
- `fechaInicio`
- `fechaFin`

Las tablas de ingresos y gastos reutilizan los mismos filtros.

## Estados de UI

El dashboard gestiona:

- carga inicial
- error de API
- datos vacios
- datos cargados

Si falla la API se muestra:

```text
No se pudieron cargar los datos del dashboard.
```
