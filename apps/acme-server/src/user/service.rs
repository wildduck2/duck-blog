use actix_web::web;

use crate::{
  email::emails::UpdatedField,
  user::{
    constants::UserMessage,
    dto::{CreateUserDto, DeleteUserDto, ResetPasswordDto, UpdateUserDto},
    types::User,
  },
  AppState,
};
use sqlx::Postgres;
use sqlx::QueryBuilder;

pub struct UserService;

impl UserService {
  pub async fn get(
    data: &web::Data<AppState>,
    credentials: ResetPasswordDto,
  ) -> Result<User, UserMessage> {
    println!("{}", credentials.user_id);
    let user = sqlx::query_as::<_, User>(
      r#"
        SELECT *
        FROM users u
        WHERE u.id = $1::uuid
          AND NOT EXISTS (
            SELECT 1
            FROM otp_codes oc
            WHERE oc.user_id = u.id
              AND oc.expires_at > NOW()
              AND oc.is_active = true
          );
    "#,
    )
    .bind(&credentials.user_id)
    .fetch_one(&data.db)
    .await
    .map_err(|e| {
      println!("{}", e);
      UserMessage::UserGetFailed
    })?;

    Ok(user)
  }

  pub async fn create(
    data: &web::Data<AppState>,
    credentials: CreateUserDto,
  ) -> Result<User, UserMessage> {
    let hashed_password = bcrypt::hash(&credentials.password, 10).unwrap();

    let user = sqlx::query_as::<_, User>(
      r#"
        INSERT INTO users (username, email, first_name, last_name, password_hash)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING * 
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
    })?;

    Ok(user)
  }

  pub async fn update<'a>(
    data: &web::Data<AppState>,
    credentials: UpdateUserDto,
  ) -> Result<(User, Vec<UpdatedField<'a>>), UserMessage> {
    let mut fields_updated = Vec::<UpdatedField<'a>>::new();
    let mut qb: QueryBuilder<Postgres> = QueryBuilder::new("UPDATE users SET ");

    // Create an iterator of field name + Option<value>
    let fields = [
      ("username", credentials.username),
      ("email", credentials.email),
      ("first_name", credentials.first_name),
      ("last_name", credentials.last_name),
      (
        "password_hash",
        credentials
          .password
          .map(|v| bcrypt::hash(v, 10).expect("UserFailedToHashPassword")),
      ),
    ];

    let mut first = true;

    for (name, value_opt) in fields.iter() {
      if let Some(value) = value_opt {
        if !first {
          qb.push(", ");
        }
        qb.push(format!("{name} = ").as_str()).push_bind(value);
        fields_updated.push(UpdatedField {
          label: name,
          value: value_opt.clone().unwrap(),
        });
        first = false;
      }
    }

    // If no fields to update
    if first {
      return Err(UserMessage::NothingToUpdate);
    }

    qb.push(" WHERE id = ").push_bind(credentials.user_id);
    qb.push(" RETURNING *");

    let updated_user = qb
      .build_query_as::<User>()
      .fetch_one(&data.db)
      .await
      .map_err(|e| {
        println!("{:?}", e);
        UserMessage::UserUpdateFailed
      })?;

    Ok((updated_user, fields_updated))
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
      WHERE users.id = $1::uuid
      "#,
    )
    .bind(user_id)
    .fetch_one(&data.db)
    .await
    .map_err(|e| {
      println!("{:?}", e);
      UserMessage::UserGetProfileFailed
    })?;

    Ok(user)
  }
}
