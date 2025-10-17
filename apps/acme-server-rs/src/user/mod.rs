use actix_session::Session;
use actix_web::{delete, get, post, web, HttpResponse, Responder};
use askama::Template;
use lettre::{message::header::ContentType, Message, Transport};

mod constants;
mod dto;
mod service;
pub mod types;

use actix_web::middleware::from_fn;
use uuid::Uuid;

pub fn config(cfg: &mut web::ServiceConfig) {
  cfg.service(
    web::scope("/user")
      .service(delete)
      .service(create)
      .service(web::scope("").wrap(from_fn(auth_middleware)).service(me)),
  );
}

use crate::{
  auth::guard::auth_middleware,
  common::{validators::validate_uuid, ApiResult, Status},
  email::emails::welcome_email::WelcomeEmail,
  user::{
    constants::UserMessage,
    dto::{CreateUserDto, DeleteUserDto},
    service::UserService,
    types::User,
  },
  AppState,
};

#[post("/create")]
async fn create(
  creditials: web::Json<CreateUserDto>,
  session: Session,
  data: web::Data<AppState>,
) -> impl Responder {
  let user = UserService::create(&data, creditials.into_inner()).await;
  println!("asdfasd f");

  match user {
    Ok(user) => {
      session
        .insert("user_id", user.id.to_string())
        .expect(&UserMessage::AuthInsertUserIdSessionFailed.to_string());

      let email = WelcomeEmail {
        username: "Ahmed".to_string(),
        dashboard_url: "http://localhost:3000/dashboard/".to_string(),
      };

      let html = email.render().unwrap();

      let email = Message::builder()
        .from("Acme App <admin@example.com>".parse().unwrap())
        .to("user@example.com".parse().unwrap())
        .subject("Welcome to ACME")
        .header(ContentType::TEXT_HTML)
        .body(html)
        .unwrap();

      match data.mailer.send(&email) {
        Ok(_) => println!("Email sent successfully!"),
        Err(e) => eprintln!("Could not send email: {:?}", e),
      }

      HttpResponse::Ok().json(ApiResult::<User, UserMessage> {
        data: Some(user),
        message: UserMessage::UserCreateSuccess,
        status: Status::Error,
      })
    },
    Err(e) => HttpResponse::BadRequest().json(ApiResult::<User, UserMessage> {
      data: None,
      message: e,
      status: Status::Error,
    }),
  }
}

#[delete("/delete")]
pub async fn delete(
  data: web::Data<AppState>,
  credentials: web::Json<DeleteUserDto>,
) -> impl Responder {
  if Uuid::parse_str(&credentials.user_id).is_err() {
    return HttpResponse::BadRequest().json(ApiResult::<User, UserMessage> {
      data: None,
      message: UserMessage::InvalidUuid,
      status: Status::Error,
    });
  }

  match UserService::delete(data, credentials.into_inner()).await {
    Ok(_) => HttpResponse::Ok().json(ApiResult::<User, UserMessage> {
      data: None,
      message: UserMessage::UserDeleteSuccess,
      status: Status::Ok,
    }),
    Err(e) => HttpResponse::BadRequest().json(ApiResult::<User, UserMessage> {
      data: None,
      message: e,
      status: Status::Error,
    }),
  }
}

#[get("/me")]
pub async fn me(data: web::Data<AppState>, session: Session) -> impl Responder {
  let user_id = session
    .get::<String>("user_id")
    .expect(&UserMessage::AuthGetSessionUserIdSessionFailed.to_string())
    .unwrap();

  let user = UserService::me(data, user_id).await;

  match user {
    Ok(user) => HttpResponse::Ok().json(user),
    Err(e) => HttpResponse::InternalServerError().body(format!("DB error: {e}")),
  }
}
