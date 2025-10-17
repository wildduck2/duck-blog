use actix_session::{Session, SessionExt};
use actix_web::{
  body::MessageBody,
  dev::{ServiceRequest, ServiceResponse},
  http::StatusCode,
  middleware::Next,
  Error,
};

use crate::{auth::constants::AuthMessage, common::functionalities::api_res::api_error};

pub async fn auth_middleware(
  req: ServiceRequest,
  next: Next<impl MessageBody + 'static>,
  // session: Session,
) -> Result<ServiceResponse<impl MessageBody>, Error> {
  let session = req.get_session();
  println!("{:?}", session.entries());

  // Check if user is logged in
  if session.get::<String>("user_id")?.is_some() {
    // User is authenticated, continue to next service
    next.call(req).await.map(|res| res.map_into_left_body())
  } else {
    // User not logged in, return unauthorized response
    let (req, _payload) = req.into_parts();
    Ok(
      ServiceResponse::new(
        req,
        api_error::<(), AuthMessage>(StatusCode::UNAUTHORIZED, AuthMessage::AuthSigninFailed),
      )
      .map_into_right_body(),
    )
  }
}
