use crate::{
  auth::{constants::AuthMessage, dto::SigninDto},
  user::types::User,
};

use actix_web::web;

use crate::AppState;

pub struct AuthService {}

impl AuthService {
  pub async fn signin(
    data: web::Data<AppState>,
    credentials: web::Json<SigninDto>,
  ) -> Result<User, AuthMessage> {
    // fetching the user from the database
    let user = match sqlx::query_as::<_, User>(
      r#"
        SELECT *
        FROM users
        WHERE username = $1;
      "#,
    )
    .bind(&credentials.username)
    .fetch_one(&data.db)
    .await
    {
      Ok(user) => user,
      Err(e) => {
        println!("{:?}", e);
        return Err(AuthMessage::AuthUserNotFound.into());
      },
    };

    // verifying the password
    if !bcrypt::verify(&credentials.password, &user.password_hash)
      .expect("Failed to verify the password")
    {
      return Err(AuthMessage::AuthPasswordInvalid.into());
    }

    Ok(user)
  }
}
