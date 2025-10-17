use std::{error::Error, fmt};

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub enum UserMessage {
  // Success
  UserCreateSuccess,
  UserUpdateSuccess,
  UserDeleteSuccess,

  // Error
  AuthInsertUserIdSessionFailed,
  AuthGetSessionUserIdSessionFailed,
  UserCreateFailed,
  UserNotFound,
  UserGetProfileFailed,
  UserDeleteFailed,
  InvalidUuid,
  UserUpdateFailed,
  NothingToUpdate,
}

impl fmt::Display for UserMessage {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl Error for UserMessage {}
