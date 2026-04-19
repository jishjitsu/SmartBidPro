use actix_web::{HttpResponse, ResponseError, http::StatusCode};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    DbError(#[from] mongodb::error::Error),

    #[error("Unauthorized access")]
    Unauthorized,

    #[error("Forbidden")]
    Forbidden,

    #[error("Not Found")]
    NotFound,

    #[error("Conflict")]
    Conflict,

    #[error("Bad Request")]
    BadRequest,

    #[error("Internal Server Error")]
    InternalError,
}

impl ResponseError for AppError {
    fn status_code(&self) -> StatusCode {
        match self {
            AppError::Unauthorized => StatusCode::UNAUTHORIZED,
            AppError::Forbidden => StatusCode::FORBIDDEN,
            AppError::NotFound => StatusCode::NOT_FOUND,
            AppError::Conflict => StatusCode::CONFLICT,
            AppError::BadRequest => StatusCode::BAD_REQUEST,
            AppError::DbError(_) | AppError::InternalError => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status_code()).json(serde_json::json!({
            "error": self.to_string()
        }))
    }
}
