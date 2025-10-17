use std::env;

use ::sqlx::PgPool;
use actix_web::{
  cookie::{time::Duration, Key},
  web, App, HttpServer,
};
use dotenv::dotenv;
use lettre::SmtpTransport;

use actix_identity::IdentityMiddleware;
use actix_session::config::PersistentSession;
use actix_session::{storage::RedisSessionStore, SessionMiddleware};

use crate::email::connect_to_smtp;

mod auth;
mod common;
mod email;
mod otp_code;
mod redis;
mod sqlx;
mod user;

struct AppState {
  db: PgPool,
  redis: RedisSessionStore,
  mailer: SmtpTransport,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
  dotenv().ok();

  let secret_key = get_session_key();

  // Connect to the SMTP service
  let mailer = connect_to_smtp().await;
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
          .cookie_name("acme-session".to_string())
          // .cookie_http_only(true)
          .session_lifecycle(PersistentSession::default().session_ttl(Duration::days(7)))
          .build(),
      )
      // Add the logger middleware to the service
      .app_data(web::Data::new(AppState {
        db: pool.clone(),
        redis: redis_client.clone(),
        mailer: mailer.clone(),
      }))
      .configure(auth::config)
      .configure(user::config)
      .configure(otp_code::config)
  })
  .bind(("127.0.0.1", address))?
  .run()
  .await
}

fn get_session_key() -> Key {
  let secret = env::var("SESSION_SECRET").expect("SESSION_SECRET must be set");
  let decoded = base64::decode(&secret).expect("Invalid base64 in SESSION_SECRET");
  Key::from(&decoded)
}
