use actix_web::{HttpResponse, web};
use serde::{Deserialize, Serialize};

use crate::auth::AuthenticatedUser;
use crate::errors::AppError;
use crate::models::{ComplianceAnalysis, ComplianceBreakdown, UserRole};

#[derive(Debug, Deserialize)]
pub struct ComplianceAnalyzeRequest {
    pub tender_description: String,
    pub proposal_text: String,
    #[serde(default)]
    pub documents: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct ComplianceAnalyzeResponse {
    pub analysis: ComplianceAnalysis,
    pub model: String,
}

#[derive(Debug, Serialize)]
struct GeminiGenerateRequest {
    contents: Vec<GeminiContent>,
    generation_config: GeminiGenerationConfig,
}

#[derive(Debug, Serialize)]
struct GeminiContent {
    role: String,
    parts: Vec<GeminiPart>,
}

#[derive(Debug, Serialize)]
struct GeminiPart {
    text: String,
}

#[derive(Debug, Serialize)]
struct GeminiGenerationConfig {
    temperature: f32,
    response_mime_type: String,
}

#[derive(Debug, Deserialize)]
struct GeminiGenerateResponse {
    candidates: Option<Vec<GeminiCandidate>>,
}

#[derive(Debug, Deserialize)]
struct GeminiCandidate {
    content: Option<GeminiCandidateContent>,
}

#[derive(Debug, Deserialize)]
struct GeminiCandidateContent {
    parts: Option<Vec<GeminiCandidatePart>>,
}

#[derive(Debug, Deserialize)]
struct GeminiCandidatePart {
    text: Option<String>,
}

pub async fn analyze_compliance(
    user: AuthenticatedUser,
    payload: web::Json<ComplianceAnalyzeRequest>,
) -> Result<HttpResponse, AppError> {
    if user.claims.role != UserRole::Vendor && user.claims.role != UserRole::Admin {
        return Err(AppError::Forbidden);
    }

    let api_key = std::env::var("GEMINI_API_KEY").map_err(|_| AppError::InternalError)?;
    let model = std::env::var("GEMINI_MODEL").unwrap_or_else(|_| "gemini-1.5-flash".to_string());

    let system_prompt = r#"You are a procurement compliance checker.

Return ONLY valid JSON matching this schema:
{
  "total_score": number (0-100),
  "risk_level": "Low" | "Medium" | "High",
  "documentation": { "score": number, "status": string, "notes": string },
  "financial": { "score": number, "status": string, "notes": string },
  "technical": { "score": number, "status": string, "notes": string }
}

Rules:
- Scores must be integers 0..100
- risk_level must be Low/Medium/High
- Keep notes concise and actionable
- Do not include markdown or extra keys"#;

    let doc_list = if payload.documents.is_empty() {
        "No documents provided.".to_string()
    } else {
        payload
            .documents
            .iter()
            .take(20)
            .map(|d| format!("- {d}"))
            .collect::<Vec<_>>()
            .join("\n")
    };

    let user_prompt = format!(
        r#"Tender description:
{tender}

Vendor proposal:
{proposal}

Uploaded document filenames (may be partial):
{docs}"#,
        tender = payload.tender_description,
        proposal = payload.proposal_text,
        docs = doc_list
    );

    // Generative Language API (v1beta) - JSON response requested
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}",
        model = model,
        key = api_key
    );

    let req = GeminiGenerateRequest {
        contents: vec![
            GeminiContent {
                role: "user".to_string(),
                parts: vec![GeminiPart {
                    text: format!("{system_prompt}\n\n{user_prompt}"),
                }],
            },
        ],
        generation_config: GeminiGenerationConfig {
            temperature: 0.2,
            response_mime_type: "application/json".to_string(),
        },
    };

    let client = reqwest::Client::new();
    let resp = client
        .post(url)
        .json(&req)
        .send()
        .await
        .map_err(|_| AppError::InternalError)?;

    if !resp.status().is_success() {
        let body = resp.text().await.unwrap_or_default();
        eprintln!("[gemini] non-200 response: {body}");
        return Err(AppError::InternalError);
    }

    let resp_json: GeminiGenerateResponse = resp.json().await.map_err(|_| AppError::InternalError)?;
    let text = resp_json
        .candidates
        .and_then(|c| c.into_iter().next())
        .and_then(|c| c.content)
        .and_then(|c| c.parts)
        .and_then(|p| p.into_iter().next())
        .and_then(|p| p.text)
        .ok_or(AppError::InternalError)?;

    let parsed: serde_json::Value = serde_json::from_str(&text).map_err(|_| AppError::InternalError)?;

    // Map JSON into the backend's ComplianceAnalysis struct.
    let analysis = ComplianceAnalysis {
        total_score: parsed
            .get("total_score")
            .and_then(|v| v.as_i64())
            .unwrap_or(0) as i32,
        risk_level: parsed
            .get("risk_level")
            .and_then(|v| v.as_str())
            .unwrap_or("Medium")
            .to_string(),
        documentation: to_breakdown(parsed.get("documentation")),
        financial: to_breakdown(parsed.get("financial")),
        technical: to_breakdown(parsed.get("technical")),
    };

    Ok(HttpResponse::Ok().json(ComplianceAnalyzeResponse { analysis, model }))
}

fn to_breakdown(v: Option<&serde_json::Value>) -> ComplianceBreakdown {
    let score = v.and_then(|x| x.get("score")).and_then(|x| x.as_i64()).unwrap_or(0) as i32;
    let status = v
        .and_then(|x| x.get("status"))
        .and_then(|x| x.as_str())
        .unwrap_or("Pass")
        .to_string();
    let notes = v
        .and_then(|x| x.get("notes"))
        .and_then(|x| x.as_str())
        .unwrap_or("")
        .to_string();
    ComplianceBreakdown { score, status, notes }
}

