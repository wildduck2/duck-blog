use actix_session::Session;
use actix_web::{delete, get, patch, post, web, HttpResponse, Responder};
use askama::Template;
use chrono::{Datelike, Local};
use lettre::{message::header::ContentType, Message, Transport};

mod constants;
mod dto;
mod service;
pub mod types;

use actix_web::middleware::from_fn;

pub fn config(cfg: &mut web::ServiceConfig) {
  cfg.service(
    web::scope("/user").service(create).service(update).service(
      web::scope("")
        .wrap(from_fn(auth_middleware))
        .service(delete)
        .service(me),
    ),
  );
}

use crate::{
  auth::guard::auth_middleware,
  common::{ApiResult, Status},
  email::emails::{
    updated_user_info::{UpdateUserEmail, UpdatedField},
    welcome_email::WelcomeEmail,
  },
  user::{
    constants::UserMessage,
    dto::{CreateUserDto, DeleteUserDto, UpdateUserDto},
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
        username: &user.username,
        dashboard_url: "http://localhost:3000/dashboard/",
        current_year: chrono::Utc::now().year(),
      };

      let html = email.render().unwrap();

      let email = Message::builder()
        .from("Acme App <admin@example.com>".parse().unwrap())
        .to(user.email.clone().parse().unwrap())
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

#[patch("/update")]
pub async fn update(
  data: web::Data<AppState>,
  credentials: web::Json<UpdateUserDto>,
) -> impl Responder {
  let user = UserService::update(&data, credentials.into_inner()).await;
  match user {
    Ok((user, updated_fields)) => {
      let date = Local::now().format("%B %-d, %Y at %-I:%M %p").to_string();
      let email = UpdateUserEmail {
        username: &user.username,
        view_profile_link: "https://example.com/profile",
        updated_fields,
        last_update: &date,
      };

      let html = email.render().unwrap();

      let email = Message::builder()
        .from("Acme App <admin@example.com>".parse().unwrap())
        .to(user.email.clone().parse().unwrap())
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
        message: UserMessage::UserUpdateSuccess,
        status: Status::Ok,
      })
    },

    Err(_) => HttpResponse::BadRequest().json(ApiResult::<User, UserMessage> {
      data: None,
      message: UserMessage::UserUpdateFailed,
      status: Status::Error,
    }),
  }
}

#[delete("/delete")]
pub async fn delete(
  data: web::Data<AppState>,
  credentials: web::Json<DeleteUserDto>,
) -> impl Responder {
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
