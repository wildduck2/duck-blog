use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct CreateUserDto {
  #[validate(length(min = 1, max = 255, message = "ValidateUsernameLength"))]
  pub username: String,

  #[validate(length(min = 8, message = "ValidatePasswordMinLength"))]
  pub password: String,

  #[validate(
    length(min = 1, max = 255, message = "ValidateEmailLength"),
    email(message = "ValidateEmailShape")
  )]
  pub email: String,

  #[validate(length(min = 1, max = 255, message = "ValidateFirstNameLength"))]
  pub first_name: String,

  #[validate(length(min = 1, max = 255, message = "ValidateLastNameLength"))]
  pub last_name: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateUserDto {
  pub user_id: uuid::Uuid,

  #[validate(length(min = 1, max = 255, message = "ValidateUsernameLength"))]
  pub username: Option<String>,

  #[validate(length(min = 8, message = "ValidatePasswordMinLength"))]
  pub password: Option<String>,

  #[validate(
    length(min = 1, max = 255, message = "ValidateEmailLength"),
    email(message = "ValidateEmailShape")
  )]
  pub email: Option<String>,

  #[validate(length(min = 1, max = 255, message = "ValidateFirstNameLength"))]
  pub first_name: Option<String>,

  #[validate(length(min = 1, max = 255, message = "ValidateLastNameLength"))]
  pub last_name: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct DeleteUserDto {
  pub user_id: uuid::Uuid,
}
