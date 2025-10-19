use serde::Deserialize;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct WordsCreateDto {
  #[validate(length(min = 2, max = 50))]
  pub category: String,

  #[validate(length(
    min = 1,
    max = 255,
    message = "literal must be between 1 and 255 chars"
  ))]
  pub literal: String,
  pub user_id: Uuid,
  pub language: String,
  #[serde(skip_deserializing, skip_serializing)]
  pub translated: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct WordsDeleteDto {
  pub user_id: Uuid,
  pub id: Uuid,
}

#[derive(Debug, Deserialize, Validate)]
pub struct WordsUpdateDto {
  #[validate(length(min = 2, max = 50))]
  pub category: Option<String>,

  #[validate(length(
    min = 1,
    max = 255,
    message = "literal must be between 1 and 255 chars"
  ))]
  pub literal: Option<String>,
  pub word_id: Option<Uuid>,
  pub language: Option<String>,
  #[serde(skip_deserializing, skip_serializing)]
  pub translated: Option<String>,
}
