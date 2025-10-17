use actix_web::{http::StatusCode, HttpResponse};
use serde::{Deserialize, Serialize};

pub fn api_error<T, M>(status: StatusCode, message: M) -> HttpResponse
where
  T: Serialize,
  M: Serialize,
{
  HttpResponse::build(status).json(ApiResult::<T, M> {
    data: None,
    message,
    status: Status::Error,
  })
}

pub fn api_success<T, M>(status: StatusCode, data: T, message: M) -> HttpResponse
where
  T: Serialize,
  M: Serialize,
{
  HttpResponse::build(status).json(ApiResult::<T, M> {
    data: Some(data),
    message,
    status: Status::Ok,
  })
}

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
