use actix_web::web;
use sqlx::{Postgres, QueryBuilder};

use crate::{
  email::emails::UpdatedField,
  words::{
    constants::WordsMessage,
    dto::{WordsCreateDto, WordsDeleteDto, WordsUpdateDto},
    types::Word,
  },
  AppState,
};

pub struct WordsService;

impl WordsService {
  pub async fn create(
    data: &web::Data<AppState>,
    credentials: WordsCreateDto,
  ) -> Result<Word, WordsMessage> {
    let word = sqlx::query_as::<_, Word>(
      r#"
        INSERT INTO words (category, literal, user_id)
        VALUES ($1, $2, $3)
        RETURNING * 
      "#,
    )
    .bind(&credentials.category)
    .bind(&credentials.literal)
    .bind(&credentials.user_id)
    .fetch_one(&data.db)
    .await
    .map_err(|e| {
      println!("{}", e);
      WordsMessage::WordCreateFailed
    })?;

    Ok(word)
  }

  pub async fn update<'a>(
    data: &web::Data<AppState>,
    credentials: WordsUpdateDto,
  ) -> Result<(Word, Vec<UpdatedField<'a>>), WordsMessage> {
    let mut fields_updated = Vec::<UpdatedField<'a>>::new();
    let mut qb: QueryBuilder<Postgres> = QueryBuilder::new("UPDATE words SET ");

    let fields = vec![("category", credentials.category)];

    let mut first = true;

    for (name, value_opt) in fields.iter() {
      if let Some(value) = value_opt {
        if !first {
          qb.push(", ");
        }
        qb.push(format!("{name} = ").as_str()).push_bind(value);
        fields_updated.push(UpdatedField {
          label: name,
          value: value_opt.clone().unwrap(),
        });
        first = false;
      }
    }

    // If no fields to update
    if first {
      return Err(WordsMessage::NothingToUpdate);
    }

    qb.push(" WHERE id = ").push_bind(credentials.word_id);
    qb.push(" RETURNING *");

    let updated_user = qb
      .build_query_as::<Word>()
      .fetch_one(&data.db)
      .await
      .map_err(|e| {
        println!("{:?}", e);
        WordsMessage::WordUpdateFailed
      })?;

    Ok((updated_user, fields_updated))
  }

  pub async fn delete(
    data: &web::Data<AppState>,
    credentials: WordsDeleteDto,
  ) -> Result<(), WordsMessage> {
    let result = sqlx::query(
      r#"
        DELETE FROM words
        WHERE id = $1::uuid AND user_id = $2::uuid
      "#,
    )
    .bind(&credentials.id)
    .bind(&credentials.user_id)
    .execute(&data.db)
    .await
    .map_err(|e| {
      println!("{:?}", e);
      WordsMessage::WordDeleteFailed
    })?;

    if result.rows_affected() == 0 {
      return Err(WordsMessage::WordNotFound);
    }

    Ok(())
  }
}
