
# PICKUP
App de venta online, con consulta de imagenes, revision de inventario, generacion de APP android y PWA 
## 🛠 Stack
JSX, TypeScript, HTML, Tailwind, Motion, Redux,

## Correr en local

Clonar proyecto

```bash
  git clone https://github.com/AresNative/Pick-UP.git
```

Ir a la direccion del proyecto

```bash
  cd Pick-UP
```

Instalar dependencias

```bash
  npm i
```

Iniciar proyecto

```bash
  ionic serve
```

## Variables de entorno

Para que el proyecto funcione correctamente, crea un archivo `.env` en la raíz del mismo y agrega las siguientes variables de entorno:

- Configuración del cliente

```
NEXT_CLIENT_NAME="Mercado Liz Pick-UP"
```

nombre de la empresa obligatorio para la generacion de ordenes de compra

- Configuración de entorno

```
VITE_PUBLIC_MODE="production"
```

- API

```
VITE_APP_API_URL="https://tu.ruta.com/api/"
VITE_APP_HUB_URL="https://tu.ruta.com/"
VITE_PUBLIC_API_URL_INT="https://api.intelisis.ejemplo/api/"
VITE_TEST_API_URL="http://localhost:5230/api/"
```
- Firebase
```
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_DATABASE_URL=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""
VITE_FIREBASE_MEASUREMENT_ID=""
```

## Lanzar nuevas versiones en play.console

Accede a: `` package.json `` y aumenta la version de `` "version" ``
Al igual que en: ``android\app\build.gradle`` aumenta la version de ``versionCode`` y ``versionName``

## Usado por

Este proyecto es usado en:

- Mercado Liz


## Authors

- [@AresNative](https://github.com/AresNative)

