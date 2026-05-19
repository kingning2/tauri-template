use serde::Deserialize;

/// 默认下载解析 API 根路径（与 `{base}/{downloadKey}` 拼接），来自仓库根 `.env` 的 `DOWNLOAD_RESOLVE_BASE_URL`。
pub const DEFAULT_DOWNLOAD_RESOLVE_BASE_URL: &str = env!("DOWNLOAD_RESOLVE_BASE_URL");

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadResolveResponse {
    pub version: String,
    pub url: String,
    #[serde(default, rename = "lastUpdated")]
    pub last_updated: Option<String>,
}

/// `GET {base_url}/{download_key}` → JSON `{ version, url, lastUpdated }`
pub async fn fetch_download_resolve(
    base_url: &str,
    download_key: &str,
) -> Result<DownloadResolveResponse, String> {
    let base = base_url.trim().trim_end_matches('/');
    let key = download_key.trim().trim_start_matches('/');
    if base.is_empty() {
        return Err("download resolve base url is empty".to_string());
    }
    if key.is_empty() {
        return Err("download key is empty".to_string());
    }

    let endpoint = format!("{base}/{key}");
    crate::log_info!("download.resolve_request endpoint={}", endpoint);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(&endpoint)
        .send()
        .await
        .map_err(|e| format!("download resolve request failed: {e}"))?;

    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|e| format!("download resolve read body failed: {e}"))?;

    if !status.is_success() {
        return Err(format!(
            "download resolve http error status={} body={}",
            status, body
        ));
    }

    let parsed: DownloadResolveResponse = serde_json::from_str(&body).map_err(|e| {
        format!(
            "download resolve invalid json: {e}; body={}",
            body.chars().take(200).collect::<String>()
        )
    })?;

    let url = parsed.url.trim();
    if url.is_empty() {
        return Err("download resolve response url is empty".to_string());
    }

    crate::log_info!(
        "download.resolve_ok key={} version={} url={}",
        key,
        parsed.version,
        url
    );

    Ok(parsed)
}

/// 从下载 URL 的路径段推导本地保存文件名。
pub fn file_name_from_url(url: &str) -> Result<String, String> {
    let parsed = reqwest::Url::parse(url.trim()).map_err(|e| e.to_string())?;
    let file_name = parsed
        .path_segments()
        .and_then(|mut segments| segments.next_back().map(|s| s.to_string()))
        .filter(|s| !s.is_empty())
        .ok_or_else(|| format!("cannot derive file name from url: {url}"))?;
    Ok(file_name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn derives_file_name_from_url_path() {
        assert_eq!(
            file_name_from_url(
                "https://resource.gbyte.com/app/win/Gbyte_Recovery_9.2.4_Setup_Win.exe"
            )
            .unwrap(),
            "Gbyte_Recovery_9.2.4_Setup_Win.exe"
        );
    }

    #[test]
    fn parses_resolve_response_json() {
        let body = r#"{"version":"9.2.4","url":"https://example.com/a.exe","lastUpdated":"2025-09-04 17:57:12"}"#;
        let parsed: DownloadResolveResponse = serde_json::from_str(body).unwrap();
        assert_eq!(parsed.version, "9.2.4");
        assert_eq!(parsed.url, "https://example.com/a.exe");
    }
}
