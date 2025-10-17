use std::{error::Error, fmt};

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub enum AuthMessage {
  AuthSigninSuccess,
  AuthSignoutSuccess,
  // ERROR
  AuthUserNotFound,
  AuthInsertUserIdSessionFailed,
  AuthPasswordInvalid,
  AuthSigninFailed,
}

impl fmt::Display for AuthMessage {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl Error for AuthMessage {}
