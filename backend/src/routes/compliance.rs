use actix_web::{web, HttpResponse};
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

#[derive(Debug, Deserialize)]
pub struct TenderRequirementsGenerateRequest {
    pub title: String,
    pub description: String,
    pub category: String,
    pub minimum_bid: f64,
}

#[derive(Debug, Serialize)]
pub struct ComplianceAnalyzeResponse {
    pub analysis: ComplianceAnalysis,
    pub model: String,
}

#[derive(Debug, Serialize)]
pub struct TenderRequirementsGenerateResponse {
    pub requirements: String,
    pub model: String,
}

#[derive(Debug, Serialize)]
struct GeminiGenerateRequest {
    #[serde(rename = "systemInstruction", skip_serializing_if = "Option::is_none")]
    system_instruction: Option<GeminiSystemInstruction>,
    #[serde(rename = "contents")]
    contents: Vec<GeminiContent>,
    #[serde(rename = "generationConfig")]
    generation_config: GeminiGenerationConfig,
}

#[derive(Debug, Serialize)]
struct GeminiSystemInstruction {
    parts: Vec<GeminiPart>,
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
    #[serde(rename = "responseMimeType")]
    response_mime_type: String,
}

#[derive(Debug, Deserialize)]
struct GeminiGenerateResponse {
    candidates: Option<Vec<GeminiCandidate>>,
    #[serde(rename = "promptFeedback")]
    prompt_feedback: Option<GeminiPromptFeedback>,
}

#[derive(Debug, Deserialize)]
struct GeminiPromptFeedback {
    #[serde(rename = "blockReason")]
    block_reason: Option<String>,
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

    let api_key = gemini_api_key()?;
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

    let req = GeminiGenerateRequest {
        system_instruction: Some(GeminiSystemInstruction {
            parts: vec![GeminiPart {
                text: system_prompt.to_string(),
            }],
        }),
        contents: vec![GeminiContent {
            role: "user".to_string(),
            parts: vec![GeminiPart { text: user_prompt }],
        }],
        generation_config: GeminiGenerationConfig {
            temperature: 0.2,
            response_mime_type: "application/json".to_string(),
        },
    };

    let resp_json = gemini_generate(&model, &api_key, req).await?;
    let text = extract_gemini_text(&resp_json).ok_or(AppError::InternalError)?;
    let parsed = parse_gemini_json(&text)?;

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

pub async fn generate_tender_requirements(
    user: AuthenticatedUser,
    payload: web::Json<TenderRequirementsGenerateRequest>,
) -> Result<HttpResponse, AppError> {
    if user.claims.role != UserRole::Admin {
        return Err(AppError::Forbidden);
    }

    let api_key = gemini_api_key()?;
    let model = std::env::var("GEMINI_MODEL").unwrap_or_else(|_| "gemini-1.5-flash".to_string());

    let system_prompt = r#"You are a procurement analyst writing clear tender requirements.

Return ONLY valid JSON matching this schema:
{
  "requirements": "plain text tender requirements"
}

Rules:
- Tailor the requirements to the tender category and description
- Keep the output concise but specific
- Use a professional procurement tone
- Do not include markdown code fences or any extra keys"#;

    let user_prompt = format!(
        r#"Tender title: {title}
Category: {category}
Minimum bid: {minimum_bid}

Tender description:
{description}"#,
        title = payload.title,
        category = payload.category,
        minimum_bid = payload.minimum_bid,
        description = payload.description,
    );

    let req = GeminiGenerateRequest {
        system_instruction: Some(GeminiSystemInstruction {
            parts: vec![GeminiPart {
                text: system_prompt.to_string(),
            }],
        }),
        contents: vec![GeminiContent {
            role: "user".to_string(),
            parts: vec![GeminiPart { text: user_prompt }],
        }],
        generation_config: GeminiGenerationConfig {
            temperature: 0.4,
            response_mime_type: "application/json".to_string(),
        },
    };

    let resp_json = gemini_generate(&model, &api_key, req).await?;
    let text = extract_gemini_text(&resp_json).ok_or(AppError::InternalError)?;
    let parsed = parse_gemini_json(&text)?;
    let requirements = parsed
        .get("requirements")
        .and_then(|value| value.as_str())
        .unwrap_or(&text)
        .to_string();

    Ok(HttpResponse::Ok().json(TenderRequirementsGenerateResponse { requirements, model }))
}

async fn gemini_generate(
    model: &str,
    api_key: &str,
    req: GeminiGenerateRequest,
) -> Result<GeminiGenerateResponse, AppError> {
    let url = gemini_url(model, api_key);
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
    if let Some(feedback) = &resp_json.prompt_feedback {
        if let Some(reason) = &feedback.block_reason {
            eprintln!("[gemini] prompt blocked: {reason}");
            return Err(AppError::InternalError);
        }
    }

    Ok(resp_json)
}

fn gemini_api_key() -> Result<String, AppError> {
    std::env::var("GEMINI_API_KEY").map_err(|_| AppError::InternalError)
}

fn gemini_url(model: &str, api_key: &str) -> String {
    format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}",
        model = model,
        key = api_key
    )
}

fn extract_gemini_text(resp_json: &GeminiGenerateResponse) -> Option<String> {
    let candidates = resp_json.candidates.as_ref()?;

    for candidate in candidates {
        let content = match candidate.content.as_ref() {
            Some(content) => content,
            None => continue,
        };

        let parts = match content.parts.as_ref() {
            Some(parts) => parts,
            None => continue,
        };

        for part in parts {
            if let Some(text) = &part.text {
                let trimmed = text.trim();
                if !trimmed.is_empty() {
                    return Some(trimmed.to_string());
                }
            }
        }
    }

    None
}

fn parse_gemini_json(text: &str) -> Result<serde_json::Value, AppError> {
    let trimmed = text.trim();
    let candidate = if trimmed.starts_with('{') || trimmed.starts_with('[') {
        trimmed.to_string()
    } else if let (Some(start), Some(end)) = (trimmed.find('{'), trimmed.rfind('}')) {
        trimmed[start..=end].to_string()
    } else if let (Some(start), Some(end)) = (trimmed.find('['), trimmed.rfind(']')) {
        trimmed[start..=end].to_string()
    } else {
        trimmed
            .trim_start_matches("```json")
            .trim_start_matches("```")
            .trim_end_matches("```")
            .trim()
            .to_string()
    };

    serde_json::from_str(&candidate).map_err(|_| AppError::InternalError)
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

