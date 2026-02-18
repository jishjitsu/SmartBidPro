use serde::{Deserialize, Serialize, Serializer};
use chrono::{DateTime, Utc};
use mongodb::bson::oid::ObjectId;

// Custom serializer for ObjectId to serialize as hex string
fn serialize_object_id<S>(oid: &Option<ObjectId>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    match oid {
        Some(oid) => serializer.serialize_str(&oid.to_hex()),
        None => serializer.serialize_none(),
    }
}

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
    pub id: Option<ObjectId>,
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
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none", serialize_with = "serialize_object_id")]
    pub id: Option<ObjectId>,
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum BidStatus {
    Pending,
    Accepted,
    Rejected,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ComplianceBreakdown {
    pub score: i32,
    pub status: String,
    pub notes: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ComplianceAnalysis {
    pub total_score: i32,
    pub risk_level: String,
    pub documentation: ComplianceBreakdown,
    pub financial: ComplianceBreakdown,
    pub technical: ComplianceBreakdown,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Bid {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none", serialize_with = "serialize_object_id")]
    pub id: Option<ObjectId>,
    pub auction_id: String,
    pub bidder_id: String,
    pub bidder_name: String,
    pub bidder_company: String,
    pub bid_amount: f64,
    pub compliance_analysis: ComplianceAnalysis,
    pub status: BidStatus,
    pub submitted_at: DateTime<Utc>,
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

impl UserInfo {
    pub fn from_user(user: &User) -> Self {
        Self {
            id: user.id.as_ref().map(|oid| oid.to_hex()).unwrap_or_default(),
            email: user.email.clone(),
            name: user.name.clone(),
            role: user.role.clone(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub role: UserRole,
    pub exp: usize,
}

#[derive(Debug, Deserialize)]
pub struct CreateAuctionRequest {
    pub title: String,
    pub description: String,
    pub status: AuctionStatus,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub minimum_bid: f64,
}

#[derive(Debug, Deserialize)]
pub struct CreateBidRequest {
    pub auction_id: String,
    pub bid_amount: f64,
    pub compliance_analysis: ComplianceAnalysis,
}
