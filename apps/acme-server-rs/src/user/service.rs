use actix_web::web;

use crate::{
  user::{
    constants::UserMessage,
    dto::{CreateUserDto, DeleteUserDto},
    types::User,
  },
  AppState,
};

pub struct UserService;

impl UserService {
  pub async fn create(
    data: &web::Data<AppState>,
    credentials: CreateUserDto,
  ) -> Result<User, UserMessage> {
    let hashed_password = bcrypt::hash(&credentials.password, 10).unwrap();

    let user = sqlx::query_as::<_, User>(
      r#"
        INSERT INTO users (username, email, first_name, last_name, password_hash)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, username, email, first_name, last_name, avatar_url, is_active, last_login_at, settings, version, created_at, updated_at, deleted_at, password_hash 
      "#,
    )
    .bind(&credentials.username)
    .bind(&credentials.email)
    .bind(&credentials.first_name)
    .bind(&credentials.last_name)
    .bind(&hashed_password)
    .fetch_one(&data.db)
    .await
    .map_err(|e| {
      println!("{}", e);
      UserMessage::UserCreateFailed
    });

    user
  }

  pub async fn delete(
    data: web::Data<AppState>,
    credentials: DeleteUserDto,
  ) -> Result<(), UserMessage> {
    let result = sqlx::query(
      r#"
        DELETE FROM users
        WHERE id = $1::uuid
      "#,
    )
    .bind(&credentials.user_id)
    .execute(&data.db)
    .await
    .map_err(|e| {
      println!("{:?}", e);
      UserMessage::UserDeleteFailed
    })?;

    if result.rows_affected() == 0 {
      return Err(UserMessage::UserNotFound);
    }

    Ok(())
  }

  pub async fn me(data: web::Data<AppState>, user_id: String) -> Result<User, UserMessage> {
    let user = sqlx::query_as::<_, User>(
      r#"
      SELECT * 
      FROM users
      WHERE users.id = $1 
      "#,
    )
    .bind(user_id)
    .fetch_one(&data.db)
    .await
    .map_err(|_| UserMessage::UserGetProfileFailed);

    user
  }
}
