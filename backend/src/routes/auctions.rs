use actix_web::{HttpResponse, web};
use alloy::primitives::B256;
use crate::models::{Auction, CreateAuctionRequest, UpdateAuctionRequest};
use crate::auth::AuthenticatedUser;
use crate::errors::AppError;
use crate::state::AppState;
use mongodb::bson::{self, doc, oid::ObjectId};
use chrono::Utc;
use futures::stream::TryStreamExt;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Deserialize)]
pub struct NotarizeRequest {
    pub data_hash: String,
}

#[derive(Serialize)]
pub struct NotarizeResponse {
    pub tx_hash: String,
}

pub async fn get_auctions(
    state: web::Data<AppState>,
    _user: AuthenticatedUser,
) -> Result<HttpResponse, AppError> {
    let collection = state.db.collection::<Auction>("auctions");
    
    let cursor = collection
        .find(doc! {})
        .await?;
    
    let auctions: Vec<Auction> = cursor
        .try_collect()
        .await
        .map_err(|_| AppError::InternalError)?;
    
    Ok(HttpResponse::Ok().json(auctions))
}

pub async fn get_auction(
    state: web::Data<AppState>,
    _user: AuthenticatedUser,
    id: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let collection = state.db.collection::<Auction>("auctions");
    let id = id.into_inner();
    
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest)?;
    
    let auction = collection
        .find_one(doc! { "_id": object_id })
        .await
        .map_err(AppError::DbError)?
        .ok_or(AppError::NotFound)?;
    
    Ok(HttpResponse::Ok().json(auction))
}

pub async fn create_auction(
    state: web::Data<AppState>,
    user: AuthenticatedUser,
    auction_data: web::Json<CreateAuctionRequest>,
) -> Result<HttpResponse, AppError> {
    let collection = state.db.collection::<Auction>("auctions");
    
    let new_auction = Auction {
        id: None,
        title: auction_data.title.clone(),
        description: auction_data.description.clone(),
        status: auction_data.status.clone(),
        created_by: user.claims.sub.clone(),
        start_date: auction_data.start_date,
        end_date: auction_data.end_date,
        minimum_bid: auction_data.minimum_bid,
        category: auction_data.category.clone(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };
    
    let result = collection
        .insert_one(&new_auction)
        .await
        .map_err(AppError::DbError)?;
    
    let inserted_id = result.inserted_id.as_object_id()
        .ok_or(AppError::InternalError)?;
    
    let created_auction = Auction {
        id: Some(inserted_id),
        ..new_auction
    };

    let tender_requirements_payload = serde_json::json!({
        "title": created_auction.title,
        "description": created_auction.description,
        "start_date": created_auction.start_date,
        "end_date": created_auction.end_date,
        "minimum_bid": created_auction.minimum_bid,
        "category": created_auction.category,
        "created_by": created_auction.created_by
    });

    let requirements_hash_bytes = serde_json::to_vec(&tender_requirements_payload)
        .map_err(|_| AppError::InternalError)?;
    let requirements_digest = Sha256::digest(&requirements_hash_bytes);
    let requirements_hash = B256::from_slice(&requirements_digest);

    state
        .blockchain
        .notarize_hash(requirements_hash)
        .await
        .map_err(|_| AppError::InternalError)?;
    
    Ok(HttpResponse::Created().json(created_auction))
}

pub async fn update_auction(
    state: web::Data<AppState>,
    user: AuthenticatedUser,
    id: web::Path<String>,
    auction_data: web::Json<UpdateAuctionRequest>,
) -> Result<HttpResponse, AppError> {
    let collection = state.db.collection::<Auction>("auctions");
    let id = id.into_inner();
    
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest)?;
    
    let existing = collection
        .find_one(doc! { "_id": object_id })
        .await
        .map_err(AppError::DbError)?
        .ok_or(AppError::NotFound)?;
    
    if existing.created_by != user.claims.sub && !matches!(user.claims.role, crate::models::UserRole::Admin) {
        return Err(AppError::Forbidden);
    }
    
    let update_doc = doc! {
        "$set": {
            "title": &auction_data.title,
            "description": &auction_data.description,
            "status": bson::to_bson(&auction_data.status).map_err(|_| AppError::InternalError)?,
            "start_date": bson::to_bson(&auction_data.start_date).map_err(|_| AppError::InternalError)?,
            "end_date": bson::to_bson(&auction_data.end_date).map_err(|_| AppError::InternalError)?,
            "minimum_bid": auction_data.minimum_bid,
            "category": &auction_data.category,
            "updated_at": bson::to_bson(&Utc::now()).map_err(|_| AppError::InternalError)?,
        }
    };
    
    collection
        .update_one(doc! { "_id": object_id }, update_doc)
        .await
        .map_err(AppError::DbError)?;
    
    let updated_auction = collection
        .find_one(doc! { "_id": object_id })
        .await
        .map_err(AppError::DbError)?
        .ok_or(AppError::InternalError)?;
    
    Ok(HttpResponse::Ok().json(updated_auction))
}

pub async fn delete_auction(
    state: web::Data<AppState>,
    user: AuthenticatedUser,
    id: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let collection = state.db.collection::<Auction>("auctions");
    let id = id.into_inner();
    
    let object_id = ObjectId::parse_str(&id)
        .map_err(|_| AppError::BadRequest)?;
    
    let existing = collection
        .find_one(doc! { "_id": object_id })
        .await
        .map_err(AppError::DbError)?
        .ok_or(AppError::NotFound)?;
    
    if existing.created_by != user.claims.sub && !matches!(user.claims.role, crate::models::UserRole::Admin) {
        return Err(AppError::Forbidden);
    }
    
    collection
        .delete_one(doc! { "_id": object_id })
        .await
        .map_err(AppError::DbError)?;
    
    Ok(HttpResponse::NoContent().finish())
}

pub async fn notarize_auction(
    state: web::Data<AppState>,
    _user: AuthenticatedUser,
    _id: web::Path<String>,
    payload: web::Json<NotarizeRequest>,
) -> Result<HttpResponse, AppError> {
    let data_hash = payload
        .data_hash
        .parse::<B256>()
        .map_err(|_| AppError::BadRequest)?;

    let tx_hash = state
        .blockchain
        .notarize_hash(data_hash)
        .await
        .map_err(|_| AppError::InternalError)?;

    Ok(HttpResponse::Ok().json(NotarizeResponse {
        tx_hash: tx_hash.to_string(),
    }))
}
