use std::{error::Error, fmt};

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub enum OtpCodeMessage {
  // Success
  OtpCodeCreateSuccess,

  // Error
  OtpCodeCreateFailed,
}

impl fmt::Display for OtpCodeMessage {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl Error for OtpCodeMessage {}
