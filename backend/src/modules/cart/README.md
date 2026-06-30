# Backend - Modulo de Carrito

Implementacion backend del carrito en Node.js/Express, aislada en esta carpeta para cumplir la regla de propiedad por modulo.

## Endpoints expuestos

Base sugerida de montaje: `/api/cart`

1. `GET /api/cart/:cartId`
2. `POST /api/cart/:cartId/items`
3. `PATCH /api/cart/:cartId/items/:productId`
4. `DELETE /api/cart/:cartId/items/:productId`
5. `DELETE /api/cart/:cartId`

## Contratos de request

### Agregar producto

`POST /api/cart/:cartId/items`

```json
{
  "productId": 1,
  "title": "Classic Burger",
  "unitPrice": 149.9,
  "quantity": 2
}
```

### Actualizar cantidad

`PATCH /api/cart/:cartId/items/:productId`

```json
{
  "quantity": 3
}
```

Si `quantity` es `0`, el item se elimina del carrito.

## Respuesta estandar

```json
{
  "cartId": "session-123",
  "items": [
    {
      "productId": 1,
      "title": "Classic Burger",
      "unitPrice": 149.9,
      "quantity": 2,
      "lineTotal": 299.8
    }
  ],
  "summary": {
    "subtotal": 299.8,
    "discount": 0,
    "taxRate": 0.16,
    "tax": 47.97,
    "total": 347.77,
    "itemCount": 2,
    "distinctItems": 1
  }
}
```

## Integracion rapida en app Express

```js
const express = require("express");
const { createCartModule } = require("./src/modules/cart");

const app = express();
app.use(express.json());

const cartModule = createCartModule();
app.use("/api/cart", cartModule.router);
```

## Extension para conectar APIs de companeros

- `stockGateway` (opcional): inyecta `ensureAvailable({ productId, quantity })` para validar inventario desde otra API.
- `discountPolicy` (opcional): inyecta `calculate({ cartId, items, subtotal })` para reglas de descuento.
- `repository` (opcional): reemplaza memoria por MySQL/Redis sin tocar rutas ni controlador.

Todo el modulo trabaja con metodos asincronos para mantener compatibilidad con integraciones remotas.