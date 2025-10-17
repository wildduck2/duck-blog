use actix_session::SessionExt;
use actix_web::{
  body::MessageBody,
  dev::{ServiceRequest, ServiceResponse},
  middleware::Next,
  Error, HttpResponse,
};

use crate::{
  auth::constants::AuthMessage,
  common::{ApiResult, Status},
};

pub async fn auth_middleware(
  req: ServiceRequest,
  next: Next<impl MessageBody + 'static>,
) -> Result<ServiceResponse<impl MessageBody>, Error> {
  let session = req.get_session();

  // Check if user is logged in
  if session.get::<String>("user_id")?.is_some() {
    // User is authenticated, continue to next service
    next.call(req).await.map(|res| res.map_into_left_body())
  } else {
    // User not logged in, return unauthorized response
    let (req, _payload) = req.into_parts();
    let response = HttpResponse::Unauthorized().json(ApiResult::<Option<u8>, AuthMessage> {
      data: None,
      message: AuthMessage::AuthSigninFailed,
      status: Status::Error,
    });
    Ok(ServiceResponse::new(req, response).map_into_right_body())
  }
}
