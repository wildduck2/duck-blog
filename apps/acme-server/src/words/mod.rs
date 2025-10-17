use actix_web::{delete, get, http::StatusCode, middleware::from_fn, patch, post, web, Responder};

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
        .service(word_create)
        .service(word_delete)
        .service(word_update)
        .service(word_get),
    ),
  );
}

#[get("/get-all")]
async fn word_get(data: web::Data<AppState>) -> impl Responder {
  let words = match WordsService::get_all(&data).await {
    Ok(words) => words,
    Err(e) => return api_error::<Vec<Word>, WordsMessage>(StatusCode::BAD_REQUEST, e),
  };

  api_success::<Vec<Word>, WordsMessage>(StatusCode::OK, words, WordsMessage::WordGetSuccess)
}

#[post("/create")]
async fn word_create(
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
async fn word_update(
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
async fn word_delete(
  data: web::Data<AppState>,
  credentials: web::Json<WordsDeleteDto>,
) -> impl Responder {
  match WordsService::delete(&data, credentials.into_inner()).await {
    Ok(word) => word,
    Err(e) => return api_error::<Word, WordsMessage>(StatusCode::BAD_REQUEST, e),
  };

  api_success::<(), WordsMessage>(StatusCode::OK, (), WordsMessage::WordDeleteSuccess)
}
