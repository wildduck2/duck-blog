use askama::Template;
use serde::Serialize;

#[derive(Serialize)]
pub struct UpdatedField<'a> {
  pub label: &'a str,
  pub value: String,
}

#[derive(Template, Serialize)]
#[template(path = "update_user_info.html")]
pub struct UpdateUserEmail<'a> {
  pub username: &'a str,
  pub view_profile_link: &'a str,
  pub updated_fields: Vec<UpdatedField<'a>>,
  pub last_update: &'a str,
}

#[derive(Template, Serialize)]
#[template(path = "welcome_email.html")]
pub struct WelcomeEmail<'a> {
  pub username: &'a str,
  pub dashboard_url: &'a str,
  pub current_year: i32,
}

#[derive(Template, Serialize)]
#[template(path = "password-reset.html")]
pub struct ResetPasswordEmail<'a> {
  pub username: &'a str,
  pub reset_code: &'a str,
  pub reset_link: &'a str,
}
