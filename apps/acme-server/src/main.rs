use std::env;

use ::sqlx::PgPool;
use actix_web::cookie::{time::Duration, Key};
use dotenv::dotenv;
use lettre::SmtpTransport;

use actix_cors::Cors;
use actix_identity::IdentityMiddleware;
use actix_session::config::PersistentSession;
use actix_session::{storage::RedisSessionStore, SessionMiddleware};
use actix_web::{http::header, web, App, HttpServer};

use crate::email::connect_to_smtp;

mod auth;
mod common;
mod email;
mod otp_code;
mod redis;
mod sqlx;
mod user;
mod words;

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
  println!("🦆 Starting server on http://localhost:{address}");

  HttpServer::new(move || {
    let cors = Cors::default()
      .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
      .allowed_headers(vec![header::AUTHORIZATION, header::CONTENT_TYPE])
      .allowed_origin_fn(|origin, _req_head| {
        let allowed = [
          "http://localhost:3001",
          "http://localhost:3000", // Add if needed
          "https://blog.gentleduck.com",
        ];
        allowed.contains(&origin.to_str().unwrap())
      })
      .supports_credentials()
      .max_age(3600);

    App::new()
      .wrap(cors)
      .wrap(
        SessionMiddleware::builder(redis_client.clone(), secret_key.clone())
          .cookie_name("acme-session".to_string())
          .cookie_domain(Some("localhost".to_string()))
          .cookie_secure(false) // 👈 required for localhost without HTTPS
          .session_lifecycle(PersistentSession::default().session_ttl(Duration::days(7)))
          .build(),
        // .cookie_http_only(false)
      )
      .wrap(IdentityMiddleware::default())
      // Add the logger middleware to the service
      .app_data(web::Data::new(AppState {
        db: pool.clone(),
        redis: redis_client.clone(),
        mailer: mailer.clone(),
      }))
      .service(
        web::scope("/v1")
          .configure(auth::config)
          .configure(user::config)
          .configure(otp_code::config)
          .configure(words::config),
      )
  })
  .bind(("0.0.0.0", address))?
  .run()
  .await
}

fn get_session_key() -> Key {
  let secret = env::var("SESSION_SECRET").expect("SESSION_SECRET must be set");
  let decoded = base64::decode(&secret).expect("Invalid base64 in SESSION_SECRET");
  Key::from(&decoded)
}
