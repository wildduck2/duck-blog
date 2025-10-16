use std::env;

use ::sqlx::PgPool;
use actix_web::{
  cookie::{time::Duration, Key},
  middleware::Logger as ActixLogger,
  web, App, HttpServer,
};
use dotenv::dotenv;

use actix_identity::IdentityMiddleware;
use actix_session::config::PersistentSession;
use actix_session::{storage::RedisSessionStore, SessionMiddleware};

mod auth;
mod common;
mod redis;
mod sqlx;

struct AppState {
  db: PgPool,
  redis: RedisSessionStore,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
  dotenv().ok();

  let secret_key = Key::generate();
  // Connect to the database
  let pool = sqlx::connect_sqlx().await;
  // Create a Redis client
  let redis_client = redis::connect_redis().await;

  let address: u16 = env::var("PORT")
    .unwrap_or("8080".to_string())
    .parse()
    .expect("Invalid port");
  println!("🦆 Starting server on http://127.0.0.1:{address}");

  HttpServer::new(move || {
    App::new()
      // Add the identity middleware to the service
      .wrap(IdentityMiddleware::default())
      .wrap(
        // Add the session middleware to the service
        SessionMiddleware::builder(redis_client.clone(), secret_key.clone())
          // Set the session cookie to expire in 7 days
          .session_lifecycle(PersistentSession::default().session_ttl(Duration::days(7)))
          .build(),
      )
      // Add the logger middleware to the service
      .app_data(web::Data::new(AppState {
        db: pool.clone(),
        redis: redis_client.clone(),
      }))
      .configure(auth::config)
      .service(auth::singin)
  })
  .bind(("127.0.0.1", address))?
  .run()
  .await
}
