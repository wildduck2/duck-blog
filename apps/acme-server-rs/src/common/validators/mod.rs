use uuid::Uuid;
use validator::ValidationError;

pub fn validate_uuid(id: &str) -> Result<(), ValidationError> {
  match Uuid::parse_str(id) {
    Ok(_) => Ok(()),
    Err(_) => Err(ValidationError::new("invalid_uuid")),
  }
}
