use actix_web::{HttpResponse, web};
use mongodb::bson::{doc, oid::ObjectId};
use serde::{Deserialize, Serialize};

use crate::auth::AuthenticatedUser;
use crate::errors::AppError;
use crate::models::{Bid, UserRole};
use crate::state::AppState;

#[derive(Debug, Serialize)]
pub struct PrivateBidDetailsResponse {
    pub ok: bool,
    pub details: serde_json::Value,
}

#[derive(Debug, Deserialize)]
struct FabricGatewayReadResponse {
    ok: Option<bool>,
    details: Option<serde_json::Value>,
}

pub async fn get_private_bid_details(
    bid_id: web::Path<String>,
    user: AuthenticatedUser,
    state: web::Data<AppState>,
) -> Result<HttpResponse, AppError> {
    let bid_id = bid_id.into_inner();

    // Only Admin or Vendor can view, and vendor can only view their own bid.
    if user.claims.role != UserRole::Admin && user.claims.role != UserRole::Vendor {
        return Err(AppError::Forbidden);
    }

    let bid_object_id = ObjectId::parse_str(&bid_id).map_err(|_| AppError::BadRequest)?;
    let bids = state.db.collection::<Bid>("bids");

    let bid = bids
        .find_one(doc! { "_id": bid_object_id })
        .await
        .map_err(AppError::DbError)?
        .ok_or(AppError::NotFound)?;

    if user.claims.role == UserRole::Vendor && bid.vendor_id != user.claims.sub {
        return Err(AppError::Forbidden);
    }

    let gateway_url = match std::env::var("FABRIC_GATEWAY_URL") {
        Ok(v) if !v.trim().is_empty() => v,
        _ => return Err(AppError::InternalError),
    };

    let url = format!(
        "{}/private-bids/{}",
        gateway_url.trim_end_matches('/'),
        bid_id
    );

    let client = reqwest::Client::new();
    let resp = client
        .get(url)
        .send()
        .await
        .map_err(|_| AppError::InternalError)?;

    if resp.status() == reqwest::StatusCode::NOT_FOUND {
        return Err(AppError::NotFound);
    }

    if !resp.status().is_success() {
        let body = resp.text().await.unwrap_or_default();
        eprintln!("[fabric-gateway] non-200 response: {body}");
        return Err(AppError::InternalError);
    }

    let parsed: FabricGatewayReadResponse = resp.json().await.map_err(|_| AppError::InternalError)?;
    let details = parsed.details.ok_or(AppError::InternalError)?;

    Ok(HttpResponse::Ok().json(PrivateBidDetailsResponse { ok: true, details }))
}

