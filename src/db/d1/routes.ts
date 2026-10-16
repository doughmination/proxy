/**
  * D1 Routes
  */

export interface ProxyRoute {
  id: string;
  proxy_address: string;
  sender_address: string;
  active: number;
}

export async function findRoute(
  db: D1Database,
  id: string,
): Promise<ProxyRoute | null> {
  return db
    .prepare(
      `SELECT id, proxy_address, sender_address, active
       FROM proxy_routes
       WHERE id = ? AND active = 1`,
    )
    .bind(id)
    .first<ProxyRoute>();
}

export async function createRoute(
  db: D1Database,
  route: ProxyRoute,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO proxy_routes
       (id, proxy_address, sender_address, active)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(
      route.id,
      route.proxy_address,
      route.sender_address,
      route.active,
    )
    .run();
}
