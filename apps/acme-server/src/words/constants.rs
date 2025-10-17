use std::{error::Error, fmt};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WordsMessage {
  WordGetSuccess,
  WordCreateSuccess,
  WordUpdateSuccess,
  WordDeleteSuccess,

  WordGetFailed,
  WordCreateFailed,
  WordUpdateFailed,
  WordDeleteFailed,
  WordNotFound,
  NothingToUpdate,
}

impl fmt::Display for WordsMessage {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl Error for WordsMessage {}
