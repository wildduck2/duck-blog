/*
 * This module is for db configuration with `SQLX`
 *
 */

use std::env;

use sqlx::{postgres::PgPoolOptions, Pool, Postgres};

pub async fn connect_sqlx() -> Pool<Postgres> {
  let database_url =
    env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env or environment");

  let pool = PgPoolOptions::new()
    .max_connections(5)
    .connect(&database_url)
    .await
    .expect("Could not connect to the database");
  println!("🦆 Database pool created and ready.");

  pool
}
