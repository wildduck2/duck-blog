use askama::Template;
use serde::Serialize;

#[derive(Template, Serialize)]
#[template(path = "welcome_email.html")]
pub struct WelcomeEmail {
  pub username: String,
  pub dashboard_url: String,
}
