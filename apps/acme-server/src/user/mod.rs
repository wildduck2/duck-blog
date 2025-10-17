use crate::common::functionalities::api_res::{api_error, api_success};
use crate::common::generators;
use crate::email::send_reset_email;
use crate::otp_code;
use crate::otp_code::constants::OtpCodeMessage;
use actix_session::Session;
use actix_web::http::StatusCode;
use actix_web::{delete, get, patch, post, web, Responder};
use askama::Template;
use chrono::{Datelike, Local};

mod constants;
mod dto;
mod service;
pub mod types;

use actix_web::middleware::from_fn;

pub fn config(cfg: &mut web::ServiceConfig) -> () {
  cfg.service(
    web::scope("/user")
      .service(user_create)
      .service(user_reset_password)
      .service(
        web::scope("")
          .wrap(from_fn(auth_middleware))
          .service(user_update)
          .service(user_me)
          .service(user_delete),
      ),
  );
}

use crate::{
  auth::guard::auth_middleware,
  email::emails::{ResetPasswordEmail, UpdateUserEmail, WelcomeEmail},
  user::{
    constants::UserMessage,
    dto::{CreateUserDto, DeleteUserDto, ResetPasswordDto, UpdateUserDto},
    service::UserService,
    types::User,
  },
  AppState,
};

#[post("/create")]
async fn user_create(
  creditials: web::Json<CreateUserDto>,
  session: Session,
  data: web::Data<AppState>,
) -> impl Responder {
  let user = match UserService::create(&data, creditials.into_inner()).await {
    Ok(user) => user,
    Err(e) => return api_error::<User, UserMessage>(StatusCode::BAD_REQUEST, e),
  };

  session
    .insert("user_id", user.id.to_string())
    .expect(&UserMessage::AuthInsertUserIdSessionFailed.to_string());

  let email = WelcomeEmail {
    username: &user.username,
    dashboard_url: "http://localhost:3000/dashboard/",
    current_year: chrono::Utc::now().year(),
  };

  let html = email.render().unwrap();

  if let Err(e) = send_reset_email(&data, &user.email, &html).await {
    eprintln!("Email send failed: {:?}", e);
    return api_error::<User, UserMessage>(
      StatusCode::BAD_REQUEST,
      UserMessage::UserCreateEmailFailed,
    );
  }

  api_success::<User, UserMessage>(StatusCode::OK, user, UserMessage::UserCreateSuccess)
}

#[patch("/update")]
async fn user_update(
  data: web::Data<AppState>,
  credentials: web::Json<UpdateUserDto>,
) -> impl Responder {
  let (user, updated_fields) = match UserService::update(&data, credentials.into_inner()).await {
    Ok(user) => user,
    Err(e) => return api_error::<User, UserMessage>(StatusCode::BAD_REQUEST, e),
  };

  let date = Local::now().format("%B %-d, %Y at %-I:%M %p").to_string();
  let email = UpdateUserEmail {
    username: &user.username,
    view_profile_link: "https://example.com/profile",
    updated_fields,
    last_update: &date,
  };

  let html = email.render().unwrap();

  if let Err(e) = send_reset_email(&data, &user.email, &html).await {
    eprintln!("Email send failed: {:?}", e);
    return api_error::<User, UserMessage>(
      StatusCode::BAD_REQUEST,
      UserMessage::UserUpdateProfileEmailFailed,
    );
  }

  api_success::<User, UserMessage>(StatusCode::OK, user, UserMessage::UserUpdateSuccess)
}

#[post("/reset-password")]
async fn user_reset_password(
  data: web::Data<AppState>,
  credentials: web::Json<ResetPasswordDto>,
) -> impl Responder {
  let user = match UserService::get(&data, credentials.into_inner()).await {
    Ok(user) => user,
    Err(e) => return api_error::<User, UserMessage>(StatusCode::BAD_REQUEST, e),
  };

  let code = generators::code::generate_code(6);
  let otp = match otp_code::service::OtpCodeService::create(&data, code.clone(), user.id).await {
    Ok(otp) => otp,
    Err(e) => return api_error::<User, OtpCodeMessage>(StatusCode::BAD_REQUEST, e),
  };

  let email = ResetPasswordEmail {
    username: &user.username,
    reset_code: &otp.code,
    reset_link: &format!("https://example.com/reset-password?code={}", otp.code),
  };

  let html = match email.render() {
    Ok(html) => html,
    Err(_) => {
      return api_error::<User, UserMessage>(
        StatusCode::BAD_REQUEST,
        UserMessage::UserResetPasswordFailed,
      );
    },
  };

  if let Err(e) = send_reset_email(&data, &user.email, &html).await {
    eprintln!("Email send failed: {:?}", e);
    return api_error::<User, UserMessage>(
      StatusCode::BAD_REQUEST,
      UserMessage::UserResetPasswordEmailFailed,
    );
  }

  api_success::<User, UserMessage>(StatusCode::OK, user, UserMessage::UserResetPasswordSuccess)
}

#[delete("/delete")]
async fn user_delete(
  data: web::Data<AppState>,
  credentials: web::Json<DeleteUserDto>,
) -> impl Responder {
  match UserService::delete(data, credentials.into_inner()).await {
    Ok(_) => api_success::<(), UserMessage>(StatusCode::OK, (), UserMessage::UserDeleteSuccess),
    Err(e) => api_error::<User, UserMessage>(StatusCode::BAD_REQUEST, e),
  }
}

#[get("/me")]
async fn user_me(data: web::Data<AppState>, session: Session) -> impl Responder {
  let user_id = session
    .get::<String>("user_id")
    .expect(&UserMessage::AuthGetSessionUserIdSessionFailed.to_string())
    .unwrap();

  let user = match UserService::me(data, user_id).await {
    Ok(user) => user,
    Err(e) => return api_error::<User, UserMessage>(StatusCode::BAD_REQUEST, e),
  };

  api_success::<User, UserMessage>(StatusCode::OK, user, UserMessage::UserGetProfileSuccess)
}
