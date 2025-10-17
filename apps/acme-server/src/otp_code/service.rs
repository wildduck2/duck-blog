use actix_web::web;

use crate::{
  otp_code::{constants::OtpCodeMessage, types::OtpCode},
  AppState,
};

pub struct OtpCodeService;

impl OtpCodeService {
  pub async fn create(
    data: &web::Data<AppState>,
    code: String,
    user_id: uuid::Uuid,
  ) -> Result<OtpCode, OtpCodeMessage> {
    let otp = sqlx::query_as::<_, OtpCode>(
      r#"
        INSERT INTO otp_codes (code, user_id, expires_at)
        VALUES ($1, $2::uuid, NOW() + INTERVAL '5 minutes')
        RETURNING *; 
      "#,
    )
    .bind(&code)
    .bind(&user_id)
    .fetch_one(&data.db)
    .await
    .map_err(|e| {
      println!("{:?}", e);
      OtpCodeMessage::OtpCodeCreateFailed
    })?;

    Ok(otp)
  }
}
