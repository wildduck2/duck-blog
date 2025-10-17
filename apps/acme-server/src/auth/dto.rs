use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct SigninDto {
  #[validate(length(min = 1, max = 255, message = "ValidateUsernameLength"))]
  pub username: String,

  #[validate(length(min = 8, message = "ValidatePasswordMinLength"))]
  pub password: String,
}
