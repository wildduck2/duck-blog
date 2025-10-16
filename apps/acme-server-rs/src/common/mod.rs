use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResult<T, E> {
  pub data: Option<T>,
  pub message: E,
  pub status: Status,
}

pub enum ApiError {
  Err(sqlx::Error),
}

#[derive(Debug, Serialize, Deserialize)]
pub enum Status {
  Ok,
  Error,
}
