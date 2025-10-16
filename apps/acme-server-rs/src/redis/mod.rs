use std::env;

use actix_session::storage::RedisSessionStore;

pub async fn connect_redis() -> RedisSessionStore {
  let redis_client =
    RedisSessionStore::new(env::var("REDIS_URL").unwrap_or("redis://localhost:6380".to_string()))
      .await
      .unwrap();

  println!("🦆 Redis client created and ready.");

  redis_client
}
