use actix_session::Session;
use actix_web::{get, post, web, HttpMessage, HttpResponse, Responder};

use crate::{
  auth::{
    constants::AuthMessage,
    dto::{SigninDto, SignupDto},
    service::AuthService,
    types::User,
  },
  common::{ApiResult, Status},
  AppState,
};

mod constants;
mod dto;
mod service;
mod types;

pub fn config(cfg: &mut web::ServiceConfig) -> () {
  cfg.service(web::scope("/auth").service(singin));
  // .service(singup));
  // .service(me);
}

#[post("singin")]
async fn singin(
  credentials: web::Json<SigninDto>,
  session: Session,
  data: web::Data<AppState>,
) -> impl Responder {
  let user = AuthService::signin(data, credentials).await;

  println!("user: {:?}", user);
  match user {
    Ok(user) => {
      session
        .insert("user_id", user.id.to_string())
        .expect("Failed to set the session");
      HttpResponse::Ok().json(ApiResult::<User, AuthMessage> {
        data: Some(user),
        message: AuthMessage::AUTH_INVALID_CREDENTIALS,
        status: Status::Ok,
      })
    },
    Err(_e) => HttpResponse::Ok().json(ApiResult::<User, String> {
      data: None,
      message: sqlx::Error::RowNotFound.to_string(),
      status: Status::Error,
    }),
  }
}

// #[post("singup")]
// async fn singup(
//   creditials: web::Json<SignupDto>,
//   session: Session,
//   data: web::Data<AppState>,
// ) -> impl Responder {
//   let user = AuthService::singup(data, creditials).await;
//
//   match user {
//     Ok(user) => {
//       session.insert("user_id", user.id.to_string());
//       HttpResponse::Ok().json(ApiResult::<User, AuthMessage> {
//         data: Some(user),
//         message: AuthMessage::AUTH_REGISTRATION_SUCCESS,
//         status: Status::Error,
//       })
//     },
//     Err(e) => HttpResponse::Ok().json(ApiResult::<User, AuthMessage> {
//       data: None,
//       message: e,
//       status: Status::Error,
//     }),
//   }
// }
//
// #[get("/me")]
// pub async fn me(data: web::Data<AppState>) -> impl Responder {
//   // let user = AuthService::me(data).await;
//
//   let pool = &data.db;
//
//   let result = sqlx::query_as::<_, User>("SELECT * FROM users")
//     .fetch_all(pool)
//     .await;
//
//   match result {
//     Ok(user) => HttpResponse::Ok().json(user),
//     Err(e) => HttpResponse::InternalServerError().body(format!("DB error: {e}")),
//   }
// }
