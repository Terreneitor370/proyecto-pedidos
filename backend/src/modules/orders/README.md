# Backend - Modulo Checkout y Pedidos

Implementacion backend para el flujo de checkout asíncrono secuencial, generacion de ticket y almacenamiento de pedidos con snapshot historico de precios.

## Endpoints

Base sugerida de montaje: /api

1. POST /api/checkout
2. GET /api/orders/:orderId
3. GET /api/users/:userId/orders

## Request de checkout

POST /api/checkout

```json
{
  "cartId": "session-1001",
  "userId": 8,
  "authToken": "token-opcional",
  "couponCode": "DESC10",
  "currency": "MXN",
  "payment": {
    "method": "card",
    "reference": "pm_123"
  },
  "metadata": {
    "channel": "web"
  }
}
```

## Flujo implementado

1. Autentica usuario (si se inyecta authGateway).
2. Obtiene carrito desde cartGateway.
3. Valida stock producto por producto con stockGateway.
4. Calcula subtotal, descuento, IVA 16% y total.
5. Cobra pago con paymentGateway (por defecto mock aprobado).
6. Guarda orden en estado PROCESSING.
7. Descuenta stock.
8. Limpia carrito.
9. Confirma orden y devuelve ticket.

Si ocurre un fallo de integracion despues del cobro, la orden se marca como FAILED para trazabilidad.

## Snapshot historico

Cada item de pedido guarda:

- productId
- title
- quantity
- priceAtPurchase
- lineTotal

Esto evita que un cambio de precio externo altere tickets pasados.

## Integracion con APIs de companeros

`createOrdersModule` acepta dependencias por inyeccion:

- cartGateway
  - getCart({ cartId, userId })
  - clearCart({ cartId, userId })
- stockGateway
  - checkAvailability({ productId, quantity })
  - decrementStock({ productId, quantity })
- authGateway (opcional)
  - verifyCheckoutAccess({ authToken, userId })
- discountPolicy (opcional)
  - calculate({ user, cartId, items, subtotal, couponCode })
- paymentGateway (opcional)
  - charge({ amount, currency, payment, user, cartId })

## Uso rapido

```js
const express = require("express");
const { createOrdersModule } = require("./src/modules/orders");

const app = express();
app.use(express.json());

const ordersModule = createOrdersModule();
app.use("/api", ordersModule.router);
```

El modulo incluye implementaciones InMemory para repositorio, carrito y stock, pensadas para pruebas e integracion inicial.