use askama::Template;
use serde::Serialize;

#[derive(Template, Serialize)]
#[template(path = "welcome_email.html")]
pub struct WelcomeEmail<'a> {
  pub username: &'a str,
  pub dashboard_url: &'a str,
  pub current_year: i32,
}
