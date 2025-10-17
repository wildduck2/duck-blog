use actix_web::web;
use lettre::message::header::ContentType;
use lettre::transport::smtp::authentication::Credentials;
use lettre::transport::smtp::client::Tls;
use lettre::{Message, SmtpTransport, Transport};
use std::env;

use crate::AppState;

pub mod emails;

/// Create and return an SMTP transport connection based on environment variables.
pub async fn connect_to_smtp() -> SmtpTransport {
  dotenv::dotenv().ok();

  let host = env::var("MAIL_HOST").expect("MAIL_HOST not set");
  let port: u16 = env::var("MAIL_SMTP_PORT")
    .unwrap_or_else(|_| "1025".into())
    .parse()
    .expect("Invalid MAIL_SMTP_PORT");

  let username = env::var("MAIL_USERNAME").unwrap_or_default();
  let password = env::var("MAIL_PASSWORD").unwrap_or_default();

  let mut builder = SmtpTransport::builder_dangerous(&host)
    .port(port)
    .tls(Tls::None); // disable TLS for local dev servers like Mailpit/Mailhog

  // Only add credentials if provided
  if !username.is_empty() {
    builder = builder.credentials(Credentials::new(username, password));
  }

  builder.build()
}

pub async fn send_reset_email(
  data: &web::Data<AppState>,
  recipient: &str,
  html: &str,
) -> Result<(), anyhow::Error> {
  let email_message = Message::builder()
    .from("Acme App <admin@example.com>".parse()?)
    .to(recipient.parse()?)
    .subject("Reset Password")
    .header(ContentType::TEXT_HTML)
    .body(html.to_string())?;

  data.mailer.send(&email_message)?;
  Ok(())
}
