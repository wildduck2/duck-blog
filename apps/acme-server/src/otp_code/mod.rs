use crate::common::generators;
use actix_session::Session;
use actix_web::{delete, get, patch, post, web, HttpResponse, Responder};
use askama::Template;
use chrono::{Datelike, Local};
use lettre::{message::header::ContentType, Message, Transport};

pub mod constants;
pub mod service;
pub mod types;

pub fn config(cfg: &mut web::ServiceConfig) {
  cfg.service(web::scope("/otp"));
}
