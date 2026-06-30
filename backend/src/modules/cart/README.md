# Backend - Modulo de Carrito

Implementacion backend del carrito en Node.js/Express que usa DummyJSON carts como fuente principal de datos remota.

## Fuente de datos

- API externa: https://dummyjson.com/carts
- Repositorio por defecto: DummyJsonCartRepository

## Endpoints expuestos

Base sugerida de montaje: /api/cart

1. GET /api/cart/:cartId
2. POST /api/cart/:cartId/items
3. PATCH /api/cart/:cartId/items/:productId
4. DELETE /api/cart/:cartId/items/:productId
5. DELETE /api/cart/:cartId

## Reglas de integracion con DummyJSON

- cartId debe ser numerico (id de carrito en DummyJSON).
- Si el cartId no existe y quieres agregar el primer item, envia userId en el body para crear carrito remoto.

## Contratos de request

### Agregar producto a carrito existente

POST /api/cart/:cartId/items

```json
{
  "productId": 1,
  "quantity": 2
}
```

### Crear carrito remoto y agregar primer producto

POST /api/cart/:cartId/items

```json
{
  "userId": 7,
  "productId": 1,
  "quantity": 2
}
```

### Actualizar cantidad

PATCH /api/cart/:cartId/items/:productId

```json
{
  "quantity": 3
}
```

Si quantity es 0, el item se elimina.

## Respuesta estandar

```json
{
  "cartId": "1",
  "userId": 33,
  "items": [
    {
      "productId": 59,
      "title": "Spring and summershoes",
      "unitPrice": 20,
      "quantity": 2,
      "lineTotal": 40
    }
  ],
  "summary": {
    "subtotal": 40,
    "discount": 0,
    "taxRate": 0.16,
    "tax": 6.4,
    "total": 46.4,
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

## Dependencias opcionales

- stockGateway: ensureAvailable({ productId, quantity })
- discountPolicy: calculate({ cartId, userId, items, subtotal })
- repository: puedes inyectar InMemoryCartRepository para desarrollo local sin red