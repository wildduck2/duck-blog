use rand::{distr::Alphanumeric, Rng};

pub fn generate_code(len: usize) -> String {
  rand::rng()
    .sample_iter(&Alphanumeric)
    .take(len)
    .map(char::from)
    .collect()
}
