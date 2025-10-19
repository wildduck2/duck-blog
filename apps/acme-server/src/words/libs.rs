use reqwest::Client;
use serde_json::Value;

pub async fn translate_text(text: &str, to: &str, from: Option<&str>) -> Result<String, String> {
  let client = Client::new();
  let source = from.unwrap_or("auto");
  let target = to;

  let url = format!(
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl={}&tl={}&dt=t&q={}",
    source,
    target,
    urlencoding::encode(text)
  );

  let resp = client
    .get(&url)
    .send()
    .await
    .map_err(|_| "Failed to send request")?;

  let body = resp.text().await.map_err(|_| "Failed to read body")?;

  let json: Value = serde_json::from_str(&body).map_err(|_| "Failed to parse JSON")?;

  if let Some(translated) = json[0][0][0].as_str() {
    Ok(translated.to_string())
  } else {
    Err("Translation not found".into())
  }
}
