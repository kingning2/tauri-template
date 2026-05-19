use std::time::Duration;

const DEFAULT_TIMEOUT_SECS: u64 = 30;

/// 构建带默认超时的 HTTP 客户端。
pub fn build_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(DEFAULT_TIMEOUT_SECS))
        .build()
        .map_err(|e| e.to_string())
}

/// `GET {url}`，附带 query 参数；仅 2xx 返回响应体文本。
pub async fn get(url: &str, query: &[(&str, &str)]) -> Result<String, String> {
    let url = url.trim();
    if url.is_empty() {
        return Err("http get url is empty".to_string());
    }

    let client = build_client()?;
    let response = client
        .get(url)
        .query(query)
        .send()
        .await
        .map_err(|e| format!("http get request failed: {e}"))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|e| format!("http get read body failed: {e}"))?;

    if !status.is_success() {
        return Err(format!("http get error status={} body={}", status, body));
    }

    Ok(body)
}

/// `GET {url}` + query，并将 JSON 反序列化为 `T`。
pub async fn get_json<T>(url: &str, query: &[(&str, &str)]) -> Result<T, String>
where
    T: serde::de::DeserializeOwned,
{
    let body = get(url, query).await?;
    serde_json::from_str(&body).map_err(|e| {
        format!(
            "http get invalid json: {e}; body={}",
            body.chars().take(200).collect::<String>()
        )
    })
}
