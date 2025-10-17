use actix_web::{delete, http::StatusCode, middleware::from_fn, patch, post, web, Responder};

use crate::{
  auth::guard::auth_middleware,
  common::functionalities::api_res::{api_error, api_success},
  words::{
    constants::WordsMessage,
    dto::{WordsCreateDto, WordsDeleteDto, WordsUpdateDto},
    service::WordsService,
    types::Word,
  },
  AppState,
};

mod constants;
mod dto;
mod service;
mod types;

pub fn config(cfg: &mut web::ServiceConfig) -> () {
  cfg.service(
    web::scope("/words").service(
      web::scope("")
        .wrap(from_fn(auth_middleware))
        .service(work_create)
        .service(work_delete)
        .service(work_update),
    ),
  );
}

#[post("/create")]
async fn work_create(
  data: web::Data<AppState>,
  credentials: web::Json<WordsCreateDto>,
) -> impl Responder {
  let word = match WordsService::create(&data, credentials.into_inner()).await {
    Ok(word) => word,
    Err(e) => return api_error::<Word, WordsMessage>(StatusCode::BAD_REQUEST, e),
  };

  api_success::<Word, WordsMessage>(StatusCode::OK, word, WordsMessage::WordGetSuccess)
}

#[patch("/update")]
async fn work_update(
  data: web::Data<AppState>,
  credentials: web::Json<WordsUpdateDto>,
) -> impl Responder {
  let (word, _) = match WordsService::update(&data, credentials.into_inner()).await {
    Ok(word) => word,
    Err(e) => return api_error::<Word, WordsMessage>(StatusCode::BAD_REQUEST, e),
  };

  api_success::<Word, WordsMessage>(StatusCode::OK, word, WordsMessage::WordUpdateSuccess)
}

#[delete("/delete")]
async fn work_delete(
  data: web::Data<AppState>,
  credentials: web::Json<WordsDeleteDto>,
) -> impl Responder {
  println!("{:?}", credentials);
  match WordsService::delete(&data, credentials.into_inner()).await {
    Ok(word) => word,
    Err(e) => return api_error::<Word, WordsMessage>(StatusCode::BAD_REQUEST, e),
  };

  api_success::<(), WordsMessage>(StatusCode::OK, (), WordsMessage::WordDeleteSuccess)
}
