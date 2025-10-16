use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct SigninDto {
  #[validate(length(min = 1, max = 255, message = "VALIDATE_USERNAME_LENGTH"))]
  pub username: String,

  #[validate(length(min = 8, message = "VALIDATE_PASSWORD_MIN_LENGTH"))]
  pub password: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct SignupDto {
  #[validate(length(min = 1, max = 255, message = "VALIDATE_USERNAME_LENGTH"))]
  pub username: String,

  #[validate(length(min = 8, message = "VALIDATE_PASSWORD_MIN_LENGTH"))]
  pub password: String,

  #[validate(length(min = 1, max = 255, message = "VALIDATE_EMAIL_LENGTH"))]
  pub email: String,

  #[validate(length(min = 1, max = 255, message = "VALIDATE_FIRST_NAME_LENGTH"))]
  pub first_name: String,

  #[validate(length(min = 1, max = 255, message = "VALIDATE_LAST_NAME_LENGTH"))]
  pub last_name: String,
}
