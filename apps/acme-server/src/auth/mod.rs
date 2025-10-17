use actix_session::Session;
use actix_web::{http::StatusCode, post, web, Responder};

use crate::{
  auth::{constants::AuthMessage, dto::SigninDto, service::AuthService},
  common::functionalities::api_res::{api_error, api_success},
  user::types::User,
  AppState,
};

mod constants;
mod dto;
pub mod guard;
mod service;

pub fn config(cfg: &mut web::ServiceConfig) -> () {
  cfg.service(web::scope("/auth").service(singin).service(signout));
}

#[post("singin")]
async fn singin(
  credentials: web::Json<SigninDto>,
  session: Session,
  data: web::Data<AppState>,
) -> impl Responder {
  let user = match AuthService::signin(data, credentials).await {
    Ok(user) => user,
    Err(e) => return api_error::<User, AuthMessage>(StatusCode::BAD_REQUEST, e),
  };

  session
    .insert("user_id", user.id.to_string())
    .expect(&AuthMessage::AuthInsertUserIdSessionFailed.to_string());

  api_success::<User, AuthMessage>(StatusCode::OK, user, AuthMessage::AuthSigninSuccess)
}

#[post("/signout")]
pub async fn signout(session: Session) -> impl Responder {
  session.purge();
  // Err(e) => api_error::<Auth, AuthMessage>(StatusCode::BAD_REQUEST, e),
  api_success::<(), AuthMessage>(StatusCode::OK, (), AuthMessage::AuthSignoutSuccess)
}
