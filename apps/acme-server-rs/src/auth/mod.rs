use actix_session::Session;
use actix_web::{post, web, HttpResponse, Responder};

use crate::{
  auth::{constants::AuthMessage, dto::SigninDto, service::AuthService},
  common::{ApiResult, Status},
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
  let user = AuthService::signin(data, credentials).await;

  match user {
    Ok(user) => {
      session
        .insert("user_id", user.id.to_string())
        .expect(&AuthMessage::AuthInsertUserIdSessionFailed.to_string());
      HttpResponse::Ok().json(ApiResult::<User, AuthMessage> {
        data: Some(user),
        message: AuthMessage::AuthSigninSuccess,
        status: Status::Ok,
      })
    },
    Err(e) => HttpResponse::Unauthorized().json(ApiResult::<User, AuthMessage> {
      data: None,
      message: e,
      status: Status::Error,
    }),
  }
}

#[post("/signout")]
pub async fn signout(session: Session) -> impl Responder {
  session.purge();

  HttpResponse::Ok().json(ApiResult::<Option<u8>, AuthMessage> {
    data: None,
    message: AuthMessage::AuthSignoutSuccess,
    status: Status::Ok,
  })
}
