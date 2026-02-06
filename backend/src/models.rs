use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    Bidder,
    Vendor,
    Auditor,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub email: String,
    pub password_hash: String,
    pub role: UserRole,
    pub name: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum AuctionStatus {
    Draft,
    Open,
    Closed,
    Awarded,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Auction {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub title: String,
    pub description: String,
    pub status: AuctionStatus,
    pub created_by: String,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub minimum_bid: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserInfo,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserInfo {
    pub id: String,
    pub email: String,
    pub name: String,
    pub role: UserRole,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub role: UserRole,
    pub exp: usize,
}
