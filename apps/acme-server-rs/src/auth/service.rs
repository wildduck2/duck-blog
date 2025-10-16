use std::fmt::Debug;

use crate::{
  auth::{
    constants::AuthMessage,
    dto::{SigninDto, SignupDto},
    types::User,
  },
  common::ApiResult,
};
use actix_web::web;

use crate::AppState;

pub struct AuthService {}

impl AuthService {
  pub async fn signin(
    data: web::Data<AppState>,
    credentials: web::Json<SigninDto>,
  ) -> Result<User, Box<dyn std::error::Error>> {
    // fetching the user from the database
    let user = match sqlx::query_as::<_, User>(
      r#"
      SELECT *
      FROM users
      WHERE username = 'janesmith';
      "#,
    )
    // .bind(&credentials.username)
    .fetch_optional(&data.db)
    .await?
    {
      Some(user) => user,
      None => {
        return Err(AuthMessage::AUTH_USER_NOT_FOUND.into());
      },
    };

    // verifying the password
    if !bcrypt::verify(&credentials.password, &user.password_hash)
      .expect("Failed to verify the password")
    {
      return Err(AuthMessage::AUTH_PASSWORD_INVALID.into());
    }

    Ok(user)
  }

  // pub async fn singup(
  //   data: web::Data<AppState>,
  //   credentials: web::Json<SignupDto>,
  // ) -> Result<User, AuthMessage> {
  //    //
  // }
  //
  // pub async fn me(data: web::Data<AppState>) -> Result<User, AuthMessage> {}
}
