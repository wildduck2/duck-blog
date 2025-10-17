use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
  pub id: Uuid,
  pub username: String,
  pub email: String,
  pub first_name: String,
  pub last_name: String,

  #[serde(skip_serializing)]
  pub password_hash: String,
  pub avatar_url: Option<String>,
  pub is_active: bool,
  pub version: i32,
  pub settings: Value, // JSON column
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub deleted_at: Option<DateTime<Utc>>,
  pub last_login_at: Option<DateTime<Utc>>,
}

impl Default for User {
  fn default() -> Self {
    Self {
      id: Uuid::default(),
      username: String::default(),
      email: String::default(),
      first_name: String::default(),
      last_name: String::default(),
      password_hash: String::default(),
      avatar_url: None,
      is_active: false,
      version: 0,
      settings: Value::default(),
      created_at: Utc::now(),
      updated_at: Utc::now(),
      deleted_at: None,
      last_login_at: None,
    }
  }
}
